# mcp-jest Framework Documentation

## What is mcp-jest?

**mcp-jest** is a comprehensive testing framework designed specifically for Model Context Protocol (MCP) servers. Think of it as "Jest for MCP" - it provides a simple, declarative way to test MCP server implementations to ensure they work correctly.

The Model Context Protocol (MCP) is an open standard that enables AI applications to securely connect to external data sources and tools. As MCP servers become more common, there's a critical need for reliable testing to ensure these servers work as expected.

## The Problem mcp-jest Solves

### Before mcp-jest
- **No Standard Testing**: MCP server developers had no consistent way to test their implementations
- **Manual Verification**: Testing required manually connecting clients and hoping everything worked
- **Integration Headaches**: No way to verify that tools, resources, and prompts functioned correctly
- **CI/CD Gaps**: No automated testing meant unreliable deployments
- **Debugging Nightmare**: When things broke, it was hard to identify what went wrong

### After mcp-jest
- **Automated Testing**: Write declarative tests that run automatically
- **Comprehensive Coverage**: Test connections, capabilities, tools, resources, and prompts
- **CI/CD Ready**: Integrates seamlessly into build pipelines
- **Clear Reporting**: Detailed test results show exactly what works and what doesn't
- **Developer Friendly**: Simple API that's easy to learn and use

## How mcp-jest Works

### Core Architecture

mcp-jest works by:

1. **Spawning Your MCP Server**: Starts your server as a child process
2. **Establishing Connection**: Creates an MCP client connection via stdio transport
3. **Discovery Phase**: Lists available tools, resources, and prompts
4. **Capability Testing**: Verifies expected capabilities exist
5. **Functional Testing**: Executes tools, reads resources, and gets prompts
6. **Validation**: Checks results against your expectations
7. **Reporting**: Provides detailed test results with pass/fail status

### Test Flow

```
Your MCP Server → MCP Client → Test Runner → Results
     ↑                                           ↓
 Auto-spawned                              Formatted Output
```

## Key Features

### 🧪 **Simple API**
- One function call to test your entire server
- Declarative configuration - describe what to test, not how

### 📝 **Comprehensive Testing**
- **Connection Testing**: Verify server starts and accepts connections
- **Capability Discovery**: Check that expected tools/resources/prompts exist
- **Tool Execution**: Call tools with arguments and validate responses
- **Resource Reading**: Access resources and verify content
- **Prompt Generation**: Get prompts and validate structure

### 🔍 **Flexible Expectations**
- Simple assertions: `exists`, `length > 5`, `contains:substring`
- Custom validation functions for complex scenarios
- Built-in helpers for common patterns

### 🚀 **CI/CD Ready**
- Command-line interface for build scripts
- JSON configuration files for complex setups
- Exit codes indicate test success/failure

### 🛠️ **Developer Experience**
- Detailed error messages with context
- Pretty-printed test results
- TypeScript support with full type safety

## Installation

### As a Library
```bash
npm install mcp-jest
# or
pnpm add mcp-jest
```

### Global CLI Tool
```bash
npm install -g mcp-jest
```

## Usage Examples

### Basic Library Usage

```javascript
import { mcpTest } from 'mcp-jest';

// Simple test - just verify tools exist
const results = await mcpTest(
  { command: 'node', args: ['./my-server.js'] },
  { tools: ['search', 'email'] }
);

console.log(`${results.passed}/${results.total} tests passed`);
```

### Advanced Testing with Expectations

```javascript
import { mcpTest, formatResults } from 'mcp-jest';

const results = await mcpTest(
  { command: 'python', args: ['server.py'] },
  {
    // Test tools with arguments and expectations
    tools: {
      calculate: {
        args: { a: 5, b: 3 },
        expect: result => result.content[0].text === '8'
      },
      search: {
        args: { query: 'test' },
        expect: 'content.length > 0'
      }
    },
    
    // Test resources
    resources: {
      'config.json': { expect: 'exists' },
      'docs/*': { expect: 'count >= 1' }
    },
    
    // Test prompts
    prompts: {
      'review-code': {
        args: { code: 'function test() {}' },
        expect: result => result.messages.length > 0
      }
    },
    
    timeout: 30000
  }
);

// Pretty print results
console.log(formatResults(results));
```

### CLI Usage

```bash
# Basic tool testing
mcp-jest node ./server.js --tools search,email

# With configuration file
mcp-jest --config ./mcp-jest.json

# Complex inline testing
mcp-jest python server.py \
  --tools "search,calculate" \
  --resources "docs/*,config.json" \
  --prompts "review-code"
```

### Configuration File Example

Create `mcp-jest.json`:

```json
{
  "server": {
    "command": "node",
    "args": ["./server.js"],
    "env": { "NODE_ENV": "test" }
  },
  "tests": {
    "tools": {
      "search": { 
        "args": { "query": "test" }, 
        "expect": "results.length > 0" 
      },
      "calculate": {
        "args": { "a": 5, "b": 3 },
        "expect": "content[0].text === '8'"
      }
    },
    "resources": {
      "config.json": { "expect": "exists" }
    },
    "timeout": 30000
  }
}
```

## Real-World Use Cases

### 1. **Development Testing**
During development, run quick tests to verify your changes:

```bash
npm run test:mcp  # runs mcp-jest in package.json scripts
```

### 2. **CI/CD Integration**

```yaml
# GitHub Actions example
- name: Test MCP Server
  run: |
    npm install mcp-jest
    mcp-jest node ./server.js --tools "search,email" --resources "docs/*"
```

### 3. **Integration Testing**
Test that your server works with different client configurations:

