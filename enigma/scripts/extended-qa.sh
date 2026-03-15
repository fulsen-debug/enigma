#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

LOG_FILE="/tmp/enigma_extended_web.log"
: > "$LOG_FILE"

export NODE_ENV=development
export ENIGMA_JWT_SECRET="enigma-extended-qa-secret"
export SOLANA_RPC_URL="${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}"
export ENIGMA_KOBX_REQUIRED_BALANCE="${ENIGMA_KOBX_REQUIRED_BALANCE:-0}"

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
    echo "[extended-qa] FAIL: server process exited before startup"
    tail -n 120 "$LOG_FILE"
    exit 1
  fi
  sleep 1
done

PORT="$(grep -oE 'http://localhost:[0-9]+' "$LOG_FILE" | tail -n1 | cut -d: -f3 || true)"
if [[ -z "$PORT" ]]; then
  echo "[extended-qa] FAIL: server failed to start"
  tail -n 80 "$LOG_FILE"
  exit 1
fi

TOKEN="$(node -e "require('dotenv').config(); const jwt=require('jsonwebtoken'); const secret=process.env.ENIGMA_JWT_SECRET || 'dev-secret-change-in-production'; process.stdout.write(jwt.sign({sub: 919191, wallet: '9xQeWvG816bUx9EPfRz4KxM2KkN8YxVUMfyk7Q8xvA5', plan: 'free'}, secret, {expiresIn:'1h'}));")"

curl -sS \
  -H "Authorization: Bearer $TOKEN" \
  -H "content-type: application/json" \
  -X POST \
  -d '{"mint":"So11111111111111111111111111111111111111112"}' \
  "http://localhost:$PORT/api/signal" > /tmp/enigma_ext_signal.json

curl -sS \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:$PORT/api/token/holders?mint=So11111111111111111111111111111111111111112&limit=12&mode=sample" > /tmp/enigma_ext_holders.json

curl -sS \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:$PORT/api/token/market/live?mint=So11111111111111111111111111111111111111112&windowSec=300" > /tmp/enigma_ext_market_live.json

curl -sS \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:$PORT/api/autotrade/config" > /tmp/enigma_ext_autotrade_config.json

curl -sS \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:$PORT/api/autotrade/execution-config" > /tmp/enigma_ext_exec_config.json

curl -sS \
  "http://localhost:$PORT/api/access/kobx?wallet=9xQeWvG816bUx9EPfRz4KxM2KkN8YxVUMfyk7Q8xvA5" > /tmp/enigma_ext_kobx_access.json

curl -sS "http://localhost:$PORT/api/openapi.json" > /tmp/enigma_ext_openapi.json
curl -sS "http://localhost:$PORT/api-docs.html" > /tmp/enigma_ext_apidocs.html
curl -sS "http://localhost:$PORT/developers.html" > /tmp/enigma_ext_developers.html
curl -sS "http://localhost:$PORT/" > /tmp/enigma_ext_index.html

HTTP401="$(curl -s -o /tmp/enigma_ext_unauth.json -w '%{http_code}' "http://localhost:$PORT/api/autotrade/config")"
HTTP400="$(curl -s -o /tmp/enigma_ext_badreq.json -w '%{http_code}' -H "Authorization: Bearer $TOKEN" -H "content-type: application/json" -X POST -d '{}' "http://localhost:$PORT/api/signal")"

node <<'NODE'
const fs = require("fs");

function must(condition, message) {
  if (!condition) {
    console.error(`[extended-qa] FAIL: ${message}`);
    process.exit(1);
  }
}

const singleSignal = JSON.parse(fs.readFileSync("/tmp/enigma_ext_signal.json", "utf8"));
const holders = JSON.parse(fs.readFileSync("/tmp/enigma_ext_holders.json", "utf8"));
const marketLive = JSON.parse(fs.readFileSync("/tmp/enigma_ext_market_live.json", "utf8"));
const autoCfg = JSON.parse(fs.readFileSync("/tmp/enigma_ext_autotrade_config.json", "utf8"));
const execCfg = JSON.parse(fs.readFileSync("/tmp/enigma_ext_exec_config.json", "utf8"));
const kobxAccess = JSON.parse(fs.readFileSync("/tmp/enigma_ext_kobx_access.json", "utf8"));
const openapi = JSON.parse(fs.readFileSync("/tmp/enigma_ext_openapi.json", "utf8"));
const apiDocsHtml = fs.readFileSync("/tmp/enigma_ext_apidocs.html", "utf8");
const devDocsHtml = fs.readFileSync("/tmp/enigma_ext_developers.html", "utf8");
const indexHtml = fs.readFileSync("/tmp/enigma_ext_index.html", "utf8");

must(singleSignal && singleSignal.signal, "/api/signal should return a signal payload");
must(singleSignal.signal.marketRegime, "signal payload should include marketRegime");
must(singleSignal.signal.rugPullRisk, "signal payload should include rugPullRisk");

const currentRegime = singleSignal.signal.marketRegime.current || {};
must(typeof currentRegime.timeframe === "string" && currentRegime.timeframe.length > 0, "marketRegime.current.timeframe should be populated");
must(typeof currentRegime.regime === "string" && currentRegime.regime.length > 0, "marketRegime.current.regime should be populated");

must(Array.isArray(holders.holderProfiles), "holders endpoint should return holderProfiles array");
must(holders.holderBehavior && typeof holders.holderBehavior === "object", "holders endpoint should return holderBehavior");

must(marketLive && marketLive.chart && Array.isArray(marketLive.chart.points), "live market endpoint should return chart points array");
must(autoCfg && autoCfg.config && typeof autoCfg.config === "object", "autotrade config should return config");
must(execCfg && execCfg.config && typeof execCfg.config === "object", "execution config should return config");
if (kobxAccess && typeof kobxAccess.error === "string") {
  console.warn(`[extended-qa] WARN: KOBX access endpoint degraded: ${kobxAccess.error}`);
} else {
  must(typeof kobxAccess.eligible === "boolean", "KOBX access endpoint should return eligibility");
  must(typeof kobxAccess.requiredBalance === "number", "KOBX access endpoint should return requiredBalance");
  must(typeof kobxAccess.buyUrl === "string" && kobxAccess.buyUrl.length > 0, "KOBX access endpoint should return buyUrl");
}

must(openapi && openapi.openapi && openapi.paths, "openapi should be valid json");
must(Boolean(openapi.paths["/api/signal"]), "openapi should include /api/signal");
must(Boolean(openapi.paths["/api/autotrade/config"]), "openapi should include /api/autotrade/config");
must(apiDocsHtml.includes("swagger-ui-bundle.js"), "api docs page should include swagger bundle");
must(devDocsHtml.includes("/api-docs.html"), "developer docs should link to api explorer");
must(indexHtml.includes("Scanner Workspace") && indexHtml.includes("Agent Workspace"), "main app should include both workspaces");

console.log("[extended-qa] PASS: API schema, docs, market endpoint, and dual-workspace UI look healthy");
NODE

[[ "$HTTP401" == "401" ]] || { echo "[extended-qa] FAIL: unauthorized expected 401, got $HTTP401"; exit 1; }
[[ "$HTTP400" == "400" ]] || { echo "[extended-qa] FAIL: bad request expected 400, got $HTTP400"; exit 1; }

echo "[extended-qa] PASS: auth and validation checks"
echo "[extended-qa] PASS: all"
