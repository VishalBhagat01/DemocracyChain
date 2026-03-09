// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Voting — Decentralized Election Smart Contract
/// @notice Supports multiple elections, candidates, voter-hash anonymity,
///         voting dates, double-vote prevention, and audit trail.
contract Voting {

    // ────────────────────────────────────────────────────────────────────────
    // STRUCTS
    // ────────────────────────────────────────────────────────────────────────

    struct Candidate {
        uint256 id;
        string  name;
        string  party;
        uint256 voteCount;
    }

    struct Election {
        string   electionId;
        string   name;
        uint256  startTime;   // Unix timestamp
        uint256  endTime;     // Unix timestamp
        bool     exists;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STATE
    // ────────────────────────────────────────────────────────────────────────

    address public owner;

    // electionId => Election
    mapping(string => Election) public elections;

    // electionId => candidateId => Candidate
    mapping(string => mapping(uint256 => Candidate)) public candidates;

    // electionId => total candidate count
    mapping(string => uint256) public candidateCount;

    // electionId => voterHash => has voted
    mapping(string => mapping(bytes32 => bool)) public hasVoted;

    // electionId => voterHash => candidateId voted for
    mapping(string => mapping(bytes32 => uint256)) private voterChoice;

    // List of all election IDs
    string[] public electionIds;

    // ────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ────────────────────────────────────────────────────────────────────────

    event ElectionCreated(string indexed electionId, string name, uint256 startTime, uint256 endTime);
    event ElectionDeleted(string indexed electionId);
    event CandidateAdded(string indexed electionId, uint256 candidateId, string name, string party);
    event CandidateUpdated(string indexed electionId, uint256 candidateId, string name, string party);
    event CandidateDeleted(string indexed electionId, uint256 candidateId);
    event VoteCast(string indexed electionId, bytes32 indexed voterHash, uint256 candidateId, uint256 timestamp);

    // ────────────────────────────────────────────────────────────────────────
    // MODIFIERS
    // ────────────────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier electionExists(string memory electionId) {
        require(elections[electionId].exists, "Election does not exist");
        _;
    }

    modifier votingOpen(string memory electionId) {
        require(block.timestamp >= elections[electionId].startTime, "Voting has not started yet");
        require(block.timestamp <= elections[electionId].endTime,   "Voting has ended");
        _;
    }

    // ────────────────────────────────────────────────────────────────────────
    // CONSTRUCTOR
    // ────────────────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ────────────────────────────────────────────────────────────────────────
    // ELECTION MANAGEMENT (owner only)
    // ────────────────────────────────────────────────────────────────────────

    /// @notice Create a new election with a voting window
    function createElection(
        string memory electionId,
        string memory name,
        uint256 startTime,
        uint256 endTime
    ) external onlyOwner {
        require(!elections[electionId].exists, "Election already exists");
        require(endTime > startTime, "End time must be after start time");

        elections[electionId] = Election({
            electionId: electionId,
            name:       name,
            startTime:  startTime,
            endTime:    endTime,
            exists:     true
        });
        electionIds.push(electionId);

        emit ElectionCreated(electionId, name, startTime, endTime);
    }

    /// @notice Delete an election and all its associated data
    function deleteElection(string memory electionId) external onlyOwner electionExists(electionId) {
        // Remove from elections mapping
        delete elections[electionId];

        // Remove from candidates mapping (we cleanup individual candidates)
        uint256 count = candidateCount[electionId];
        for (uint256 i = 1; i <= count; i++) {
            delete candidates[electionId][i];
        }
        delete candidateCount[electionId];

        // Remove from electionIds array
        for (uint256 i = 0; i < electionIds.length; i++) {
            if (keccak256(abi.encodePacked(electionIds[i])) == keccak256(abi.encodePacked(electionId))) {
                electionIds[i] = electionIds[electionIds.length - 1];
                electionIds.pop();
                break;
            }
        }

        emit ElectionDeleted(electionId);
    }

    /// @notice Add a candidate to an election (must be done before voting starts)
    function addCandidate(
        string memory electionId,
        string memory name,
        string memory party
    ) external onlyOwner electionExists(electionId) {
        uint256 newId = candidateCount[electionId] + 1;
        candidateCount[electionId] = newId;

        candidates[electionId][newId] = Candidate({
            id:        newId,
            name:      name,
            party:     party,
            voteCount: 0
        });

        emit CandidateAdded(electionId, newId, name, party);
    }

    /// @notice Update an existing candidate's details
    function updateCandidate(
        string memory electionId,
        uint256 candidateId,
        string memory name,
        string memory party
    ) external onlyOwner electionExists(electionId) {
        require(candidateId > 0 && candidateId <= candidateCount[electionId], "Invalid candidate ID");
        require(candidates[electionId][candidateId].id != 0, "Candidate does not exist");

        Candidate storage c = candidates[electionId][candidateId];
        c.name  = name;
        c.party = party;

        emit CandidateUpdated(electionId, candidateId, name, party);
    }

    /// @notice Delete a candidate (sets their entry to empty)
    /// @dev Note: This does not re-index other candidates to avoid breaking existing vote counts/mappings.
    function deleteCandidate(
        string memory electionId, 
        uint256 candidateId
    ) external onlyOwner electionExists(electionId) {
        require(candidateId > 0 && candidateId <= candidateCount[electionId], "Invalid candidate ID");
        require(candidates[electionId][candidateId].id != 0, "Candidate already deleted or doesn't exist");

        delete candidates[electionId][candidateId];
        
        emit CandidateDeleted(electionId, candidateId);
    }

    // ────────────────────────────────────────────────────────────────────────
    // VOTING
    // ────────────────────────────────────────────────────────────────────────

    /// @notice Cast a vote using an anonymous voter hash
    /// @param electionId  The election identifier
    /// @param voterHash   keccak256(voter_id + ":" + electionId) — computed off-chain
    /// @param candidateId The candidate to vote for
    function castVote(
        string memory electionId,
        bytes32 voterHash,
        uint256 candidateId
    ) external electionExists(electionId) votingOpen(electionId) {
        require(candidateId > 0 && candidateId <= candidateCount[electionId], "Invalid candidate");
        require(!hasVoted[electionId][voterHash], "Voter has already voted");

        hasVoted[electionId][voterHash]   = true;
        voterChoice[electionId][voterHash] = candidateId;
        candidates[electionId][candidateId].voteCount++;

        emit VoteCast(electionId, voterHash, candidateId, block.timestamp);
    }

    // ────────────────────────────────────────────────────────────────────────
    // VIEW FUNCTIONS
    // ────────────────────────────────────────────────────────────────────────

    /// @notice Get election details
    function getElection(string memory electionId)
        external view electionExists(electionId)
        returns (string memory, string memory, uint256, uint256)
    {
        Election memory e = elections[electionId];
        return (e.electionId, e.name, e.startTime, e.endTime);
    }

    /// @notice Get total number of candidates in an election
    function getCandidateCount(string memory electionId) external view returns (uint256) {
        return candidateCount[electionId];
    }

    /// @notice Get a candidate by ID
    function getCandidate(string memory electionId, uint256 candidateId)
        external view electionExists(electionId)
        returns (uint256, string memory, string memory, uint256)
    {
        Candidate memory c = candidates[electionId][candidateId];
        return (c.id, c.name, c.party, c.voteCount);
    }

    /// @notice Check whether an anonymous voter hash has voted
    function checkVoterStatus(string memory electionId, bytes32 voterHash)
        external view returns (bool)
    {
        return hasVoted[electionId][voterHash];
    }

    /// @notice Helper: compute a voter hash on-chain (same as off-chain SHA-256 equivalent using keccak256)
    function computeVoterHash(string memory voterId, string memory electionId_)
        external pure returns (bytes32)
    {
        return keccak256(abi.encodePacked(voterId, ":", electionId_));
    }

    /// @notice Get a list of all election IDs
    function getElectionIds() external view returns (string[] memory) {
        return electionIds;
    }
}
