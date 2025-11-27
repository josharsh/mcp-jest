# Troubleshooting

Common issues and solutions when using MCP-Jest.

## Quick Diagnostics

Before diving into specific issues, try these:

```bash
# Enable debug logging
DEBUG=mcp-jest* mcp-jest node ./server.js --tools search

# Check MCP-Jest version
mcp-jest --version

# Verify server runs manually
node ./server.js
```

## Common Issues

### Server Won't Start

#### Error: `spawn ENOENT` or `Command not found`

**Cause:** The server command cannot be found.

**Solutions:**

1. Use absolute paths:
```bash
mcp-jest /usr/bin/node ./server.js --tools search
```

2. Ensure the command is in PATH:
```javascript
const results = await mcpTest({
  command: 'node',
  args: ['./server.js'],
  env: {
    ...process.env,  // Inherit PATH
    PATH: process.env.PATH
  }
});
```

3. Set working directory:
```javascript
const results = await mcpTest({
  command: 'node',
  args: ['./server.js'],
  cwd: '/path/to/project'
});
```

#### Error: `Server process exited unexpectedly`

**Cause:** The server crashed during startup.

**Solutions:**

1. Test server manually first:
```bash
node ./server.js
```

2. Check for missing dependencies:
```bash
npm install
```

3. Check for syntax errors:
```bash
node --check ./server.js
```

4. Enable server debug logging:
```javascript
const results = await mcpTest({
  command: 'node',
  args: ['./server.js'],
  env: { DEBUG: '*', NODE_ENV: 'development' }
});
```

### Connection Timeout

#### Error: `Server startup timeout after 30000ms`

**Cause:** Server takes too long to start or isn't responding to MCP protocol.

**Solutions:**

1. Increase timeout:
```bash
mcp-jest node ./server.js --tools search --timeout 60000
```

2. Check server implements MCP correctly:
```javascript
// Your server should output MCP messages to stdout
// and read from stdin
```

3. Verify stdio transport:
```javascript
// Server must use stdio, not HTTP by default
// Check server configuration
```

4. Test with minimal config:
```bash
mcp-jest node ./server.js --tools search --timeout 120000
```

### Tool Execution Failures

#### Error: `Tool 'toolName' not found`

**Cause:** The tool doesn't exist on the server.

**Solutions:**

1. List available tools:
```bash
mcp-jest discover node ./server.js
```

2. Check tool name spelling:
```bash
# Tool names are case-sensitive
mcp-jest node ./server.js --tools Search  # Wrong
mcp-jest node ./server.js --tools search  # Correct
```

3. Verify tool is registered in server:
```javascript
// In your server code
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{ name: 'search', description: '...' }]
}));
```

#### Error: `Tool execution failed: Invalid arguments`

**Cause:** Arguments don't match tool schema.

**Solutions:**

1. Check tool schema:
```bash
mcp-jest discover node ./server.js --output schema.json
# Review the inputSchema for the tool
```

2. Add detailed logging:
```javascript
const results = await mcpTest(serverConfig, {
  tools: {
    search: {
      args: { query: 'test' },
      expect: (result) => {
        console.log('Result:', JSON.stringify(result, null, 2));
        return result.content && result.content.length > 0;
      }
    }
  }
});
```

3. Verify required arguments:
```javascript
// If tool requires 'query', make sure to provide it
tools: {
  search: {
    args: { query: 'test' }  // Not args: {}
  }
}
```

### Validation Failures

#### Error: `Expected 'content.length > 0' but got undefined`

**Cause:** The result structure doesn't match your expectation.

**Solutions:**

1. Log actual result structure:
```javascript
tools: {
  search: {
    args: { query: 'test' },
    expect: (result) => {
      console.log('Actual structure:');
      console.log(JSON.stringify(result, null, 2));
      return true;  // Temporarily pass to see structure
    }
  }
}
```

2. Use safe property access:
```javascript
// Instead of
expect: 'content[0].text === "hello"'

// Use
expect: (result) => {
  return result?.content?.[0]?.text === 'hello';
}
```

