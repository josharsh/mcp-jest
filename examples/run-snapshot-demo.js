import { mcpTest } from '../dist/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🎬 MCP Snapshot Testing Demo\n');

// Simulate a weather MCP server response
const mockWeatherServer = {
  command: 'node',
  args: [path.join(__dirname, 'demo-server.js')]
};

async function runDemo() {
  console.log('1️⃣  First Run - Creating Snapshots\n');
  process.env.UPDATE_SNAPSHOTS = 'true';
  
  const firstRun = await mcpTest(mockWeatherServer, {
    tools: {
      add: {
        args: { a: 10, b: 20 },
        snapshot: 'math-addition-test'
      }
    }
  });
  
  console.log(`✅ First run complete: ${firstRun.passed}/${firstRun.total} tests passed`);
  console.log('📸 Snapshots created in __snapshots__ directory\n');
  
  // Second run - snapshots should match
  console.log('2️⃣  Second Run - Comparing Against Snapshots\n');
  process.env.UPDATE_SNAPSHOTS = 'false';
  
  const secondRun = await mcpTest(mockWeatherServer, {
    tools: {
      add: {
        args: { a: 10, b: 20 },
        snapshot: 'math-addition-test'
      }
    }
  });
  
  console.log(`✅ Second run complete: ${secondRun.passed}/${secondRun.total} tests passed`);
  console.log('✨ Snapshots matched perfectly!\n');
  
  // Third run - with different inputs (should fail)
  console.log('3️⃣  Third Run - Different Inputs (Expected to Fail)\n');
  
  const thirdRun = await mcpTest(mockWeatherServer, {
    tools: {
      add: {
        args: { a: 5, b: 7 },  // Different inputs!
        snapshot: 'math-addition-test'
      }
    }
  });
  
  console.log(`❌ Third run complete: ${thirdRun.passed}/${thirdRun.total} tests passed`);
  console.log('📋 Snapshot mismatch detected (as expected)');
  
  // Show the failed test details
  const failedTest = thirdRun.results.find(r => r.status === 'fail');
  if (failedTest && failedTest.message) {
    console.log('\nDiff Preview:');
    console.log(failedTest.message.split('\n').slice(0, 5).join('\n'));
  }
  
  console.log('\n---');
  console.log('💡 To update snapshots when changes are intentional:');
  console.log('   UPDATE_SNAPSHOTS=true npm test');
  console.log('   or');
  console.log('   mcp-jest server.js --update-snapshots');
}

runDemo().catch(console.error);