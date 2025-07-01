# API Reference

This section contains the complete API reference for MCP-Jest.

## Core Functions

### `mcpTest(serverConfig, testConfig)`

The main testing function for MCP servers.

#### Parameters

- `serverConfig` (MCPServerConfig): Server configuration
  - `command` (string): Command to start the server
  - `args` (string[]): Command arguments
  - `env` (Record<string, string>): Environment variables

- `testConfig` (MCPTestConfig): Test configuration
  - `name` (string): Test suite name
  - `timeout` (number): Global timeout in milliseconds
  - `tools` (ToolTests): Tool test configurations
  - `resources` (ResourceTests): Resource test configurations
  - `prompts` (PromptTests): Prompt test configurations
  - `snapshot` (boolean | SnapshotConfig): Snapshot configuration

#### Returns

Promise<TestSuite> - Test results

#### Example

```javascript
const results = await mcpTest({
  command: 'node',
  args: ['server.js']
}, {
  name: 'My MCP Server Tests',
  tools: {
    calculate: {
      args: { a: 5, b: 3 },
      expect: 'result === 8'
    }
  }
});
```

## Types

### MCPServerConfig

```typescript
interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}
```

### MCPTestConfig

```typescript
interface MCPTestConfig {
  name?: string;
  timeout?: number;
  tools?: ToolTests;
  resources?: ResourceTests;
  prompts?: PromptTests;
  snapshot?: boolean | string | SnapshotConfig;
}
```

### ToolTestConfig

```typescript
interface ToolTestConfig {
  args?: Record<string, unknown>;
  expect?: string;
  snapshot?: boolean | SnapshotConfig;
}
```

### ResourceTestConfig

```typescript
interface ResourceTestConfig {
  expect?: string;
  count?: number;
  snapshot?: boolean | SnapshotConfig;
}
```

### PromptTestConfig

```typescript
interface PromptTestConfig {
  args?: Record<string, unknown>;
  expect?: string;
  snapshot?: boolean | SnapshotConfig;
}
```

### SnapshotConfig

```typescript
interface SnapshotConfig {
  updateSnapshot?: boolean;
  snapshotDir?: string;
  include?: string[];
  exclude?: string[];
}
```

### TestResult

```typescript
interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  duration: number;
  error?: string;
  snapshot?: {
    updated: boolean;
    diff?: string;
  };
}
```

### TestSuite

```typescript
interface TestSuite {
  name: string;
  passed: number;
  failed: number;
  total: number;
  duration: number;
  results: TestResult[];
}
```

## CLI API

### Commands

```bash
# Run tests with a config file
mcp-jest test-config.json

# Update snapshots
mcp-jest test-config.json --update-snapshots

# Set custom timeout
mcp-jest test-config.json --timeout 60000

# Verbose output
mcp-jest test-config.json --verbose
```

### Options

- `--update-snapshots`: Update snapshot files
- `--timeout <ms>`: Set global timeout in milliseconds
- `--verbose`: Enable verbose output
- `--help`: Show help information
- `--version`: Show version information

## Advanced Usage

### Custom Expectations

Use JavaScript expressions in expect strings:

```javascript
{
  tools: {
    search: {
      args: { query: 'test' },
      expect: 'results.length > 0 && results[0].title.includes("test")'
    }
  }
}
```

### Snapshot Exclusions

Exclude volatile fields from snapshots:

```javascript
{
  snapshot: {
    exclude: ['timestamp', 'id', 'sessionId']
  }
}
```

### Pattern Matching

Use glob patterns for resources:

```javascript
{
  resources: {
    'file://**/*.md': {
      count: 5,
      expect: 'content.length > 0'
    }
  }
}
```