# MCP-Jest Architecture

This document explains how MCP-Jest works internally and why it's uniquely designed for testing MCP servers.

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MCP-JEST Architecture v1.2.0                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                    │
│  │    CLI      │     │  Library    │     │   Types     │                    │
│  │ (cli.ts)    │     │ (index.ts)  │     │ (types.ts)  │                    │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                    │
│         │                    │                    │                         │
│         └────────────────────┴────────────────────┘                         │
│                              │                                              │
│    ┌─────────────────────────┼─────────────────────────┐                    │
│    │                         │                         │                    │
│    ▼                         ▼                         ▼                    │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐                │
│  │ MCPDiscovery │  │  MCPTestRunner  │  │ MCPProtocolValid │                │
│  │(discovery.ts)│  │   (runner.ts)   │  │  (validator.ts)  │                │
│  └──────────────┘  └────────┬────────┘  └──────────────────┘                │
│                             │                                               │
│         ┌───────────────────┼───────────────────┐                           │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐                      │
│  │ MCPTestClient│  │SnapshotManager│  │  Expectation │                      │
│  │ (client.ts)  │  │ (snapshot.ts) │  │   Evaluator  │                      │
│  └──────┬───────┘  └───────┬───────┘  └──────┬───────┘                      │
│         │                   │                  │                            │
│         ▼                   ▼                  ▼                            │
│  ┌──────────────────────────────────────────────────┐                       │
│  │          MCP Protocol Communication              │                       │
│  │        (via @modelcontextprotocol/sdk)          │                        │
│  └──────────────────────────────────────────────────┘                       │
│                             │                                               │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐                      │
│  │  WatchMode   │  │  HTMLReporter │  │ GitHub Action│                      │
│  │ (watch.ts)   │  │ (reporter.ts) │  │ (action.yml) │                      │
│  └──────────────┘  └───────────────┘  └──────────────┘                      │
│                             │                                               │
└─────────────────────────────┼──────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Your MCP Server │
                    │   (Being Tested) │
                    └─────────────────┘
```

## Core Components

### 1. CLI (`cli.ts`)
Entry point for command-line usage. Parses arguments and delegates to appropriate handlers.

### 2. Library (`index.ts`)
Programmatic API for integration into existing test suites (Jest, Vitest, etc.).

### 3. MCPTestRunner (`runner.ts`)
Orchestrates the entire test flow:
- Spawns server process
- Establishes MCP connection
- Runs discovery and functional tests
- Collects and reports results

### 4. MCPTestClient (`client.ts`)
Handles MCP protocol communication:
- Connection management
- Tool execution
- Resource reading
- Prompt retrieval

### 5. MCPDiscovery (`discovery.ts`)
Auto-discovers server capabilities and generates test configurations.

### 6. MCPProtocolValidator (`validator.ts`)
Validates MCP protocol compliance with detailed scoring.

### 7. SnapshotManager (`snapshot.ts`)
Manages snapshot testing for output comparison.

### 8. HTMLReporter (`reporter.ts`)
Generates interactive HTML test reports.

### 9. WatchMode (`watch.ts`)
File watcher for auto-rerunning tests during development.

## How Testing Works

### Test Flow

```
Your MCP Server → MCP Client → Test Runner → Results
     ↑                                           ↓
 Auto-spawned                              Formatted Output
```

### Detailed Flow

1. **Server Startup**: MCP-Jest spawns your server as a child process
2. **Connection**: Establishes MCP client connection via configured transport
3. **Discovery**: Lists available tools, resources, and prompts
4. **Capability Testing**: Verifies expected capabilities exist
5. **Functional Testing**: Executes tools, reads resources, gets prompts
6. **Validation**: Checks results against expectations
7. **Reporting**: Outputs detailed results with pass/fail status
8. **Cleanup**: Terminates server process and connections

## Protocol-Specific Design

MCP-Jest is purpose-built for the MCP protocol, unlike generic testing frameworks:

```
┌─────────────────────────────────────────────────────────┐
│           Generic Testing vs MCP-JEST                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Generic Test Framework:                                │
│  ┌─────────┐                                            │
│  │  Test   │──[HTTP/Function Call]──> Response          │
│  └─────────┘                                            │
│                                                         │
│  MCP-JEST:                                              │
│  ┌─────────┐                                            │
│  │  Test   │                                            │
│  └────┬────┘                                            │
│       │                                                 │
│       ├──[1. Process Management]                        │
│       ├──[2. Transport Setup (stdio/HTTP/SSE)]          │
│       ├──[3. MCP Protocol Handshake]                    │
│       ├──[4. Capability Discovery]                      │
│       ├──[5. Tool/Resource/Prompt Execution]            │
│       └──[6. Structured Validation]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Test Coverage Layers

