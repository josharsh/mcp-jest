// Debug the failing expectations specifically
import { mcpTest } from '../dist/index.js';

async function debugFailing() {
  console.log('🔍 Debugging failing expectations...\n');
  
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
              console.log('Search result:', JSON.stringify(result, null, 2));
              console.log('content exists?', !!result.content);
              console.log('content length:', result.content?.length);
              console.log('content && content.length > 0:', !!(result.content && result.content.length > 0));
              return true;
            }
          }
        },
        prompts: {
          'review-code': {
            args: { code: 'function test() { return 42; }' },
            expect: result => {
              console.log('\nPrompt result:', JSON.stringify(result, null, 2));
              console.log('messages exists?', !!result.messages);
              console.log('messages length:', result.messages?.length);
              console.log('messages && messages.length > 0:', !!(result.messages && result.messages.length > 0));
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

debugFailing();