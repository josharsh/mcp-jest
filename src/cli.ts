#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { mcpTest, formatResults } from './index.js';
import type { MCPTestConfig, MCPServerConfig } from './types.js';

interface CLIOptions {
  config?: string;
  server?: string;
  args?: string[];
  tools?: string[];
  resources?: string[];
  prompts?: string[];
  timeout?: number;
  help?: boolean;
  version?: boolean;
  updateSnapshots?: boolean;
  filter?: string;
  skip?: string;
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {};
  const positionalArgs: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '-v':
      case '--version':
        options.version = true;
        break;
      case '-c':
      case '--config':
        options.config = args[++i];
        break;
      case '-s':
      case '--server':
        options.server = args[++i];
        break;
      case '--args':
        options.args = args[++i]?.split(',') || [];
        break;
      case '-t':
      case '--tools':
        options.tools = args[++i]?.split(',') || [];
        break;
      case '-r':
      case '--resources':
        options.resources = args[++i]?.split(',') || [];
        break;
      case '-p':
      case '--prompts':
        options.prompts = args[++i]?.split(',') || [];
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]) || 30000;
        break;
      case '-u':
      case '--update-snapshots':
        options.updateSnapshots = true;
        break;
      case '-f':
      case '--filter':
        options.filter = args[++i];
        break;
      case '--skip':
        options.skip = args[++i];
        break;
      default:
        if (!arg.startsWith('-')) {
          positionalArgs.push(arg);
        }
        break;
    }
  }
  
  // Handle positional arguments: first is command, rest are args
  if (!options.server && positionalArgs.length > 0) {
    options.server = positionalArgs[0];
    if (positionalArgs.length > 1) {
      options.args = positionalArgs.slice(1);
    }
  }
  
  return options;
}

function showHelp(): void {
  console.log(`
mcp-jest - Testing framework for Model Context Protocol (MCP) servers

USAGE:
  mcp-jest [OPTIONS] [SERVER_COMMAND]

OPTIONS:
  -h, --help              Show this help message
  -v, --version           Show version
  -c, --config <file>     Load configuration from JSON file
  -s, --server <cmd>      Server command to test
  --args <args>           Comma-separated server arguments
  -t, --tools <tools>     Comma-separated list of tools to test
  -r, --resources <res>   Comma-separated list of resources to test
  -p, --prompts <prompts> Comma-separated list of prompts to test
  --timeout <ms>          Test timeout in milliseconds (default: 30000)
  -u, --update-snapshots  Update snapshots instead of comparing
  -f, --filter <pattern>  Run only tests matching pattern
  --skip <pattern>        Skip tests matching pattern

EXAMPLES:
  # Test a Node.js MCP server
  mcp-jest node ./my-server.js --tools search,email

  # Test a Python MCP server with resources
  mcp-jest python server.py --tools search --resources "docs/*,config.json"

  # Use a configuration file
  mcp-jest --config ./mcp-jest.json

  # Test specific capabilities
  mcp-jest ./server --tools "search,email" --resources "docs/*"

  # Filter tests by pattern
  mcp-jest ./server --tools "search,email,weather" --filter search

  # Skip specific tests
  mcp-jest ./server --tools "search,email,weather" --skip email

CONFIGURATION FILE:
  Create a mcp-jest.json file:
  {
    "server": {
      "command": "node",
      "args": ["./server.js"],
      "env": { "NODE_ENV": "test" }
    },
    "tests": {
      "tools": {
        "search": { "args": { "query": "test" }, "expect": "results.length > 0" },
        "email": { "args": { "to": "test@test.com" }, "shouldThrow": false }
      },
      "resources": {
        "config.json": { "expect": "exists" },
        "docs/*": { "expect": "count > 5" }
      },
      "timeout": 30000
    }
  }
`);
}

function showVersion(): void {
  try {
    const packagePath = resolve(import.meta.url.replace('file://', ''), '../../package.json');
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
    console.log(`mcp-jest v${pkg.version}`);
  } catch {
    console.log('mcp-jest v0.1.0');
  }
}

async function loadConfig(configPath: string): Promise<{ server: MCPServerConfig; tests: MCPTestConfig }> {
  const fullPath = resolve(configPath);
  
  if (!existsSync(fullPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }
  
  try {
    const content = readFileSync(fullPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse configuration file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  if (options.help) {
    showHelp();
    return;
  }
  
  if (options.version) {
    showVersion();
    return;
  }
  
  let serverConfig: MCPServerConfig;
  let testConfig: MCPTestConfig;
  
  if (options.config) {
    // Load from configuration file
    try {
      const config = await loadConfig(options.config);
      serverConfig = config.server;
      testConfig = config.tests;
    } catch (error) {
      console.error(`❌ Configuration error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  } else {
    // Build from CLI options
    if (!options.server) {
      console.error('❌ Error: Server command is required. Use --help for usage information.');
      process.exit(1);
    }
    
    serverConfig = {
      command: options.server,
      args: options.args
    };
    
    testConfig = {
      tools: options.tools,
      resources: options.resources,
      prompts: options.prompts,
      timeout: options.timeout,
      filter: options.filter,
      skip: options.skip
    };
  }
  
  try {
    // Set environment variable for snapshot updates
    if (options.updateSnapshots) {
      process.env.UPDATE_SNAPSHOTS = 'true';
      console.log('📸 Snapshot update mode enabled');
    }
    
    console.log(`🚀 Testing MCP server: ${serverConfig.command} ${(serverConfig.args || []).join(' ')}`);
    console.log('');
    
    const results = await mcpTest(serverConfig, testConfig);
    
    console.log(formatResults(results));
    
    // Exit with error code if tests failed
    if (results.failed > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Test execution failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`❌ Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(`❌ Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Always run main when this file is executed
main().catch((error) => {
  console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});