# GitHub Actions Integration

Complete guide to integrating MCP-Jest with GitHub Actions for CI/CD.

## Quick Start

Add this to `.github/workflows/mcp-test.yml`:

```yaml
name: MCP Server Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Test MCP Server
        run: |
          npm install -g mcp-jest
          mcp-jest node ./dist/server.js --tools "search,calculate"
```

## Using the Official GitHub Action

MCP-Jest provides a native GitHub Action for easier integration:

```yaml
name: MCP Server Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Test MCP Server
        uses: josharsh/mcp-jest@v1
        with:
          server-command: 'node'
          server-args: 'dist/server.js'
          tools: 'search,calculate,email'
```

### Action Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `server-command` | Command to start server | Yes | - |
| `server-args` | Server command arguments | No | - |
| `tools` | Comma-separated tools to test | No | - |
| `resources` | Comma-separated resources to test | No | - |
| `prompts` | Comma-separated prompts to test | No | - |
| `config` | Path to config file | No | - |
| `timeout` | Test timeout in ms | No | `30000` |
| `transport` | Transport type | No | `stdio` |
| `url` | Server URL (for HTTP) | No | - |
| `reporter` | Report format | No | `console` |
| `report-output` | Report output file | No | - |

## Complete Examples

### Basic CI Pipeline

```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Unit tests
        run: npm test

      - name: MCP Server tests
        run: |
          npm install -g mcp-jest
          mcp-jest node ./dist/server.js --tools "search,calculate"
```

### Matrix Testing (Multiple Node Versions)

```yaml
name: Test Matrix
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20, 22]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Test MCP Server
        run: |
          npm install -g mcp-jest
          mcp-jest node ./dist/server.js --tools "search,calculate" --timeout 60000
```

### With HTML Reports

```yaml
name: MCP Tests with Report
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

      - name: Test MCP Server
        uses: josharsh/mcp-jest@v1
        with:
          server-command: 'node'
          server-args: 'dist/server.js'
          tools: 'search,calculate,email'
          reporter: 'html'
          report-output: 'mcp-test-report.html'

      - name: Upload Test Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: mcp-test-report
          path: mcp-test-report.html
          retention-days: 30
```

### Using Config File

```yaml
name: MCP Tests (Config File)
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

      - name: Test MCP Server
        run: |
          npm install -g mcp-jest
          mcp-jest --config ./tests/mcp-jest.json
```

### Auto-Discovery Mode

```yaml
name: MCP Auto-Discovery Tests
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

      - name: Discover and Test
        run: |
          npm install -g mcp-jest
          mcp-jest discover node ./dist/server.js --output discovered-tests.json
          mcp-jest --config discovered-tests.json
```

### Protocol Validation

```yaml
name: MCP Protocol Validation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run build

      - name: Validate Protocol Compliance
        run: |
          npm install -g mcp-jest
          mcp-jest validate node ./dist/server.js --depth full --output compliance.json

      - name: Upload Compliance Report
        uses: actions/upload-artifact@v4
        with:
          name: compliance-report
          path: compliance.json
```

### HTTP Server Testing

```yaml
name: HTTP MCP Server Tests
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
          sleep 5  # Wait for server to start

      - name: Test HTTP Server
        run: |
          npm install -g mcp-jest
          mcp-jest --transport streamable-http --url http://localhost:3000/mcp --tools "search,calculate"
```

### Multiple Test Suites

```yaml
name: Comprehensive MCP Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  mcp-basic:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci && npm run build
      - name: Basic MCP Tests
        run: |
          npm install -g mcp-jest
          mcp-jest node ./dist/server.js --tools "search"

  mcp-full:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci && npm run build
      - name: Full MCP Tests
        run: |
          npm install -g mcp-jest
          mcp-jest --config ./tests/mcp-full.json

  mcp-validation:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci && npm run build
      - name: Protocol Validation
        run: |
          npm install -g mcp-jest
          mcp-jest validate node ./dist/server.js --depth full
```

### With Environment Variables

```yaml
name: MCP Tests with Env
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    env:
      NODE_ENV: test
      API_KEY: ${{ secrets.TEST_API_KEY }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run build

      - name: Test MCP Server
        run: |
          npm install -g mcp-jest
          mcp-jest node ./dist/server.js --tools "search,api-call"
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

### Scheduled Tests

```yaml
name: Scheduled MCP Tests
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:  # Manual trigger

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

      - name: Run Full Test Suite
        run: |
          npm install -g mcp-jest
          mcp-jest --config ./tests/mcp-comprehensive.json --reporter html --report-output report.html

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: daily-test-report
          path: report.html
```

## Best Practices

### 1. Cache Dependencies

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # Caches node_modules
```

### 2. Fail Fast

```yaml
strategy:
  fail-fast: true  # Stop other jobs if one fails
  matrix:
    node-version: [18, 20]
```

### 3. Set Appropriate Timeouts

```yaml
- name: Test MCP Server
  run: mcp-jest node ./server.js --tools search --timeout 60000
  timeout-minutes: 5  # GitHub Action timeout
```

### 4. Always Upload Reports

```yaml
- name: Upload Report
  uses: actions/upload-artifact@v4
  if: always()  # Upload even if tests fail
  with:
    name: test-report
    path: report.html
```

### 5. Use Secrets for Sensitive Data

```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
```

## Exit Codes

MCP-Jest uses standard exit codes:

| Code | Meaning | GitHub Action Result |
|------|---------|---------------------|
| `0` | All tests passed | Success |
| `1` | Tests failed | Failure |
| `2` | Configuration error | Failure |
| `3` | Server startup failure | Failure |

## Related Documentation

- [CLI Reference](../cli-reference.md) - All CLI options
- [Getting Started](getting-started.md) - Basic setup
- [HTTP Transport](http-transport.md) - HTTP server testing
