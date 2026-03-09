// test/Voting.test.js — Hardhat test suite for the Voting smart contract
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
    let voting, owner, voter1, voter2;
    const ELECTION_ID = "election2025";
    let startTime, endTime;

    beforeEach(async () => {
        [owner, voter1, voter2] = await ethers.getSigners();

        const Voting = await ethers.getContractFactory("Voting");
        voting = await Voting.deploy();
        await voting.waitForDeployment();

        // Create an election starting now
        startTime = Math.floor(Date.now() / 1000) - 10; // started 10s ago
        endTime = startTime + 7 * 24 * 60 * 60;       // ends in 1 week

        await voting.createElection(ELECTION_ID, "Test Election 2025", startTime, endTime);
        await voting.addCandidate(ELECTION_ID, "Alice", "Party A");
        await voting.addCandidate(ELECTION_ID, "Bob", "Party B");
    });

    it("should deploy and set the owner", async () => {
        expect(await voting.owner()).to.equal(owner.address);
    });

    it("should create an election", async () => {
        const [id, name, start, end] = await voting.getElection(ELECTION_ID);
        expect(id).to.equal(ELECTION_ID);
        expect(name).to.equal("Test Election 2025");
        expect(start).to.equal(startTime);
        expect(end).to.equal(endTime);
    });

    it("should add candidates", async () => {
        expect(await voting.getCandidateCount(ELECTION_ID)).to.equal(2);
        const [id, name, party, count] = await voting.getCandidate(ELECTION_ID, 1);
        expect(name).to.equal("Alice");
        expect(party).to.equal("Party A");
        expect(count).to.equal(0);
    });

    it("should allow a voter to cast a vote", async () => {
        const voterHash = ethers.keccak256(ethers.toUtf8Bytes("voter1:election2025"));
        await voting.castVote(ELECTION_ID, voterHash, 1);

        const [, , , count] = await voting.getCandidate(ELECTION_ID, 1);
        expect(count).to.equal(1);
    });

    it("should prevent double voting", async () => {
        const voterHash = ethers.keccak256(ethers.toUtf8Bytes("voter1:election2025"));
        await voting.castVote(ELECTION_ID, voterHash, 1);

        await expect(
            voting.castVote(ELECTION_ID, voterHash, 2)
        ).to.be.revertedWith("Voter has already voted");
    });

    it("should return correct voter status", async () => {
        const voterHash = ethers.keccak256(ethers.toUtf8Bytes("voter1:election2025"));
        expect(await voting.checkVoterStatus(ELECTION_ID, voterHash)).to.be.false;
        await voting.castVote(ELECTION_ID, voterHash, 1);
        expect(await voting.checkVoterStatus(ELECTION_ID, voterHash)).to.be.true;
    });

    it("should reject invalid candidate ID", async () => {
        const voterHash = ethers.keccak256(ethers.toUtf8Bytes("voter2:election2025"));
        await expect(
            voting.castVote(ELECTION_ID, voterHash, 99)
        ).to.be.revertedWith("Invalid candidate");
    });

    it("should reject votes from non-existent elections", async () => {
        const voterHash = ethers.keccak256(ethers.toUtf8Bytes("voter2:other"));
        await expect(
            voting.castVote("nonexistent", voterHash, 1)
        ).to.be.revertedWith("Election does not exist");
    });
});
