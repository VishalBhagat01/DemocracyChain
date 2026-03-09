# VoteChain — Project Summary

> A full-stack decentralised voting system combining **Ethereum smart contracts**, **biometric face authentication**, and a **PostgreSQL** voter database.

---

## 🎯 What It Does

VoteChain allows an administrator to run tamper-proof elections on the Ethereum blockchain. Voters register once (with a face scan), get approved by an admin, and then cast their vote — verified by biometrics before anything hits the blockchain.

---

## ✨ Key Features

| Feature | Detail |
|---------|--------|
| **On-chain voting** | Votes are stored permanently on Ethereum via `Voting.sol` |
| **Biometric auth** | Face embedding captured at registration; verified at vote time using Euclidean distance |
| **Voter anonymity** | Only a `keccak256` hash of the voter ID is written to the blockchain — never the real identity |
| **Double-vote prevention** | Hash checked on-chain; rejected if already used |
| **Admin approval flow** | New voters register as `pending`; admin must approve before they can vote |
| **Multi-election support** | Admin can create multiple elections, each with their own candidates and time window |
| **Live results** | Vote counts read directly from the blockchain in real time |
| **Full audit trail** | Every login, vote, and biometric failure is logged to a PostgreSQL `audit_log` table |
| **JWT sessions** | Stateless 2-hour sessions; role-separated (admin vs voter) |

---

## 🏗️ Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  login.html  register.html  vote.html  admin.html        │
│                    face-api.js (SSD MobileNet v1)        │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / REST
┌──────────────────────▼──────────────────────────────────┐
│               Express Server  (Node.js :8080)            │
│  JWT Auth  │  bcrypt  │  Biometric verify  │  ethers.js  │
└─────┬───────────────────────────────────────────┬────────┘
      │ SQL (pg)                                  │ RPC
┌─────▼──────────────────┐          ┌─────────────▼───────┐
│  PostgreSQL (Supabase)  │          │  Ethereum Node       │
│  voters                 │          │  Voting.sol contract │
│  audit_log              │          │  (Hardhat / Sepolia) │
└─────────────────────────┘          └─────────────────────┘
```

### Three-Layer Design

#### Layer 1 — Blockchain (Trust Layer)
- **`Voting.sol`** — Solidity smart contract managing elections, candidates, and votes
- Stores only anonymous voter hashes — never real identities
- Enforces voting windows (`startTime` / `endTime`) and double-vote prevention entirely on-chain
- Events emitted: `ElectionCreated`, `CandidateAdded`, `VoteCast`, etc.

#### Layer 2 — Backend (Logic & Security Layer)
- **Express.js** server handles auth, biometric verification, and transaction relay
- On `/api/cast-vote`:
  1. JWT is verified
  2. Voter's stored face embedding is fetched from DB
  3. Euclidean distance is computed between live and stored embeddings (threshold: **0.6**)
  4. If matched → `keccak256(voterId + electionId + SECRET_KEY)` is computed server-side
  5. `contract.castVote()` is called via an **ethers.js Master Wallet** — voters never need ETH
- All events written to `audit_log`

#### Layer 3 — Database (Identity Layer)
- **PostgreSQL** (hosted on Supabase) stores voter records only — not votes
- Key fields: `voter_id`, `hashed_password` (bcrypt), `face_embedding` (128-dim JSON array), `status` (pending / approved)

---

## 🔐 Security Design

| Threat | Mitigation |
|--------|-----------|
| Password theft | bcrypt (12 rounds) |
| Session hijack | JWT HS256, 2h expiry |
| Biometric spoof | Server-side Euclidean distance check on 128-dim vectors |
| Vote manipulation | Immutable Ethereum ledger; smart contract enforces rules |
| Double voting | On-chain `hasVoted` mapping per voter hash |
| Identity exposure | Voter ID never on blockchain — only `keccak256` hash |
| Unauthorised admin access | Role checked on every admin API call |

---

## 🔄 Vote Casting Flow (Step by Step)

```
1. Voter logs in → bcrypt verify → JWT issued
2. Browser opens camera → face-api.js captures 128-dim embedding
3. Voter selects candidate → clicks Cast Vote
4. Server receives: { electionId, candidateId, face_embedding, JWT }
5. Server fetches stored embedding from PostgreSQL
6. Euclidean distance computed — must be < 0.6   ← biometric gate
7. Server computes voterHash = keccak256(voterId + electionId + SECRET)
8. server → contract.castVote(electionId, voterHash, candidateId)
9. Blockchain checks: election open? candidate valid? hash unused?
10. Vote recorded on-chain → tx hash returned to voter
11. Audit log entry written to PostgreSQL
```

---

## 📂 Project Structure

```
votechain/
├── contracts/Voting.sol         ← Solidity smart contract
├── scripts/deploy.js            ← Deploy + seed demo data
├── test/Voting.test.js          ← Hardhat test suite
├── frontend/
│   ├── server.js                ← Express backend (432 lines)
│   └── src/
│       ├── login.html
│       ├── register.html        ← Face capture + registration
│       ├── vote.html            ← Biometric vote portal
│       ├── admin.html           ← Election + voter management
│       └── results.html         ← Live blockchain results
├── database_api/
│   ├── setup_db.js
│   ├── db_init.sql              ← Schema (voters + audit_log)
│   └── db_reset.sql
├── .env.example                 ← Environment variable template
└── hardhat.config.js
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity ^0.8.19 |
| Blockchain Dev | Hardhat |
| Blockchain Client (server) | ethers.js v6 |
| Blockchain Client (browser) | Web3.js v4 |
| Browser Wallet | MetaMask |
| Backend Runtime | Node.js + Express.js |
| Authentication | JWT (jsonwebtoken) + bcrypt |
| Biometrics | face-api.js (SSD MobileNet v1) |
| Database | PostgreSQL via Supabase |
| DB Client | node-postgres (pg) |

---

## 🚀 Running Locally (Quick Reference)

```bash
# 1. Install
npm install

# 2. Set up database
npm run setup:db

# 3. Start Ethereum node (separate terminal)
npx hardhat node

# 4. Deploy contract
npm run compile && npm run deploy:local

# 5. Start server
npm run frontend
# → http://localhost:8080
```

---

*VoteChain — Built with Ethereum, Node.js, and face-api.js*
