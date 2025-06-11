# How to Use mcp-jest: Step-by-Step Guide

> **Complete guide to testing your MCP servers with mcp-jest - from basic usage to advanced patterns**

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Usage](#basic-usage)
3. [Advanced Testing](#advanced-testing)
4. [CLI Usage](#cli-usage)
5. [Configuration Files](#configuration-files)
6. [Integration Patterns](#integration-patterns)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

**As a development dependency (recommended):**
```bash
npm install --save-dev mcp-jest
# or
pnpm add -D mcp-jest
# or
yarn add -D mcp-jest
```

**As a global CLI tool:**
```bash
npm install -g mcp-jest
```

### Your First Test

Create a simple test file to verify your MCP server works:

```javascript
// test-mcp.js
import { mcpTest, formatResults } from 'mcp-jest';

async function testMyServer() {
  const results = await mcpTest(
    { command: 'node', args: ['./my-server.js'] },
    { tools: ['search'] }  // Test that 'search' tool exists
  );
  
  console.log(formatResults(results));
  
  if (results.failed > 0) {
    process.exit(1);
  }
}

testMyServer();
```

Run it:
```bash
node test-mcp.js
```

---

## Basic Usage

### 1. Testing Tool Existence

```javascript
import { mcpTest } from 'mcp-jest';

// Just verify tools exist
const results = await mcpTest(
  { command: 'node', args: ['./server.js'] },
  { 
    tools: ['search', 'email', 'calculate'],
    resources: ['docs/*', 'config.json'],
    prompts: ['review-code']
  }
);

console.log(`${results.passed}/${results.total} tests passed`);
```

### 2. Testing with Simple Expectations

```javascript
const results = await mcpTest(
  { command: 'python', args: ['server.py'] },
  {
    tools: {
      add: {
        args: { a: 5, b: 3 },
        expect: 'content[0].text === "8"'  // String expectation
      },
      search: {
        args: { query: 'test' },
        expect: 'content.length > 0'  // Check results exist
      }
    },
    resources: {
      'config.json': { expect: 'exists' },  // File exists
      'docs/*': { expect: 'count >= 1' }    // At least one doc
    }
  }
);
```

### 3. Testing with Custom Functions

```javascript
const results = await mcpTest(
  { command: 'node', args: ['./server.js'] },
  {
    tools: {
      getUserData: {
        args: { userId: 123 },
        expect: (result) => {
          // Custom validation logic
          return result.user && 
                 result.user.id === 123 && 
                 result.user.email.includes('@');
        }
      },
      processFile: {
        args: { filepath: './test.txt' },
        expect: (result) => result.success && result.linesProcessed > 0
      }
    }
  }
);
```

---

## Advanced Testing

### 1. Environment-Specific Testing

```javascript
async function testMultipleEnvironments() {
  // Test development configuration
  const devResults = await mcpTest(
    { 
      command: 'node', 
      args: ['./server.js'],
      env: { NODE_ENV: 'development', DEBUG: 'true' }
    },
    { 
      tools: ['search', 'email', 'debug'],  // Include debug tool
      timeout: 10000
    }
  );

  // Test production configuration
  const prodResults = await mcpTest(
    { 
      command: 'node', 
      args: ['./server.js'],
      env: { NODE_ENV: 'production' }
    },
    { 
      tools: ['search', 'email'],  // No debug tool in prod
      timeout: 5000
    }
  );

  console.log('Dev Tests:', formatResults(devResults));
  console.log('Prod Tests:', formatResults(prodResults));
}
```

### 2. Complex Validation Patterns

```javascript
const advancedTests = {
  tools: {
    dataAnalysis: {
      args: { 
        dataset: 'sales_data.csv',
        metrics: ['avg', 'sum', 'count']
      },
      expect: (result) => {
        // Multi-condition validation
        return result.analysis &&
               result.analysis.avg > 0 &&
               result.analysis.sum > result.analysis.avg &&
               result.analysis.count > 100 &&
               result.charts &&
               Array.isArray(result.charts) &&
               result.charts.length >= 3;
      }
    },
    
    apiCall: {
      args: { endpoint: '/users', method: 'GET' },
      expect: (result) => {
        // Validate API response structure
        const isValidResponse = 
          result.status === 200 &&
          Array.isArray(result.data) &&
          result.data.every(user => 
            user.id && user.email && user.name
          );
        
        console.log('API Response valid:', isValidResponse);
        return isValidResponse;
      }
    }
  },

  resources: {
    'database://*': {
      expect: (content) => {
        // Validate database resources
        return content.connection &&
               content.connection.status === 'connected' &&
               content.tables &&
               content.tables.length > 0;
      }
    }
  },

  prompts: {
    'generate-report': {
      args: { 
        type: 'sales',
        period: '2024-Q1',
        format: 'markdown'
      },
      expect: (result) => {
        // Validate prompt structure
        return result.messages &&
               result.messages.length > 0 &&
               result.messages[0].content.text.includes('sales') &&
               result.messages[0].content.text.includes('2024-Q1');
      }
    }
  }
};

const results = await mcpTest(serverConfig, advancedTests);
```

### 3. Error Handling Tests

```javascript
const errorTests = {
  tools: {
    divideByZero: {
      args: { a: 10, b: 0 },
      shouldThrow: true  // Expect this to fail
    },
    
    invalidInput: {
      args: { invalidParam: 'bad-data' },
      expect: (result) => {
        // Check that error is handled gracefully
        return result.error && 
               result.error.message.includes('invalid');
      }
    },
    
    timeoutTest: {
      args: { delay: 60000 },  // 60 second delay
      expect: (result) => result.timeout === true
    }
  }
};
```

---

## CLI Usage

### Basic CLI Commands

```bash
# Test specific tools
mcp-jest node ./server.js --tools search,email,calculate

# Test with resources
mcp-jest python server.py --tools search --resources "docs/*,config.json"

# Test with timeout
mcp-jest ./server --tools search --timeout 10000

# Test everything with prompts
mcp-jest node server.js \
  --tools "search,email" \
  --resources "docs/*" \
  --prompts "review-code,analyze-data"
```

### Using with Different Servers

```bash
# Node.js server
mcp-jest node ./my-mcp-server.js --tools search

# Python server
mcp-jest python ./server.py --tools search,analyze

# Executable binary
mcp-jest ./my-server-binary --tools search

# With custom working directory
mcp-jest --config ./configs/test.json
```

### CLI in Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:mcp": "mcp-jest node ./server.js --tools search,email",
    "test:mcp:full": "mcp-jest --config ./tests/comprehensive.json",
    "test:mcp:quick": "mcp-jest node ./server.js --tools search",
    "test:all": "npm run test && npm run test:mcp",
    "precommit": "npm run test:mcp:quick"
  }
}
```

---

## Configuration Files

### Basic Configuration File

Create `mcp-jest.json`:

```json
{
  "server": {
    "command": "node",
    "args": ["./server.js"],
    "env": {
      "NODE_ENV": "test",
      "DEBUG": "mcp:*"
    }
  },
  "tests": {
    "tools": {
      "search": {
        "args": { "query": "test search" },
        "expect": "content && content.length > 0"
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
    "timeout": 30000
  }
}
```

Run with:
```bash
mcp-jest --config mcp-jest.json
```

### Environment-Specific Configurations

**tests/mcp-dev.json:**
```json
{
  "server": {
    "command": "node",
    "args": ["./server.js"],
    "env": { "NODE_ENV": "development" }
  },
  "tests": {
    "tools": ["search", "email", "debug"],
    "timeout": 10000
  }
}
```

**tests/mcp-prod.json:**
```json
{
  "server": {
    "command": "node",
    "args": ["./dist/server.js"],
    "env": { "NODE_ENV": "production" }
  },
  "tests": {
    "tools": {
      "search": {
        "args": { "query": "production test" },
        "expect": "content.length > 0"
      },
      "email": {
        "args": { "to": "test@example.com" },
        "expect": "messageId !== undefined"
      }
    },
    "timeout": 5000
  }
}
```

### Complex Test Suite Configuration

**tests/comprehensive.json:**
```json
{
  "server": {
    "command": "node",
    "args": ["./server.js"],
    "env": {
      "NODE_ENV": "test",
      "DATABASE_URL": "sqlite://test.db",
      "API_KEY": "test-key-123"
    }
  },
  "tests": {
    "tools": {
      "userAuth": {
        "args": { "username": "testuser", "password": "testpass" },
        "expect": "token && token.length > 10"
      },
      "fetchUserData": {
        "args": { "userId": 1 },
        "expect": "user.id === 1 && user.email"
      },
      "processData": {
        "args": { 
          "data": [1, 2, 3, 4, 5],
          "operation": "sum"
        },
        "expect": "result === 15"
      },
      "generateReport": {
        "args": { "type": "summary", "format": "json" },
        "expect": "report.summary && report.data"
      }
    },
    "resources": {
      "config.json": { "expect": "exists" },
      "data/*": { "expect": "count >= 3" },
      "templates/*.html": { "expect": "count >= 1" }
    },
    "prompts": {
      "analyze-code": {
        "args": { "code": "function test() { return 42; }" },
        "expect": "messages[0].content.text.includes('function')"
      },
      "review-pr": {
        "args": { "diff": "+added line\n-removed line" },
        "expect": "messages.length > 0"
      }
    },
    "timeout": 30000,
    "maxRetries": 3
  }
}
```

---

## Integration Patterns

### 1. Jest Integration

```javascript
// tests/mcp-server.test.js
import { mcpTest, formatResults } from 'mcp-jest';

describe('MCP Server Tests', () => {
  const serverConfig = { command: 'node', args: ['./server.js'] };

  test('should connect and list capabilities', async () => {
    const results = await mcpTest(serverConfig, {
      tools: ['search', 'email']
    });

    expect(results.failed).toBe(0);
    expect(results.total).toBeGreaterThan(0);
  });

  test('search tool should work correctly', async () => {
    const results = await mcpTest(serverConfig, {
      tools: {
        search: {
          args: { query: 'test' },
          expect: (result) => result.content && result.content.length > 0
        }
      }
    });

    expect(results.failed).toBe(0);
  });

  test('should handle multiple tools', async () => {
    const results = await mcpTest(serverConfig, {
      tools: {
        add: { args: { a: 5, b: 3 }, expect: 'content[0].text === "8"' },
        multiply: { args: { a: 4, b: 6 }, expect: 'content[0].text === "24"' }
      }
    });

    expect(results.passed).toBe(4); // 2 existence + 2 execution tests
    expect(results.failed).toBe(0);
  });
});
```

### 2. GitHub Actions Integration

```yaml
# .github/workflows/test-mcp.yml
name: Test MCP Server

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-mcp:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build server
      run: npm run build
    
    - name: Install mcp-jest
      run: npm install -g mcp-jest
    
    - name: Test MCP Server - Basic
      run: mcp-jest node ./dist/server.js --tools "search,email" --timeout 30000
    
    - name: Test MCP Server - Full Suite
      run: mcp-jest --config ./tests/mcp-ci.json
    
    - name: Test MCP Server - Production Config
      run: mcp-jest --config ./tests/mcp-prod.json
      env:
        NODE_ENV: production
```

### 3. Docker Integration

```dockerfile
# Dockerfile.test
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the server
RUN npm run build

# Install mcp-jest globally
RUN npm install -g mcp-jest

# Copy test configurations
COPY tests/ ./tests/

# Run tests
CMD ["mcp-jest", "--config", "./tests/mcp-docker.json"]
```

```bash
# Build and run tests in Docker
docker build -f Dockerfile.test -t my-mcp-server-test .
docker run my-mcp-server-test
```

### 4. Pre-commit Hook Integration

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "Running MCP tests before commit..."

# Quick smoke test
if ! mcp-jest node ./server.js --tools search --timeout 10000; then
  echo "❌ MCP tests failed. Commit aborted."
  exit 1
fi

echo "✅ MCP tests passed!"
```

Or using husky:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:mcp:quick"
    }
  }
}
```

---

## Best Practices

### 1. Start Simple, Add Complexity

```javascript
// Phase 1: Basic existence testing
const basicTests = { tools: ['search', 'email'] };

// Phase 2: Add simple expectations  
const withExpectations = {
  tools: {
    search: { args: { query: 'test' } },
    email: { args: { to: 'test@example.com' } }
  }
};

// Phase 3: Add validation
const withValidation = {
  tools: {
    search: { 
      args: { query: 'test' },
      expect: 'content.length > 0'
    },
    email: { 
      args: { to: 'test@example.com' },
      expect: (result) => result.messageId !== undefined
    }
  }
};
```

### 2. Use Realistic Test Data

```javascript
// Good: Realistic test data
const goodTests = {
  tools: {
    sendEmail: {
      args: {
        to: 'user@example.com',
        subject: 'Test Email',
        body: 'This is a test message with realistic content.'
      },
      expect: (result) => result.messageId && result.status === 'sent'
    },
    
    searchProducts: {
      args: {
        query: 'laptop',
        category: 'electronics',
        priceRange: { min: 500, max: 2000 }
      },
      expect: (result) => result.products && result.products.length > 0
    }
  }
};

// Avoid: Minimal test data
const badTests = {
  tools: {
    sendEmail: {
      args: { to: 'test@test.com' },
      expect: 'exists'
    }
  }
};
```

### 3. Test Edge Cases and Error Conditions

```javascript
const edgeCaseTests = {
  tools: {
    // Test empty input
    search: {
      args: { query: '' },
      expect: (result) => result.error || result.results.length === 0
    },
    
    // Test invalid input
    divide: {
      args: { a: 10, b: 0 },
      shouldThrow: true
    },
    
    // Test large input
    processData: {
      args: { data: new Array(10000).fill(1) },
      expect: (result) => result.processed === true,
      timeout: 30000
    },
    
    // Test malformed input
    parseJson: {
      args: { json: '{ invalid json }' },
      expect: (result) => result.error && result.error.includes('parse')
    }
  }
};
```

### 4. Organize Tests by Environment and Purpose

```
tests/
├── mcp-unit.json          # Basic functionality
├── mcp-integration.json   # Full integration tests  
├── mcp-regression.json    # Critical functionality that must work
├── mcp-performance.json   # Performance and timeout tests
├── mcp-dev.json          # Development environment
├── mcp-staging.json      # Staging environment
└── mcp-prod.json         # Production-like environment
```

### 5. Use Helper Functions for Complex Tests

```javascript
// helpers/mcp-jest-helpers.js
export function createUserTest(userId, expectation) {
  return {
    args: { userId },
    expect: (result) => {
      const user = result.user;
      return user && 
             user.id === userId && 
             user.email &&
             user.email.includes('@') &&
             expectation(user);
    }
  };
}

export function createSearchTest(query, minResults = 1) {
  return {
    args: { query },
    expect: (result) => result.results && result.results.length >= minResults
  };
}

// Usage in tests
import { createUserTest, createSearchTest } from './helpers/mcp-jest-helpers.js';

const tests = {
  tools: {
    getUser: createUserTest(123, user => user.active === true),
    searchProducts: createSearchTest('laptop', 5),
    searchUsers: createSearchTest('john', 1)
  }
};
```

### 6. Monitor Test Performance

```javascript
// performance-test.js
import { mcpTest } from 'mcp-jest';

async function performanceTest() {
  const start = Date.now();
  
  const results = await mcpTest(serverConfig, testConfig);
  
  const duration = Date.now() - start;
  
  console.log(`Test suite completed in ${duration}ms`);
  console.log(`Average per test: ${duration / results.total}ms`);
  
  // Alert if tests are too slow
  if (duration > 10000) {
    console.warn('⚠️  Tests are running slowly. Consider optimizing.');
  }
  
  return results;
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Server Won't Start

**Error:** `spawn ENOENT` or `Command not found`

**Solutions:**
```javascript
// Use absolute paths
const serverConfig = {
  command: '/usr/bin/node',  // Full path
  args: ['./server.js']
};

// Or ensure PATH is set correctly
const serverConfig = {
  command: 'node',
  args: ['./server.js'],
  env: { 
    ...process.env,  // Inherit current environment
    PATH: process.env.PATH 
  }
};

// Set working directory
const serverConfig = {
  command: 'node',
  args: ['./server.js'],
  cwd: '/path/to/project'
};
```

#### 2. Connection Timeout

**Error:** `Server startup timeout after 30000ms`

**Solutions:**
```javascript
// Increase timeout
const testConfig = {
  tools: ['search'],
  timeout: 60000  // 60 seconds
};

// Check server logs
const serverConfig = {
  command: 'node',
  args: ['./server.js'],
  env: { DEBUG: 'mcp:*' }  // Enable debug logging
};

// Test server manually first
// node ./server.js
// Then check if it responds to MCP protocol
```

#### 3. Tool Execution Fails

**Error:** `Tool 'search' failed: Invalid arguments`

**Debug approach:**
```javascript
// Add detailed logging
const testConfig = {
  tools: {
    search: {
      args: { query: 'test' },
      expect: (result) => {
        console.log('Search result:', JSON.stringify(result, null, 2));
        return result.content && result.content.length > 0;
      }
    }
  }
};

// Check tool schema matches arguments
// Look at server implementation to verify expected parameters
```

#### 4. Flaky Tests

**Problem:** Tests pass sometimes, fail others

**Solutions:**
```javascript
// Add retry logic
const testConfig = {
  tools: ['search'],
  maxRetries: 3,
  timeout: 30000
};

// Add delays between operations
const testConfig = {
  tools: {
    search: { args: { query: 'test' } },
    email: { args: { to: 'test@test.com' } }
  },
  delayBetweenTests: 1000  // Wait 1 second between tests
};

// Use fresh server instance for each test
const isolatedTest = {
  tools: ['search'],
  isolateTests: true  // Restart server for each test
};
```

#### 5. Validation Failures

**Error:** `Expected 'content.length > 0' but got undefined`

**Debug:**
```javascript
// Log actual result to understand structure
const testConfig = {
  tools: {
    search: {
      args: { query: 'test' },
      expect: (result) => {
        console.log('Actual result structure:');
        console.log(JSON.stringify(result, null, 2));
        
        // Adjust expectation based on actual structure
        return result.data && result.data.length > 0;  // Instead of result.content
      }
    }
  }
};
```

### Debug Mode

Enable verbose logging to see detailed information:

```bash
# Enable debug logging
DEBUG=mcp-jest* mcp-jest node ./server.js --tools search

# Or in code
process.env.DEBUG = 'mcp-jest*';
const results = await mcpTest(serverConfig, testConfig);
```

### Test Server Manually

Before using MCP-Test, verify your server works manually:

```bash
# Start your server
node ./server.js

# In another terminal, test with a simple MCP client
# This helps isolate whether the issue is with your server or the test
```

### Common Validation Patterns

```javascript
// Safe property access patterns
const safeValidations = {
  // Check nested properties safely
  'content[0].text === "expected"',           // Array access
  'result && result.data && result.data.id',  // Nested object
  'user?.profile?.name',                      // Optional chaining style
  
  // Type checking
  'typeof result === "object"',
  'Array.isArray(result.items)',
  'result.count && typeof result.count === "number"',
  
  // Custom validation with error handling
  expect: (result) => {
    try {
      return result.user.profile.settings.notifications === true;
    } catch (error) {
      console.log('Validation error:', error.message);
      return false;
    }
  }
};
```

---

## Next Steps

1. **Start with basic tests** to verify your server works
2. **Add expectations** to validate behavior
3. **Integrate into CI/CD** for automated testing
4. **Create comprehensive test suites** for different environments
5. **Monitor and optimize** test performance

For more detailed information, see:
- [HOW-IT-WORKS.md](./HOW-IT-WORKS.md) - Deep dive into internals
- [README.md](../README.md) - Quick reference
- [Examples](../examples/) - Working examples

Happy testing! 🧪