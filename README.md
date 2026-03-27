# VoteChain

VoteChain is a full-stack voting platform that combines:

- a Solidity smart contract for vote integrity,
- an Express API for authentication and voting workflow,
- PostgreSQL for voter identity and audit metadata,
- optional ML and graph analytics microservices,
- a React dashboard for operational analytics.

Core voting data is committed on-chain. User identity, approvals, and audit trails stay in PostgreSQL.

## Features

- Smart contract election lifecycle and candidate management
- Hash-based anonymous vote recording on Ethereum
- JWT-based login with admin and voter roles
- Face embedding verification before vote submission
- Admin voter approval and voter management endpoints
- Optional ML congestion predictions and graph analytics services

## Tech Stack

- Node.js + Express
- Hardhat + Solidity + Ethers
- PostgreSQL (Supabase or self-hosted)
- React + Vite (dashboard)
- FastAPI (ML service and graph service)
- Neo4j (graph service backend)

## Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL instance
- MetaMask (for local wallet testing)
- Neo4j (only if running graph service)

## Quick Start (Local)

1. **Install dependencies**

```bash
# Main project & API dependencies
npm install

# Dashboard dependencies
cd frontend/apps/dashboard && npm install
cd ../../../

# ML service dependencies (optional)
cd frontend/apps/ml-service && pip install -r requirements.txt
cd ../../../

# Graph service dependencies (optional)
cd frontend/apps/graph-service && pip install -r requirements.txt
cd ../../../
```

2. **Create environment file**

```bash
cp .env.example .env
```

Windows CMD alternative:

```bat
copy .env.example .env
```

3. **Update required values in `.env`**

- `DATABASE_URL`: Your PostgreSQL connection string.
- `SECRET_KEY`: Random string for JWT.
- `MASTER_WALLET_PRIVATE_KEY`: Private key of a wallet with test ETH (if using a real testnet).
- `ETH_RPC_URL`: RPC endpoint (e.g., `http://127.0.0.1:8545`).
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`: If using the graph service.

4. **Initialize database schema and seed users**

```bash
npm run setup:db
```

5. **Start local blockchain node (Terminal 1)**

```bash
npm run node
```

6. **Compile and deploy contract (Terminal 2)**

```bash
npm run compile
npm run deploy:local
```

This writes contract metadata to `frontend/src/contract.json`.

7. **Start Express API + static web app (Terminal 3)**

```bash
npm run frontend
```

App URL: [http://localhost:8080](http://localhost:8080)

8. **Optional: Start dashboard dev server (Terminal 4)**

```bash
npm run dashboard:dev
```

Dashboard URL: [http://localhost:5173](http://localhost:5173)

9. **Optional: Start ML service (Terminal 5)**

```bash
npm run ml:start
```

10. **Optional: Start & Seed Graph service (Terminal 6)**

```bash
# Seed the data first
npm run graph:seed

# Start the service
npm run graph:start
```

## Demo Credentials

The DB seed script creates the following users:

- admin / value of ADMIN_PASSWORD (default Admin@123)
- voter001 / Voter@001
- voter002 / Voter@002

## Environment Variables

Base server and blockchain:

- MASTER_WALLET_PRIVATE_KEY
- ETH_RPC_URL
- DATABASE_URL
- SECRET_KEY
- ADMIN_PASSWORD

Dashboard and service URLs:

- VITE_BACKEND_URL (default http://localhost:8080)
- VITE_ML_URL (default http://localhost:8001)
- VITE_GRAPH_URL (default http://localhost:8002)
- ML_SERVICE_URL (default http://localhost:8001)

Graph service:

- NEO4J_URI
- NEO4J_USER
- NEO4J_PASSWORD

See .env.example for a full template.

## Available Scripts

- npm run compile: Compile Solidity contracts
- npm test: Run Hardhat test suite
- npm run node: Start Hardhat local chain
- npm run deploy:local: Deploy contract to localhost
- npm run deploy:ganache: Deploy contract to Ganache
- npm run frontend: Start Express server
- npm run setup:db: Reset and initialize PostgreSQL schema
- npm run dashboard:dev: Run Vite dashboard in dev mode
- npm run dashboard:build: Build dashboard for production
- npm run ml:start: Run ML FastAPI service locally
- npm run graph:start: Run graph FastAPI service locally
- npm run graph:seed: Seed Neo4j sample graph data

## Project Structure

```text
votechain/
|- contracts/                # Solidity contracts
|- scripts/                  # Deployment scripts
|- test/                     # Hardhat tests
|- database_api/             # SQL and DB initialization scripts
|- frontend/
|  |- server.js              # Express API and static host
|  |- src/                   # Legacy HTML pages + contract.json
|  |- public/models/         # Face model assets
|  |- apps/dashboard/        # React dashboard (Vite)
|  |- apps/ml-service/       # FastAPI ML service
|  |- apps/graph-service/    # FastAPI Neo4j analytics service
|- hardhat.config.js
|- package.json
|- .env.example
```

## Testnet Deployment Notes

To deploy to a live EVM network:

1. Set ETH_RPC_URL to the target RPC endpoint.
2. Set MASTER_WALLET_PRIVATE_KEY to a funded deployer key.
3. Run:

```bash
npx hardhat run scripts/deploy.js --network live
```

4. Ensure frontend/src/contract.json is distributed with the deployed address and ABI.

## License

MIT
