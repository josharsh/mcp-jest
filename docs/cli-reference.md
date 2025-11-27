# CLI Reference

Complete command-line interface documentation for MCP-Jest.

## Installation

```bash
# Global installation (recommended for CLI usage)
npm install -g mcp-jest

# Local installation
npm install mcp-jest
npx mcp-jest --help
```

## Basic Syntax

```bash
mcp-jest [command] [OPTIONS] [SERVER_COMMAND] [SERVER_ARGS...]
```

## Commands

### Default (Run Tests)

Run tests against an MCP server.

```bash
mcp-jest node ./server.js --tools search,email
mcp-jest python server.py --tools calculate
mcp-jest ./my-binary --tools fetch
```

### `discover`

Auto-discover server capabilities and generate test configurations.

```bash
# Discover and print to stdout
mcp-jest discover node ./server.js

# Output as JSON file
mcp-jest discover node ./server.js --output tests.json

# Output as TypeScript test file
mcp-jest discover node ./server.js --output tests.ts

# Discover from HTTP server
mcp-jest discover --transport streamable-http --url http://localhost:3000
```

### `validate`

Validate MCP protocol compliance and get a compliance score.

```bash
# Basic validation
mcp-jest validate node ./server.js

# Detailed validation
mcp-jest validate node ./server.js --depth full

# Export compliance report
mcp-jest validate node ./server.js --output compliance.json
```

### `watch`

Watch for file changes and automatically rerun tests.

```bash
# Basic watch mode
mcp-jest watch node ./server.js --tools search

# Watch specific directories
mcp-jest watch node ./server.js --watch-paths src,lib --tools search

# Watch with config file
mcp-jest watch --config mcp-jest.json
```

## Options

### Core Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--help` | `-h` | Show help message | - |
| `--version` | `-v` | Show version | - |
| `--config <file>` | `-c` | Load configuration from JSON file | - |
| `--server <cmd>` | `-s` | Server command (stdio only) | - |
| `--timeout <ms>` | | Test timeout in milliseconds | `30000` |

### Transport Options

| Option | Description | Example |
|--------|-------------|---------|
| `--transport <type>` | Transport type: `stdio`, `sse`, `streamable-http` | `--transport streamable-http` |
| `--url <url>` | Server URL (required for HTTP transports) | `--url http://localhost:3000` |

### Test Options

| Option | Alias | Description | Example |
|--------|-------|-------------|---------|
| `--tools <tools>` | `-t` | Comma-separated list of tools to test | `--tools search,email` |
| `--resources <res>` | `-r` | Comma-separated list of resources to test | `--resources "data/*,config.json"` |
| `--prompts <prompts>` | `-p` | Comma-separated list of prompts to test | `--prompts analyze,summarize` |
| `--args <args>` | | Comma-separated server arguments | `--args "port=3000,debug"` |

### Filter Options

| Option | Description | Example |
|--------|-------------|---------|
| `--filter <pattern>` | `-f` | Run only tests matching pattern | `--filter "search*"` |
| `--skip <pattern>` | | Skip tests matching pattern | `--skip "*test*"` |

### Snapshot Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--update-snapshots` | `-u` | Update snapshots instead of comparing |

### Reporter Options

| Option | Description | Example |
|--------|-------------|---------|
| `--reporter <type>` | Output format: `console`, `html`, `json` | `--reporter html` |
| `--report-output <file>` | Output file for report | `--report-output report.html` |

### Discovery Options

| Option | Description | Example |
|--------|-------------|---------|
| `--output <file>` | Output file (.json or .ts) | `--output tests.json` |

### Validation Options

| Option | Description | Example |
|--------|-------------|---------|
| `--depth <level>` | Validation depth: `basic`, `standard`, `full` | `--depth full` |
| `--output <file>` | Output file for compliance report | `--output compliance.json` |

### Watch Options

| Option | Description | Example |
|--------|-------------|---------|
| `--watch-paths <paths>` | Comma-separated directories to watch | `--watch-paths src,lib` |

## Usage Examples

### Basic Testing

```bash
# Test specific tools
mcp-jest node ./server.js --tools search,email,calculate

# Test with resources
mcp-jest python server.py --tools search --resources "docs/*,config.json"

# Test with prompts
mcp-jest node server.js --tools search --prompts "review-code,analyze"

# Test with custom timeout
mcp-jest node ./server.js --tools search --timeout 60000
```

