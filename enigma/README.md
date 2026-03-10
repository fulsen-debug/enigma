# AI Guardian

AI Guardian is a web product with two workspaces:

Repository:
- `https://github.com/fulsen-debug/enigma`

- `Scanner Workspace`: fast, one-token analysis for traders
- `Agent Workspace`: autonomous paper-trading logic for one selected token

This first release is deterministic and rules-based. It does not require an LLM.

## Release Scope

### Scanner Workspace
- Manual token scan
- Random token discovery
- Token risk and market analysis
- Holder concentration uses Helius-compatible RPC `getTokenLargestAccounts` (top 20)
- Helius-backed wallet activity and labeling when available
- AIG Forensics summary with verified vs inferred signals
- Download PNG / Share on X

### Agent Workspace
- One selected agent token
- Paper-only autonomous entry/exit loop
- Policy-gated buy candidate selection
- Risk-managed exits: TP, SL, trailing stop, max hold, cooldown
- Position and activity history
- Each paper run auto-stops after 8 minutes (daily run cap)

### Not in First Release
- Full lifetime holder history
- Public live trading mode
- LLM-generated trading decisions
- Watchlist-driven scanner workflow

## Runtime Requirements

- Node.js `22+`
- `HELIUS_API_KEY` / `HELIUS_API_KEYS` or `SOLANA_RPC_URL`
- `ENIGMA_JWT_SECRET`

## Install

```bash
npm install
cp .env.example .env
npm run build
```

## Local Run

```bash
npm run dev
```

Open:

- `http://127.0.0.1:3000`

If port `3000` is occupied, the server will bind to the next available port and print it in the logs.

## Environment

Minimum production environment:

- `NODE_ENV=production`
- `ENIGMA_JWT_SECRET=<32+ random chars>`
- `HELIUS_API_KEY=<key>` or `HELIUS_API_KEYS=<key1,key2,key3>` or `SOLANA_RPC_URL=<rpc>`
- `ENIGMA_DB_PATH=/var/data/enigma_data.sqlite`
- `ENIGMA_KOBX_REQUIRED_BALANCE=500000`
- `ENIGMA_KOBX_HIGH_TIER_BALANCE=3000000`

Scanner access tiers:
- `>= 500,000 KOBX` => 2 scans/day
- `>= 3,000,000 KOBX` => 5 scans/day

Live execution variables still exist in the codebase, but they are not part of this first-release product surface.

## Build and QA

```bash
npm run build
npm run test
npm run qa
```

`npm run qa` performs:

- TypeScript build
- smoke test
- unit tests
- extended API/web checks

## Deploy

This repo is deploy-ready with Docker and Render.

### Render

Use the root-level `render.yaml` or `enigma/render.yaml`.

Required Render environment variables:

- `ENIGMA_JWT_SECRET`
- `HELIUS_API_KEY` / `HELIUS_API_KEYS` or `SOLANA_RPC_URL`
- `ENIGMA_DB_PATH=/var/data/enigma_data.sqlite`

Recommended:

- persistent disk mounted at `/var/data`

### Docker

```bash
docker build -t ai-guardian ./enigma
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e ENIGMA_JWT_SECRET=change_me \
  -e HELIUS_API_KEYS=key1,key2,key3 \
  -e ENIGMA_DB_PATH=/app/data/enigma_data.sqlite \
  -v $(pwd)/data:/app/data \
  ai-guardian
```

## Product Positioning

For this first release:

- Scanner = fast trader analysis
- Agent = simplified autonomous paper-trading workspace

Do not market this build as a market-wide autonomous trading system. The current agent monitors and trades one selected token using deterministic policy gates and execution rules.
