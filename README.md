# MCP-Jest - Testing Framework for Model Context Protocol Servers

[![npm version](https://img.shields.io/npm/v/mcp-jest.svg)](https://www.npmjs.com/package/mcp-jest)
[![npm downloads](https://img.shields.io/npm/dm/mcp-jest.svg)](https://www.npmjs.com/package/mcp-jest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js CI](https://github.com/josharsh/mcp-jest/actions/workflows/ci.yml/badge.svg)](https://github.com/josharsh/mcp-jest/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)

**The testing framework for Model Context Protocol (MCP) servers - like Jest, but for MCP. Test your AI agent tools, validate protocol compliance, and integrate with CI/CD pipelines.**

MCP-Jest is an open-source testing tool for developers building MCP servers that connect AI assistants (Claude, ChatGPT, GPT-4, Gemini, LLMs) to external tools, databases, APIs, and file systems. Write automated tests for your MCP tools, resources, and prompts with Jest-like syntax.

## What is MCP?

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) is an open standard introduced by Anthropic that allows AI assistants like Claude, ChatGPT, and other large language models (LLMs) to connect with external tools, data sources, and APIs. Think of it as a USB-C port for AI - a standardized way for AI to interact with the world.

## The Problem

You built an MCP server that connects AI assistants to your database, file system, or API. But how do you know it actually works?

- Manual testing for every change is slow and error-prone
- Silent failures break AI workflows without warning
- No native CI/CD integration exists for MCP servers
- Debugging is difficult when tools fail in production

**MCP-Jest solves this** with automated, repeatable testing for your MCP servers.

## Quick Start

### Install

```bash
npm install mcp-jest        # As dependency
npm install -g mcp-jest     # Or globally for CLI
```

### Test Your Server

```javascript
import { mcpTest } from 'mcp-jest';

const results = await mcpTest(
  { command: 'node', args: ['./server.js'] },
  { tools: ['search', 'email'] }
);

console.log(`${results.passed}/${results.total} tests passed`);
```

### Or Use CLI

```bash
mcp-jest node ./server.js --tools search,email
```

**That's it!** Your MCP server is now tested.

## Features

### Core Testing
- **Automated Testing** - Write tests once, run them everywhere
- **Comprehensive Coverage** - Test connections, tools, resources, and prompts
- **Flexible Expectations** - Simple strings or custom validation functions
- **CI/CD Ready** - Works with GitHub Actions, Jenkins, CircleCI, etc.

### Advanced Features
- **Snapshot Testing** - Capture and compare MCP outputs over time
- **Test Filtering** - Run specific tests with `--filter` and `--skip`
- **Watch Mode** - Auto-rerun tests when files change
- **HTML Reports** - Generate beautiful, shareable test reports

### Transport Support
- **stdio** - Default transport for local servers
- **HTTP Streaming** - Test remote HTTP servers
- **SSE** - Server-Sent Events support

### Developer Tools
- **Auto-Discovery** - Automatically discover and generate tests for all capabilities
- **Protocol Validator** - Check MCP compliance with detailed scoring
- **GitHub Action** - Native CI/CD integration

## CLI Quick Reference

| Command | Description |
|---------|-------------|
| `mcp-jest node ./server.js --tools search` | Test specific tools |
| `mcp-jest --config test.json` | Use config file |
| `mcp-jest discover node ./server.js` | Auto-discover capabilities |
| `mcp-jest validate node ./server.js` | Check protocol compliance |
| `mcp-jest watch node ./server.js --tools search` | Watch mode |

### Common Options

| Option | Description |
|--------|-------------|
| `-t, --tools <tools>` | Comma-separated tools to test |
| `-c, --config <file>` | Config file path |
| `--timeout <ms>` | Test timeout (default: 30000) |
| `-u, --update-snapshots` | Update snapshot files |
| `--reporter html` | Generate HTML report |

See [CLI Reference](docs/cli-reference.md) for all options.

## Example: CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Test MCP Server
  run: |
    npm install -g mcp-jest
    mcp-jest node ./dist/server.js --tools "search,analyze"
```

## Example: Config File

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
    },
    "timeout": 30000
  }
}
```

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/guides/getting-started.md) | Step-by-step setup guide |
| [CLI Reference](docs/cli-reference.md) | Complete CLI documentation |
| [API Reference](docs/api/README.md) | Library API documentation |
| [Examples](docs/examples/README.md) | Real-world examples |
| [Architecture](docs/architecture.md) | How MCP-Jest works |
| [Troubleshooting](docs/guides/troubleshooting.md) | Common issues and solutions |

### Feature Guides

- [Snapshot Testing](docs/guides/snapshot-testing.md)
- [HTTP Transport](docs/guides/http-transport.md)
- [GitHub Actions](docs/guides/github-actions.md)
- [Watch Mode](docs/guides/watch-mode.md)

## Requirements

- **Node.js** 18+
- **MCP Server** implementing [Model Context Protocol](https://modelcontextprotocol.io)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
git clone https://github.com/josharsh/mcp-jest.git
cd mcp-jest
npm install
npm run dev
npm test
```

## Security

See [SECURITY.md](SECURITY.md) for our security policy and vulnerability reporting.

## Use Cases

MCP-Jest is ideal for:

- **MCP Server Developers** - Test your tools, resources, and prompts before deployment
- **AI Application Teams** - Ensure your MCP integrations work correctly
- **DevOps/SRE** - Add MCP server testing to CI/CD pipelines
- **Open Source MCP Projects** - Provide reliable testing for community contributions

## Comparison with Other Tools

| Feature | MCP-Jest | Manual Testing | Generic Test Frameworks |
|---------|----------|----------------|------------------------|
| MCP Protocol Support | Native | Manual | Requires custom setup |
| Auto-Discovery | Yes | No | No |
| Snapshot Testing | Yes | No | Varies |
| Protocol Validation | Yes | No | No |
| CI/CD Integration | Built-in | Manual | Varies |

## Support

- [GitHub Issues](https://github.com/josharsh/mcp-jest/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/josharsh/mcp-jest/discussions) - Questions and ideas
- [Model Context Protocol](https://modelcontextprotocol.io) - Official MCP documentation

## Related Technologies

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io) - The protocol standard
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - Official MCP SDK
- [Claude](https://claude.ai) - Anthropic's AI assistant with MCP support
- [Jest](https://jestjs.io) - JavaScript testing framework (inspiration for MCP-Jest)

## License

MIT License - Use freely in commercial and open source projects.

---

**Built for the MCP ecosystem** | [Documentation](docs/) | [Examples](docs/examples/) | [Contributing](CONTRIBUTING.md)

---

<sub>Keywords: mcp testing, model context protocol testing, mcp server testing, ai agent testing, llm testing, claude mcp, chatgpt mcp, mcp tools testing, mcp validator, anthropic mcp, test mcp server, mcp ci cd, automated mcp testing</sub>
