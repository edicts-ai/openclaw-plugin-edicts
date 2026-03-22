# openclaw-plugin-edicts

OpenClaw plugin for [Edicts](https://github.com/edicts-ai/edicts) — ground truth for AI agents.

Automatically injects edicts into every agent session and exposes tools so agents can read, create, and manage edicts at runtime.

## Install

```bash
openclaw plugins install openclaw-plugin-edicts
openclaw gateway restart
```

That's it. The plugin auto-creates `edicts.yaml` in your workspace on first run.

## What it does

- **Context injection** — Before every prompt, edicts are injected into the system context as a clearly separated block. Your agent always sees the ground truth.
- **Agent tools** — Seven tools registered automatically:

| Tool | Description |
|------|-------------|
| `edicts_list` | List edicts with optional filtering by category, tags, or TTL |
| `edicts_add` | Create a new edict |
| `edicts_update` | Update an existing edict by id |
| `edicts_remove` | Remove an edict |
| `edicts_search` | Free-text search across edicts |
| `edicts_stats` | Show store statistics (counts, token usage, budget) |
| `edicts_review` | Review and clean up stale/expired edicts |

## Injected format

The plugin renders edicts as compact, binding rules — category prefix and text only, no metadata noise:

```
## EDICTS — BINDING STANDING INSTRUCTIONS

The following are standing instructions provided by the user for this workspace/session.
Treat them as binding operational rules unless explicitly overridden by the user.

- [product] Product v2.0 launches April 15, NOT before.
- [rules] NEVER mention Project X publicly.

## END EDICTS
```

## Configuration

The plugin works with zero configuration. To customize, add options to your `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "openclaw-plugin-edicts": {
        "enabled": true,
        "config": {
          "path": "edicts.yaml",
          "autoInject": true,
          "tokenBudget": 2000
        }
      }
    }
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `path` | `edicts.yaml` | Path to storage file (relative to workspace) |
| `format` | Auto-detected | Storage format (`yaml` or `json`) |
| `autoInject` | `true` | Inject edicts into system context on every session |
| `tokenBudget` | `2000` | Max tokens for context injection |

## Links

- [Edicts library](https://github.com/edicts-ai/edicts) — standalone core (no OpenClaw dependency)
- [edicts.ai](https://edicts.ai) — docs and landing page
- [OpenClaw](https://openclaw.ai) — the agent platform

## License

MIT
