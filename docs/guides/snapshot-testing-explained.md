# Understanding Snapshot Testing in MCP-JEST

## What is Snapshot Testing?

Think of snapshot testing as **taking a photograph of your MCP server's output** and using it as a reference for future tests. It's like having a "golden standard" that your server's responses are compared against.

```
First Run (Taking the Photo):
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Your Test   │ ───> │ MCP Server  │ ───> │   Output    │
│ Runs Tool   │      │  Responds   │      │   Saved as  │
│             │      │             │      │  Snapshot   │
└─────────────┘      └─────────────┘      └─────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │ 📸 Snapshot  │
                                          │    File      │
                                          └──────────────┘

Future Runs (Comparing with Photo):
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Your Test   │ ───> │ MCP Server  │ ───> │   Output    │
│ Runs Tool   │      │  Responds   │      │             │
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │   Compare    │
                                          │     with     │
                                          │ 📸 Snapshot  │
                                          └──────┬───────┘
                                                  │
                                          ┌───────┴───────┐
                                          │               │
                                      [Match ✓]      [Mismatch ✗]
                                          │               │
                                      Test Passes    Test Fails
```

## Why is Snapshot Testing Needed?

### 1. **Detect Unintended Changes**

Without snapshots:
```javascript
// You might write brittle tests like this:
expect(result.content[0].text).toBe("The sum is 8");
expect(result.metadata.processedAt).toBeDefined();
expect(result.metadata.version).toBe("1.0.0");
// What if the format changes slightly?
```

With snapshots:
```javascript
// Just snapshot the whole response!
snapshot: true
// Any change, no matter how small, is detected
```

### 2. **Regression Testing Made Easy**

```
Scenario: You refactor your MCP server code

Without Snapshots:                    With Snapshots:
┌─────────────────┐                  ┌─────────────────┐
│ Did I break     │                  │ Run tests       │
│ anything?       │                  │                 │
│                 │                  │                 │
│ ¯\_(ツ)_/¯      │                  │ Instant feedback│
│                 │                  │ on any changes! │
└─────────────────┘                  └─────────────────┘
```

### 3. **Documentation Through Examples**

Your snapshots become living documentation:
```
__snapshots__/
├── tool-search-basic.snap.json      # Shows exact search output format
├── tool-calculate-complex.snap.json # Shows calculation response structure
└── resource-config.snap.json        # Shows configuration schema
```

### 4. **API Contract Testing**

```
Your MCP Server <──> Consumer Applications
        │                    │
        └────────┬───────────┘
                 │
         Snapshot ensures
         format never breaks
```

## How Does It Work Technically?

### The SnapshotManager Flow

```
1. Generate Snapshot Name
   ┌────────────────────────────────────┐
   │ Input: test type + name + hash     │
   │ Output: "tool-search-a1b2c3d4"     │
   └────────────────────────────────────┘

2. Normalize Data (Sort Keys for consistency)
   ┌────────────────────────────────────┐
   │ Before: {b: 2, a: 1, c: {d: 3}}    │
   │ After:  {a: 1, b: 2, c: {d: 3}}    │
   └────────────────────────────────────┘

3. Apply Configuration
   ┌────────────────────────────────────┐
   │ Include only: ['content', 'type']  │
   │ Exclude: ['timestamp', 'id']       │
   └────────────────────────────────────┘

4. Compare or Save
   ┌────────────────────────────────────┐
   │ First run?  → Save snapshot        │
   │ Later runs? → Compare & report     │
   │ Update mode? → Overwrite snapshot  │
   └────────────────────────────────────┘
```

### Deep Equality Algorithm

The snapshot system uses a recursive deep equality check:

```
deepEqual(snapshot, current):
  ├─ Same type? (string, number, object, etc.)
  ├─ Same value? (for primitives)
  ├─ Same keys? (for objects)
  ├─ Same length? (for arrays)
  └─ Recursively check all nested values
```

### Diff Generation

When snapshots don't match:
```
Snapshot:                Current Output:
{                       {
  "count": 5,             "count": 6,      ← Different!
  "items": [              "items": [
    "apple",                "apple",
    "banana"                "banana",
                           "orange"        ← Added!
  ]                       ]
}                       }

Generated Diff:
- count: 5
+ count: 6
+ items[2]: "orange"
```

## Common Use Cases

### 1. **Testing Tool Output Consistency**

```javascript
// Ensure your calculation tool always returns the same format
{
  tools: {
    calculate: {
      args: { expression: "2+2" },
      snapshot: true  // Captures: {"result": 4, "expression": "2+2"}
    }
  }
}
```

### 2. **Testing Complex Data Structures**

```javascript
// Test that your data transformation tool maintains structure
{
  tools: {
    transformData: {
      args: { input: complexData },
      snapshot: {
        name: 'data-transformation-v2',
        exclude: ['processedAt', 'requestId']  // Exclude volatile fields
      }
    }
  }
}
```

### 3. **API Response Validation**

```javascript
// Ensure your API responses don't accidentally change
{
  resources: {
    'user/profile': {
      snapshot: {
        properties: [
          'data.user',      // User object structure
          'data.settings',  // Settings structure
          'meta.version'    // API version
        ]
      }
    }
  }
}
```

