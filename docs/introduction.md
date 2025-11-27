# Introduction to MCP-Jest

MCP-Jest is a comprehensive testing framework designed specifically for Model Context Protocol (MCP) servers. Think of it as "Jest for MCP" - it provides a simple, declarative way to test MCP server implementations.

## What is MCP?

The Model Context Protocol (MCP) is an open standard that enables AI applications to securely connect to external data sources and tools. MCP servers expose:

- **Tools** - Functions that AI can call (e.g., search, calculate, send email)
- **Resources** - Data sources AI can read (e.g., files, database records)
- **Prompts** - Pre-defined prompt templates

## Why MCP-Jest?

Before MCP-Jest, testing MCP servers meant:
- Manual testing with Claude Desktop
- Custom scripts that reinvent the wheel
- No standardized approach
- No CI/CD integration

MCP-Jest provides:
- **Automated testing** in seconds
- **Declarative configuration** - describe what to test, not how
- **CI/CD ready** out of the box
- **Comprehensive coverage** for tools, resources, and prompts

## How It Works

1. **Spawns your server** as a child process
2. **Establishes MCP connection** via configured transport
3. **Discovers capabilities** (tools, resources, prompts)
4. **Runs tests** against your expectations
5. **Reports results** with pass/fail status

```
Your MCP Server → MCP Client → Test Runner → Results
     ↑                                           ↓
 Auto-spawned                              Formatted Output
```

## Quick Start

```bash
# Install
npm install -g mcp-jest

# Test your server
mcp-jest node ./server.js --tools search,email
```

## Learn More

- **[Getting Started Guide](guides/getting-started.md)** - Detailed setup instructions
- **[CLI Reference](cli-reference.md)** - All command-line options
- **[API Reference](api/README.md)** - Library API documentation
- **[Architecture](architecture.md)** - Deep dive into how it works
- **[Comparison](comparison.md)** - MCP-Jest vs alternatives

## Use Cases

| Scenario | How MCP-Jest Helps |
|----------|-------------------|
| **Development** | Instant feedback on changes |
| **CI/CD** | Automated testing in pipelines |
| **Deployment** | Verify before going live |
| **Regression** | Catch breaking changes |
| **Documentation** | Tests document expected behavior |

## Next Steps

1. **[Install MCP-Jest](guides/getting-started.md#installation)**
2. **[Write your first test](guides/getting-started.md#your-first-test)**
3. **[Add to CI/CD](guides/github-actions.md)**