```javascript
// Test different environments
const prodResults = await mcpTest(
  { command: 'node', args: ['./server.js'], env: { NODE_ENV: 'production' } },
  { tools: ['search', 'email'] }
);

const devResults = await mcpTest(
  { command: 'node', args: ['./server.js'], env: { NODE_ENV: 'development' } },
  { tools: ['search', 'email', 'debug'] }
);
```

### 4. **Regression Testing**
Ensure updates don't break existing functionality:

```javascript
const regressionSuite = {
  tools: {
    // Critical tools that must always work
    userAuth: { args: { token: 'test' }, expect: 'success === true' },
    dataFetch: { args: { id: 1 }, expect: 'data !== null' }
  },
  resources: {
    'api/users/*': { expect: 'count > 0' }
  }
};

const results = await mcpTest(serverConfig, regressionSuite);
```

## Configuration Reference

### Server Configuration

```typescript
interface MCPServerConfig {
  command: string;           // Command to start server (e.g., 'node', 'python')
  args?: string[];          // Command arguments
  env?: Record<string, string>; // Environment variables
  cwd?: string;            // Working directory
}
```

### Test Configuration

```typescript
interface MCPTestConfig {
  tools?: string[] | Record<string, ToolTestConfig>;
  resources?: string[] | Record<string, ResourceTestConfig>;
  prompts?: string[] | Record<string, PromptTestConfig>;
  timeout?: number;        // Test timeout in milliseconds
  maxRetries?: number;     // Max retry attempts
}
```

### Expectation Patterns

- `'exists'` - Value is not null/undefined
- `'length > 5'` - Array/string length comparison
- `'count >= 10'` - Count comparison for arrays
- `'contains:substring'` - String contains substring
- `result => result.success` - Custom function

## Best Practices

### 1. **Start Simple**
Begin with basic existence tests, then add complexity:

```javascript
// Start here
{ tools: ['search', 'email'] }

// Then evolve to
{ 
  tools: {
    search: { args: { query: 'test' } },
    email: { args: { to: 'test@example.com' } }
  }
}
```

### 2. **Use Meaningful Test Data**
Provide realistic arguments that match production usage:

```javascript
tools: {
  sendEmail: {
    args: { 
      to: 'user@example.com',
      subject: 'Test Email',
      body: 'This is a test message'
    },
    expect: result => result.messageId !== undefined
  }
}
```

### 3. **Test Edge Cases**
Include tests for error conditions:

```javascript
tools: {
  divide: {
    args: { a: 10, b: 0 },
    shouldThrow: true  // Expect this to fail
  }
}
```

### 4. **Organize Tests by Environment**
Create different test suites for different environments:

```javascript
// tests/mcp-dev.json - Development tests
// tests/mcp-prod.json - Production-like tests  
// tests/mcp-regression.json - Regression suite
```

### 5. **Use in CI/CD Pipelines**
Integrate into your build process:

```bash
# In package.json scripts
"test:mcp": "mcp-jest --config ./tests/mcp-jest.json",
"test": "npm run test:unit && npm run test:mcp"
```

## Troubleshooting

### Common Issues

**Server Won't Start**
- Check that your server command is correct
- Verify environment variables are set
- Ensure all dependencies are installed

**Connection Failures**
- Verify your server implements MCP protocol correctly
- Check that stdio transport is configured
- Increase timeout if server is slow to start

**Tool Execution Fails**
- Verify tool arguments match server expectations
- Check that tools are properly registered
- Review server logs for detailed error messages

**Tests Are Flaky**
- Increase timeout values
- Add retry logic for unstable operations
- Ensure test isolation (no shared state)

### Debug Mode

Run with verbose output to see detailed information:

```bash
DEBUG=mcp-jest* mcp-jest node ./server.js --tools search
```

## API Reference

### Core Functions

#### `mcpTest(server, config)`
Main testing function that runs a complete test suite.

**Parameters:**
- `server` - Server configuration or command string
- `config` - Test configuration object

**Returns:** Promise<TestSuite>

#### `formatResults(suite)`
Formats test results for console output.

**Parameters:**
- `suite` - TestSuite object from mcpTest()

**Returns:** Formatted string

### Helper Functions

#### `expect.exists(value)`
Checks if value is not null/undefined

#### `expect.notEmpty(value)`
Checks if array/string/object is not empty

#### `expect.length(value, expected)`
Checks if array/string has exact length

#### `expect.contains(value, substring)`
Checks if string/array contains value

#### `expect.matches(value, pattern)`
Checks if string matches regex pattern

## Performance Considerations

### Test Execution Time
- Average test suite: 100-500ms
- Complex servers: 1-3 seconds
- Use timeouts appropriately for slow servers

### Resource Usage
- Minimal memory footprint
- Spawns server as child process
- Cleans up connections automatically

### Parallelization
- Tests run sequentially within a suite
- Multiple test suites can run in parallel
- Each suite spawns its own server instance

## Contributing

mcp-jest is open source and welcomes contributions:

- **Bug Reports**: Issues with server compatibility
- **Feature Requests**: New expectation patterns or capabilities
- **Documentation**: Examples and use cases
- **Code**: Core functionality improvements

## License

MIT License - Use freely in commercial and open source projects.

## Conclusion

mcp-jest solves the critical problem of testing MCP servers in a reliable, automated way. By providing a simple API and comprehensive testing capabilities, it enables developers to build robust MCP implementations with confidence.

Whether you're building a simple MCP server or a complex multi-tool system, mcp-jest helps ensure your implementation works correctly and continues to work as it evolves.

Start testing your MCP servers today and build with confidence!