# VoteChain Deployment Guide

This document covers practical deployment patterns for the current VoteChain codebase.

## Services in this Repository

- Core API + static voting pages: frontend/server.js (Node/Express)
- Smart contract deployment pipeline: Hardhat scripts in scripts/
- Dashboard: frontend/apps/dashboard (React + Vite)
- ML service: frontend/apps/ml-service (FastAPI)
- Graph service: frontend/apps/graph-service (FastAPI + Neo4j)

## Recommended Production Topology

- API service on Render/Railway/Fly/VM
- Dashboard on Vercel or Netlify
- ML service on Render/Railway
- Graph service on Render/Railway with managed Neo4j (Aura)
- PostgreSQL on Supabase/Neon/RDS
- EVM RPC from a provider (Infura/Alchemy/QuickNode)

## 1) Deploy Smart Contract

Set in environment:

- ETH_RPC_URL
- MASTER_WALLET_PRIVATE_KEY

Deploy:

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network live
```

After deployment, persist frontend/src/contract.json as an artifact in your release pipeline.

## 2) Deploy Core API (frontend/server.js)

### Build and start commands

- Build command:

```bash
npm ci
```

- Start command:

```bash
npm run frontend
```

### Required environment variables

- DATABASE_URL
- SECRET_KEY
- ETH_RPC_URL
- MASTER_WALLET_PRIVATE_KEY
- ADMIN_PASSWORD
- NODE_ENV=production

### Notes

- server.js enables CORS for localhost dashboard origins only. Update the CORS allow-list before production if dashboard is hosted on a public domain.
- Ensure frontend/src/contract.json exists in deployment output.

## 3) Deploy Dashboard (frontend/apps/dashboard)

The dashboard is a standalone Vite app.

### Vercel settings

- Framework: Vite
- Root Directory: frontend/apps/dashboard
- Build Command: npm run build
- Output Directory: dist

### Required environment variables

- VITE_BACKEND_URL=https://your-api-domain
- VITE_ML_URL=https://your-ml-domain
- VITE_GRAPH_URL=https://your-graph-domain

## 4) Deploy ML Service (frontend/apps/ml-service)

### Render web service settings

- Build command:

```bash
pip install -r frontend/apps/ml-service/requirements.txt
```

- Start command:

```bash
cd frontend/apps/ml-service && uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Optional environment variables

- LOG_LEVEL=info

Health check endpoint:

- /health

## 5) Deploy Graph Service (frontend/apps/graph-service)

### Render web service settings

- Build command:

```bash
pip install -r frontend/apps/graph-service/requirements.txt
```

- Start command:

```bash
cd frontend/apps/graph-service && uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Required environment variables

- NEO4J_URI
- NEO4J_USER
- NEO4J_PASSWORD

### Seed graph data

Run once against the target Neo4j instance:

```bash
cd frontend/apps/graph-service
python seed.py
```

Health check endpoint:

- /health

## 6) Local Pre-Production Validation

Run this before promoting new builds:

1. npm test
2. npm run setup:db
3. npm run node
4. npm run deploy:local
5. npm run frontend
6. Optional: npm run dashboard:dev, npm run ml:start, npm run graph:start

Smoke tests:

```bash
curl http://localhost:8080/contract.json
curl http://localhost:8001/health
curl http://localhost:8002/health
```

## 7) Environment Variable Matrix

API service:

- DATABASE_URL
- SECRET_KEY
- ETH_RPC_URL
- MASTER_WALLET_PRIVATE_KEY
- ADMIN_PASSWORD

Dashboard:

- VITE_BACKEND_URL
- VITE_ML_URL
- VITE_GRAPH_URL

Graph service:

- NEO4J_URI
- NEO4J_USER
- NEO4J_PASSWORD

## 8) Troubleshooting

Contract calls fail from API:

- Confirm ETH_RPC_URL is reachable from the server.
- Confirm MASTER_WALLET_PRIVATE_KEY is valid and funded.
- Confirm frontend/src/contract.json matches deployed network and address.

Login/API failures:

- Verify DATABASE_URL connectivity and SSL settings.
- Verify SECRET_KEY is set and stable across restarts.

Dashboard cannot reach backend:

- Verify VITE_BACKEND_URL points to the public API URL.
- Update server CORS allow-list for your dashboard domain.

Graph service degraded:

- Verify NEO4J_URI/credentials.
- Run seed.py to initialize sample graph data.

## 9) Security Checklist

- Do not commit .env files.
- Rotate MASTER_WALLET_PRIVATE_KEY if ever exposed.
- Use strong SECRET_KEY value (32 random bytes minimum).
- Restrict database and Neo4j network access.
- Enable HTTPS on all public endpoints.
