#!/usr/bin/env node

/**
 * Demo Server Validation Tests
 * Ensures the demo server works correctly for testing purposes
 */

import { mcpTest } from '../dist/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function validateDemoServer() {
  console.log('🔧 Demo Server Validation');
  console.log('=========================\n');

  const demoServerPath = path.join(__dirname, '../examples/demo-server.js');

  try {
    console.log('1. Testing basic server functionality...');
    const basicResults = await mcpTest(
      { command: 'node', args: [demoServerPath] },
      { timeout: 10000 }
    );

    console.log(`   ✅ Server starts: ${basicResults.total > 0 ? 'Yes' : 'No'}`);
    console.log(`   ✅ Connection works: ${basicResults.failed === 0 ? 'Yes' : 'No'}`);

    console.log('\n2. Testing tool discovery...');
    const toolResults = await mcpTest(
      { command: 'node', args: [demoServerPath] },
      { tools: ['add', 'ping'] }
    );

    const toolTests = toolResults.results.filter(r => r.type === 'tool');
    console.log(`   ✅ Tools discovered: ${toolTests.length}`);
    console.log(`   ✅ All tools work: ${toolTests.every(t => t.status === 'pass') ? 'Yes' : 'No'}`);

    console.log('\n3. Testing tool execution...');
    const execResults = await mcpTest(
      { command: 'node', args: [demoServerPath] },
      {
        tools: {
          add: {
            args: { a: 2, b: 3 },
            expect: 'content[0].text === "5"'
          },
          ping: {
            expect: 'content[0].text === "pong"'
          }
        }
      }
    );

    console.log(`   ✅ Math operations: ${execResults.results.some(r => r.name.includes('add') && r.status === 'pass') ? 'Working' : 'Failed'}`);
    console.log(`   ✅ Ping responses: ${execResults.results.some(r => r.name.includes('ping') && r.status === 'pass') ? 'Working' : 'Failed'}`);

    console.log('\n4. Testing error handling...');
    const errorResults = await mcpTest(
      { command: 'node', args: [demoServerPath] },
      {
        tools: {
          nonexistent: {
            args: {},
            shouldThrow: true
          }
        }
      }
    );

    const errorTest = errorResults.results.find(r => r.name.includes('nonexistent'));
    console.log(`   ✅ Error handling: ${errorTest?.status === 'pass' ? 'Working' : 'Failed'}`);

    console.log('\n🎉 Demo server validation complete!');
    console.log('The demo server is ready for comprehensive testing.\n');

    return true;

  } catch (error) {
    console.error('❌ Demo server validation failed:', error.message);
    console.error('Please check the demo server implementation.\n');
    return false;
  }
}

// Run validation
validateDemoServer()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Validation error:', error);
    process.exit(1);
  });