```
┌────────────────────────────────────────────────┐
│          MCP-JEST Test Coverage               │
├────────────────────────────────────────────────┤
│                                                │
│  Connection Layer:                             │
│  • Server startup                              │
│  • Protocol handshake                          │
│  • Timeout handling                            │
│                                                │
│  Discovery Layer:                              │
│  • Available tools                             │
│  • Available resources                         │
│  • Available prompts                           │
│  • Capability matching                         │
│                                                │
│  Functional Layer:                             │
│  • Tool execution with arguments               │
│  • Resource reading                            │
│  • Prompt generation                           │
│  • Error handling                              │
│                                                │
│  Validation Layer:                             │
│  • Response structure                          │
│  • Content validation                          │
│  • Snapshot comparison                         │
│  • Custom expectations                         │
│                                                │
└────────────────────────────────────────────────┘
```

## Snapshot Algorithm

MCP-Jest uses a deterministic snapshot comparison algorithm:

```
┌─────────────────────────────────────────────────────────┐
│              Snapshot Comparison Algorithm               │
├───────────────────────────────────────────────────────── ┤
│                                                          │
│  1. Normalize Data:                                      │
│     • Sort object keys alphabetically                    │
│     • Remove volatile fields (timestamps, IDs)           │
│     • Apply inclusion/exclusion rules                    │
│                                                          │
│  2. Generate Hash:                                       │
│     • Create deterministic string representation         │
│     • Use SHA-256 for consistency                        │
│                                                          │
│  3. Compare:                                             │
│     ┌─────────────┐     ┌─────────────┐                  │
│     │   Current   │     │   Stored    │                  │
│     │   Output    │ <=> │  Snapshot   │                  │
│     └─────────────┘     └─────────────┘                  │
│            │                    │                        │
│            └────────┬───────────┘                        │
│                     │                                    │
│                ┌────┴────┐                               │
│                │  Equal? │                               │
│                └────┬────┘                               │
│                     │                                    │
│           ┌─────────┴─────────┐                          │
│           │                   │                          │
│         [Yes]               [No]                         │
│           │                   │                          │
│        ✓ Pass          Check Update Mode                 │
│                               │                          │
│                      ┌────────┴────────┐                 │
│                      │                 │                 │
│                 [Update Mode]     [Normal Mode]          │
│                      │                 │                 │
│                Update & Pass       Show Diff & Fail      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Transport Support

MCP-Jest supports multiple transport protocols:

### stdio (Default)
- Spawns server as child process
- Communicates via stdin/stdout
- Best for local development

### HTTP Streaming (streamable-http)
- Connects to HTTP endpoints
- Supports streaming responses
- Good for remote servers

### SSE (Server-Sent Events)
- Real-time event streaming
- One-way server-to-client
- Useful for long-running operations

## Developer Experience Flow

```
┌─────────────────────────────────────────────────┐
│         Developer Experience Flow                │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. Write Test Config (JSON)                     │
│     Simple, declarative, no code needed          │
│                                                  │
│  2. Run Tests                                    │
│     $ mcp-jest test-config.json                  │
│                                                  │
│  3. See Results                                  │
│     ✓ Connection test passed (50ms)              │
│     ✓ Tool: calculate - passed (23ms)            │
│     ✗ Resource: data - failed (15ms)             │
│       Expected: "value"                          │
│       Received: "other"                          │
│                                                  │
│  4. Update Snapshots (if needed)                 │
│     $ mcp-jest test-config.json -u               │
│                                                  │
│  5. Integrate with CI/CD                         │
│     Exit codes, JSON output, timing info         │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Performance Characteristics

| Metric | Typical Value |
|--------|---------------|
| Average test suite | 100-500ms |
| Complex servers | 1-3 seconds |
| Memory footprint | Minimal |
| Server isolation | Each suite spawns own instance |

## Related Documentation

- [Getting Started](guides/getting-started.md) - Quick start guide
- [CLI Reference](cli-reference.md) - Complete CLI documentation
- [API Reference](api/README.md) - Library API documentation
- [Comparison](comparison.md) - MCP-Jest vs alternatives
