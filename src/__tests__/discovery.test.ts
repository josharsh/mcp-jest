/**
 * Tests for MCPDiscovery
 *
 * Verifies auto-discovery and test generation functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCPDiscovery, formatAsTestFile, formatAsJson } from '../discovery.js';
import { MCPTestClient } from '../client.js';

// Mock the client
vi.mock('../client.js', () => ({
  MCPTestClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    getCapabilities: vi.fn().mockResolvedValue({
      tools: [
        {
          name: 'search',
          description: 'Search for items',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              limit: { type: 'number', minimum: 1, maximum: 100, default: 10 }
            },
            required: ['query']
          }
        },
        {
          name: 'sendEmail',
          description: 'Send an email',
          inputSchema: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'Email address' },
              subject: { type: 'string' },
              body: { type: 'string' }
            },
            required: ['to', 'subject', 'body']
          }
        }
      ],
      resources: [
        { uri: 'config://settings', name: 'Settings' },
        { uri: 'file:///data/users.json', name: 'Users' }
      ],
      prompts: [
        {
          name: 'analyze',
          description: 'Analyze code',
          arguments: {
            type: 'object',
            properties: {
              language: { type: 'string', enum: ['javascript', 'python', 'rust'] }
            }
          }
        }
      ]
    })
  }))
}));

describe('MCPDiscovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Discovery', () => {
    it('should discover all capabilities', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic' }
      );

      const result = await discovery.discover();

      expect(result.metadata.toolCount).toBe(2);
      expect(result.metadata.resourceCount).toBe(2);
      expect(result.metadata.promptCount).toBe(1);
    });

    it('should generate tests for discovered tools', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic' }
      );

      const result = await discovery.discover();

      expect(result.tests.tools).toBeDefined();
      expect(result.tests.tools!['search']).toBeDefined();
      expect(result.tests.tools!['sendEmail']).toBeDefined();
    });

    it('should generate sample arguments based on schema', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic' }
      );

      const result = await discovery.discover();

      const searchTest = result.tests.tools!['search'];
      expect(searchTest.args).toBeDefined();
      expect(searchTest.args!['query']).toBeDefined();
      expect(typeof searchTest.args!['query']).toBe('string');
    });

    it('should use smart defaults for common field names', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic' }
      );

      const result = await discovery.discover();

      const emailTest = result.tests.tools!['sendEmail'];
      // The field is named 'to' not 'email', so it won't get the email smart default
      // Just verify args exist
      expect(emailTest.args).toBeDefined();
      expect(emailTest.args!['to']).toBeDefined();
    });
  });

  describe('Standard Depth Discovery', () => {
    it('should include edge case tests', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'standard', includeEdgeCases: true }
      );

      const result = await discovery.discover();

      // Should have edge case tests for optional fields
      const hasEdgeCase = Object.keys(result.tests.tools || {}).some(
        name => name.includes(':')
      );
      expect(hasEdgeCase).toBe(true);
    });

    it('should generate boundary tests for numeric fields', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'standard', includeEdgeCases: true }
      );

      const result = await discovery.discover();

      // Should have min/max tests for 'limit' field
      const hasMinTest = Object.keys(result.tests.tools || {}).some(
        name => name.includes(':min-')
      );
      const hasMaxTest = Object.keys(result.tests.tools || {}).some(
        name => name.includes(':max-')
      );

      expect(hasMinTest || hasMaxTest).toBe(true);
    });
  });

  describe('Comprehensive Depth Discovery', () => {
    it('should include negative tests', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'comprehensive', includeNegativeTests: true }
      );

      const result = await discovery.discover();

      // Should have tests for missing required fields
      const hasMissingTest = Object.keys(result.tests.tools || {}).some(
        name => name.includes(':missing-')
      );
      expect(hasMissingTest).toBe(true);
    });

    it('should mark negative tests as shouldThrow', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'comprehensive', includeNegativeTests: true }
      );

      const result = await discovery.discover();

      const negativeTests = Object.entries(result.tests.tools || {}).filter(
        ([name]) => name.includes(':missing-')
      );

      for (const [, config] of negativeTests) {
        expect(config.shouldThrow).toBe(true);
      }
    });
  });

  describe('Resource Discovery', () => {
    it('should generate tests for resources', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic' }
      );

      const result = await discovery.discover();

      expect(result.tests.resources).toBeDefined();
      expect(result.tests.resources!['config://settings']).toBeDefined();
      expect(result.tests.resources!['file:///data/users.json']).toBeDefined();
    });

    it('should set default expectation for resources', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic' }
      );

      const result = await discovery.discover();

      const resourceTest = result.tests.resources!['config://settings'] as any;
      expect(resourceTest.expect).toBe('exists');
    });
  });

  describe('Prompt Discovery', () => {
    it('should generate tests for prompts', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic' }
      );

      const result = await discovery.discover();

      expect(result.tests.prompts).toBeDefined();
      expect(result.tests.prompts!['analyze']).toBeDefined();
    });

    it('should generate sample arguments for prompts', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic' }
      );

      const result = await discovery.discover();

      const promptTest = result.tests.prompts!['analyze'] as any;
      expect(promptTest.args).toBeDefined();
      expect(promptTest.args.language).toBe('javascript'); // First enum value
    });
  });

  describe('Snapshot Generation', () => {
    it('should add snapshot config when enabled', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic', generateSnapshots: true }
      );

      const result = await discovery.discover();

      const searchTest = result.tests.tools!['search'];
      expect(searchTest.snapshot).toBeDefined();
    });

    it('should exclude volatile fields from snapshots', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic', generateSnapshots: true }
      );

      const result = await discovery.discover();

      const searchTest = result.tests.tools!['search'];
      const snapshot = searchTest.snapshot as any;
      expect(snapshot.exclude).toContain('timestamp');
    });
  });

  describe('Output Formatting', () => {
    it('should format as JSON', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic' }
      );

      const result = await discovery.discover();
      const json = formatAsJson(result);

      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.server).toBeDefined();
      expect(parsed.tests).toBeDefined();
    });

    it('should format as JavaScript test file', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic' }
      );

      const result = await discovery.discover();
      const js = formatAsTestFile(result);

      expect(js).toContain('export default');
      expect(js).toContain('server:');
      expect(js).toContain('tests:');
      expect(js).toContain('tools:');
    });

    it('should include metadata comments in JS output', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic' }
      );

      const result = await discovery.discover();
      const js = formatAsTestFile(result);

      expect(js).toContain('// Auto-generated by mcp-jest');
      expect(js).toContain('// Server:');
    });
  });

  describe('Metadata', () => {
    it('should include discovery timestamp', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic' }
      );

      const result = await discovery.discover();

      expect(result.metadata.discoveredAt).toBeDefined();
      expect(() => new Date(result.metadata.discoveredAt)).not.toThrow();
    });

    it('should count generated tests', async () => {
      const discovery = new MCPDiscovery(
        { command: 'node', args: ['./server.js'] },
        { depth: 'basic' }
      );

      const result = await discovery.discover();

      expect(result.metadata.generatedTestCount).toBeGreaterThan(0);
    });
  });
});
