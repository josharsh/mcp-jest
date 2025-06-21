# Examples

This directory contains example configurations and use cases for MCP-Jest.

## Basic Examples

### Simple Tool Test
```javascript
// basic-tool-test.json
{
  "name": "Basic Tool Test",
  "tools": {
    "echo": {
      "args": { "message": "Hello, World!" },
      "expect": "result === 'Hello, World!'"
    }
  }
}
```

### Testing Multiple Tools
```javascript
// multi-tool-test.json
{
  "name": "Multi-Tool Test Suite",
  "tools": {
    "math.add": {
      "args": { "a": 5, "b": 3 },
      "expect": "result === 8"
    },
    "math.multiply": {
      "args": { "a": 4, "b": 7 },
      "expect": "result === 28"
    },
    "string.concat": {
      "args": { "str1": "Hello", "str2": "World" },
      "expect": "result === 'HelloWorld'"
    }
  }
}
```

## Advanced Examples

### Snapshot Testing
```javascript
// snapshot-test.json
{
  "name": "Snapshot Test Suite",
  "tools": {
    "getUserData": {
      "args": { "userId": 123 },
      "snapshot": {
        "exclude": ["lastLogin", "sessionId"]
      }
    }
  }
}
```

### Resource Testing
```javascript
// resource-test.json
{
  "name": "Resource Test Suite",
  "resources": {
    "file://docs/*.md": {
      "count": 10,
      "expect": "content.length > 100"
    },
    "db://users/*": {
      "expect": "data.active === true"
    }
  }
}
```

### Complex Expectations
```javascript
// complex-test.json
{
  "name": "Complex Expectation Tests",
  "tools": {
    "search": {
      "args": { "query": "typescript", "limit": 10 },
      "expect": "results.length <= 10 && results.every(r => r.title.toLowerCase().includes('typescript'))"
    },
    "aggregate": {
      "args": { "data": [1, 2, 3, 4, 5] },
      "expect": "sum === 15 && average === 3 && count === 5"
    }
  }
}
```

### Environment Variables
```javascript
// env-test.json
{
  "name": "Environment Variable Test",
  "env": {
    "API_KEY": "test-key-123",
    "DATABASE_URL": "sqlite://test.db",
    "LOG_LEVEL": "debug"
  },
  "tools": {
    "getConfig": {
      "expect": "apiKey === 'test-key-123' && dbUrl === 'sqlite://test.db'"
    }
  }
}
```

## Real-World Examples

### AI Model Server Test
```javascript
// ai-model-test.json
{
  "name": "AI Model Server Tests",
  "timeout": 30000,
  "tools": {
    "complete": {
      "args": {
        "prompt": "What is 2+2?",
        "maxTokens": 10
      },
      "expect": "response.includes('4')"
    },
    "embed": {
      "args": {
        "text": "Hello, world!"
      },
      "expect": "Array.isArray(embedding) && embedding.length === 768"
    }
  }
}
```

### Database Server Test
```javascript
// database-server-test.json
{
  "name": "Database Server Tests",
  "tools": {
    "query": {
      "args": {
        "sql": "SELECT * FROM users WHERE active = true",
        "params": []
      },
      "expect": "rows.length > 0 && rows.every(r => r.active === true)"
    },
    "insert": {
      "args": {
        "table": "logs",
        "data": { "message": "Test log", "level": "info" }
      },
      "expect": "insertedId !== null"
    }
  },
  "resources": {
    "db://tables/*": {
      "count": 5
    }
  }
}
```

### File System Server Test
```javascript
// filesystem-server-test.json
{
  "name": "File System Server Tests",
  "tools": {
    "readFile": {
      "args": { "path": "/tmp/test.txt" },
      "expect": "content.length > 0"
    },
    "listDirectory": {
      "args": { "path": "/tmp" },
      "expect": "Array.isArray(files) && files.includes('test.txt')"
    }
  },
  "resources": {
    "file:///tmp/*.txt": {
      "expect": "size < 1000000"
    }
  }
}
```

## Running Examples

To run these examples:

1. Save the configuration to a `.json` file
2. Run with mcp-jest:
   ```bash
   mcp-jest my-test-config.json
   ```

3. With options:
   ```bash
   mcp-jest my-test-config.json --update-snapshots --verbose
   ```

## Creating Your Own Tests

1. Start with a simple test configuration
2. Add more test cases incrementally
3. Use snapshots for complex response validation
4. Leverage patterns for resource testing
5. Add expectations to validate behavior

Remember: Good tests are specific, reproducible, and meaningful!