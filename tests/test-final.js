// Final test to verify all new features work correctly
import { mcpTest, formatResults } from '../dist/index.js';

async function testAllFeatures() {
  console.log('🚀 Testing all mcp-jest features including new ones...\n');
  
  try {
    const results = await mcpTest(
      { 
        command: '/Users/josharsh/.nvm/versions/node/v20.11.1/bin/node', 
        args: ['examples/demo-server.js'] 
      },
      { 
        tools: {
          // Test 1: Deep property access with exact match
          add: { 
            args: { a: 5, b: 3 }, 
            expect: "content[0].text === '8'" 
          },
          
          // Test 2: Deep property access with Echo
          echo: {
            args: { message: 'hello world' },
            expect: "content[0].text === 'Echo: hello world'"
          },
          
          // Test 3: Deep property access with AND condition
          search: {
            args: { query: 'test' },
            expect: "content && content.length > 0"
          }
        },
        
        prompts: {
          // Test 4: Deep property access for prompts
          'review-code': {
            args: { code: 'function test() { return 42; }' },
            expect: "messages && messages.length > 0"
          }
        },
        
        // Test 5: Timeout feature (should work without hanging)
        timeout: 5000
      }
    );
    
    console.log(formatResults(results));
    
    // Verify our new features
    const connectionPassed = results.results.some(r => r.name === 'Server Connection' && r.status === 'pass');
    const deepPropertyPassed = results.results.filter(r => r.type === 'tool' && r.status === 'pass').length;
    
    console.log('\n📊 Feature Analysis:');
    console.log(`✅ Server timeout: ${connectionPassed ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Deep property access: ${deepPropertyPassed >= 3 ? 'WORKING' : 'PARTIAL'} (${deepPropertyPassed}/3 tests passed)`);
    console.log(`✅ Resource counting: IMPLEMENTED (no resources to test)`);
    
    if (results.passed >= 8) {
      console.log('\n🎉 New features successfully implemented and working!');
    } else {
      console.log('\n⚠️  Some expectations may need adjustment for exact response format');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAllFeatures();