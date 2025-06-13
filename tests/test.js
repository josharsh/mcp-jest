// Simple test to verify the package works
import { mcpTest, formatResults } from '../dist/index.js';

async function runTests() {
  console.log('🧪 Testing mcp-jest package...\n');
  
  try {
    // Test with the demo server
    const results = await mcpTest(
      { command: process.execPath, args: ['examples/demo-server.js'] },
      { 
        tools: {
          add: { args: { a: 5, b: 3 } },
          echo: { args: { message: 'Hello World' } },
          search: { args: { query: 'test search' } }
        },
        prompts: {
          'review-code': { args: { code: 'function test() { return 42; }' } }
        },
        timeout: 10000
      }
    );
    
    console.log(formatResults(results));
    
    if (results.failed > 0) {
      console.error('❌ Some tests failed');
      process.exit(1);
    } else {
      console.log('✅ All tests passed!');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

runTests();