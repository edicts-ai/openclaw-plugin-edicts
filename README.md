# openclaw-plugin-edicts

OpenClaw plugin for [Edicts](https://github.com/mssteuer/edicts) — ground truth for AI agents.

Automatically injects edicts into every agent session and exposes CRUD tools so agents can read, create, and manage edicts at runtime.

## Install

```bash
openclaw plugins install openclaw-plugin-edicts
openclaw gateway restart
```

That's it. The plugin auto-creates `edicts.yaml` in your workspace on first run.

## What it does

- **Context injection** — Before every prompt, relevant edicts are serialized and injected into the system context. Your agent always knows the ground truth.
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

## Configuration

The plugin works with zero configuration. To customize, add options to your `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "edicts": {
        "enabled": true,
        "config": {
          "path": "edicts.yaml",
          "format": "yaml",
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
| `format` | `yaml` | Storage format (`yaml` or `json`) |
| `autoInject` | `true` | Inject edicts into system context on every session |
| `autoInjectFilter` | `all` | Which edicts to inject (v1: only `all`) |
| `tokenBudget` | `2000` | Max tokens for context injection |

## How edicts work

Edicts are small, verified facts your agent treats as non-negotiable:

```yaml
version: 1
edicts:
  - text: "v2.0 launches April 15, 2026"
    category: product
    confidence: verified
    ttl: event
  - text: "Never mention Project X publicly"
    category: compliance
    confidence: verified
    ttl: permanent
```

Add them via the CLI, agent tools, or edit the YAML directly.

## Links

- [Edicts library](https://github.com/mssteuer/edicts) — standalone core (no OpenClaw dependency)
- [edicts.ai](https://mssteuer.github.io/edicts.ai/) — docs and landing page
- [OpenClaw](https://openclaw.ai) — the agent platform

## License

MIT