3. Check MCP response format:
```javascript
// MCP tool responses have this structure:
{
  content: [
    { type: 'text', text: 'result text' }
  ]
}
```

### Flaky Tests

#### Problem: Tests pass sometimes, fail others

**Causes:** Race conditions, network issues, or server state.

**Solutions:**

1. Increase timeout:
```javascript
const results = await mcpTest(serverConfig, {
  tools: ['search'],
  timeout: 60000
});
```

2. Add retries:
```javascript
const results = await mcpTest(serverConfig, {
  tools: ['search'],
  maxRetries: 3
});
```

3. Ensure test isolation:
```javascript
// Each test should not depend on previous tests
// Don't rely on server state from previous operations
```

4. Add delays for slow operations:
```bash
mcp-jest node ./server.js --tools search --timeout 30000
```

### Snapshot Issues

#### Error: `Snapshot mismatch`

**Cause:** Output changed from stored snapshot.

**Solutions:**

1. Review the diff and update if intentional:
```bash
mcp-jest node ./server.js --tools search --update-snapshots
```

2. Exclude volatile fields:
```javascript
tools: {
  search: {
    args: { query: 'test' },
    snapshot: {
      exclude: ['timestamp', 'id', 'sessionId']
    }
  }
}
```

3. Check for non-deterministic output:
```javascript
// If your tool returns timestamps or random IDs,
// exclude them from snapshots
```

### HTTP Transport Issues

#### Error: `Connection refused` (HTTP transport)

**Cause:** HTTP server not running or wrong URL.

**Solutions:**

1. Verify server is running:
```bash
curl http://localhost:3000/health
```

2. Check URL format:
```bash
mcp-jest --transport streamable-http --url http://localhost:3000/mcp --tools search
```

3. Check CORS settings on server

4. Verify port is correct:
```bash
netstat -an | grep 3000
```

#### Error: `SSE connection failed`

**Cause:** SSE endpoint not responding correctly.

**Solutions:**

1. Test SSE endpoint manually:
```bash
curl -N http://localhost:3000/sse
```

2. Check server SSE implementation

3. Increase connection timeout:
```bash
mcp-jest --transport sse --url http://localhost:3000/sse --timeout 60000 --tools search
```

## Debug Mode

Enable verbose logging for detailed diagnostics:

```bash
# Full debug output
DEBUG=mcp-jest* mcp-jest node ./server.js --tools search

# Or in code
process.env.DEBUG = 'mcp-jest*';
const results = await mcpTest(serverConfig, testConfig);
```

## Verifying Server Manually

Before using MCP-Jest, verify your server works:

```bash
# 1. Start your server
node ./server.js

# 2. In another terminal, test with a simple MCP client
# Or use mcp-jest discover to list capabilities
mcp-jest discover node ./server.js
```

## Common Validation Patterns

```javascript
// Safe patterns that handle undefined values

// Check nested properties
expect: (result) => {
  return result?.content?.[0]?.text === 'expected';
}

// Check array length
expect: (result) => {
  return Array.isArray(result?.items) && result.items.length > 0;
}

// Check type
expect: (result) => {
  return typeof result?.value === 'number';
}

// Multiple conditions
expect: (result) => {
  return result?.success === true &&
         result?.data?.id !== undefined &&
         result?.data?.name?.length > 0;
}
```

## Getting Help

If you're still stuck:

1. **Check existing issues**: [GitHub Issues](https://github.com/josharsh/mcp-jest/issues)
2. **Ask a question**: [GitHub Discussions](https://github.com/josharsh/mcp-jest/discussions)
3. **File a bug report**: Include debug output, server info, and minimal reproduction

When reporting issues, include:
- MCP-Jest version (`mcp-jest --version`)
- Node.js version (`node --version`)
- Server command and configuration
- Debug output (`DEBUG=mcp-jest*`)
- Minimal reproduction steps

## Related Documentation

- [Getting Started](getting-started.md) - Basic setup
- [CLI Reference](../cli-reference.md) - All CLI options
- [Architecture](../architecture.md) - How MCP-Jest works
