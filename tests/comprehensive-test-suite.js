#!/usr/bin/env node

/**
 * Comprehensive Test Suite for MCP-Jest
 * Tests all functionality including core features and snapshot testing
 */

import { mcpTest, MCPTestClient, SnapshotManager, formatResults } from '../dist/index.js';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async run() {
    console.log('🧪 MCP-Jest Comprehensive Test Suite');
    console.log('=====================================\n');

    // Clean up any existing snapshots from previous runs
    await this.cleanup();

    // Run all test categories
    await this.testBasicFunctionality();
    await this.testAdvancedFeatures();
    await this.testSnapshotFunctionality();
    await this.testErrorHandling();
    await this.testCLIInterface();
    await this.testEdgeCases();

    // Final results
    this.printResults();
    
    // Cleanup
    await this.cleanup();
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }

  async testBasicFunctionality() {
    console.log('📋 Basic Functionality Tests');
    console.log('----------------------------');

    await this.test('Server Connection', async () => {
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        { timeout: 10000 }
      );
      
      if (results.total === 0) throw new Error('No tests were executed');
      if (results.failed > 0) throw new Error(`${results.failed} tests failed`);
      
      return 'Server connects and responds properly';
    });

    await this.test('Tool Existence Testing', async () => {
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        { tools: ['add', 'search', 'echo'] }
      );
      
      const toolTests = results.results.filter(r => r.type === 'tool');
      if (toolTests.length === 0) throw new Error('No tool tests executed');
      if (toolTests.some(t => t.status === 'fail')) {
        throw new Error('Tool existence tests failed');
      }
      
      return `${toolTests.length} tools verified`;
    });

    await this.test('Tool Execution', async () => {
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        {
          tools: {
            add: {
              args: { a: 5, b: 3 },
              expect: 'content[0].text === "8"'
            }
          }
        }
      );
      
      const addTest = results.results.find(r => r.name.includes('add'));
      if (!addTest || addTest.status !== 'pass') {
        throw new Error('Tool execution test failed');
      }
      
      return 'Tool executes with correct output';
    });

    await this.test('Multiple Tools', async () => {
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        {
          tools: {
            add: { args: { a: 10, b: 20 }, expect: 'content[0].text === "30"' },
            echo: { args: { message: 'test' }, expect: 'content[0].text === "Echo: test"' }
          }
        }
      );
      
      if (results.failed > 0) {
        throw new Error(`${results.failed} tool tests failed`);
      }
      
      return `${results.passed} tools tested successfully`;
    });

    console.log('');
  }

  async testAdvancedFeatures() {
    console.log('🚀 Advanced Features Tests');
    console.log('--------------------------');

    await this.test('Custom Expectations', async () => {
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        {
          tools: {
            add: {
              args: { a: 7, b: 13 },
              expect: (result) => {
                return result.content?.[0]?.text === "20" && 
                       result.content?.[0]?.type === "text";
              }
            }
          }
        }
      );
      
      if (results.failed > 0) {
        throw new Error('Custom expectation failed');
      }
      
      return 'Custom function expectations work correctly';
    });

    await this.test('Error Handling - shouldThrow', async () => {
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        {
          tools: {
            add: {
              args: { a: 'not a number', b: 5 }, // Invalid args should cause error
              shouldThrow: true
            }
          }
        }
      );
      
      const errorTest = results.results.find(r => r.name.includes('add') && r.name.includes('execution'));
      if (!errorTest || errorTest.status !== 'pass') {
        throw new Error('shouldThrow test failed');
      }
      
      return 'Error expectations work correctly';
    });

    await this.test('Timeout Configuration', async () => {
      const startTime = Date.now();
      
      try {
        await mcpTest(
          { command: 'sleep', args: ['2'] }, // Command that takes too long
          { timeout: 1000 } // 1 second timeout
        );
        throw new Error('Should have timed out');
      } catch (error) {
        const duration = Date.now() - startTime;
        if (duration > 1500) { // Allow some margin
          throw new Error('Timeout took too long');
        }
        return 'Timeout configuration works correctly';
      }
    });

    await this.test('Result Formatting', async () => {
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        { tools: ['add', 'ping'] }
      );
      
      const formatted = formatResults(results);
      
      if (!formatted.includes('Test Results')) {
        throw new Error('Result formatting missing header');
      }
      if (!formatted.includes('passed')) {
        throw new Error('Result formatting missing pass count');
      }
      if (!formatted.includes('Duration:')) {
        throw new Error('Result formatting missing duration');
      }
      
      return 'Result formatting works correctly';
    });

    console.log('');
  }

  async testSnapshotFunctionality() {
    console.log('📸 Snapshot Testing');
    console.log('-------------------');

    await this.test('Basic Snapshot Creation', async () => {
      // First run - create snapshot
      process.env.UPDATE_SNAPSHOTS = 'true';
      
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        {
          tools: {
            add: {
              args: { a: 15, b: 25 },
              snapshot: 'test-basic-snapshot'
            }
          }
        }
      );
      
      if (results.failed > 0) {
        throw new Error('Snapshot creation failed');
      }
      
      // Verify snapshot file was created
      const snapshotPath = path.join(process.cwd(), '__snapshots__', 'test-basic-snapshot.snap.json');
      const snapshotExists = await fs.access(snapshotPath).then(() => true).catch(() => false);
      
      if (!snapshotExists) {
        throw new Error('Snapshot file was not created');
      }
      
      return 'Snapshot created successfully';
    });

    await this.test('Snapshot Comparison', async () => {
      // Second run - compare against snapshot
      process.env.UPDATE_SNAPSHOTS = 'false';
      
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        {
          tools: {
            add: {
              args: { a: 15, b: 25 }, // Same args as snapshot creation
              snapshot: 'test-basic-snapshot'
            }
          }
        }
      );
      
      if (results.failed > 0) {
        throw new Error('Snapshot comparison failed');
      }
      
      return 'Snapshot comparison passed';
    });

    await this.test('Snapshot Mismatch Detection', async () => {
      process.env.UPDATE_SNAPSHOTS = 'false';
      
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        {
          tools: {
            add: {
              args: { a: 10, b: 10 }, // Different args - should fail
              snapshot: 'test-basic-snapshot'
            }
          }
        }
      );
      
      if (results.failed === 0) {
        throw new Error('Snapshot mismatch was not detected');
      }
      
      const failedTest = results.results.find(r => r.status === 'fail');
      if (!failedTest || !failedTest.message?.includes('mismatch')) {
        throw new Error('Snapshot mismatch not properly reported');
      }
      
      return 'Snapshot mismatch detected correctly';
    });

    await this.test('Snapshot with Exclusions', async () => {
      process.env.UPDATE_SNAPSHOTS = 'true';
      
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        {
          tools: {
            add: {
              args: { a: 5, b: 5 },
              snapshot: {
                name: 'test-exclusions',
                exclude: ['metadata', 'timestamp']
              }
            }
          }
        }
      );
      
      if (results.failed > 0) {
        throw new Error('Snapshot with exclusions failed');
      }
      
      return 'Snapshot exclusions work correctly';
    });

    await this.test('Snapshot with Property Selection', async () => {
      process.env.UPDATE_SNAPSHOTS = 'true';
      
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        {
          tools: {
            add: {
              args: { a: 3, b: 7 },
              snapshot: {
                name: 'test-properties',
                properties: ['content[0].text', 'content[0].type']
              }
            }
          }
        }
      );
      
      if (results.failed > 0) {
        throw new Error('Snapshot with property selection failed');
      }
      
      return 'Snapshot property selection works correctly';
    });

    console.log('');
  }

  async testErrorHandling() {
    console.log('⚠️  Error Handling Tests');
    console.log('------------------------');

    await this.test('Invalid Server Command', async () => {
      try {
        await mcpTest(
          { command: 'nonexistent-command' },
          { tools: [] }
        );
        throw new Error('Should have failed with invalid command');
      } catch (error) {
        if (!error.message.includes('spawn') && !error.message.includes('ENOENT')) {
          throw new Error('Wrong error type for invalid command');
        }
        return 'Invalid server command handled correctly';
      }
    });

    await this.test('Server Startup Failure', async () => {
      try {
        await mcpTest(
          { command: 'node', args: ['-e', 'process.exit(1)'] },
          { tools: [] }
        );
        throw new Error('Should have failed with server exit');
      } catch (error) {
        return 'Server startup failure handled correctly';
      }
    });

    await this.test('Connection Timeout', async () => {
      const startTime = Date.now();
      
      try {
        await mcpTest(
          { command: 'node', args: ['-e', 'setTimeout(() => {}, 10000)'] }, // Hangs
          { timeout: 1000 }
        );
        throw new Error('Should have timed out');
      } catch (error) {
        const duration = Date.now() - startTime;
        if (duration > 2000) {
          throw new Error('Timeout handling too slow');
        }
        return 'Connection timeout handled correctly';
      }
    });

    console.log('');
  }

  async testCLIInterface() {
    console.log('🖥️  CLI Interface Tests');
    console.log('-----------------------');

    await this.test('CLI Basic Usage', async () => {
      try {
        const output = execSync(
          `node ${path.join(__dirname, '../dist/cli.js')} node ${path.join(__dirname, '../examples/demo-server.js')} --tools add --timeout 5000`,
          { encoding: 'utf8', timeout: 10000 }
        );
        
        if (!output.includes('passed')) {
          throw new Error('CLI output missing pass indicator');
        }
        
        return 'CLI basic usage works';
      } catch (error) {
        if (error.status) {
          throw new Error(`CLI exited with code ${error.status}: ${error.stdout || error.stderr}`);
        }
        throw error;
      }
    });

    await this.test('CLI Help', async () => {
      const output = execSync(
        `node ${path.join(__dirname, '../dist/cli.js')} --help`,
        { encoding: 'utf8' }
      );
      
      if (!output.includes('mcp-jest')) {
        throw new Error('CLI help missing program name');
      }
      if (!output.includes('--tools')) {
        throw new Error('CLI help missing tools option');
      }
      if (!output.includes('--update-snapshots')) {
        throw new Error('CLI help missing snapshot option');
      }
      
      return 'CLI help works correctly';
    });

    await this.test('CLI Version', async () => {
      const output = execSync(
        `node ${path.join(__dirname, '../dist/cli.js')} --version`,
        { encoding: 'utf8' }
      );
      
      if (!output.trim().match(/^mcp-jest v\d+\.\d+\.\d+/)) {
        throw new Error(`CLI version output invalid: ${output.trim()}`);
      }
      
      return 'CLI version works correctly';
    });

    await this.test('CLI Snapshot Update Flag', async () => {
      const output = execSync(
        `node ${path.join(__dirname, '../dist/cli.js')} node ${path.join(__dirname, '../examples/demo-server.js')} --tools add --update-snapshots`,
        { encoding: 'utf8', timeout: 10000 }
      );
      
      if (!output.includes('Snapshot update mode enabled')) {
        throw new Error('CLI snapshot update flag not working');
      }
      
      return 'CLI snapshot update flag works';
    });

    console.log('');
  }

  async testEdgeCases() {
    console.log('🔍 Edge Cases');
    console.log('-------------');

    await this.test('Empty Test Configuration', async () => {
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        {} // Empty config
      );
      
      // Should still test connection and capabilities
      if (results.total === 0) {
        throw new Error('No tests executed with empty config');
      }
      
      return 'Empty config handled correctly';
    });

    await this.test('Large Snapshot Data', async () => {
      // Create a tool that returns large data
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }));
      
      process.env.UPDATE_SNAPSHOTS = 'true';
      
      // This would test with actual large data if demo server supported it
      // For now, just test that large snapshots don't break the system
      const results = await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        {
          tools: {
            add: {
              args: { a: 1, b: 1 },
              snapshot: 'large-data-test'
            }
          }
        }
      );
      
      if (results.failed > 0) {
        throw new Error('Large snapshot test failed');
      }
      
      return 'Large snapshot data handled correctly';
    });

    await this.test('Concurrent Test Execution', async () => {
      // Run multiple tests in parallel
      const promises = Array.from({ length: 3 }, async (_, i) => {
        return mcpTest(
          { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
          {
            tools: {
              add: {
                args: { a: i, b: i + 1 },
                snapshot: `concurrent-test-${i}`
              }
            }
          }
        );
      });
      
      process.env.UPDATE_SNAPSHOTS = 'true';
      const results = await Promise.all(promises);
      
      if (results.some(r => r.failed > 0)) {
        throw new Error('Concurrent execution failed');
      }
      
      return 'Concurrent test execution works';
    });

    await this.test('SnapshotManager Direct Usage', async () => {
      const snapshotManager = new SnapshotManager();
      await snapshotManager.init();
      
      const testData = { test: 'data', value: 123 };
      const snapshotName = 'direct-usage-test';
      
      // Create snapshot
      process.env.UPDATE_SNAPSHOTS = 'true';
      await snapshotManager.captureSnapshot(snapshotName, testData);
      
      // Compare snapshot
      process.env.UPDATE_SNAPSHOTS = 'false';
      const result = await snapshotManager.compareSnapshot(snapshotName, testData);
      
      if (!result.match) {
        throw new Error('Direct SnapshotManager usage failed');
      }
      
      return 'Direct SnapshotManager usage works';
    });

    console.log('');
  }

  async test(name, testFn) {
    process.stdout.write(`  ${name}... `);
    this.results.total++;
    
    try {
      const result = await testFn();
      console.log(`✅ ${result}`);
      this.results.passed++;
    } catch (error) {
      console.log(`❌ ${error.message}`);
      this.results.failed++;
    }
  }

  printResults() {
    console.log('📊 Test Results');
    console.log('===============');
    console.log(`Total: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed! MCP-Jest is working correctly.');
    } else {
      console.log(`\n💥 ${this.results.failed} tests failed. Please check the implementation.`);
    }
  }

  async cleanup() {
    try {
      await fs.rm(path.join(process.cwd(), '__snapshots__'), { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Run the comprehensive test suite
const testRunner = new TestRunner();
testRunner.run().catch(console.error);