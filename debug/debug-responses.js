// Debug script to see actual response structures
import { mcpTest } from '../dist/index.js';

async function debugResponses() {
  console.log('🔍 Debugging response structures...\n');
  
  try {
    const results = await mcpTest(
      { 
        command: '/Users/josharsh/.nvm/versions/node/v20.11.1/bin/node', 
        args: ['examples/demo-server.js'] 
      },
      { 
        tools: {
          search: {
            args: { query: 'test' },
            expect: result => {
              console.log('Search result structure:', JSON.stringify(result, null, 2));
              return true; // Always pass, we just want to see the structure
            }
          }
        },
        prompts: {
          'review-code': {
            args: { code: 'function test() { return 42; }' },
            expect: result => {
              console.log('Prompt result structure:', JSON.stringify(result, null, 2));
              return true; // Always pass, we just want to see the structure
            }
          }
        }
      }
    );
    
    console.log(`\n✅ Debug complete - ${results.passed}/${results.total} tests passed`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugResponses();