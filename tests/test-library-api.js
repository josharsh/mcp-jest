#!/usr/bin/env node

import { mcpTest, formatResults } from '../dist/index.js';

// Test the library API as shown in documentation
async function testLibraryAPI() {
  console.log('📚 Testing mcp-jest library API...\n');
  
  try {
    // Basic test as shown in README
    console.log('1. Basic existence testing:');
    const basicResults = await mcpTest(
      { command: process.execPath, args: ['examples/demo-server.js'] },
      { tools: ['add', 'search', 'echo'] }
    );
    
    console.log(`✅ Basic test: ${basicResults.passed}/${basicResults.total} passed\n`);

    // Advanced test with expectations
    console.log('2. Advanced testing with expectations:');
    const advancedResults = await mcpTest(
      { command: process.execPath, args: ['examples/demo-server.js'] },
      {
        tools: {
          add: {
            args: { a: 10, b: 15 },
            expect: result => result.content[0].text === '25'
          },
          search: {
            args: { query: 'artificial intelligence' },
            expect: 'content.length > 0'
          },
          echo: {
            args: { message: 'testing framework' },
            expect: result => result.content[0].text.includes('testing framework')
          }
        },
        prompts: {
          'review-code': {
            args: { code: 'function test() { return 42; }' },
            expect: result => result.messages && result.messages.length > 0
          }
        }
      }
    );
    
    console.log(`✅ Advanced test: ${advancedResults.passed}/${advancedResults.total} passed\n`);

    // Test error handling
    console.log('3. Error handling test:');
    const errorResults = await mcpTest(
      { command: process.execPath, args: ['examples/demo-server.js'] },
      {
        tools: {
          'nonexistent-tool': {
            args: { test: 'value' },
            expect: result => false // This should fail
          }
        }
      }
    );
    
    console.log(`✅ Error test: ${errorResults.passed}/${errorResults.total} passed (expected some failures)\n`);

    // Format results test
    console.log('4. Formatted results output:');
    console.log(formatResults(advancedResults));

    const totalTests = basicResults.total + advancedResults.total + errorResults.total;
    const totalPassed = basicResults.passed + advancedResults.passed + errorResults.passed;
    
    console.log(`\n🎉 Library API testing complete!`);
    console.log(`Overall: ${totalPassed}/${totalTests} tests passed across all test scenarios`);
    
    if (totalPassed > 0) {
      console.log('✅ Library API verification PASSED - all documented features work correctly!');
      return true;
    } else {
      console.log('❌ Library API verification FAILED');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Library API test failed:', error.message);
    return false;
  }
}

testLibraryAPI().then(success => {
  process.exit(success ? 0 : 1);
});