# Production Runbook

## Release Shape

AI Guardian first release ships:
- `Scanner Workspace`: quick one-token analysis
- `Agent Workspace`: autonomous paper trading for one selected token

It does not ship public live execution.

## Pre-Deploy Gate

Run locally:

```bash
npm run qa
```

This covers:
- build
- smoke test
- unit tests
- extended API/web QA

Run these checks serially. Do not run smoke and extended QA in parallel against the same SQLite file.

## Required Environment

- `NODE_ENV=production`
- `ENIGMA_JWT_SECRET` set to a strong non-default value
- `HELIUS_API_KEY` / `HELIUS_API_KEYS` or `SOLANA_RPC_URL`
- `ENIGMA_DB_PATH` pointing to persistent storage
- `ENIGMA_KOBX_REQUIRED_BALANCE=500000`
- `ENIGMA_KOBX_HIGH_TIER_BALANCE=3000000`

Recommended:
- persistent disk mounted at `/var/data`
- `ENIGMA_DB_PATH=/var/data/enigma_data.sqlite`
- `ENIGMA_EXECUTION_ENABLED=0`

## Deployment Target

Current recommended host:
- Render

Expected flow:
1. push to `main`
2. deploy using `render.yaml`
3. verify service health
4. attach custom domain

## Post-Deploy Verification

Check:

```bash
curl -sS https://<your-domain>/api/health
```

Then verify in the browser:
1. homepage loads
2. wallet connect works
3. random scan works
4. manual token scan works
4a. scanner gate requires >= 500K KOBX
4b. daily scan limit matches KOBX tier (2/day or 5/day)
5. holder table renders
6. AIG Forensics renders verified concentration / wallet activity source note
7. Download PNG and Share on X buttons render for scanner cards
6. agent workspace loads config/history
7. paper test starts and logs actions
7a. paper test auto-stops after 8 minutes
8. refresh preserves login via cookie session

## Cookie/Auth Verification

This release uses server-issued `HttpOnly` cookie auth for the web app.

Confirm:
- login works
- refresh keeps the session
- browser JS does not store the JWT in `localStorage`

## Rollback

If deployment is bad:
1. rollback to previous Render deploy
2. record timestamp and failing route/UI flow
3. patch forward with a regression test

## Operational Boundaries

Do not market this deployment as:
- market-wide autonomous live trading
- LLM-driven execution
- guaranteed-profit automation

Market it as:
- fast scanner for traders
- autonomous paper agent for one selected token

## Live Ops Alerting (Phase 4.1)

Required env:
- `ENIGMA_OPS_ALERT_WEBHOOK_URL`
- `ENIGMA_OPS_ALERT_MIN_LEVEL` (`info|warn|error`)
- `ENIGMA_OPS_ALERT_COOLDOWN_SEC`
- `ENIGMA_LIVE_CONSENT_VERSION` (versioned live consent gate)

Operator endpoints (admin token required):
- `GET /api/live/alert-templates`
- `POST /api/live/alerts/test`
- `GET /api/live/status`
- `GET /api/live/canary-precheck`
- `POST /api/live/emergency-halt` (runtime halt toggle for validation)
- `POST /api/live/simulate` (`drawdown_breach` / `failed_trade`)

One-command smoke test:

```bash
ENIGMA_ADMIN_TOKEN=<admin_token> BASE_URL=https://<your-domain> npm run -s live:ops:smoke
```

Expected behavior:
- INFO bursts are deduplicated by cooldown.
- CRITICAL bursts bypass cooldown and are never suppressed.
- `/api/live/status` returns active wallet/risk/PnL state plus alert delivery health.

Canary pre-activation checklist:
- `GET /api/live/canary-precheck` must return `"pass": true`
- only Wallet A appears in `ENIGMA_INTERNAL_LIVE_WALLETS`
- Wallet B is removed from allowlist and signer map
- Wallet A execution config is strict: `paperBudgetUsd=50`, `maxOpenPositions=1`, conservative trade size

Manual safety simulations (admin token required):

```bash
curl -X POST "$BASE_URL/api/live/emergency-halt" \
  -H "x-admin-token: $ENIGMA_ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"enabled":true}'

curl -X POST "$BASE_URL/api/live/simulate" \
  -H "x-admin-token: $ENIGMA_ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"wallet":"<walletA>","type":"drawdown_breach"}'

curl -X POST "$BASE_URL/api/live/simulate" \
  -H "x-admin-token: $ENIGMA_ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"wallet":"<walletA>","type":"failed_trade"}'
```
