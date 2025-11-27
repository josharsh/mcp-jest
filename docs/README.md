# MCP-Jest Documentation

Welcome to the MCP-Jest documentation. This guide will help you test your MCP servers with confidence.

## Quick Links

| I want to... | Go to |
|--------------|-------|
| Get started quickly | [Getting Started](guides/getting-started.md) |
| See all CLI options | [CLI Reference](cli-reference.md) |
| Use the library API | [API Reference](api/README.md) |
| See code examples | [Examples](examples/README.md) |
| Set up CI/CD | [GitHub Actions](guides/github-actions.md) |
| Fix an issue | [Troubleshooting](guides/troubleshooting.md) |

## Documentation Structure

### Core Documentation

- **[CLI Reference](cli-reference.md)** - Complete command-line interface documentation
- **[API Reference](api/README.md)** - Library API for programmatic usage
- **[Architecture](architecture.md)** - How MCP-Jest works internally
- **[Comparison](comparison.md)** - MCP-Jest vs other testing approaches

### Guides

- **[Getting Started](guides/getting-started.md)** - Step-by-step setup guide
- **[Snapshot Testing](guides/snapshot-testing.md)** - Capture and compare outputs
- **[HTTP Transport](guides/http-transport.md)** - Test HTTP/SSE servers
- **[GitHub Actions](guides/github-actions.md)** - CI/CD integration
- **[Watch Mode](guides/watch-mode.md)** - Auto-rerun tests on changes
- **[Troubleshooting](guides/troubleshooting.md)** - Common issues and solutions

### Examples

- **[Examples](examples/README.md)** - Real-world test configurations

## Installation

```bash
# Global CLI
npm install -g mcp-jest

# Local dependency
npm install mcp-jest
```

## Quick Example

### CLI

```bash
mcp-jest node ./server.js --tools search,email
```

### Library

```javascript
import { mcpTest } from 'mcp-jest';

const results = await mcpTest(
  { command: 'node', args: ['./server.js'] },
  { tools: ['search', 'email'] }
);

console.log(`${results.passed}/${results.total} tests passed`);
```

### Config File

```json
{
  "server": {
    "command": "node",
    "args": ["./server.js"]
  },
  "tests": {
    "tools": {
      "search": {
        "args": { "query": "test" },
        "expect": "content.length > 0"
      }
    }
  }
}
```

```bash
mcp-jest --config mcp-jest.json
```

## Features Overview

| Feature | Description |
|---------|-------------|
| **Automated Testing** | Test tools, resources, and prompts automatically |
| **Snapshot Testing** | Capture and compare MCP outputs |
| **Test Filtering** | Run specific tests with `--filter` and `--skip` |
| **Watch Mode** | Auto-rerun tests when files change |
| **HTML Reports** | Generate shareable test reports |
| **Auto-Discovery** | Discover all server capabilities |
| **Protocol Validation** | Check MCP compliance |
| **HTTP Transport** | Test remote HTTP/SSE servers |
| **GitHub Action** | Native CI/CD integration |

## Getting Help

- **[GitHub Issues](https://github.com/josharsh/mcp-jest/issues)** - Bug reports
- **[GitHub Discussions](https://github.com/josharsh/mcp-jest/discussions)** - Questions
- **[Troubleshooting](guides/troubleshooting.md)** - Common issues

## Contributing

See the [Contributing Guide](../CONTRIBUTING.md) for information on how to contribute to MCP-Jest.
