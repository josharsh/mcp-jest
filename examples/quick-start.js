// Quick start example for mcp-jest
import { mcpTest, formatResults } from '../dist/index.js';

async function runTests() {
  console.log('Running MCP tests on demo server...\n');
  
  // Test configuration
  const testConfig = {
    tools: {
      add: {
        args: { a: 10, b: 20 },
        expect: (result) => result.content[0].text === '30'
      },
      search: {
        args: { query: 'mcp-jest' },
        expect: 'exists'
      }
    },
    prompts: ['review-code']
  };
  
  // Run tests
  const results = await mcpTest(
    { 
      command: 'node', 
      args: ['examples/demo-server.js'] 
    },
    testConfig
  );
  
  // Display results
  console.log(formatResults(results));
}

runTests().catch(console.error);