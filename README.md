# MCP-Jest

[![npm version](https://img.shields.io/npm/v/mcp-jest.svg)](https://www.npmjs.com/package/mcp-jest)
[![npm downloads](https://img.shields.io/npm/dm/mcp-jest.svg)](https://www.npmjs.com/package/mcp-jest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js CI](https://github.com/josharsh/mcp-jest/actions/workflows/ci.yml/badge.svg)](https://github.com/josharsh/mcp-jest/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**The first (and perhaps only) testing framework for Model Context Protocol (MCP) servers - like Jest, but for MCP**

> 🚀 **Finally!** Test your MCP servers with confidence. No more manual verification, no more broken deployments.

## The Problem

You built an MCP server that connects AI assistants to your database, file system, or API. But how do you know it actually works?

```bash
npm install mcp-jest
```

## Why mcp-jest? 

### The Problem 😤

Building MCP servers? You've probably experienced this:

- ❌ **Manual Testing Hell**: Manually connecting clients to test every change
- ❌ **Silent Failures**: Servers break and you don't know until Claude Code crashes  
- ❌ **No CI/CD**: Can't automate MCP server testing in pipelines
- ❌ **Debugging Nightmare**: When things break, you have no idea what went wrong
- ❌ **Fear of Deployment**: Every update is a gamble

### The Solution ✨

**mcp-jest** is the missing piece of the MCP ecosystem:

- ✅ **Automated Testing**: Write tests once, run them everywhere
- ✅ **Instant Feedback**: Know immediately when something breaks  
- ✅ **CI/CD Ready**: Integrate seamlessly into any build pipeline
- ✅ **Crystal Clear Results**: Detailed reports show exactly what works and what doesn't
- ✅ **Deploy with Confidence**: Comprehensive testing before production

## 📋 Table of Contents

- [Quick Start](#-quick-start-30-seconds)
- [Features](#-features)
- [Documentation](#-documentation)
- [API Reference](#-api-reference)
- [Examples](#-examples)
- [Contributing](#-contributing)
- [Security](#-security)
- [License](#-license)

📚 **Documentation**: [https://mcp-jest.ddiy.diy/](https://mcp-jest.ddiy.diy/)

## ⚡ Quick Start (30 seconds)

### 1. Install
```bash
npm install mcp-jest          # As dependency
npm install -g mcp-jest       # Or globally for CLI
```

### 2. Test Your Server
```javascript
import { mcpTest } from 'mcp-jest';

const results = await mcpTest(
  { command: 'node', args: ['./server.js'] },
  { tools: ['search', 'email'] }
);

console.log(`${results.passed}/${results.total} tests passed`);
```

### 3. Or Use CLI
```bash
mcp-jest node ./server.js --tools search,email
```

**That's it!** Your MCP server is now tested. 🎉


## 🔥 Features That Matter

### 🧪 **Dead Simple API**
One function call tests your entire server. No complex setup, no boilerplate.

### 📝 **Declarative Testing**  
Describe *what* to test, not *how*. Focus on your server logic, not test infrastructure.

### 🔍 **Comprehensive Coverage**
- **Connection Testing**: Server starts and responds
- **Capability Discovery**: Tools/resources/prompts exist  
- **Functional Testing**: Everything actually works
- **Validation**: Results match expectations

### 🚀 **Built for Production**
- **CI/CD Integration**: Works with GitHub Actions, Jenkins, etc.
- **Fast Execution**: Complete test suites in under 500ms
- **Detailed Reporting**: Know exactly what failed and why
- **Zero Dependencies**: Uses official MCP SDK only

### 🛠️ **Flexible Usage**
- **Library**: Integrate into existing test suites
- **CLI**: Perfect for scripts and pipelines  
- **Config Files**: Complex test scenarios
- **TypeScript**: Full type safety included

### 📸 **Snapshot Testing**
- **Capture Outputs**: Save MCP responses as snapshots
- **Detect Changes**: Know when outputs change unexpectedly
- **Easy Updates**: Update snapshots with a single flag
- **Selective Snapshots**: Choose specific fields to track

### 🎯 **Test Filtering** (NEW v1.0.10!)
- **Filter Tests**: Run only tests matching a pattern with `--filter`
- **Skip Tests**: Exclude tests from running with `--skip`
- **Wildcard Support**: Use `*` for flexible pattern matching
- **Fast Iteration**: Focus on specific tests during development

### 🌐 **HTTP Transport Support** (NEW v1.0.13!)
- **Multiple Transports**: Test servers over stdio, HTTP streaming, or SSE
- **Flexible Connectivity**: Support for remote and local HTTP servers
- **Easy Configuration**: Simple CLI flags or config file settings
- **Backward Compatible**: Existing stdio tests work without changes

### 🛡️ **Enhanced Compatibility** (NEW v1.0.13!)
- **FastMCP Support**: Works with servers that implement partial MCP protocol
- **Graceful Error Handling**: Handle "Method not found" errors elegantly
- **Flexible Servers**: Test servers that only implement some capabilities

---

## 🎯 Real-World Examples

### Testing a Search Server
```javascript
const results = await mcpTest(
  { command: 'python', args: ['search-server.py'] },
  {
    tools: {
      search: {
        args: { query: 'artificial intelligence' },
        expect: result => result.results.length > 0
      },
      autocomplete: {
        args: { partial: 'artif' },
        expect: 'suggestions.length >= 3'
      }
    }
  }
);
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
- name: Test MCP Server
  run: |
    npm install -g mcp-jest
    mcp-jest node ./dist/server.js --tools "search,analyze"
```

### Development Workflow
```json
{
  "scripts": {
    "test": "jest && npm run test:mcp",
    "test:mcp": "mcp-jest node ./server.js --tools search,email",
    "dev": "concurrently 'npm run dev:server' 'npm run test:mcp:watch'"
  }
}
```

### Snapshot Testing (NEW!)
```javascript
// Capture and compare MCP outputs over time
const results = await mcpTest(
  { command: 'node', args: ['./weather-server.js'] },
  {
    tools: {
      getWeather: {
        args: { city: 'London' },
        snapshot: {
          exclude: ['temperature', 'timestamp'],  // Exclude changing data
          properties: ['format', 'units', 'structure']  // Track structure
        }
      }
    }
  }
);

// Update snapshots when changes are intentional
// mcp-jest node ./server.js --update-snapshots
```

### Test Filtering (NEW!)
```bash
# Run only search-related tests
mcp-jest node ./server.js --tools "search,email,weather" --filter search

# Skip email tests during development
mcp-jest node ./server.js --tools "search,email,weather" --skip email

# Use wildcards for flexible filtering
mcp-jest node ./server.js --tools "getUser,getUserProfile,updateUser" --filter "user*"

# Combine with other options
mcp-jest node ./server.js --filter search --timeout 5000 --update-snapshots
```

### HTTP Transport Testing (NEW!)
```bash
# Test stdio server (default)
mcp-jest node ./server.js --tools search,email

# Test HTTP streaming server
mcp-jest --transport streamable-http --url http://localhost:3000 --tools search

# Test SSE server
mcp-jest --transport sse --url http://api.example.com/sse --tools search,email

# Use config file for HTTP transport
cat > mcp-jest.json << EOF
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
EOF
mcp-jest --config mcp-jest.json
```

## 📖 CLI Reference

### Command Line Options

```bash
mcp-jest [OPTIONS] [SERVER_COMMAND]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `-h, --help` | Show help message | `mcp-jest --help` |
| `-v, --version` | Show version | `mcp-jest --version` |
| `-c, --config <file>` | Load configuration from JSON file | `mcp-jest --config test.json` |
| `-s, --server <cmd>` | Server command to test (stdio only) | `mcp-jest --server "node server.js"` |
| `--transport <type>` | Transport type: stdio, sse, streamable-http | `mcp-jest --transport streamable-http` |
| `--url <url>` | Server URL (required for HTTP transports) | `mcp-jest --url http://localhost:3000` |
| `--args <args>` | Comma-separated server arguments | `mcp-jest node server.js --args "port=3000,debug"` |
| `-t, --tools <tools>` | Comma-separated list of tools to test | `mcp-jest --tools search,calculate` |
| `-r, --resources <res>` | Comma-separated list of resources to test | `mcp-jest --resources "data/*,config.json"` |
| `-p, --prompts <prompts>` | Comma-separated list of prompts to test | `mcp-jest --prompts analyze,summarize` |
| `--timeout <ms>` | Test timeout in milliseconds | `mcp-jest --timeout 60000` |
| `-u, --update-snapshots` | Update snapshots instead of comparing | `mcp-jest -u` |
| `-f, --filter <pattern>` | Run only tests matching pattern | `mcp-jest --filter "search*"` |
| `--skip <pattern>` | Skip tests matching pattern | `mcp-jest --skip "*test*"` |

## 🚀 Ecosystem Integration

### Works With Everything

- **MCP Servers**: Any language, any framework
- **AI Clients**: Claude Code, custom clients, SDKs
- **CI/CD**: GitHub Actions, GitLab CI, Jenkins, CircleCI
- **Package Managers**: npm, pnpm, yarn
- **Test Runners**: Jest, Vitest, Mocha (as library)

### Popular Use Cases

1. **Development**: Test changes instantly during development
2. **CI/CD**: Automated testing in build pipelines  
3. **Deployment**: Verify servers work before going live
4. **Monitoring**: Regular health checks in production
5. **Documentation**: Ensure examples actually work

---

### The Problem It Solves

```
┌─────────────────────┐         ┌─────────────────────┐
│                     │         │                     │
│   MCP Server Dev    │   ???   │  How do I know my   │
│   Implements Tool   │ ──────> │  server works?      │
│                     │         │                     │
└─────────────────────┘         └─────────────────────┘

Before MCP-JEST: Manual testing, no automation, no confidence
```

```
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│                     │         │                     │         │                     │
│   MCP Server Dev    │ ──────> │     MCP-JEST        │ ──────> │  ✓ Automated Tests   │
│   Implements Tool   │         │   Test Framework    │         │  ✓ CI/CD Ready      │
│                     │         │                     │         │  ✓ Snapshot Testing │
└─────────────────────┘         └─────────────────────┘         └─────────────────────┘

With MCP-JEST: Automated, repeatable, confident testing
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MCP-JEST Architecture                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                    │
│  │    CLI      │     │  Library    │     │   Types     │                    │
│  │ (cli.ts)    │     │ (index.ts)  │     │ (types.ts)  │                    │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                    │
│         │                    │                    │                         │
│         └────────────────────┴────────────────────┘                         │
│                              │                                              │
│                              ▼                                              │
│                    ┌─────────────────┐                                      │
│                    │   MCPTestRunner  │                                     │
│                    │   (runner.ts)    │                                     │
│                    └────────┬─────────┘                                     │
│                             │                                               │
│         ┌───────────────────┼───────────────────┐                           │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐                      │
│  │ MCPTestClient│  │SnapshotManager│  │  Expectation │                      │
│  │ (client.ts)  │  │ (snapshot.ts) │  │   Evaluator  │                      │
│  └──────┬───────┘  └───────┬───────┘  └──────┬───────┘                      │
│         │                   │                  │                            │
│         ▼                   ▼                  ▼                            │
│  ┌──────────────────────────────────────────────────┐                       │
│  │          MCP Protocol Communication              │                       │
│  │        (via @modelcontextprotocol/sdk)          │                        │
│  └──────────────────────────────────────────────────┘                       │
│                             │                                               │
└─────────────────────────────┼──────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Your MCP Server │
                    │   (Being Tested) │
                    └─────────────────┘
```
## MCP-JEST is Unique for its Protocol-Specific Design

```
┌─────────────────────────────────────────────────────────┐
│           Generic Testing vs MCP-JEST                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Generic Test Framework:                                │
│  ┌─────────┐                                            │
│  │  Test   │──[HTTP/Function Call]──> Response          │
│  └─────────┘                                            │
│                                                         │
│  MCP-JEST:                                              │
│  ┌─────────┐                                            │
│  │  Test   │                                            │
│  └────┬────┘                                            │
│       │                                                 │
│       ├──[1. Process Management]                        │
│       ├──[2. StdioTransport Setup]                      │
│       ├──[3. MCP Protocol Handshake]                    │
│       ├──[4. Capability Discovery]                      │
│       ├──[5. Tool/Resource/Prompt Execution]            │
│       └──[6. Structured Validation]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### MCP-JEST is Unique for Comprehensive Test Coverage

```
┌────────────────────────────────────────────────┐
│          MCP-JEST Test Coverage               │
├────────────────────────────────────────────────┤
│                                                │
│  Connection Layer:                             │
│  • Server startup                              │
│  • Protocol handshake                          │
│  • Timeout handling                            │
│                                                │
│  Discovery Layer:                              │
│  • Available tools                             │
│  • Available resources                         │
│  • Available prompts                           │
│  • Capability matching                         │
│                                                │
│  Functional Layer:                             │
│  • Tool execution with arguments               │
│  • Resource reading                            │
│  • Prompt generation                           │
│  • Error handling                              │
│                                                │
│  Validation Layer:                             │
│  • Response structure                          │
│  • Content validation                          │
│  • Snapshot comparison                         │
│  • Custom expectations                         │
│                                                │
└────────────────────────────────────────────────┘
```

### 3. MCP-JEST is Unique for its Developer Experience

```
┌─────────────────────────────────────────────────┐
│         Developer Experience Flow                │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. Write Test Config (JSON)                     │
│     Simple, declarative, no code needed          │
│                                                  │
│  2. Run Tests                                    │
│     $ mcp-jest test-config.json                  │
│                                                  │
│  3. See Results                                  │
│     ✓ Connection test passed (50ms)              │
│     ✓ Tool: calculate - passed (23ms)            │
│     ✗ Resource: data - failed (15ms)             │
│       Expected: "value"                          │
│       Received: "other"                          │
│                                                  │
│  4. Update Snapshots (if needed)                 │
│     $ mcp-jest test-config.json -u               │
│                                                  │
│  5. Integrate with CI/CD                         │
│     Exit codes, JSON output, timing info         │
│                                                  │
└─────────────────────────────────────────────────┘
```

### MCP-JEST Supports Snapshots
```
┌─────────────────────────────────────────────────────────┐
│              Snapshot Comparison Algorithm               │
├───────────────────────────────────────────────────────── ┤
│                                                          │
│  1. Normalize Data:                                      │
│     • Sort object keys alphabetically                    │
│     • Remove volatile fields (timestamps, IDs)           │
│     • Apply inclusion/exclusion rules                    │
│                                                          │
│  2. Generate Hash:                                       │
│     • Create deterministic string representation         │
│     • Use SHA-256 for consistency                        │
│                                                          │
│  3. Compare:                                             │
│     ┌─────────────┐     ┌─────────────┐                  │
│     │   Current   │     │   Stored    │                  │
│     │   Output    │ <=> │  Snapshot   │                  │
│     └─────────────┘     └─────────────┘                  │
│            │                    │                        │
│            └────────┬───────────┘                        │
│                     │                                    │
│                ┌────┴────┐                               │
│                │  Equal? │                               │
│                └────┬────┘                               │
│                     │                                    │
│           ┌─────────┴─────────┐                          │
│           │                   │                          │
│         [Yes]               [No]                         │
│           │                   │                          │
│        ✓ Pass          Check Update Mode                 │
│                               │                          │
│                      ┌────────┴────────┐                 │
│                      │                 │                 │
│                 [Update Mode]     [Normal Mode]          │
│                      │                 │                 │
│                Update & Pass       Show Diff & Fail      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Comparison with Alternatives

### What Exists Today vs MCP-JEST

```
┌─────────────────────────────────────────────────────────────┐
│                  Testing Approach Comparison                 │
├───────────────────────────────────────────────────────────── ┤
│                                                              │
│  Manual Testing:                                             │
│  ───────────────                                             │
│  • Start server manually                                     │
│  • Use Claude Desktop or terminal                            │
│  • Manually invoke each tool                                 │
│  • Visually verify outputs                                   │
│  • No automation, no CI/CD                                   │
│                                                              │
│  Custom Scripts:                                             │
│  ───────────────                                             │
│  • Write custom Node.js/Python scripts                       │
│  • Implement MCP client from scratch                         │
│  • Handle all edge cases yourself                            │
│  • Maintain test infrastructure                              │
│  • Reinvent the wheel for each project                       │
│                                                              │
│  Generic Test Frameworks (Jest/Mocha):                       │
│  ─────────────────────────────────────                       │
│  • Not designed for process communication                    │
│  • No MCP protocol understanding                             │
│  • Complex setup for stdio handling                          │
│  • No built-in capability discovery                          │
│  • Manual snapshot implementation                            │
│                                                              │
│  MCP-JEST:                                                   │
│  ─────────                                                   │
│  ✓ Purpose-built for MCP                                     │
│  ✓ Zero-config process management                            │
│  ✓ Protocol-aware testing                                    │
│  ✓ Built-in expectations & snapshots                         │
│  ✓ CI/CD ready out of the box                                │
│  ✓ Minimal dependencies                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Feature Comparison Matrix

```
┌─────────────────────────────────────────────────────────────┐
│                    Feature Comparison                        │
├─────────────────┬──────────┬─────────┬──────────┬──────────  ┤
│     Feature      │ MCP-JEST │ Manual  │ Custom   │ Generic   │
│                  │          │ Testing │ Scripts  │ Frameworks│
├─────────────────┼──────────┼─────────┼──────────┼────────────┤
│ Process Mgmt     │    ✓     │    ✗    │    ~     │    ✗      │
│ MCP Protocol     │    ✓     │    ✓    │    ~     │    ✗      │
│ Auto Discovery   │    ✓     │    ✗    │    ~     │    ✗      │
│ Snapshots        │    ✓     │    ✗    │    ~     │    ~      │
│ CI/CD Ready      │    ✓     │    ✗    │    ~     │    ✓      │
│ Type Safety      │    ✓     │    ✗    │    ~     │    ~      │
│ Zero Config      │    ✓     │    ✓    │    ✗     │    ✗      │
│ Timing Info      │    ✓     │    ✗    │    ~     │    ✓      │
│ Expectations     │    ✓     │    ✗    │    ~     │    ✓      │
│ JSON Reports     │    ✓     │    ✗    │    ~     │    ~      │
└─────────────────┴──────────┴─────────┴──────────┴──────────┘

Legend: ✓ Full Support, ~ Partial/Manual Implementation, ✗ Not Supported
```

## Why This Matters

### 1. For MCP Server Developers

```
┌─────────────────────────────────────────────────────────┐
│           Value for Server Developers                    │
├───────────────────────────────────────────────────────── ┤
│                                                          │
│  Confidence:                                             │
│  • Know your server works before shipping                │
│  • Catch regressions immediately                         │
│  • Test edge cases systematically                        │
│                                                          │
│  Productivity:                                           │
│  • Fast feedback loop                                    │
│  • No manual testing repetition                          │
│  • Focus on features, not testing infrastructure         │
│                                                          │
│  Quality:                                                │
│  • Consistent behavior across updates                    │
│  • Document expected behavior via tests                  │
│  • Ensure protocol compliance                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2. For the MCP Ecosystem

```
┌─────────────────────────────────────────────────────────┐
│              Ecosystem Benefits                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Standardization:                                        │
│  • Common testing patterns                              │
│  • Shared quality bar                                   │
│  • Consistent user experience                           │
│                                                          │
│  Trust:                                                  │
│  • Users can trust tested servers                       │
│  • "MCP-JEST tested" badge                             │
│  • Reduced bugs in production                           │
│                                                          │
│  Growth:                                                 │
│  • Lower barrier to entry                               │
│  • Faster development cycles                            │
│  • More reliable servers → more adoption                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🤝 Contributing

We love contributions! Here's how to get started:

### Quick Development Setup

```bash
# Clone the repository
cd mcp-jest
npm install
npm run dev        # Start development mode
npm test          # Run tests
npm run build     # Build for production
```

### Ways to Contribute

- 🐛 **Bug Reports**: Found an issue? Report it in the issue tracker
- 💡 **Feature Requests**: Have an idea? We'd love to hear it
- 📝 **Documentation**: Help improve our docs
- 🧪 **Test Cases**: Add tests for edge cases
- 🔧 **Code**: Submit pull requests

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Be kind and respectful

---

## 🆘 Troubleshooting

### Common Issues

**Server won't start?**
```bash
# Use absolute paths
mcp-jest /usr/bin/node ./server.js

# Check server logs
DEBUG=mcp-jest* mcp-jest node ./server.js
```

**Connection timeout?**
```bash
# Increase timeout
mcp-jest node ./server.js --timeout 60000
```

**Tool execution fails?**
```javascript
// Add detailed logging
expect: (result) => {
  console.log('Result:', JSON.stringify(result, null, 2));
  return result.success === true;
}
```

### Get Help

- 📖 **[Full Documentation](./docs/)**: Comprehensive guides and examples
- 💬 **Community Q&A**: Join the community discussions
- 🐛 **Issues**: Bug reports and feature requests
- 📧 **Email**: For private inquiries

---

## 📋 Requirements

- **Node.js**: 18+ (for ESM and modern features)
- **MCP Server**: Any server implementing [Model Context Protocol](https://modelcontextprotocol.io)
- **Optional**: TypeScript 5+ for full type safety

---

## 🎉 Join the Community

- ⭐ **Show your support**: Give us a star
- 🐦 **Follow Updates**: Get the latest news
- 💬 **Join Discussions**: Connect with other developers
- 🔄 **Share**: Help others discover mcp-jest

---

## 📄 License

MIT License - Use freely in commercial and open source projects.

---

## 🙏 Acknowledgments

- **[Anthropic](https://anthropic.com)**: For creating the Model Context Protocol
- **[MCP Community](https://modelcontextprotocol.io)**: For building the ecosystem
- **Contributors**: Everyone who makes this project better

---

<div align="center">

**Built with ❤️ for the MCP ecosystem**

[Get Started](#-quick-start-30-seconds) • [Documentation](./docs/) • [Examples](./examples/) • [Contributing](#-contributing)

**Make your MCP servers bulletproof. Start testing today!** 🚀

</div>

---

## Documentation

Comprehensive documentation is available to help you get the most out of mcp-jest:

- **[Getting Started Guide](docs/guides/getting-started.md)** - Step-by-step guide to get up and running quickly
- **[API Reference](docs/api/)** - Complete API documentation with detailed examples
- **[Examples](docs/examples/)** - Real-world examples and use cases
- **[Guides](docs/guides/)** - In-depth guides for advanced usage patterns

## Contributing

We welcome contributions from the community! Your input helps make mcp-jest better for everyone.

Thank you to all our contributors who have helped shape this project. Every contribution, no matter how small, is valued and appreciated.

- **[Contributing Guidelines](CONTRIBUTING.md)** - Learn how to contribute to the project
- **Code of Conduct** - We maintain a welcoming and inclusive environment for all contributors
- **Getting Started** - Fork the repo, make your changes, and submit a pull request

We encourage contributions of all kinds:
- Bug fixes and feature implementations
- Documentation improvements
- Test coverage enhancements
- Performance optimizations
- Community support and engagement

## Security

Security is a top priority for mcp-jest. We take the security of our code and our users seriously.

- **[Security Policy](SECURITY.md)** - View our security policy and vulnerability reporting process
- **Responsible Disclosure** - Please report security vulnerabilities responsibly through our security policy

If you discover a security vulnerability, please follow our responsible disclosure process outlined in the security policy.

## License

mcp-jest is released under the **MIT License**. This means you can use it freely in both commercial and open-source projects.

See the [LICENSE](LICENSE) file for the full license text.

## Support

Need help? We're here to support you:

- **[GitHub Issues](https://github.com/josharsh/mcp-jest/issues)** - Report bugs or request features
- **[GitHub Discussions](https://github.com/josharsh/mcp-jest/discussions)** - Ask questions and share ideas with the community
- **Email** - For private inquiries, reach out to [support@mcp-jest.dev](mailto:support@mcp-jest.dev)

Before opening an issue, please check if your question has already been answered in the documentation or existing issues.