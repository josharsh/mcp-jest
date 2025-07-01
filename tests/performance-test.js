#!/usr/bin/env node

/**
 * Performance Tests for MCP-Jest
 * Ensures the testing framework is fast and efficient
 */

import { mcpTest } from '../dist/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class PerformanceTest {
  constructor() {
    this.results = [];
  }

  async run() {
    console.log('⚡ MCP-Jest Performance Tests');
    console.log('============================\n');

    await this.testBasicPerformance();
    await this.testMultipleToolsPerformance();
    await this.testSnapshotPerformance();
    await this.testConcurrentTestsPerformance();

    this.printResults();
  }

  async testBasicPerformance() {
    console.log('📊 Basic Performance Test');
    console.log('-------------------------');

    const iterations = 5;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        { tools: ['add'] }
      );
      
      const duration = Date.now() - startTime;
      times.push(duration);
      console.log(`  Run ${i + 1}: ${duration}ms`);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`  Average: ${avgTime.toFixed(1)}ms`);
    console.log(`  Min: ${minTime}ms, Max: ${maxTime}ms`);

    this.results.push({
      test: 'Basic Performance',
      avgTime,
      minTime,
      maxTime,
      acceptable: avgTime < 2000 // Should be under 2 seconds
    });

    console.log('');
  }

  async testMultipleToolsPerformance() {
    console.log('🔧 Multiple Tools Performance');
    console.log('-----------------------------');

    const toolCounts = [1, 2, 5];
    
    for (const count of toolCounts) {
      const startTime = Date.now();
      
      const tools = {};
      for (let i = 0; i < count; i++) {
        tools[`add_${i}`] = {
          args: { a: i, b: i + 1 }
        };
        // Use same tool with different names for testing
        if (i > 0) {
          tools[`add_${i}`] = tools.add || { args: { a: 1, b: 1 } };
        } else {
          tools.add = { args: { a: 1, b: 1 } };
        }
      }

      // Actually just test the real tools multiple times
      const realTools = count === 1 ? 
        { add: { args: { a: 1, b: 1 } } } :
        count === 2 ?
        { add: { args: { a: 1, b: 1 } }, ping: {} } :
        { add: { args: { a: 1, b: 1 } }, ping: {}, add2: { args: { a: 2, b: 2 } } };

      // For count > 2, we'll just test add and ping multiple times
      if (count > 2) {
        for (let i = 0; i < count - 2; i++) {
          await mcpTest(
            { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
            { tools: { add: { args: { a: i, b: i + 1 } } } }
          );
        }
      }

      await mcpTest(
        { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
        { tools: count <= 2 ? realTools : { add: { args: { a: 1, b: 1 } }, ping: {} } }
      );
      
      const duration = Date.now() - startTime;
      console.log(`  ${count} tools: ${duration}ms`);

      this.results.push({
        test: `${count} Tools`,
        duration,
        acceptable: duration < 5000 // Should scale reasonably
      });
    }

    console.log('');
  }

  async testSnapshotPerformance() {
    console.log('📸 Snapshot Performance');
    console.log('-----------------------');

    // Test snapshot creation
    process.env.UPDATE_SNAPSHOTS = 'true';
    const createStart = Date.now();
    
    await mcpTest(
      { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
      {
        tools: {
          add: {
            args: { a: 10, b: 20 },
            snapshot: 'perf-test-snapshot'
          }
        }
      }
    );
    
    const createTime = Date.now() - createStart;
    console.log(`  Snapshot creation: ${createTime}ms`);

    // Test snapshot comparison
    process.env.UPDATE_SNAPSHOTS = 'false';
    const compareStart = Date.now();
    
    await mcpTest(
      { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
      {
        tools: {
          add: {
            args: { a: 10, b: 20 },
            snapshot: 'perf-test-snapshot'
          }
        }
      }
    );
    
    const compareTime = Date.now() - compareStart;
    console.log(`  Snapshot comparison: ${compareTime}ms`);

    this.results.push({
      test: 'Snapshot Creation',
      duration: createTime,
      acceptable: createTime < 3000
    });

    this.results.push({
      test: 'Snapshot Comparison', 
      duration: compareTime,
      acceptable: compareTime < 2000
    });

    console.log('');
  }

  async testConcurrentTestsPerformance() {
    console.log('🚀 Concurrent Tests Performance');
    console.log('-------------------------------');

    const concurrencyLevels = [1, 2, 3];

    for (const level of concurrencyLevels) {
      const startTime = Date.now();
      
      const promises = Array.from({ length: level }, async (_, i) => {
        return mcpTest(
          { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
          {
            tools: {
              add: {
                args: { a: i, b: i + 1 }
              }
            }
          }
        );
      });

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      console.log(`  ${level} concurrent tests: ${duration}ms`);

      // Verify all tests passed
      const allPassed = results.every(r => r.failed === 0);
      if (!allPassed) {
        console.log(`    ⚠️  Some concurrent tests failed`);
      }

      this.results.push({
        test: `${level} Concurrent`,
        duration,
        acceptable: duration < 6000 && allPassed
      });
    }

    console.log('');
  }

  printResults() {
    console.log('📊 Performance Summary');
    console.log('======================');

    let allAcceptable = true;
    
    for (const result of this.results) {
      const status = result.acceptable ? '✅' : '❌';
      const time = result.duration || result.avgTime;
      console.log(`${status} ${result.test}: ${time.toFixed(1)}ms`);
      
      if (!result.acceptable) {
        allAcceptable = false;
      }
    }

    console.log('');
    
    if (allAcceptable) {
      console.log('🎉 All performance tests passed!');
      console.log('MCP-Jest meets performance requirements.');
    } else {
      console.log('⚠️  Some performance tests failed.');
      console.log('Consider optimizing the implementation.');
    }

    // Performance benchmarks for reference
    console.log('\n📏 Performance Benchmarks:');
    console.log('- Basic test: < 2 seconds');
    console.log('- Multiple tools: scales reasonably');  
    console.log('- Snapshots: creation < 3s, comparison < 2s');
    console.log('- Concurrency: handles multiple tests efficiently');
  }
}

// Run performance tests
const perfTest = new PerformanceTest();
perfTest.run().catch(console.error);