# AI Guardian Workspace

Monorepo wrapper for the deployable app in `./enigma`.

Current first-release product:
- `Scanner Workspace`: one-token trader analysis
- `Agent Workspace`: one-token autonomous paper-trading workflow

Access & limits:
- KOBX gate: `>= 500,000 KOBX` required to use Scanner Workspace
- Daily scanner limits: `2/day` for `>= 500K KOBX`, `5/day` for `>= 3M KOBX`
- Agent paper runs auto-stop after `8 minutes` per run

Use:

```bash
npm run dev
npm run build
npm run web
```

All commands proxy into:
- [enigma/package.json](/workspaces/enigma/enigma/package.json)