### 4. **Selective Property Testing**

```javascript
// Only snapshot specific parts you care about
{
  tools: {
    searchProducts: {
      args: { query: 'laptop' },
      snapshot: {
        properties: [
          'results[0]',           // First result structure
          'pagination',           // Pagination object
          'filters'               // Available filters
        ],
        exclude: [
          'results[0].id',        // IDs might change
          'executionTime'         // Performance metrics
        ]
      }
    }
  }
}
```

## How to Test Snapshot Functionality

### 1. **Unit Testing the SnapshotManager**

```javascript
// Test basic snapshot operations
const manager = new SnapshotManager('./test-snapshots');
await manager.init();

// Test 1: Create snapshot
const testData = { message: "Hello", count: 42 };
await manager.captureSnapshot('test-1', testData);

// Test 2: Compare matching data
const result = await manager.compareSnapshot('test-1', testData);
assert(result.match === true);

// Test 3: Detect differences
const modifiedData = { message: "Hello", count: 43 };
const result2 = await manager.compareSnapshot('test-1', modifiedData);
assert(result2.match === false);
assert(result2.diff.includes('count'));
```

### 2. **Integration Testing with MCP Servers**

```javascript
// Test real MCP server responses
await mcpTest(serverConfig, {
  tools: {
    // Test 1: Basic snapshot
    simple: {
      args: { input: "test" },
      snapshot: true
    },
    
    // Test 2: Filtered snapshot
    complex: {
      args: { data: complexInput },
      snapshot: {
        properties: ['result.summary', 'result.status'],
        exclude: ['timestamp', 'duration']
      }
    }
  }
});
```

### 3. **Testing Update Functionality**

```bash
# Step 1: Create initial snapshots
mcp-jest config.json

# Step 2: Modify server output

# Step 3: Verify failure
mcp-jest config.json  # Should fail

# Step 4: Update snapshots
mcp-jest config.json -u  # Should pass and update

# Step 5: Verify new snapshots work
mcp-jest config.json  # Should pass
```

### 4. **Edge Case Testing**

```javascript
// Test edge cases
const edgeCases = [
  null,                          // Null values
  undefined,                     // Undefined values
  [],                           // Empty arrays
  {},                           // Empty objects
  { nested: { deep: { value: 1 } } },  // Deep nesting
  new Date(),                   // Date objects
  /regex/,                      // Regular expressions
];

for (const testCase of edgeCases) {
  await manager.captureSnapshot(`edge-${i}`, testCase);
  const result = await manager.compareSnapshot(`edge-${i}`, testCase);
  assert(result.match);
}
```

## Benefits Summary

```
┌─────────────────────────────────────────────────────────────┐
│                  Snapshot Testing Benefits                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. Catch Regressions                                        │
│    └─> Any unexpected change is immediately detected        │
│                                                              │
│ 2. Less Test Code                                           │
│    └─> One snapshot replaces many assertions               │
│                                                              │
│ 3. Visual Diffs                                            │
│    └─> See exactly what changed when tests fail            │
│                                                              │
│ 4. Living Documentation                                      │
│    └─> Snapshots show real output examples                 │
│                                                              │
│ 5. Refactoring Confidence                                   │
│    └─> Change code freely, snapshots catch breaks          │
│                                                              │
│ 6. API Stability                                            │
│    └─> Ensure your API contract never breaks               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

### 1. **Name Your Snapshots**
```javascript
// Bad: snapshot: true
// Good: snapshot: 'user-search-with-filters'
```

### 2. **Exclude Volatile Data**
```javascript
snapshot: {
  exclude: ['timestamp', 'requestId', 'random', 'uuid']
}
```

### 3. **Review Before Updating**
```bash
# Don't blindly update!
# First, check what changed:
git diff __snapshots__/

# Then update if changes are intentional:
mcp-jest config.json -u
```

### 4. **Keep Snapshots Focused**
```javascript
// Instead of snapshotting everything:
snapshot: true

// Snapshot what matters:
snapshot: {
  properties: ['data.structure', 'data.format']
}
```

### 5. **Commit Snapshots to Git**
```bash
# Always commit snapshots
git add __snapshots__/
git commit -m "Update snapshots for new feature"
```

## Troubleshooting Guide

### Problem: Snapshots Always Fail
```
Diagnosis Flow:
1. Check for dynamic data → Exclude it
2. Check for sorting issues → Data is normalized
3. Check for async timing → Ensure consistent state
```

### Problem: Snapshots Not Created
```
Checklist:
□ Is UPDATE_SNAPSHOTS=true set?
□ Do you have write permissions?
□ Is the snapshot config valid?
□ Check console for errors
```

### Problem: Large Snapshot Files
```
Solutions:
1. Use property filtering
2. Exclude large data blocks
3. Split into multiple focused snapshots
```

## Conclusion

Snapshot testing in MCP-JEST provides a powerful, low-maintenance way to ensure your MCP servers behave consistently. It's especially valuable for:

- **API stability** - Detect any output format changes
- **Regression prevention** - Catch bugs before users do
- **Documentation** - Real examples of server responses
- **Confidence** - Refactor freely with safety net

The key is to use snapshots wisely: exclude volatile data, focus on what matters, and always review changes before updating snapshots.