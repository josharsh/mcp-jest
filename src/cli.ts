#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { mcpTest, formatResults } from './index.js';
import { MCPDiscovery, formatAsTestFile, formatAsJson } from './discovery.js';
import { MCPProtocolValidator, formatComplianceReport } from './validator.js';
import { WatchMode } from './watch.js';
import { HTMLReporter } from './reporter.js';
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
  transport?: 'stdio' | 'sse' | 'streamable-http';
  url?: string;
  // New options
  discover?: boolean;
  discoveryOutput?: string;
  discoveryDepth?: 'basic' | 'standard' | 'comprehensive';
  validate?: boolean;
  watch?: boolean;
  reporter?: 'console' | 'html' | 'json';
  reportOutput?: string;
  verbose?: boolean;
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
      case '--transport':
        const transport = args[++i];
        if (transport === 'stdio' || transport === 'sse' || transport === 'streamable-http') {
          options.transport = transport;
        } else {
          console.error(`Invalid transport type: ${transport}. Must be one of: stdio, sse, streamable-http`);
          process.exit(1);
        }
        break;
      case '--url':
        options.url = args[++i];
        break;
      // New commands
      case 'discover':
      case '--discover':
        options.discover = true;
        break;
      case '--discovery-output':
      case '-o':
        options.discoveryOutput = args[++i];
        break;
      case '--discovery-depth':
      case '--depth':
        const depth = args[++i] as 'basic' | 'standard' | 'comprehensive';
        if (['basic', 'standard', 'comprehensive'].includes(depth)) {
          options.discoveryDepth = depth;
        }
        break;
      case 'validate':
      case '--validate':
        options.validate = true;
        break;
      case 'watch':
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      case '--reporter':
        const reporter = args[++i] as 'console' | 'html' | 'json';
        if (['console', 'html', 'json'].includes(reporter)) {
          options.reporter = reporter;
        }
        break;
      case '--report-output':
        options.reportOutput = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
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
    // Check if first positional is a subcommand
    if (positionalArgs[0] === 'discover') {
      options.discover = true;
      positionalArgs.shift();
    } else if (positionalArgs[0] === 'validate') {
      options.validate = true;
      positionalArgs.shift();
    } else if (positionalArgs[0] === 'watch') {
      options.watch = true;
      positionalArgs.shift();
    }

    if (positionalArgs.length > 0) {
      options.server = positionalArgs[0];
      if (positionalArgs.length > 1) {
        options.args = positionalArgs.slice(1);
      }
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
mcp-jest - Testing framework for Model Context Protocol (MCP) servers

USAGE:
  mcp-jest [COMMAND] [OPTIONS] [SERVER_COMMAND]

COMMANDS:
  test (default)    Run tests against an MCP server
  discover          Auto-discover capabilities and generate test configuration
  validate          Validate MCP protocol compliance
  watch             Run tests in watch mode (re-run on file changes)

OPTIONS:
  -h, --help              Show this help message
  -v, --version           Show version
  -c, --config <file>     Load configuration from JSON file
  -s, --server <cmd>      Server command to test (for stdio transport)
  --args <args>           Comma-separated server arguments
  -t, --tools <tools>     Comma-separated list of tools to test
  -r, --resources <res>   Comma-separated list of resources to test
  -p, --prompts <prompts> Comma-separated list of prompts to test
  --timeout <ms>          Test timeout in milliseconds (default: 30000)
  -u, --update-snapshots  Update snapshots instead of comparing
  -f, --filter <pattern>  Run only tests matching the pattern
  --skip <pattern>        Skip tests matching the pattern
  --transport <type>      Transport type: stdio, sse, streamable-http (default: stdio)
  --url <url>             Server URL (required for sse and streamable-http)

DISCOVERY OPTIONS:
  --discover              Run auto-discovery mode
  -o, --discovery-output  Output file for generated tests (default: mcp-jest.generated.json)
  --depth <level>         Discovery depth: basic, standard, comprehensive (default: standard)

VALIDATION OPTIONS:
  --validate              Run protocol compliance validation

WATCH OPTIONS:
  -w, --watch             Run in watch mode
  --verbose               Show verbose output

REPORTER OPTIONS:
  --reporter <type>       Reporter: console, html, json (default: console)
  --report-output <file>  Output file for HTML/JSON reports

EXAMPLES:
  # Basic testing
  mcp-jest node ./server.js --tools search,email

  # Auto-discover and generate tests
  mcp-jest discover node ./server.js
  mcp-jest discover node ./server.js --depth comprehensive -o tests/mcp.test.js

  # Validate protocol compliance
  mcp-jest validate node ./server.js

  # Watch mode for development
  mcp-jest watch node ./server.js --tools search

  # Generate HTML report
  mcp-jest node ./server.js --tools search --reporter html --report-output report.html

  # Test HTTP server
  mcp-jest --transport streamable-http --url http://localhost:3000 --tools search

  # Use configuration file
  mcp-jest --config ./mcp-jest.json

CONFIGURATION FILE:
  {
    "server": {
      "command": "node",
      "args": ["./server.js"],
      "env": { "NODE_ENV": "test" }
    },
    "tests": {
      "tools": {
        "search": { "args": { "query": "test" }, "expect": "results.length > 0" }
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
    console.log('mcp-jest v1.1.0');
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

async function runDiscovery(serverConfig: MCPServerConfig, options: CLIOptions): Promise<void> {
  console.log('🔍 Discovering MCP server capabilities...');
  console.log('');

  const discovery = new MCPDiscovery(serverConfig, {
    depth: options.discoveryDepth || 'standard',
    includeEdgeCases: options.discoveryDepth !== 'basic',
    includeNegativeTests: options.discoveryDepth === 'comprehensive',
    timeout: options.timeout || 30000
  });

  const result = await discovery.discover();

  console.log(`✅ Discovery complete!`);
  console.log(`   Tools: ${result.metadata.toolCount}`);
  console.log(`   Resources: ${result.metadata.resourceCount}`);
  console.log(`   Prompts: ${result.metadata.promptCount}`);
  console.log(`   Generated Tests: ${result.metadata.generatedTestCount}`);
  console.log('');

  // Determine output format
  const outputPath = options.discoveryOutput || 'mcp-jest.generated.json';
  const isJsOutput = outputPath.endsWith('.js') || outputPath.endsWith('.ts');

  const content = isJsOutput
    ? formatAsTestFile(result)
    : formatAsJson(result);

  // Write output
  const { promises: fs } = await import('fs');
  await fs.writeFile(resolve(outputPath), content, 'utf-8');

  console.log(`📝 Test configuration written to: ${outputPath}`);
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Review and customize the generated tests`);
  console.log(`  2. Run: mcp-jest --config ${outputPath}`);
}

async function runValidation(serverConfig: MCPServerConfig, options: CLIOptions): Promise<void> {
  console.log('🔬 Validating MCP protocol compliance...');
  console.log('');

  const validator = new MCPProtocolValidator(serverConfig, {
    timeout: options.timeout || 30000
  });

  const report = await validator.validate();

  console.log(formatComplianceReport(report));

  // Exit with error if non-compliant
  if (report.level === 'non-compliant') {
    process.exit(1);
  }
}

async function runWatchMode(serverConfig: MCPServerConfig, testConfig: MCPTestConfig): Promise<void> {
  const watchMode = new WatchMode(serverConfig, testConfig, {
    runOnStart: true,
    clearOnRerun: true,
    verbose: false
  });

  await watchMode.start();
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
    const transport = options.transport || 'stdio';

    // Validate transport-specific requirements
    if (transport === 'stdio' && !options.server) {
      console.error('❌ Error: Server command is required for stdio transport. Use --help for usage information.');
      process.exit(1);
    }

    if ((transport === 'sse' || transport === 'streamable-http') && !options.url) {
      console.error(`❌ Error: URL is required for ${transport} transport. Use --url to specify the server URL.`);
      process.exit(1);
    }

    serverConfig = {
      command: options.server || '',
      args: options.args,
      transport: transport,
      url: options.url
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
    // Handle different modes
    if (options.discover) {
      await runDiscovery(serverConfig, options);
      return;
    }

    if (options.validate) {
      await runValidation(serverConfig, options);
      return;
    }

    if (options.watch) {
      await runWatchMode(serverConfig, testConfig);
      return;
    }

    // Default: Run tests
    if (options.updateSnapshots) {
      process.env.UPDATE_SNAPSHOTS = 'true';
      console.log('📸 Snapshot update mode enabled');
    }

    const transport = serverConfig.transport || 'stdio';
    if (transport === 'stdio') {
      console.log(`🚀 Testing MCP server: ${serverConfig.command} ${(serverConfig.args || []).join(' ')}`);
    } else {
      console.log(`🚀 Testing MCP server: ${serverConfig.url} (${transport})`);
    }
    console.log('');

    const results = await mcpTest(serverConfig, testConfig);

    // Handle different reporters
    if (options.reporter === 'html') {
      const reporter = new HTMLReporter({
        outputPath: options.reportOutput || './mcp-jest-report.html',
        open: true
      });
      const reportPath = await reporter.generate(results, {
        command: serverConfig.command,
        args: serverConfig.args
      });
      console.log(`\n📊 HTML report generated: ${reportPath}`);
    } else if (options.reporter === 'json') {
      const output = options.reportOutput
        ? resolve(options.reportOutput)
        : null;

      const jsonOutput = JSON.stringify(results, null, 2);

      if (output) {
        const { promises: fs } = await import('fs');
        await fs.writeFile(output, jsonOutput, 'utf-8');
        console.log(`📊 JSON report written to: ${output}`);
      } else {
        console.log(jsonOutput);
      }
    } else {
      console.log(formatResults(results));
    }

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
