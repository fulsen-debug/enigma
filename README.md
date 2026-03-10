# AI Guardian Workspace

Monorepo wrapper for the deployable app in `./enigma`.

Current first-release product:
- `Scanner Workspace`: one-token trader analysis
- `Agent Workspace`: one-token autonomous paper-trading workflow

Use:

```bash
npm run dev
npm run build
npm run web
```

All commands proxy into:
- [enigma/package.json](/workspaces/enigma/enigma/package.json)
