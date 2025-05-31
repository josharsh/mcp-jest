// Debug the evaluation logic with correct tool names
import { mcpTest } from '../dist/index.js';

async function debugEvaluator() {
  console.log('🔍 Testing expectation evaluation with correct tool names...\n');
  
  try {
    const results = await mcpTest(
      { 
        command: '/Users/josharsh/.nvm/versions/node/v20.11.1/bin/node', 
        args: ['examples/demo-server.js'] 
      },
      { 
        tools: {
          // Test simple property access vs && operator
          search: {
            args: { query: 'test' },
            expect: "content.length > 0"  // Simple property access
          }
        },
        prompts: {
          'review-code': {
            args: { code: 'function test() { return 42; }' },
            expect: "messages.length > 0"  // Simple property access
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