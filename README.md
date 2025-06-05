# mcp-jest

[![npm version](https://img.shields.io/npm/v/mcp-jest.svg)](https://www.npmjs.com/package/mcp-jest)
[![npm downloads](https://img.shields.io/npm/dm/mcp-jest.svg)](https://www.npmjs.com/package/mcp-jest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js CI](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

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