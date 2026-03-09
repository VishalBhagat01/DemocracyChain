# VoteChain — Decentralized Voting System on Ethereum

A full-stack decentralized voting system powered by **Ethereum** smart contracts, **Web3.js**, and a **PostgreSQL** voter database. Features anonymous on-chain voting, a biometric face-registration portal, admin election management, and live results — all running locally with Hardhat.

---

## ✨ Features

- **Smart Contract** — Solidity `Voting.sol` with multi-election support, candidate management, anonymous hash-based voter identity, and double-vote prevention
- **Admin Portal** — Create elections, add/manage candidates, register voters, view live standings
- **Voter Portal** — Cast votes directly on-chain via MetaMask
- **Face Registration** — Biometric face embedding capture during voter registration
- **Live Results** — Real-time vote counts fetched from the blockchain
- **Auth** — JWT-based login with role separation (admin / voter)
- **Database** — PostgreSQL (Supabase) stores voter records; blockchain stores votes
- **Tests** — Hardhat test suite covering all smart contract functions

---

## �️ Prerequisites

| Tool | Version | Link |
|------|---------|------|
| Node.js | v18+ | https://nodejs.org/ |
| MetaMask | Latest | https://metamask.io/download/ |
| PostgreSQL | Any (or Supabase) | https://supabase.com/ |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/votechain.git
cd votechain
npm install
```

### 2. Configure Environment

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Local Hardhat private key (Account #0 — default for local dev)
MASTER_WALLET_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Local Hardhat RPC
ETH_RPC_URL=http://127.0.0.1:8545

# PostgreSQL connection string (Supabase or local)
DATABASE_URL=postgresql://user:password@host:5432/postgres

# JWT secret (generate a random 64-char hex string)
SECRET_KEY=your_secret_key_here

# Admin password for the portal
ADMIN_PASSWORD=Admin@123
```

> **Note:** Never commit your real `.env` file. It is already in `.gitignore`.

### 3. Set Up the Database

```bash
npm run setup:db
```

This runs `database_api/setup_db.js` which initialises the `voters` table in PostgreSQL.

### 4. Start Local Ethereum Node *(separate terminal)*

```bash
npx hardhat node
```

Starts a local Hardhat node at `http://127.0.0.1:8545` and prints **20 test accounts** with 10 000 ETH each.

**Add the network to MetaMask:**

| Field | Value |
|-------|-------|
| Network name | `Hardhat Local` |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency | `ETH` |

Import one of the printed private keys into MetaMask to use as your test wallet.

### 5. Compile & Deploy the Contract

```bash
npm run compile
npm run deploy:local
```

Deploys `Voting.sol`, seeds a demo election (`election2026`) with 3 candidates, and writes contract info to `frontend/src/contract.json`.

### 6. Start the Web Server

```bash
npm run frontend
```

Open **http://localhost:8080** in your browser.

---

## 👤 Demo Accounts

| Voter ID | Password | Role |
|----------|----------|------|
| `admin` | `Admin@123` | Admin |
| `voter001` | `voter123` | Voter |
| `voter002` | `voter123` | Voter |

---

## 🧪 Run Tests

```bash
npm test
```

Runs the Hardhat test suite in `test/Voting.test.js` covering election creation, candidate management, vote casting, double-vote prevention, and anonymity.

---

## 📂 Project Structure

```
votechain/
├── contracts/
│   └── Voting.sol              # Solidity smart contract
├── scripts/
│   └── deploy.js               # Hardhat deploy + seed script
├── test/
│   └── Voting.test.js          # Hardhat test suite
├── frontend/
│   ├── server.js               # Express backend (API + static serving)
│   └── src/
│       ├── login.html          # Login page
│       ├── register.html       # Voter registration (with face capture)
│       ├── vote.html           # Voter portal (MetaMask)
│       ├── admin.html          # Admin portal
│       └── results.html        # Live results
├── database_api/
│   ├── setup_db.js             # Creates DB tables
│   ├── db_init.sql             # SQL schema
│   └── db_reset.sql            # SQL reset script
├── hardhat.config.js           # Hardhat configuration
├── package.json
├── .env.example                # Environment variable template
└── .gitignore
```

---

## � Available Scripts

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile Solidity contracts |
| `npm run deploy:local` | Deploy contract to local Hardhat node |
| `npm run deploy:ganache` | Deploy contract to Ganache |
| `npm run node` | Start local Hardhat Ethereum node |
| `npm run frontend` | Start Express web server |
| `npm run setup:db` | Initialise PostgreSQL database |
| `npm test` | Run Hardhat smart contract tests |

---

## 🔐 Smart Contract Functions

| Function | Access | Description |
|----------|--------|-------------|
| `createElection(id, name, start, end)` | Owner | Create a new election |
| `addCandidate(electionId, name, party)` | Owner | Add a candidate to an election |
| `castVote(electionId, voterHash, candidateId)` | Public | Cast an anonymous vote on-chain |
| `checkVoterStatus(electionId, hash)` | Public | Check if a voter hash has already voted |
| `getCandidate(electionId, id)` | Public | Get candidate details + vote count |
| `getCandidateCount(electionId)` | Public | Number of candidates in an election |
| `getElection(electionId)` | Public | Get election metadata |

---

## �️ How Voter Anonymity Works

The voter's real identity is **never stored on-chain**:

1. Off-chain: `voterHash = keccak256(voterAddress + ":" + electionId)`
2. Only this hash is passed to `castVote()` and recorded on the blockchain
3. The actual wallet address or voter ID is **never written to the ledger**

---

## 🌐 Deploying to a Testnet (Sepolia)

1. Add your Sepolia RPC URL and funded wallet key to `.env`
2. Add a `sepolia` network entry in `hardhat.config.js`
3. Run: `npx hardhat run scripts/deploy.js --network sepolia`
4. Update `ETH_RPC_URL` in `.env` to your Sepolia RPC and restart the server

---

## 📄 License

MIT
