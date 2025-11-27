# Watch Mode

Auto-rerun tests when files change during development.

## Basic Usage

```bash
# Watch and rerun tests
mcp-jest watch node ./server.js --tools search,email

# Watch with config file
mcp-jest watch --config mcp-jest.json
```

## Options

| Option | Description | Example |
|--------|-------------|---------|
| `--watch-paths <paths>` | Directories to watch | `--watch-paths src,lib` |
| `--tools <tools>` | Tools to test | `--tools search,email` |
| `--config <file>` | Config file | `--config test.json` |
| `--timeout <ms>` | Test timeout | `--timeout 30000` |

## Examples

### Watch Source Directory

```bash
mcp-jest watch node ./server.js --watch-paths src --tools search
```

### Watch Multiple Directories

```bash
mcp-jest watch node ./server.js --watch-paths src,lib,config --tools search,email
```

### With Config File

```bash
mcp-jest watch --config mcp-jest.json
```

### Full Example

```bash
mcp-jest watch node ./dist/server.js \
  --watch-paths src,lib \
  --tools "search,calculate,email" \
  --timeout 30000
```

## How It Works

1. **Initial Run**: Tests run immediately when watch mode starts
2. **File Monitoring**: Watches specified directories for changes
3. **Auto-Rerun**: When files change, tests rerun automatically
4. **Smart Detection**: Only reruns when relevant files change

## Watch Patterns

By default, watch mode monitors:
- `*.js`, `*.ts`, `*.mjs`, `*.cjs` files
- `*.json` configuration files
- Files in the specified `--watch-paths`

## Development Workflow

### Recommended Setup

```json
{
  "scripts": {
    "dev": "npm run build:watch",
    "test:watch": "mcp-jest watch node ./dist/server.js --tools search",
    "dev:full": "concurrently \"npm run dev\" \"npm run test:watch\""
  }
}
```

### Terminal Layout

```
┌─────────────────────────────────────────┐
│  Terminal 1: npm run dev                │
│  (Building/watching source)             │
├─────────────────────────────────────────┤
│  Terminal 2: npm run test:watch         │
│  (Running MCP tests)                    │
└─────────────────────────────────────────┘
```

## Tips

### 1. Watch Built Output

```bash
# Watch the compiled output, not source
mcp-jest watch node ./dist/server.js --watch-paths dist --tools search
```

### 2. Combine with Build Watch

```bash
# In one terminal
npm run build:watch

# In another terminal
mcp-jest watch node ./dist/server.js --tools search
```

### 3. Focus on Specific Tests

```bash
# Watch only search-related tests
mcp-jest watch node ./server.js --tools search --filter "search*"
```

## Stopping Watch Mode

Press `Ctrl+C` to stop watching and exit.

## Related Documentation

- [Getting Started](getting-started.md) - Basic setup
- [CLI Reference](../cli-reference.md) - All CLI options
- [GitHub Actions](github-actions.md) - CI/CD integration
