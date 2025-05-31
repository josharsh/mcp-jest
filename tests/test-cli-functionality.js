#!/usr/bin/env node

import { spawn } from 'child_process';
import { resolve } from 'path';

// Test CLI functionality
async function testCLI() {
  console.log('🖥️  Testing mcp-jest CLI functionality...\n');
  
  const cliPath = resolve('dist/cli.js');
  const nodePath = process.execPath;
  
  return new Promise((resolve, reject) => {
    const child = spawn(nodePath, [
      cliPath, 
      nodePath, 
      'examples/demo-server.js', 
      '--tools', 'add,echo',
      '--timeout', '15000'
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      console.log('CLI Output:');
      console.log(stdout);
      if (stderr) {
        console.log('CLI Stderr:');
        console.log(stderr);
      }
      
      if (code === 0) {
        console.log('✅ CLI test PASSED - exit code 0');
        resolve(true);
      } else {
        console.log(`❌ CLI test FAILED - exit code ${code}`);
        resolve(false);
      }
    });
    
    child.on('error', (error) => {
      console.error('❌ CLI test ERROR:', error.message);
      reject(error);
    });
    
    // Add timeout
    setTimeout(() => {
      child.kill();
      console.log('❌ CLI test TIMEOUT');
      resolve(false);
    }, 20000);
  });
}

testCLI().then(success => {
  console.log(`\n🎯 CLI functionality test: ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('CLI test error:', error);
  process.exit(1);
});