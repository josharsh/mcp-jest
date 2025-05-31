// Debug the evaluation logic specifically
import { mcpTest } from '../dist/index.js';

// Test the evaluation with a simple function first
async function debugEvaluator() {
  console.log('🔍 Testing expectation evaluation...\n');
  
  try {
    const results = await mcpTest(
      { 
        command: '/Users/josharsh/.nvm/versions/node/v20.11.1/bin/node', 
        args: ['examples/demo-server.js'] 
      },
      { 
        tools: {
          // Test with simple property access first
          search1: {
            args: { query: 'test' },
            expect: "content.length > 0"  // Simple property access
          },
          // Test with function-based expectation
          search2: {
            args: { query: 'test' },
            expect: result => result.content && result.content.length > 0
          }
        },
        prompts: {
          // Test with simple property access
          'review-code': {
            args: { code: 'function test() { return 42; }' },
            expect: "messages.length > 0"
          }
        }
      }
    );
    
    console.log(`Results: ${results.passed}/${results.total} passed`);
    results.results.forEach(r => {
      if (r.type === 'tool' || r.type === 'prompt') {
        console.log(`${r.status === 'pass' ? '✅' : '❌'} ${r.name}: ${r.message}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugEvaluator();