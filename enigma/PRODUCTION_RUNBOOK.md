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
5. holder table renders
6. AIG Forensics renders verified concentration / wallet activity source note
7. Download PNG and Share on X buttons render for scanner cards
6. agent workspace loads config/history
7. paper test starts and logs actions
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
