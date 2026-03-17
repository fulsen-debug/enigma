# Live Alert Payload Templates

These templates are used by the live alert webhook layer and include the required fields:
- `eventType`
- `severity`
- `wallet`
- `PnL`
- `reason`
- `timestamp`

## Telegram

Send to Telegram Bot API endpoint (`https://api.telegram.org/bot<token>/sendMessage`):

```json
{
  "text": "[CRITICAL] DRAWDOWN_BREACH | wallet=3hh5...8bUw | pnl=-4.12% | reason=drawdown_threshold_breached | ts=2026-03-17T10:22:11.000Z"
}
```

## Slack

Send to Slack incoming webhook URL:

```json
{
  "text": "[WARN] LIVE_SELL | wallet=3hh5...8bUw | pnl=+1.80% | reason=TP_HIT | ts=2026-03-17T10:22:11.000Z"
}
```

## Discord

Send to Discord webhook URL:

```json
{
  "text": "[CRITICAL] ERROR | wallet=3hh5...8bUw | pnl=n/a | reason=live sell failed | ts=2026-03-17T10:22:11.000Z",
  "embeds": [
    {
      "title": "Enigma Live Alert",
      "description": "event=ERROR severity=CRITICAL\nwallet=3hh5...8bUw\npnl=n/a\nreason=live sell failed\nts=2026-03-17T10:22:11.000Z",
      "color": 15158332
    }
  ]
}
```

## Notes

- `CRITICAL` alerts bypass cooldown and are never suppressed.
- `INFO/WARN` alerts use cooldown deduplication by fingerprint.
- Use `GET /api/live/alert-templates` (admin token required) for runtime-generated templates.
