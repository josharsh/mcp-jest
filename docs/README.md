# mcp-jest: Jest for MCP Servers

> **Automated testing for Model Context Protocol servers. Ship with confidence.**

[![npm version](https://badge.fury.io/js/mcp-jest.svg)](https://www.npmjs.com/package/mcp-jest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## The Problem

You built an MCP server that connects AI assistants to your database, file system, or API. But how do you know it actually works?

**Before mcp-jest:**
- ❌ Manual testing for every change
- ❌ "Hope it works in production" deployments  
- ❌ Silent failures that break AI workflows
- ❌ No CI/CD integration for MCP servers

**After mcp-jest:**
- ✅ Automated testing in seconds
- ✅ Confident deployments
- ✅ Catch issues before users do
- ✅ Full CI/CD integration

## Quick Example

```javascript
import { mcpTest } from 'mcp-jest';

// Test your MCP server automatically
const results = await mcpTest(
  { command: 'node', args: ['./my-server.js'] },
  {
    tools: {
      calculate: { 
        args: { a: 5, b: 3 }, 
        expect: result => result.content[0].text === '8' 
      },
      sendEmail: {
        args: { to: 'test@example.com', subject: 'Test' },
        expect: 'messageId exists'
      }
    },
    resources: {
      'config.json': { expect: 'exists' },
      'docs/*': { expect: 'count >= 1' }
    }
  }
);

console.log(`✅ ${results.passed}/${results.total} tests passed`);
```

## Real-World Value

### 🚀 **Development Velocity**
Stop manually testing every change. Run `mcp-jest` and know instantly if your server works.

### 🛡️ **Production Confidence** 
Deploy knowing your MCP server actually responds to tools, serves resources, and handles edge cases.

### 🔄 **CI/CD Integration**
```bash
# In your GitHub Actions
- name: Test MCP Server
  run: mcp-jest node ./server.js --tools "search,email" --resources "docs/*"
```

### 🐛 **Regression Prevention**
Catch breaking changes before they reach production. Perfect for teams building complex MCP ecosystems.

## Installation

```bash
# As a library
npm install mcp-jest

# Global CLI tool  
npm install -g mcp-jest
```

## Use Cases

| Scenario | Without MCP-Test | With MCP-Test |
|----------|------------------|---------------|
| **New Feature** | Manual client connection testing | `mcp-jest --tools newFeature` |
| **Deployment** | Cross fingers and deploy | Automated test suite in CI |
| **Team Collaboration** | "It works on my machine" | Shared test specifications |
| **Debugging** | Unclear what's broken | Detailed test failure reports |

## CLI Usage

```bash
# Test specific tools
mcp-jest node ./server.js --tools "search,calculate"

# Test everything with config file
mcp-jest --config ./mcp-jest.json

# Quick smoke test
mcp-jest python server.py --tools "health"
```

## Library Usage

```javascript
import { mcpTest, formatResults } from 'mcp-jest';

// Comprehensive testing
const results = await mcpTest(serverConfig, {
  tools: {
    userAuth: { args: { token: 'test' }, expect: 'success === true' },
    dataQuery: { args: { table: 'users' }, expect: 'results.length > 0' }
  },
  resources: {
    'schema.sql': { expect: 'exists' },
    'migrations/*': { expect: 'count >= 5' }
  },
  prompts: {
    'code-review': { expect: 'messages.length > 0' }
  },
  timeout: 30000
});

if (results.passed === results.total) {
  console.log('🎉 All tests passed! Ready to deploy.');
} else {
  console.error(formatResults(results));
  process.exit(1);
}
```

## Why MCP-Test?

### **Simple API**
One function call tests your entire server. No complex setup or configuration.

### **Comprehensive Coverage**
- ✅ Connection testing
- ✅ Tool execution validation  
- ✅ Resource accessibility checks
- ✅ Prompt generation verification

### **Developer Experience**
- 🎯 Clear test failures with context
- 📊 Pretty-printed results
- 🔧 TypeScript support
- ⚡ Fast execution (typically < 500ms)

### **Production Ready**
- 🔒 Secure server spawning
- 🧹 Automatic cleanup
- 🔄 Retry logic for flaky servers
- 📈 Detailed reporting

## Perfect For

- **MCP Server Developers** - Test your implementations thoroughly
- **AI Application Teams** - Ensure your MCP integrations work
- **DevOps Engineers** - Add MCP testing to CI/CD pipelines  
- **QA Teams** - Automated testing for AI tool ecosystems

## Get Started

1. **Install**: `npm install mcp-jest`
2. **Test**: `mcp-jest node ./your-server.js --tools "your-tool"`
3. **Integrate**: Add to your CI/CD pipeline
4. **Ship**: Deploy with confidence

---

**mcp-jest**: Because AI tools should work reliably, every time.

[📖 Full Documentation](./MCP-Test%20Framework%20Documentation.md) | [🐛 Issues](https://github.com/your-repo/mcp-jest/issues) | [💬 Discussions](https://github.com/your-repo/mcp-jest/discussions)