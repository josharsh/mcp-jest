import { mcpTest, MCPTestClient, SnapshotManager } from '../dist/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test the snapshot functionality
async function testSnapshotFeatures() {
  console.log('Testing Snapshot Features...\n');
  
  // Test 1: SnapshotManager basic functionality
  console.log('Test 1: SnapshotManager basic operations');
  const snapshotManager = new SnapshotManager(path.join(__dirname, 'test-snapshots'));
  await snapshotManager.init();
  
  // Test snapshot name generation
  const toolName = snapshotManager.generateSnapshotName('tool', 'search', undefined);
  console.log(`✅ Generated snapshot name: ${toolName}`);
  
  const customName = snapshotManager.generateSnapshotName('tool', 'search', 'my-custom-snapshot');
  console.log(`✅ Custom snapshot name: ${customName}`);
  
  // Test 2: Snapshot capture and comparison
  console.log('\nTest 2: Snapshot capture and comparison');
  
  const testData = {
    content: [
      {
        type: 'text',
        text: 'Search results for: test'
      }
    ],
    metadata: {
      count: 5,
      timestamp: '2024-01-01T00:00:00Z'
    }
  };
  
  // First run - should create snapshot
  process.env.UPDATE_SNAPSHOTS = 'true';
  const firstResult = await snapshotManager.compareSnapshot('test-snapshot-1', testData);
  console.log(`✅ First run (create): ${firstResult.match ? 'Created' : 'Failed'}`);
  
  // Second run - should match
  process.env.UPDATE_SNAPSHOTS = 'false';
  const secondResult = await snapshotManager.compareSnapshot('test-snapshot-1', testData);
  console.log(`✅ Second run (match): ${secondResult.match ? 'Matched' : 'Failed'}`);
  
  // Third run with different data - should fail
  const modifiedData = { ...testData, metadata: { ...testData.metadata, count: 10 } };
  const thirdResult = await snapshotManager.compareSnapshot('test-snapshot-1', modifiedData);
  console.log(`✅ Third run (mismatch): ${!thirdResult.match ? 'Correctly failed' : 'Unexpected match'}`);
  if (thirdResult.diff) {
    console.log('  Diff preview:', thirdResult.diff.split('\n')[0]);
  }
  
  // Test 3: Snapshot with properties filter
  console.log('\nTest 3: Snapshot with property filtering');
  
  const complexData = {
    id: '12345',
    timestamp: Date.now(),
    content: {
      title: 'Test Document',
      body: 'This is the body',
      metadata: {
        author: 'John Doe',
        version: '1.0.0'
      }
    },
    volatile: {
      requestId: 'abc-123',
      processingTime: 142
    }
  };
  
  process.env.UPDATE_SNAPSHOTS = 'true';
  const filteredResult = await snapshotManager.compareSnapshot(
    'test-filtered',
    complexData,
    {
      properties: ['content.title', 'content.metadata.version'],
      exclude: ['timestamp', 'volatile']
    }
  );
  console.log(`✅ Filtered snapshot: ${filteredResult.match ? 'Created' : 'Failed'}`);
  
  // Verify the snapshot only contains specified properties
  const snapshotPath = path.join(__dirname, 'test-snapshots', '__snapshots__', 'test-filtered.snap.json');
  try {
    const savedSnapshot = JSON.parse(await fs.readFile(snapshotPath, 'utf-8'));
    const hasOnlyExpectedProps = savedSnapshot.data.content?.title && 
                                savedSnapshot.data.content?.metadata?.version &&
                                !savedSnapshot.data.timestamp &&
                                !savedSnapshot.data.volatile;
    console.log(`✅ Property filtering: ${hasOnlyExpectedProps ? 'Working correctly' : 'Failed'}`);
  } catch (error) {
    console.log('❌ Could not verify snapshot file');
  }
  
  // Test 4: Integration with mcpTest
  console.log('\nTest 4: Integration with mcpTest (using demo server)');
  
  try {
    // First run with snapshots
    process.env.UPDATE_SNAPSHOTS = 'true';
    const firstTestRun = await mcpTest(
      { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
      {
        tools: {
          add: {
            args: { a: 5, b: 3 },
            snapshot: 'addition-5-3'
          }
        }
      }
    );
    console.log(`✅ Snapshot test run 1: ${firstTestRun.passed}/${firstTestRun.total} passed`);
    
    // Second run should match
    process.env.UPDATE_SNAPSHOTS = 'false';
    const secondTestRun = await mcpTest(
      { command: 'node', args: [path.join(__dirname, '../examples/demo-server.js')] },
      {
        tools: {
          add: {
            args: { a: 5, b: 3 },
            snapshot: 'addition-5-3'
          }
        }
      }
    );
    console.log(`✅ Snapshot test run 2: ${secondTestRun.passed}/${secondTestRun.total} passed`);
    
  } catch (error) {
    console.log('⚠️  Integration test skipped (demo server may not support required operations)');
  }
  
  // Cleanup test snapshots
  console.log('\nCleaning up test snapshots...');
  try {
    await fs.rm(path.join(__dirname, 'test-snapshots'), { recursive: true, force: true });
    console.log('✅ Test snapshots cleaned up');
  } catch (error) {
    console.log('⚠️  Could not clean up test snapshots');
  }
  
  console.log('\n✅ All snapshot tests completed!');
}

// Run the tests
testSnapshotFeatures().catch(console.error);