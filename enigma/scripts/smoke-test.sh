#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

LOG_FILE="/tmp/enigma_smoke_web.log"
: > "$LOG_FILE"

export NODE_ENV=development
export ENIGMA_JWT_SECRET="enigma-smoke-secret"
export SOLANA_RPC_URL="${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}"
TEST_MINT="${ENIGMA_SMOKE_TEST_MINT:-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v}"

cleanup() {
  if [[ -n "${WEB_PID:-}" ]]; then
    kill -- -"$WEB_PID" >/dev/null 2>&1 || kill "$WEB_PID" >/dev/null 2>&1 || true
    wait "$WEB_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

setsid npm run web > "$LOG_FILE" 2>&1 &
WEB_PID=$!

for _ in $(seq 1 60); do
  if grep -qE 'http://localhost:[0-9]+' "$LOG_FILE"; then
    break
  fi
  if ! kill -0 "$WEB_PID" >/dev/null 2>&1; then
    echo "[smoke] server process exited before startup"
    tail -n 120 "$LOG_FILE"
    exit 1
  fi
  sleep 1
done

PORT="$(grep -oE 'http://localhost:[0-9]+' "$LOG_FILE" | tail -n1 | cut -d: -f3 || true)"
if [[ -z "$PORT" ]]; then
  echo "[smoke] server failed to start"
  tail -n 80 "$LOG_FILE"
  exit 1
fi

echo "[smoke] server on port $PORT"

TOKEN="$(node -e "require('dotenv').config(); const jwt=require('jsonwebtoken'); const secret=process.env.ENIGMA_JWT_SECRET || 'dev-secret-change-in-production'; process.stdout.write(jwt.sign({sub: 909090, wallet: 'Qa8v2dQf5LZ1bR7hQwH4uXxS9nY3kPm5uK2v1r8t9Zx', plan: 'free'}, secret, {expiresIn:'1h'}));")"

curl --max-time 20 -sS "http://localhost:$PORT/api/health" > /tmp/enigma_smoke_health.json

curl -sS \
  --max-time 35 \
  -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -X POST \
  -d "{\"mint\":\"$TEST_MINT\"}" \
  "http://localhost:$PORT/api/signal" > /tmp/enigma_smoke_signal.json

curl -sS \
  --max-time 40 \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:$PORT/api/token/holders?mint=$TEST_MINT&limit=5&mode=sample" > /tmp/enigma_smoke_holders.json

curl -sS \
  --max-time 20 \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:$PORT/api/dashboard/stats" > /tmp/enigma_smoke_stats.json

curl -sS \
  --max-time 20 \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:$PORT/api/autotrade/config" > /tmp/enigma_smoke_autotrade_config.json

curl -sS \
  --max-time 20 \
  -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -X PUT \
  -d '{"enabled":true,"mode":"paper","allowCautionEntries":true,"allowHighRiskEntries":false,"minPatternScore":72,"minConfidence":0.62,"maxConnectedHolderPct":25,"requireKillSwitchPass":true,"maxPositionUsd":25,"scanIntervalSec":10}' \
  "http://localhost:$PORT/api/autotrade/config" > /tmp/enigma_smoke_autotrade_config_put.json

curl -sS \
  --max-time 20 \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:$PORT/api/autotrade/execution-config" > /tmp/enigma_smoke_exec_config.json

curl -sS \
  --max-time 20 \
  -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -X PUT \
  -d '{"enabled":true,"mode":"paper","paperBudgetUsd":100,"tradeAmountUsd":5,"maxOpenPositions":1,"tpPct":1.8,"slPct":1.0,"trailingStopPct":0.6,"maxHoldMinutes":20,"cooldownSec":5,"pollIntervalSec":5}' \
  "http://localhost:$PORT/api/autotrade/execution-config" > /tmp/enigma_smoke_exec_config_put.json

node <<'NODE'
const fs = require('fs');

function must(cond, msg) {
  if (!cond) {
    console.error(`[smoke] FAIL: ${msg}`);
    process.exit(1);
  }
}

const health = JSON.parse(fs.readFileSync('/tmp/enigma_smoke_health.json', 'utf8'));
const singleSignal = JSON.parse(fs.readFileSync('/tmp/enigma_smoke_signal.json', 'utf8'));
const holders = JSON.parse(fs.readFileSync('/tmp/enigma_smoke_holders.json', 'utf8'));
const stats = JSON.parse(fs.readFileSync('/tmp/enigma_smoke_stats.json', 'utf8'));
const autoCfg = JSON.parse(fs.readFileSync('/tmp/enigma_smoke_autotrade_config.json', 'utf8'));
const autoCfgPut = JSON.parse(fs.readFileSync('/tmp/enigma_smoke_autotrade_config_put.json', 'utf8'));
const execCfg = JSON.parse(fs.readFileSync('/tmp/enigma_smoke_exec_config.json', 'utf8'));
const execCfgPut = JSON.parse(fs.readFileSync('/tmp/enigma_smoke_exec_config_put.json', 'utf8'));

must(health && health.ok === true, 'health endpoint should return ok=true');

must(singleSignal && singleSignal.signal && typeof singleSignal.signal === 'object', '/api/signal should return signal object');
must(singleSignal.signal.token && typeof singleSignal.signal.token === 'object', 'signal should include token metadata');
must(typeof singleSignal.signal.status === 'string', 'signal should include status');
must(singleSignal.signal.marketRegime && typeof singleSignal.signal.marketRegime === 'object', 'signal should include marketRegime');
must(singleSignal.signal.rugPullRisk && typeof singleSignal.signal.rugPullRisk === 'object', 'signal should include rugPullRisk');

const currentRegime = singleSignal.signal.marketRegime.current || {};
must(typeof currentRegime.timeframe === 'string' && currentRegime.timeframe.length > 0, 'marketRegime.current.timeframe should be populated');
must(typeof currentRegime.regime === 'string' && currentRegime.regime.length > 0, 'marketRegime.current.regime should be populated');

must(Array.isArray(holders.holderProfiles), 'holders endpoint should return holderProfiles array');
must(holders.holderBehavior && typeof holders.holderBehavior === 'object', 'holders endpoint should return holderBehavior');

must(stats && stats.stats && typeof stats.stats === 'object', 'stats should return stats object');
must(autoCfg && autoCfg.config && typeof autoCfg.config === 'object', 'autotrade config should return config object');
must(autoCfgPut && autoCfgPut.config && autoCfgPut.config.mode === 'paper', 'autotrade config PUT should persist paper mode');
must(execCfg && execCfg.config && typeof execCfg.config === 'object', 'execution config should return config object');
must(execCfgPut && execCfgPut.config && execCfgPut.config.mode === 'paper', 'execution config PUT should persist paper mode');

console.log('[smoke] PASS: health, scanner, holder analysis, stats, and paper-agent config endpoints look healthy');
NODE
