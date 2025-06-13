import { mcpTest } from '../dist/index.js';

// Example demonstrating snapshot testing for MCP servers

async function runSnapshotTests() {
  console.log('Running MCP Snapshot Tests...\n');

  try {
    const results = await mcpTest(
      {
        command: 'node',
        args: ['./demo-server.js']
      },
      {
        tools: {
          // Basic snapshot test - captures entire response
          search: {
            args: { query: 'javascript' },
            snapshot: true
          },
          
          // Named snapshot for better organization
          calculateTax: {
            args: { amount: 100, rate: 0.08 },
            snapshot: 'tax-calculation-basic'
          },
          
          // Snapshot with specific properties only
          getUserInfo: {
            args: { userId: '123' },
            snapshot: {
              name: 'user-info-structure',
              properties: ['content[0].type', 'content[0].text', 'metadata.version'],
              exclude: ['timestamp', 'requestId']
            }
          },
          
          // Complex snapshot configuration
          generateReport: {
            args: { type: 'monthly', month: 'January' },
            snapshot: {
              name: 'monthly-report-january',
              exclude: ['generatedAt', 'processingTime', 'tempData'],
              properties: ['content', 'summary', 'statistics']
            }
          }
        },
        
        resources: {
          // Snapshot resource content
          'config.json': {
            snapshot: true
          },
          
          // Snapshot with exclusions for dynamic data
          'status.json': {
            snapshot: {
              exclude: ['uptime', 'lastChecked', 'memoryUsage']
            }
          }
        },
        
        prompts: {
          // Snapshot prompt responses
          codeReview: {
            args: { 
              code: 'function add(a, b) { return a + b; }',
              language: 'javascript'
            },
            snapshot: 'code-review-simple-function'
          }
        }
      }
    );

    console.log('Test Results:', results);
    
    // Show snapshot-specific guidance
    if (results.failed > 0) {
      console.log('\n📸 Snapshot Tests Failed!');
      console.log('If the changes are expected, run with --update-snapshots flag:');
      console.log('  npm test -- --update-snapshots');
      console.log('  or');
      console.log('  UPDATE_SNAPSHOTS=true npm test');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runSnapshotTests();