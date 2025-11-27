# HTTP Transport Guide

Testing MCP servers over HTTP transports (HTTP streaming and SSE).

## Overview

MCP-Jest supports three transport types:

| Transport | Description | Use Case |
|-----------|-------------|----------|
| `stdio` | Standard input/output | Local servers (default) |
| `streamable-http` | HTTP streaming | Remote HTTP servers |
| `sse` | Server-Sent Events | Real-time streaming servers |

## HTTP Streaming (streamable-http)

### Basic Usage

```bash
# CLI
mcp-jest --transport streamable-http --url http://localhost:3000/mcp --tools search

# With config file
mcp-jest --config http-test.json
```

### Config File

```json
{
  "server": {
    "transport": "streamable-http",
    "url": "http://localhost:3000/mcp"
  },
  "tests": {
    "tools": {
      "search": {
        "args": { "query": "test" },
        "expect": "content.length > 0"
      }
    },
    "timeout": 60000
  }
}
```

### Programmatic Usage

```javascript
import { mcpTest } from 'mcp-jest';

const results = await mcpTest(
  {
    transport: 'streamable-http',
    url: 'http://localhost:3000/mcp'
  },
  {
    tools: {
      search: {
        args: { query: 'test' },
        expect: 'content.length > 0'
      }
    },
    timeout: 60000
  }
);
```

## Server-Sent Events (SSE)

### Basic Usage

```bash
# CLI
mcp-jest --transport sse --url http://localhost:3000/sse --tools search

# With timeout
mcp-jest --transport sse --url http://localhost:3000/sse --tools search --timeout 60000
```

### Config File

```json
{
  "server": {
    "transport": "sse",
    "url": "http://localhost:3000/sse"
  },
  "tests": {
    "tools": ["search", "stream"],
    "timeout": 60000
  }
}
```

### Programmatic Usage

```javascript
import { mcpTest } from 'mcp-jest';

const results = await mcpTest(
  {
    transport: 'sse',
    url: 'http://localhost:3000/sse'
  },
  {
    tools: ['search', 'stream'],
    timeout: 60000
  }
);
```

## Complete Examples

### Testing a Remote API Server

```bash
# Test a deployed MCP server
mcp-jest --transport streamable-http \
  --url https://api.example.com/mcp \
  --tools "search,calculate" \
  --timeout 30000
```

### Testing Local HTTP Server

```bash
# Start your HTTP server first
node ./http-server.js &

# Then test it
mcp-jest --transport streamable-http \
  --url http://localhost:3000/mcp \
  --tools search
```

### Full Config Example

```json
{
  "server": {
    "transport": "streamable-http",
    "url": "http://localhost:3000/mcp",
    "headers": {
      "Authorization": "Bearer test-token"
    }
  },
  "tests": {
    "tools": {
      "search": {
        "args": { "query": "test query" },
        "expect": "content[0].text.length > 0"
      },
      "calculate": {
        "args": { "expression": "2 + 2" },
        "expect": "content[0].text === '4'"
      }
    },
    "resources": {
      "config": { "expect": "exists" }
    },
    "timeout": 60000
  }
}
```

### CI/CD with HTTP Server

```yaml
# .github/workflows/http-test.yml
name: HTTP MCP Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run build

      - name: Start HTTP Server
        run: |
          node ./dist/http-server.js &
          sleep 5  # Wait for server startup

      - name: Test MCP Server
        run: |
          npm install -g mcp-jest
          mcp-jest --transport streamable-http \
            --url http://localhost:3000/mcp \
            --tools "search,calculate" \
            --timeout 60000
```

### Docker Testing

```dockerfile
# Dockerfile.test
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm install -g mcp-jest

# Start server and run tests
CMD sh -c "node dist/http-server.js & sleep 5 && mcp-jest --transport streamable-http --url http://localhost:3000/mcp --tools search"
```

## Comparison: stdio vs HTTP

| Feature | stdio | HTTP (streamable-http/SSE) |
|---------|-------|----------------------------|
| Setup | Simple | Requires running server |
| Local testing | Best choice | Works |
| Remote testing | Not possible | Best choice |
| CI/CD | Simple | Need to start server |
| Performance | Fastest | Network overhead |
| Debugging | Easy | Check server logs |

## When to Use Each Transport

### Use stdio when:
- Testing locally during development
- Server is a CLI application
- Simple CI/CD setup
- Best performance is needed

### Use streamable-http when:
- Testing remote servers
- Server is an HTTP API
- Testing deployed services
- Testing microservices

### Use SSE when:
- Server uses Server-Sent Events
- Real-time streaming responses
- Long-running operations

## Troubleshooting HTTP Transport

### Connection Refused

```bash
# Check server is running
curl http://localhost:3000/health

# Check correct port
netstat -an | grep 3000

# Check URL format
mcp-jest --transport streamable-http --url http://localhost:3000/mcp  # Include path
```

### Timeout Issues

```bash
# Increase timeout for slow servers
mcp-jest --transport streamable-http \
  --url http://localhost:3000/mcp \
  --tools search \
  --timeout 120000
```

### CORS Issues

If testing from a browser environment, ensure your server has proper CORS headers:

```javascript
// Server-side
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### SSL/TLS Issues

```bash
# For self-signed certificates in development
NODE_TLS_REJECT_UNAUTHORIZED=0 mcp-jest --transport streamable-http \
  --url https://localhost:3000/mcp \
  --tools search
```

### Authentication

```json
{
  "server": {
    "transport": "streamable-http",
    "url": "http://localhost:3000/mcp",
    "headers": {
      "Authorization": "Bearer your-token",
      "X-API-Key": "your-api-key"
    }
  }
}
```

## Auto-Discovery with HTTP

```bash
# Discover capabilities of HTTP server
mcp-jest discover --transport streamable-http --url http://localhost:3000/mcp

# Save as config
mcp-jest discover --transport streamable-http \
  --url http://localhost:3000/mcp \
  --output http-tests.json
```

## Protocol Validation with HTTP

```bash
# Validate HTTP server compliance
mcp-jest validate --transport streamable-http \
  --url http://localhost:3000/mcp \
  --depth full \
  --output compliance.json
```

## Related Documentation

- [CLI Reference](../cli-reference.md) - All CLI options
- [GitHub Actions](github-actions.md) - CI/CD integration
- [Troubleshooting](troubleshooting.md) - Common issues
- [Architecture](../architecture.md) - How transports work
