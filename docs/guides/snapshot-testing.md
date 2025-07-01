# Snapshot Testing with mcp-jest

Snapshot testing is a powerful feature that captures the output of your MCP server operations and compares them against saved snapshots in future test runs. This helps you detect unexpected changes in your server's behavior and ensures consistency across updates.

## What is Snapshot Testing?

Snapshot testing works by:
1. Capturing the output of a tool, resource, or prompt on the first run
2. Saving this output as a "snapshot" file
3. Comparing future outputs against this saved snapshot
4. Alerting you when the output changes

This is particularly useful for:
- Detecting breaking changes in API responses
- Ensuring consistent formatting of outputs
- Regression testing complex data structures
- Documentation through examples

## Basic Usage

### Simple Snapshot Test

```javascript
await mcpTest(serverConfig, {
  tools: {
    search: {
      args: { query: 'test' },
      snapshot: true  // Enable snapshot testing
    }
  }
});
```

On the first run, this creates a snapshot file. On subsequent runs, it compares the output against the saved snapshot.

### Named Snapshots

For better organization, you can provide custom names:

```javascript
await mcpTest(serverConfig, {
  tools: {
    calculatePrice: {
      args: { items: ['apple', 'banana'], tax: 0.08 },
      snapshot: 'price-calculation-with-tax'
    }
  }
});
```

## Advanced Configuration

### Selective Property Snapshots

Sometimes you only want to snapshot specific parts of the response:

```javascript
await mcpTest(serverConfig, {
  tools: {
    getUserInfo: {
      args: { userId: '123' },
      snapshot: {
        properties: [
          'content[0].type',
          'content[0].text',
          'metadata.version'
        ]
      }
    }
  }
});
```

### Excluding Dynamic Data

Exclude fields that change on every run (timestamps, IDs, etc.):

```javascript
await mcpTest(serverConfig, {
  resources: {
    'status.json': {
      snapshot: {
        exclude: ['timestamp', 'requestId', 'uptime']
      }
    }
  }
});
```

### Complex Configurations

Combine multiple options for precise control:

```javascript
await mcpTest(serverConfig, {
  tools: {
    generateReport: {
      args: { type: 'monthly' },
      snapshot: {
        name: 'monthly-report-structure',
        properties: ['content', 'summary', 'totals'],
        exclude: ['generatedAt', 'processingTimeMs']
      }
    }
  }
});
```

## Updating Snapshots

When you intentionally change your server's output, you'll need to update the snapshots.

### CLI Method

```bash
# Update all snapshots
mcp-jest server.js --tools search --update-snapshots

# Or use the short flag
mcp-jest server.js --tools search -u
```

### Environment Variable

```bash
UPDATE_SNAPSHOTS=true npm test
```

### Programmatic

```javascript
process.env.UPDATE_SNAPSHOTS = 'true';
await mcpTest(serverConfig, testConfig);
```

## Snapshot Storage

Snapshots are stored in a `__snapshots__` directory relative to your current working directory:

```
project/
├── __snapshots__/
│   ├── tool-search-a1b2c3d4.snap.json
│   ├── resource-config_json-e5f6g7h8.snap.json
│   └── prompt-codeReview-i9j0k1l2.snap.json
├── server.js
└── test.js
```

Each snapshot file contains:
- The captured data
- Metadata about the test (type, name, server command)
- Timestamp of creation

## Understanding Snapshot Diffs

When a snapshot doesn't match, you'll see a detailed diff:

```
❌ Tool 'search' snapshot
   Snapshot mismatch:
   - results.count: 5
   + results.count: 6
   + results[5]: {"id": "new-item", "title": "New Result"}
```

This shows:
- `-` Lines that were in the snapshot but not in current output
- `+` Lines that are in current output but not in the snapshot

## Best Practices

### 1. Commit Snapshots
Always commit snapshot files to version control. They're part of your test suite and help track changes over time.

### 2. Review Before Updating
Before running `--update-snapshots`, carefully review the differences to ensure they're intentional.

### 3. Use Meaningful Names
For complex tests, use descriptive snapshot names:

```javascript
snapshot: 'user-profile-with-premium-features'
// instead of
snapshot: true
```

### 4. Exclude Volatile Data
Always exclude data that changes between runs:

```javascript
snapshot: {
  exclude: [
    'timestamp',
    'requestId', 
    'sessionId',
    'randomValue',
    'processingTime'
  ]
}
```

### 5. Focus on Structure
For API stability, often the structure matters more than exact values:

```javascript
snapshot: {
  properties: [
    'data.users[0]',  // Just verify first user exists
    'data.pagination', // Verify pagination structure
    'metadata.version' // Track API version
  ]
}
```

## Examples

### Testing Tool Consistency

```javascript
// Ensure math operations remain consistent
await mcpTest(serverConfig, {
  tools: {
    calculate: {
      args: { expression: '(10 + 5) * 2' },
      snapshot: 'basic-arithmetic'
    }
  }
});
```

### Testing Resource Formats

```javascript
// Verify configuration structure doesn't change
await mcpTest(serverConfig, {
  resources: {
    'config.json': {
      snapshot: {
        name: 'app-configuration',
        exclude: ['lastModified', 'buildNumber']
      }
    }
  }
});
```

### Testing Complex Responses

```javascript
// Test AI-generated content structure
await mcpTest(serverConfig, {
  prompts: {
    codeReview: {
      args: { 
        code: 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }' 
      },
      snapshot: {
        name: 'code-review-fibonacci',
        properties: [
          'content[0].type',           // Verify response type
          'suggestions.length',        // Number of suggestions
          'overallAssessment.score'   // Numerical score exists
        ],
        exclude: [
          'reviewId',
          'reviewedAt',
          'content[0].text'  // Exact wording may vary
        ]
      }
    }
  }
});
```

## Troubleshooting

### Snapshots Not Being Created
- Ensure you have write permissions in the current directory
- Check that `UPDATE_SNAPSHOTS=true` is set on first run
- Verify the snapshot configuration is correct

### Snapshots Always Failing
- Check if you're excluding all dynamic fields
- Ensure your server returns consistent results for the same inputs
- Verify the snapshot files aren't corrupted

### Large Snapshot Files
- Consider using `properties` to snapshot only essential parts
- Exclude large binary data or generated content
- Use multiple focused snapshots instead of one large one

## Migration from Other Testing Approaches

If you're currently using explicit assertions, snapshot testing can simplify your tests:

```javascript
// Before: Manual assertions
{
  tools: {
    search: {
      args: { query: 'test' },
      expect: (result) => {
        return result.content?.length > 0 &&
               result.content[0].type === 'text' &&
               result.metadata?.count > 0;
      }
    }
  }
}

// After: Snapshot testing
{
  tools: {
    search: {
      args: { query: 'test' },
      snapshot: {
        exclude: ['timestamp', 'metadata.count']
      }
    }
  }
}
```

The snapshot approach is more maintainable and provides better error messages when things change.