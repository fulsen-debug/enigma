#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:${PORT:-3000}}"
ADMIN_TOKEN="${ENIGMA_ADMIN_TOKEN:-}"
BURST="${BURST:-4}"
TARGET_WALLET="${TARGET_WALLET:-}"

if [[ -z "$ADMIN_TOKEN" ]]; then
  echo "[live-ops-smoke] FAIL: ENIGMA_ADMIN_TOKEN is required"
  exit 1
fi

echo "[live-ops-smoke] base=$BASE_URL burst=$BURST wallet=${TARGET_WALLET:-n/a}"

curl -sS \
  -H "x-admin-token: $ADMIN_TOKEN" \
  "$BASE_URL/api/live/alert-templates" > /tmp/enigma_live_alert_templates.json

echo "[live-ops-smoke] alert templates:"
node - <<'NODE'
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("/tmp/enigma_live_alert_templates.json", "utf8"));
console.log(JSON.stringify(data, null, 2));
NODE

TEST_BODY="{\"burst\":$BURST"
if [[ -n "$TARGET_WALLET" ]]; then
  TEST_BODY="$TEST_BODY,\"wallet\":\"$TARGET_WALLET\""
fi
TEST_BODY="$TEST_BODY}"

curl -sS \
  -X POST \
  -H "content-type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d "$TEST_BODY" \
  "$BASE_URL/api/live/alerts/test" > /tmp/enigma_live_alert_test.json

echo "[live-ops-smoke] waiting 2s for webhook async delivery..."
sleep 2

curl -sS \
  -H "x-admin-token: $ADMIN_TOKEN" \
  "$BASE_URL/api/live/status" > /tmp/enigma_live_status.json

curl -sS \
  -H "x-admin-token: $ADMIN_TOKEN" \
  "$BASE_URL/api/live/canary-precheck" > /tmp/enigma_live_canary_precheck.json

echo "[live-ops-smoke] parsed summary:"
node - <<'NODE'
const fs = require("fs");
function must(condition, message) {
  if (!condition) {
    console.error(`[live-ops-smoke] FAIL: ${message}`);
    process.exit(1);
  }
}
const test = JSON.parse(fs.readFileSync("/tmp/enigma_live_alert_test.json", "utf8"));
const status = JSON.parse(fs.readFileSync("/tmp/enigma_live_status.json", "utf8"));
const canary = JSON.parse(fs.readFileSync("/tmp/enigma_live_canary_precheck.json", "utf8"));

const burst = Number(test.burst || 0);
must(Boolean(test.ok), "alerts test endpoint should return ok");
must(burst > 0, "burst should be > 0");
must(Boolean(status.alerts?.configured), "webhook is not configured; cannot validate delivery");
const before = test.before || {};
const after = test.after || {};
const statusAfter = status.alerts?.stats || {};
const attemptedDelta = Number(after.attempted || 0) - Number(before.attempted || 0);
const bypassDelta = Number(after.criticalBypass || 0) - Number(before.criticalBypass || 0);
const cooldownSuppressedDelta = Number(after.suppressedCooldown || 0) - Number(before.suppressedCooldown || 0);
const sentDelta = Number(statusAfter.sent || 0) - Number(before.sent || 0);
must(attemptedDelta >= burst * 2, "expected attempted alerts delta to cover INFO+CRITICAL burst");
must(bypassDelta >= burst, "CRITICAL alerts must bypass cooldown for every burst item");
must(cooldownSuppressedDelta >= 1, "expected INFO burst to trigger cooldown suppression");
must(sentDelta >= 1, "expected at least one webhook alert to be delivered successfully");

console.log(JSON.stringify({
  alerts: status.alerts || null,
  liveSummary: status.summary || null,
  canaryChecks: canary.checks || null,
  canaryPass: Boolean(canary.pass)
}, null, 2));
NODE

echo "[live-ops-smoke] PASS"
