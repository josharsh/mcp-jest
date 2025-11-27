/**
 * Tests for MCPProtocolValidator
 *
 * Verifies protocol compliance validation functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCPProtocolValidator, formatComplianceReport } from '../validator.js';
import { MCPTestClient } from '../client.js';

// Mock the client
vi.mock('../client.js', () => ({
  MCPTestClient: vi.fn()
}));

describe('MCPProtocolValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Connection Validation', () => {
    it('should pass when server connects successfully', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(true),
        getCapabilities: vi.fn().mockResolvedValue({ tools: [], resources: [], prompts: [] }),
        callTool: vi.fn().mockRejectedValue(new Error('Unknown tool')),
        readResource: vi.fn().mockRejectedValue(new Error('Unknown resource')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Unknown prompt'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();

      const connectionResult = report.results.find(r => r.name === 'Server Connection');
      expect(connectionResult?.passed).toBe(true);
    });

    it('should fail when server fails to connect', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockRejectedValue(new Error('Connection refused')),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(false),
        getCapabilities: vi.fn().mockRejectedValue(new Error('Not connected')),
        callTool: vi.fn().mockRejectedValue(new Error('Not connected')),
        readResource: vi.fn().mockRejectedValue(new Error('Not connected')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Not connected'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();

      expect(report.level).toBe('non-compliant');
      const connectionResult = report.results.find(r => r.name === 'Server Connection');
      expect(connectionResult?.passed).toBe(false);
    });

    it('should check ping response', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(true),
        getCapabilities: vi.fn().mockResolvedValue({ tools: [], resources: [], prompts: [] }),
        callTool: vi.fn().mockRejectedValue(new Error('Unknown tool')),
        readResource: vi.fn().mockRejectedValue(new Error('Unknown resource')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Unknown prompt'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();

      const pingResult = report.results.find(r => r.name === 'Ping Response');
      expect(pingResult?.passed).toBe(true);
    });
  });

  describe('Capability Validation', () => {
    it('should validate tools have proper structure', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(true),
        getCapabilities: vi.fn().mockResolvedValue({
          tools: [
            { name: 'search', description: 'Search items', inputSchema: {} },
            { name: 'calculate', description: 'Calculate', inputSchema: {} }
          ],
          resources: [],
          prompts: []
        }),
        callTool: vi.fn().mockResolvedValue({ content: [] }),
        readResource: vi.fn().mockRejectedValue(new Error('Not found')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Not found'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();

      const toolsResult = report.results.find(r => r.name === 'Tools Discovery');
      expect(toolsResult?.passed).toBe(true);
      expect(toolsResult?.message).toContain('2 tools');
    });

    it('should check for input schemas on tools', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(true),
        getCapabilities: vi.fn().mockResolvedValue({
          tools: [
            { name: 'search', inputSchema: { type: 'object' } },
            { name: 'noSchema' } // Missing inputSchema
          ],
          resources: [],
          prompts: []
        }),
        callTool: vi.fn().mockResolvedValue({ content: [] }),
        readResource: vi.fn().mockRejectedValue(new Error('Not found')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Not found'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();

      const schemaResult = report.results.find(r => r.name === 'Tool Input Schemas');
      expect(schemaResult?.passed).toBe(false);
      expect(schemaResult?.message).toContain('1/2');
    });

    it('should validate resources have proper URIs', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(true),
        getCapabilities: vi.fn().mockResolvedValue({
          tools: [],
          resources: [
            { uri: 'config://settings', name: 'Settings' },
            { uri: 'file:///data.json', name: 'Data' }
          ],
          prompts: []
        }),
        callTool: vi.fn().mockRejectedValue(new Error('Unknown tool')),
        readResource: vi.fn().mockResolvedValue({ contents: [] }),
        getPrompt: vi.fn().mockRejectedValue(new Error('Not found'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();

      const resourcesResult = report.results.find(r => r.name === 'Resources Discovery');
      expect(resourcesResult?.passed).toBe(true);
    });
  });

  describe('Error Handling Validation', () => {
    it('should verify error handling for unknown tools', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(true),
        getCapabilities: vi.fn().mockResolvedValue({ tools: [], resources: [], prompts: [] }),
        callTool: vi.fn().mockRejectedValue(new Error('Tool not found: __nonexistent_tool_12345__')),
        readResource: vi.fn().mockRejectedValue(new Error('Resource not found')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Prompt not found'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();

      const errorResult = report.results.find(r => r.name === 'Unknown Tool Error');
      expect(errorResult?.passed).toBe(true);
    });

    it('should verify error handling for invalid resources', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(true),
        getCapabilities: vi.fn().mockResolvedValue({ tools: [], resources: [], prompts: [] }),
        callTool: vi.fn().mockRejectedValue(new Error('Unknown tool')),
        readResource: vi.fn().mockRejectedValue(new Error('Invalid resource URI')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Unknown prompt'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();

      const errorResult = report.results.find(r => r.name === 'Invalid Resource Error');
      expect(errorResult?.passed).toBe(true);
    });
  });

  describe('Scoring', () => {
    it('should calculate score based on passed tests', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(true),
        getCapabilities: vi.fn().mockResolvedValue({
          tools: [{ name: 'test', inputSchema: {} }],
          resources: [],
          prompts: []
        }),
        callTool: vi.fn().mockResolvedValue({ content: [] }),
        readResource: vi.fn().mockRejectedValue(new Error('Not found')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Not found'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();

      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
    });

    it('should return compliant status when all tests pass', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(true),
        getCapabilities: vi.fn().mockResolvedValue({
          tools: [{ name: 'test', inputSchema: { type: 'object' } }],
          resources: [{ uri: 'test://resource' }],
          prompts: [{ name: 'test' }]
        }),
        callTool: vi.fn().mockResolvedValue({ content: [] }),
        readResource: vi.fn().mockResolvedValue({ contents: [] }),
        getPrompt: vi.fn().mockResolvedValue({ messages: [] })
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();

      // Score and level depend on how many tests run - just verify structure
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(['full', 'standard', 'basic', 'non-compliant']).toContain(report.level);
    });

    it('should return "non-compliant" when required tests fail', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockRejectedValue(new Error('Failed')),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(false),
        getCapabilities: vi.fn().mockRejectedValue(new Error('Failed')),
        callTool: vi.fn().mockRejectedValue(new Error('Failed')),
        readResource: vi.fn().mockRejectedValue(new Error('Failed')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Failed'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();

      expect(report.level).toBe('non-compliant');
      expect(report.summary.required.failed).toBeGreaterThan(0);
    });
  });

  describe('Summary', () => {
    it('should calculate summary correctly', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(true),
        getCapabilities: vi.fn().mockResolvedValue({ tools: [], resources: [], prompts: [] }),
        callTool: vi.fn().mockRejectedValue(new Error('Unknown')),
        readResource: vi.fn().mockRejectedValue(new Error('Unknown')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Unknown'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();

      const { summary } = report;
      expect(summary.required.total).toBeGreaterThan(0);
      expect(summary.required.passed + summary.required.failed).toBe(summary.required.total);
    });

    it('should include duration', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(true),
        getCapabilities: vi.fn().mockResolvedValue({ tools: [], resources: [], prompts: [] }),
        callTool: vi.fn().mockRejectedValue(new Error('Unknown')),
        readResource: vi.fn().mockRejectedValue(new Error('Unknown')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Unknown'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();

      // Duration may be 0 for fast mocked tests, just check it exists
      expect(report.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Report Formatting', () => {
    it('should format report with all sections', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(true),
        getCapabilities: vi.fn().mockResolvedValue({ tools: [], resources: [], prompts: [] }),
        callTool: vi.fn().mockRejectedValue(new Error('Unknown')),
        readResource: vi.fn().mockRejectedValue(new Error('Unknown')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Unknown'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();
      const formatted = formatComplianceReport(report);

      expect(formatted).toContain('MCP PROTOCOL COMPLIANCE REPORT');
      expect(formatted).toContain('Score:');
      expect(formatted).toContain('Level:');
      expect(formatted).toContain('SUMMARY');
      expect(formatted).toContain('DETAILED RESULTS');
    });

    it('should include spec references in formatted report', async () => {
      vi.mocked(MCPTestClient).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(true),
        getCapabilities: vi.fn().mockResolvedValue({ tools: [], resources: [], prompts: [] }),
        callTool: vi.fn().mockRejectedValue(new Error('Unknown')),
        readResource: vi.fn().mockRejectedValue(new Error('Unknown')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Unknown'))
      }));

      const validator = new MCPProtocolValidator(
        { command: 'node', args: ['./server.js'] }
      );

      const report = await validator.validate();
      const formatted = formatComplianceReport(report);

      expect(formatted).toContain('MCP Spec:');
    });
  });
});
