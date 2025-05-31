// Debug the && operator specifically
import { mcpTest } from '../dist/index.js';

async function debugAndOperator() {
  console.log('🔍 Debugging && operator specifically...\n');
  
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
              console.log('Testing manually:');
              console.log('content:', !!result.content);
              console.log('content.length > 0:', result.content && result.content.length > 0);
              
              // Test if the && parsing issue is in my logic
              const expectation = "content && content.length > 0";
              console.log('Expectation string:', expectation);
              console.log('Contains &&?', expectation.includes('&&'));
              
              return true;
            }
          }
        }
      }
    );
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAndOperator();