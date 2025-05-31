#!/usr/bin/env node

import { mcpTest, formatResults } from '../dist/index.js';

// Simple verification test
async function verifyPackage() {
  console.log('🧪 Verifying mcp-jest package functionality...\n');
  
  try {
    // Test with the example configuration
    const results = await mcpTest(
      { 
        command: process.execPath, // Use the current Node.js executable path
        args: ['examples/demo-server.js'],
        env: { NODE_ENV: 'test' }
      },
      {
        tools: {
          add: {
            args: { a: 5, b: 3 },
            expect: (result) => {
              console.log('Add tool result:', JSON.stringify(result, null, 2));
              return result.content && result.content[0] && result.content[0].text === '8';
            }
          },
          echo: {
            args: { message: 'hello test' },
            expect: (result) => {
              console.log('Echo tool result:', JSON.stringify(result, null, 2));
              return result.content && result.content[0] && result.content[0].text === 'Echo: hello test';
            }
          }
        },
        timeout: 15000
      }
    );
    
    console.log(formatResults(results));
    
    if (results.total > 0 && results.passed > 0) {
      console.log('\n✅ Package verification PASSED - mcp-jest is working correctly!');
      process.exit(0);
    } else {
      console.log('\n❌ Package verification FAILED - no tests passed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

verifyPackage();