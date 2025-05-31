import { MCPTestRunner } from './runner.js';
import type { MCPTestConfig, MCPServerConfig, TestSuite } from './types.js';

export * from './types.js';
export { MCPTestClient } from './client.js';
export { MCPTestRunner } from './runner.js';

/**
 * Test an MCP server with the given configuration
 * 
 * @param server - Server configuration (command, args, etc.)
 * @param config - Test configuration (tools, resources, prompts to test)
 * @returns Promise resolving to test results
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const results = await mcpTest(
 *   { command: 'node', args: ['./my-server.js'] },
 *   { tools: ['search', 'email'], resources: ['docs/*'] }
 * );
 * 
 * // Advanced usage with expectations
 * const results = await mcpTest(
 *   { command: 'python', args: ['server.py'] },
 *   {
 *     tools: {
 *       search: { args: { query: 'test' }, expect: 'results.length > 0' },
 *       email: { args: { to: 'test@test.com' }, expect: result => result.success }
 *     },
 *     resources: {
 *       'config.json': { expect: 'exists' },
 *       'docs/*': { expect: 'count > 5' }
 *     }
 *   }
 * );
 * ```
 */
export async function mcpTest(
  server: MCPServerConfig | string,
  config: MCPTestConfig = {}
): Promise<TestSuite> {
  const serverConfig: MCPServerConfig = typeof server === 'string' 
    ? { command: server }
    : server;

  const runner = new MCPTestRunner(serverConfig, config);
  return await runner.run();
}

/**
 * Format test results for console output
 */
export function formatResults(suite: TestSuite): string {
  const lines: string[] = [];
  
  // Header
  lines.push('');
  lines.push('MCP Test Results');
  lines.push('================');
  lines.push('');
  
  // Summary
  const passRate = suite.total > 0 ? Math.round((suite.passed / suite.total) * 100) : 0;
  lines.push(`Tests: ${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped, ${suite.total} total`);
  lines.push(`Pass rate: ${passRate}%`);
  lines.push(`Duration: ${suite.duration}ms`);
  lines.push('');
  
  // Group results by type
  const byType = suite.results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, typeof suite.results>);
  
  // Output results by type
  for (const [type, results] of Object.entries(byType)) {
    lines.push(`${type.toUpperCase()} TESTS`);
    lines.push('-'.repeat(type.length + 6));
    
    for (const result of results) {
      const status = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      lines.push(`${status} ${result.name}${duration}`);
      
      if (result.message) {
        lines.push(`   ${result.message}`);
      }
      
      if (result.error) {
        lines.push(`   Error: ${result.error.message}`);
      }
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Simple assertion helpers for custom expectations
 */
export const expect = {
  exists: (value: unknown) => value !== null && value !== undefined,
  notEmpty: (value: unknown) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return Boolean(value);
  },
  length: (value: unknown, expected: number) => {
    if (Array.isArray(value)) return value.length === expected;
    if (typeof value === 'string') return value.length === expected;
    return false;
  },
  contains: (value: unknown, substring: string) => {
    if (typeof value === 'string') return value.includes(substring);
    if (Array.isArray(value)) return value.includes(substring);
    return false;
  },
  matches: (value: unknown, pattern: RegExp | string) => {
    if (typeof value !== 'string') return false;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return regex.test(value);
  }
};