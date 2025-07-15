#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = resolve(__dirname, '../dist/cli.js');
const SERVER_PATH = resolve(__dirname, './filter-test-server.js');

// Color codes for output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function runTest(args, description) {
  console.log(`\n${BLUE}Test: ${description}${RESET}`);
  console.log(`Command: mcp-jest ${args.join(' ')}`);
  
  try {
    const output = execSync(`node "${CLI_PATH}" ${args.join(' ')}`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log(output);
    
    // Parse results from output
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const skippedMatch = output.match(/(\d+) skipped/);
    
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
    
    return { passed, failed, skipped, output };
  } catch (error) {
    console.error(`${RED}Error running test: ${error.message}${RESET}`);
    return { passed: 0, failed: 0, skipped: 0, output: error.message, error: true };
  }
}

function assert(condition, message) {
  if (condition) {
    console.log(`${GREEN}✓ ${message}${RESET}`);
  } else {
    console.log(`${RED}✗ ${message}${RESET}`);
    process.exit(1);
  }
}

async function main() {
  console.log(`${YELLOW}=== Testing MCP-Jest Filtering Functionality ===${RESET}`);
  
  // Create a simple test that won't fail on tool execution
  const simpleArgs = [
    'node', SERVER_PATH,
    '--tools', 'getUser,search,sendEmail,getWeather'
  ];
  
  // Test 1: Run all tests without filtering
  console.log(`\n${YELLOW}=== Test 1: No filtering (baseline) ===${RESET}`);
  const baseline = runTest(simpleArgs, 'Run all tests without filtering');
  
  assert(!baseline.error, 'Baseline test should succeed');
  assert(baseline.passed > 0, 'Should have passed tests');
  assert(baseline.skipped === 0, 'Should have no skipped tests');
  
  const totalTests = baseline.passed + baseline.failed;
  console.log(`Total tests: ${totalTests}`);
  
  // Test 2: Filter for 'user' tests
  console.log(`\n${YELLOW}=== Test 2: Filter for 'user' tests ===${RESET}`);
  const userFilter = runTest([
    ...simpleArgs,
    '--filter', 'user'
  ], 'Filter for user-related tests');
  
  assert(!userFilter.error, 'User filter test should succeed');
  assert(userFilter.passed === 3, 'Should have 3 passed tests (connection, capability, tool exists)');
  assert(userFilter.skipped === 3, 'Should skip 3 tests (search, sendEmail, getWeather)');
  
  // Test 3: Filter with wildcard
  console.log(`\n${YELLOW}=== Test 3: Filter with wildcard pattern ===${RESET}`);
  const wildcardFilter = runTest([
    'node', SERVER_PATH,
    '--tools', allTools.join(','),
    '--filter', 'get*'
  ], 'Filter for tests starting with "get"');
  
  assert(!wildcardFilter.error, 'Wildcard filter test should succeed');
  assert(wildcardFilter.output.includes('getUser'), 'Should include getUser');
  assert(wildcardFilter.output.includes('getUserProfile'), 'Should include getUserProfile');
  assert(wildcardFilter.output.includes('getWeather'), 'Should include getWeather');
  assert(wildcardFilter.output.includes('getEmails'), 'Should include getEmails');
  assert(wildcardFilter.output.includes('getForecast'), 'Should include getForecast');
  assert(!wildcardFilter.output.includes('updateUser execution'), 'Should not execute updateUser');
  
  // Test 4: Skip email tests
  console.log(`\n${YELLOW}=== Test 4: Skip email tests ===${RESET}`);
  const skipEmail = runTest([
    'node', SERVER_PATH,
    '--tools', allTools.join(','),
    '--skip', 'email'
  ], 'Skip email-related tests');
  
  assert(!skipEmail.error, 'Skip email test should succeed');
  assert(skipEmail.output.includes('sendEmail\' execution.*skip', 's'), 'Should skip sendEmail');
  assert(skipEmail.output.includes('getEmails\' execution.*skip', 's'), 'Should skip getEmails');
  assert(skipEmail.skipped === 4, 'Should skip 4 tests (2 tools + 2 capability checks)');
  
  // Test 5: Case-insensitive matching
  console.log(`\n${YELLOW}=== Test 5: Case-insensitive matching ===${RESET}`);
  const caseInsensitive = runTest([
    'node', SERVER_PATH,
    '--tools', allTools.join(','),
    '--filter', 'SEARCH'
  ], 'Filter with uppercase pattern');
  
  assert(!caseInsensitive.error, 'Case-insensitive test should succeed');
  assert(caseInsensitive.output.includes('search'), 'Should match lowercase search');
  assert(caseInsensitive.output.includes('searchAdvanced'), 'Should match searchAdvanced');
  
  // Test 6: Combine filter and skip
  console.log(`\n${YELLOW}=== Test 6: Combine filter and skip ===${RESET}`);
  const combined = runTest([
    'node', SERVER_PATH,
    '--tools', allTools.join(','),
    '--filter', 'get*',
    '--skip', 'weather'
  ], 'Filter for get* but skip weather');
  
  assert(!combined.error, 'Combined filter/skip test should succeed');
  assert(combined.output.includes('getUser'), 'Should include getUser');
  assert(combined.output.includes('getUserProfile'), 'Should include getUserProfile');
  assert(combined.output.includes('getEmails'), 'Should include getEmails');
  assert(combined.output.includes('getWeather\' execution.*skip', 's'), 'Should skip getWeather');
  assert(combined.output.includes('getForecast\' execution.*skip', 's'), 'Should skip getForecast');
  
  // Test 7: Filter with no matches
  console.log(`\n${YELLOW}=== Test 7: Filter with no matches ===${RESET}`);
  const noMatches = runTest([
    'node', SERVER_PATH,
    '--tools', allTools.join(','),
    '--filter', 'nonexistent'
  ], 'Filter with pattern that matches nothing');
  
  assert(!noMatches.error, 'No matches test should succeed');
  assert(noMatches.passed === 3, 'Should only pass connection and capability tests');
  assert(noMatches.skipped === totalTests - 3, 'All tool tests should be skipped');
  
  // Test 8: Test with resources
  console.log(`\n${YELLOW}=== Test 8: Filter with resources ===${RESET}`);
  const resourceFilter = runTest([
    'node', SERVER_PATH,
    '--resources', 'user://123,search://index,email://templates/welcome',
    '--filter', 'user'
  ], 'Filter resources for user pattern');
  
  assert(!resourceFilter.error, 'Resource filter test should succeed');
  assert(resourceFilter.output.includes('user://123'), 'Should test user resource');
  assert(resourceFilter.output.includes('search://index.*skip', 's'), 'Should skip search resource');
  
  // Test 9: Test with prompts
  console.log(`\n${YELLOW}=== Test 9: Filter with prompts ===${RESET}`);
  const promptFilter = runTest([
    'node', SERVER_PATH,
    '--prompts', 'userPrompt,searchPrompt,emailPrompt',
    '--filter', 'search'
  ], 'Filter prompts for search pattern');
  
  assert(!promptFilter.error, 'Prompt filter test should succeed');
  assert(promptFilter.output.includes('searchPrompt'), 'Should test searchPrompt');
  assert(promptFilter.output.includes('userPrompt.*skip', 's'), 'Should skip userPrompt');
  assert(promptFilter.output.includes('emailPrompt.*skip', 's'), 'Should skip emailPrompt');
  
  // Test 10: Complex pattern
  console.log(`\n${YELLOW}=== Test 10: Complex wildcard pattern ===${RESET}`);
  const complexPattern = runTest([
    'node', SERVER_PATH,
    '--tools', allTools.join(','),
    '--filter', '*user*'
  ], 'Filter with *user* pattern');
  
  assert(!complexPattern.error, 'Complex pattern test should succeed');
  assert(complexPattern.output.includes('getUser'), 'Should include getUser');
  assert(complexPattern.output.includes('getUserProfile'), 'Should include getUserProfile');
  assert(complexPattern.output.includes('updateUser'), 'Should include updateUser');
  assert(!complexPattern.output.includes('search\' execution.*pass', 's'), 'Should not pass search execution');
  
  console.log(`\n${GREEN}=== All filter tests passed! ===${RESET}`);
}

main().catch(error => {
  console.error(`${RED}Test suite failed: ${error.message}${RESET}`);
  process.exit(1);
});