### Using Config Files

```bash
# Use config file
mcp-jest --config mcp-jest.json

# Override config options
mcp-jest --config mcp-jest.json --timeout 60000 --tools search
```

### Test Filtering

```bash
# Run only search-related tests
mcp-jest node ./server.js --tools "search,email,weather" --filter search

# Skip email tests during development
mcp-jest node ./server.js --tools "search,email,weather" --skip email

# Use wildcards
mcp-jest node ./server.js --tools "getUser,getUserProfile,updateUser" --filter "user*"

# Combine with other options
mcp-jest node ./server.js --filter search --timeout 5000 --update-snapshots
```

### HTTP Transport

```bash
# Test HTTP streaming server
mcp-jest --transport streamable-http --url http://localhost:3000 --tools search

# Test SSE server
mcp-jest --transport sse --url http://api.example.com/sse --tools search,email

# HTTP with config file
mcp-jest --config http-test.json
```

### Snapshot Testing

```bash
# Run tests with snapshot comparison
mcp-jest node ./server.js --tools search

# Update snapshots
mcp-jest node ./server.js --tools search --update-snapshots
mcp-jest node ./server.js --tools search -u
```

### Report Generation

```bash
# Generate HTML report
mcp-jest node ./server.js --tools search --reporter html

# Specify output file
mcp-jest node ./server.js --tools search --reporter html --report-output report.html

# Generate JSON report
mcp-jest node ./server.js --tools search --reporter json --report-output results.json
```

### Auto-Discovery

```bash
# Discover all capabilities
mcp-jest discover node ./server.js

# Save as JSON config
mcp-jest discover node ./server.js --output mcp-jest.json

# Save as TypeScript
mcp-jest discover node ./server.js --output tests.ts

# Discover HTTP server
mcp-jest discover --transport streamable-http --url http://localhost:3000
```

### Protocol Validation

```bash
# Basic validation
mcp-jest validate node ./server.js

# Full validation with report
mcp-jest validate node ./server.js --depth full --output compliance.json
```

### Watch Mode

```bash
# Watch and rerun tests
mcp-jest watch node ./server.js --tools search

# Watch specific paths
mcp-jest watch node ./server.js --watch-paths src,lib --tools search

# Watch with config
mcp-jest watch --config mcp-jest.json
```

## Configuration File Format

Create `mcp-jest.json`:

```json
{
  "server": {
    "command": "node",
    "args": ["./server.js"],
    "env": {
      "NODE_ENV": "test"
    }
  },
  "tests": {
    "tools": {
      "search": {
        "args": { "query": "test" },
        "expect": "content.length > 0"
      },
      "calculate": {
        "args": { "a": 5, "b": 3 },
        "expect": "content[0].text === '8'"
      }
    },
    "resources": {
      "config.json": { "expect": "exists" },
      "docs/*": { "expect": "count >= 1" }
    },
    "prompts": {
      "review-code": {
        "args": { "code": "function test() {}" },
        "expect": "messages.length > 0"
      }
    },
    "timeout": 30000
  }
}
```

### HTTP Transport Config

```json
{
  "server": {
    "transport": "streamable-http",
    "url": "http://localhost:3000/mcp"
  },
  "tests": {
    "tools": ["search", "calculate"],
    "timeout": 60000
  }
}
```

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | All tests passed |
| `1` | One or more tests failed |
| `2` | Configuration error |
| `3` | Server startup failure |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DEBUG=mcp-jest*` | Enable debug logging |
| `MCP_JEST_TIMEOUT` | Default timeout (ms) |

## Package.json Scripts

```json
{
  "scripts": {
    "test:mcp": "mcp-jest node ./server.js --tools search,email",
    "test:mcp:full": "mcp-jest --config ./tests/mcp-jest.json",
    "test:mcp:quick": "mcp-jest node ./server.js --tools search",
    "test:mcp:watch": "mcp-jest watch node ./server.js --tools search",
    "test:all": "npm test && npm run test:mcp"
  }
}
```

## Related Documentation

- [Getting Started](guides/getting-started.md) - Quick start guide
- [API Reference](api/README.md) - Library API documentation
- [Examples](examples/README.md) - Real-world examples
- [HTTP Transport](guides/http-transport.md) - HTTP transport guide
- [GitHub Actions](guides/github-actions.md) - CI/CD integration
