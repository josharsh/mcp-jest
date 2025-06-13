import { mcpTest, formatResults } from 'mcp-jest';

// Basic test example
async function basicTest() {
  console.log('🧪 Running basic MCP server test...\n');
  
  try {
    const results = await mcpTest(
      // Server configuration
      { 
        command: 'node', 
        args: ['./my-server.js'] 
      },
      // Test configuration
      { 
        tools: ['search', 'email'],
        resources: ['docs/*', 'config.json'] 
      }
    );
    
    console.log(formatResults(results));
    
    if (results.failed > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Advanced test example with expectations
async function advancedTest() {
  console.log('🔬 Running advanced MCP server test...\n');
  
  try {
    const results = await mcpTest(
      { command: 'python', args: ['server.py'] },
      {
        tools: {
          search: { 
            args: { query: 'test' }, 
            expect: (result) => result.content && result.content.length > 0 
          },
          email: { 
            args: { to: 'test@test.com', subject: 'Test' },
            expect: 'success === true'
          },
          calculate: {
            args: { a: 5, b: 3 },
            expect: (result) => result.content[0].text === '8'
          }
        },
        resources: {
          'config.json': { expect: 'exists' },
          'docs/*': { expect: 'count > 0' }
        },
        prompts: {
          'analyze-code': {
            args: { code: 'function test() { return 42; }' },
            expect: (result) => result.messages && result.messages.length > 0
          }
        },
        timeout: 10000
      }
    );
    
    console.log(formatResults(results));
    
    if (results.failed > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the examples
if (process.argv[2] === 'advanced') {
  advancedTest();
} else {
  basicTest();
}