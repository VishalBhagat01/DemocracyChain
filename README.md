# VoteChain — DemocracyChain

VoteChain is a full-stack decentralized voting platform combining:

- A Solidity smart contract for tamper-proof vote integrity
- An Express API for authentication and voting workflow
- PostgreSQL (Supabase) for voter identity and audit trails
- Face biometric verification before vote submission
- Optional ML congestion prediction and graph analytics microservices
- A React dashboard for live operational analytics

Core voting data is committed on-chain. User identity, approvals, and audit trails stay in PostgreSQL.

---

## Prerequisites

- Node.js 18+
- Python 3.10+ with pip
- MetaMask browser extension (for the admin panel)
- A running PostgreSQL instance (Supabase connection is pre-configured in `.env`)

---

## First-Time Setup

### 1. Install dependencies

```powershell
# Root project
npm install

# Python virtual environment (run once)
python -m venv venv
.\venv\Scripts\Activate.ps1

# ML service
pip install -r frontend/apps/ml-service/requirements.txt

# Graph service
pip install -r frontend/apps/graph-service/requirements.txt

# Dashboard
cd frontend/apps/dashboard && npm install && cd ../../../
```

### 2. Configure environment

Copy the example and fill in your values:

```powershell
copy .env.example .env
```

Key variables to set in `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | Random string for JWT signing |
| `MASTER_WALLET_PRIVATE_KEY` | Hardhat account #0 private key (pre-filled for local) |
| `ETH_RPC_URL` | RPC endpoint (default: `http://127.0.0.1:8545`) |
| `ADMIN_PASSWORD` | Admin account password (default: `Admin@123`) |

### 3. Initialize the database

```powershell
npm run setup:db
```

This creates the schema and seeds the admin account.

---

## Running the Project

### One-command startup (recommended)

```powershell
.\start.ps1
```

This single script will:
1. Start the **Hardhat local blockchain** node
2. Wait 8 seconds for it to initialize
3. **Deploy the smart contract** (writes `frontend/src/contract.json`)
4. Start the **Express frontend server** on port 8080
5. Start the **ML service** on port 8001
6. Start the **Graph analytics service** on port 8002
7. Start the **React dashboard** dev server

> If you get an execution policy error, run once:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

### Service URLs

| Service | URL |
|---|---|
| Voting App | http://localhost:8080 |
| Admin Panel | http://localhost:8080/admin |
| ML Service | http://localhost:8001 |
| Graph Service | http://localhost:8002 |
| Dashboard | http://localhost:5173 (check dashboard window) |

---

## Admin Workflow (after startup)

No election data or voters are pre-loaded. The admin sets up everything:

1. Open **http://localhost:8080/admin** → connect MetaMask
2. **Sessions tab** → Create an election (ID, name, start/end dates) → **Finalize & Deploy**
3. **Candidates tab** → Select session → add nominees individually OR bulk-import via CSV
4. **Voters tab** → bulk-import voter list via CSV
5. Voters log in at **http://localhost:8080** and cast biometric-verified votes

---

## CSV Formats

### Voters CSV — Admin → Voters tab → "Bulk Import"

Required columns: `voter_id`, `full_name`, `password`
Optional columns: `email`, `booth_id`

```
voter_id,full_name,password,email,booth_id
voter101,Arjun Kapoor,Pass@123,arjun@example.com,BOOTH001
voter102,Sunita Sharma,Pass@456,sunita@example.com,BOOTH002
```

- All imported voters are set to **approved** immediately (no manual approval needed)
- Re-uploading the same `voter_id` updates the record (upsert)
- A **Download Template** link is available in the admin panel

### Candidates CSV — Admin → Candidates tab → "Bulk Import"

Required columns: `name`, `party`

```
name,party
Narendra Modi,Bharatiya Janata Party (BJP)
Rahul Gandhi,Indian National Congress (INC)
Arvind Kejriwal,Aam Aadmi Party (AAP)
```

- Candidates are written directly to the **blockchain** via the master wallet
- Must have an active election session selected first
- A **Download Template** link is available in the admin panel

---

## Demo Credentials

Only the admin account is seeded by `npm run setup:db`:

| User | Password |
|---|---|
| `admin` | Value of `ADMIN_PASSWORD` (default: `Admin@123`) |

All voter accounts must be imported via CSV from the admin panel.

---

## Project Structure

```
DemocracyChain/
├── contracts/               # Solidity smart contracts
├── scripts/deploy.js        # Contract deployment (no auto-seed)
├── test/                    # Hardhat test suite
├── database_api/            # PostgreSQL schema and setup scripts
├── frontend/
│   ├── server.js            # Express API + static file host
│   ├── src/                 # HTML voting pages + contract.json
│   ├── public/models/       # Face-api.js model files
│   └── apps/
│       ├── dashboard/       # React + Vite admin dashboard
│       ├── ml-service/      # FastAPI voter congestion ML service
│       └── graph-service/   # FastAPI Neo4j graph analytics
├── start.ps1                # One-command project launcher
├── hardhat.config.js
├── package.json
└── .env
```

---

## Available Scripts

| Script | Description |
|---|---|
| `.\start.ps1` | Start all services (recommended) |
| `npm run node` | Start Hardhat local chain only |
| `npm run deploy:local` | Deploy contract to localhost |
| `npm run frontend` | Start Express server only |
| `npm run setup:db` | Initialize PostgreSQL schema |
| `npm run compile` | Compile Solidity contracts |
| `npm test` | Run Hardhat test suite |
| `npm run dashboard:dev` | Run Vite dashboard in dev mode |
| `npm run ml:start` | Start ML FastAPI service |
| `npm run graph:start` | Start Graph FastAPI service |
| `npm run graph:seed` | Seed Neo4j with sample data |

---

## Testnet Deployment

To deploy to a live EVM network:

1. Set `ETH_RPC_URL` to the target RPC endpoint
2. Set `MASTER_WALLET_PRIVATE_KEY` to a funded deployer wallet key
3. Run:

```bash
npx hardhat run scripts/deploy.js --network live
```

4. Distribute the updated `frontend/src/contract.json` with the live address and ABI.

---

## License

MIT
