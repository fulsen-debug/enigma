# AI Guardian Developer Guide

## Product Scope

AI Guardian first release has two workspaces:

- `Scanner Workspace`: one-token trader analysis
- `Agent Workspace`: one-token autonomous paper-trading workflow

This release is deterministic and rules-based. It does not depend on an LLM for trading decisions.

## Runtime

### Prerequisites
- Node.js `22+`
- Git
- `HELIUS_API_KEY` / `HELIUS_API_KEYS` or `SOLANA_RPC_URL`
- `ENIGMA_JWT_SECRET`

### Install
```bash
npm install
cp .env.example .env
```

### Run (dev)
```bash
npm run dev
```

### Run (production)
```bash
npm run build
npm start
```

## Web Surface

Primary app pages:
- `/` main dashboard
- `/start.html` onboarding
- `/manual.html` user manual
- `/developers.html` developer docs
- `/api-docs.html` API explorer

## Current API Surface

Core first-release endpoints:
- `POST /api/auth/nonce`
- `POST /api/auth/verify`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/signal`
- `POST /api/discovery/suggest`
- `GET /api/token/holders`
- `GET /api/token/market/live`
- `GET /api/dashboard/stats`
- `GET /api/autotrade/config`
- `PUT /api/autotrade/config`
- `GET /api/autotrade/execution-config`
- `PUT /api/autotrade/execution-config`
- `POST /api/autotrade/run`
- `POST /api/autotrade/engine/tick`
- `GET /api/autotrade/positions`
- `GET /api/autotrade/performance`

## Auth Model

- Wallet signs nonce
- Server verifies signature
- Server issues JWT in an `HttpOnly` cookie
- Browser app uses cookie-based session auth
- Bearer token auth remains supported for scripts and QA

Do not store server secrets or wallet private keys in browser code.

## Database

Current persistence is SQLite:
- configured by `ENIGMA_DB_PATH`
- intended for low-cost first-release deployment

Main persisted entities:
- users
- auth nonces
- usage counters
- signals
- forecasts
- autotrade configs
- autotrade execution configs
- autotrade runs
- autotrade positions
- premium payments
- managed balances
- withdrawal requests

## First-Release Constraints

- scanner is one-token-at-a-time
- agent is one selected token at a time
- holder concentration uses Helius-compatible RPC `getTokenLargestAccounts` top-20 accounts
- wallet activity and wallet labeling prefer Helius when configured
- bundle/coordinated-risk remains AIG inference layered on top of provider-backed facts
- public live trading is not part of the release
- scanner requires KOBX balance gate
- daily scanner limits are tiered by KOBX holdings
- paper agent auto-stops after 8 minutes per run

## QA Commands

```bash
npm run build
npm run test
npm run qa:extended
npm run qa
```

Important:
- run QA serially, not in parallel, because SQLite test servers can contend for the same DB file

## Deployment

Recommended current deployment:
- Render web service
- persistent disk for SQLite
- production env vars stored in Render secrets

Required production env:
- `NODE_ENV=production`
- `ENIGMA_JWT_SECRET`
- `HELIUS_API_KEY` / `HELIUS_API_KEYS` or `SOLANA_RPC_URL`
- `ENIGMA_DB_PATH=/var/data/enigma_data.sqlite`
- `ENIGMA_KOBX_REQUIRED_BALANCE=500000`
- `ENIGMA_KOBX_HIGH_TIER_BALANCE=3000000`

Keep for first release:
- `ENIGMA_EXECUTION_ENABLED=0`

## Engineering Direction

For this release, prefer:
- deterministic scoring
- clear risk gates
- paper-first execution
- low operational cost

Do not expand product claims beyond what the code supports today.
