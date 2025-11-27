/**
 * Comprehensive tests for MCPTestRunner
 *
 * These tests verify the core functionality of mcp-jest.
 * A testing framework must test itself rigorously.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPTestRunner } from '../runner.js';
import { MCPTestClient } from '../client.js';
import type { MCPServerConfig, MCPTestConfig, MCPCapabilities } from '../types.js';

// Mock the MCPTestClient
vi.mock('../client.js', () => ({
  MCPTestClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    ping: vi.fn().mockResolvedValue(true),
    getCapabilities: vi.fn().mockResolvedValue({
      tools: [
        { name: 'search', description: 'Search for items', inputSchema: { type: 'object', properties: { query: { type: 'string' } } } },
        { name: 'calculate', description: 'Perform calculations', inputSchema: { type: 'object', properties: { expression: { type: 'string' } } } }
      ],
      resources: [
        { uri: 'config://settings', name: 'Settings', description: 'App settings' }
      ],
      prompts: [
        { name: 'analyze', description: 'Analyze code' }
      ]
    }),
    callTool: vi.fn().mockImplementation((name: string, args: any) => {
      if (name === 'search') {
        return Promise.resolve({ content: [{ type: 'text', text: 'Search results for: ' + args.query }] });
      }
      if (name === 'calculate') {
        try {
          // Simple safe evaluation for tests
          const result = Function(`"use strict"; return (${args.expression})`)();
          return Promise.resolve({ content: [{ type: 'text', text: String(result) }] });
        } catch {
          return Promise.reject(new Error('Invalid expression'));
        }
      }
      return Promise.reject(new Error(`Unknown tool: ${name}`));
    }),
    readResource: vi.fn().mockImplementation((uri: string) => {
      if (uri === 'config://settings') {
        return Promise.resolve({ contents: [{ uri, text: '{"theme": "dark"}' }] });
      }
      return Promise.reject(new Error(`Unknown resource: ${uri}`));
    }),
    getPrompt: vi.fn().mockImplementation((name: string, args: any) => {
      if (name === 'analyze') {
        return Promise.resolve({ messages: [{ role: 'user', content: { type: 'text', text: 'Analyze this code' } }] });
      }
      return Promise.reject(new Error(`Unknown prompt: ${name}`));
    })
  }))
}));

describe('MCPTestRunner', () => {
  const mockServerConfig: MCPServerConfig = {
    command: 'node',
    args: ['./test-server.js']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Test Execution', () => {
    it('should run connection test successfully', async () => {
      const runner = new MCPTestRunner(mockServerConfig, {});
      const results = await runner.run();

      expect(results.total).toBeGreaterThan(0);
      expect(results.results.some(r => r.name === 'Server Connection' && r.status === 'pass')).toBe(true);
    });

    it('should discover capabilities', async () => {
      const runner = new MCPTestRunner(mockServerConfig, {});
      const results = await runner.run();

      const capabilityResult = results.results.find(r => r.name === 'Capability Discovery');
      expect(capabilityResult).toBeDefined();
      expect(capabilityResult?.status).toBe('pass');
      expect(capabilityResult?.message).toContain('2 tools');
    });

    it('should report total duration', async () => {
      const runner = new MCPTestRunner(mockServerConfig, {});
      const results = await runner.run();

      // Duration may be 0 for fast mocked tests, just verify it's defined
      expect(results.duration).toBeGreaterThanOrEqual(0);
      expect(results.duration).toBeLessThan(5000); // Should complete quickly
    });
  });

  describe('Tool Testing', () => {
    it('should test specified tools exist', async () => {
      const config: MCPTestConfig = {
        tools: ['search', 'calculate']
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const searchExists = results.results.find(r => r.name === "Tool 'search' exists");
      const calculateExists = results.results.find(r => r.name === "Tool 'calculate' exists");

      expect(searchExists?.status).toBe('pass');
      expect(calculateExists?.status).toBe('pass');
    });

    it('should fail when expected tool does not exist', async () => {
      const config: MCPTestConfig = {
        tools: ['nonexistent']
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const toolExists = results.results.find(r => r.name === "Tool 'nonexistent' exists");
      expect(toolExists?.status).toBe('fail');
      expect(toolExists?.message).toContain('not found');
    });

    it('should execute tools with arguments', async () => {
      const config: MCPTestConfig = {
        tools: {
          search: { args: { query: 'test' } }
        }
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const execution = results.results.find(r => r.name === "Tool 'search' execution");
      expect(execution?.status).toBe('pass');
    });

    it('should validate tool expectations', async () => {
      const config: MCPTestConfig = {
        tools: {
          calculate: {
            args: { expression: '2 + 2' },
            expect: "content[0].text === '4'"
          }
        }
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const execution = results.results.find(r => r.name === "Tool 'calculate' execution");
      expect(execution?.status).toBe('pass');
    });

    it('should fail when expectation is not met', async () => {
      const config: MCPTestConfig = {
        tools: {
          calculate: {
            args: { expression: '2 + 2' },
            expect: "content[0].text === '5'" // Wrong expectation
          }
        }
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const execution = results.results.find(r => r.name === "Tool 'calculate' execution");
      expect(execution?.status).toBe('fail');
    });

    it('should handle tools that should throw', async () => {
      const config: MCPTestConfig = {
        tools: {
          calculate: {
            args: { expression: 'invalid' },
            shouldThrow: true
          }
        }
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const execution = results.results.find(r => r.name === "Tool 'calculate' execution");
      expect(execution?.status).toBe('pass');
      expect(execution?.message).toContain('threw an error as expected');
    });
  });

  describe('Resource Testing', () => {
    it('should test specified resources exist', async () => {
      const config: MCPTestConfig = {
        resources: ['config://settings']
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const resourceExists = results.results.find(r => r.name === "Resource 'config://settings' exists");
      expect(resourceExists?.status).toBe('pass');
    });

    it('should read resources', async () => {
      const config: MCPTestConfig = {
        resources: {
          'config://settings': { expect: 'exists' }
        }
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const resourceRead = results.results.find(r => r.name === "Resource 'config://settings' read");
      expect(resourceRead?.status).toBe('pass');
    });
  });

  describe('Prompt Testing', () => {
    it('should test specified prompts exist', async () => {
      const config: MCPTestConfig = {
        prompts: ['analyze']
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const promptExists = results.results.find(r => r.name === "Prompt 'analyze' exists");
      expect(promptExists?.status).toBe('pass');
    });

    it('should execute prompts', async () => {
      const config: MCPTestConfig = {
        prompts: {
          analyze: { args: { code: 'function test() {}' } }
        }
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const execution = results.results.find(r => r.name === "Prompt 'analyze' execution");
      expect(execution?.status).toBe('pass');
    });
  });

  describe('Test Filtering', () => {
    it('should filter tests by pattern', async () => {
      const config: MCPTestConfig = {
        tools: ['search', 'calculate'],
        filter: 'search'
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const searchResult = results.results.find(r => r.name.includes('search') && r.type === 'capability');
      const calculateResult = results.results.find(r => r.name.includes('calculate') && r.type === 'capability');

      expect(searchResult?.status).toBe('pass');
      expect(calculateResult?.status).toBe('skip');
    });

    it('should skip tests by pattern', async () => {
      const config: MCPTestConfig = {
        tools: ['search', 'calculate'],
        skip: 'calc*'
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const calculateResult = results.results.find(r => r.name.includes('calculate') && r.type === 'capability');
      expect(calculateResult?.status).toBe('skip');
    });
  });

  describe('Expectation Evaluation', () => {
    it('should evaluate "exists" expectation', async () => {
      const config: MCPTestConfig = {
        tools: {
          search: {
            args: { query: 'test' },
            expect: 'exists'
          }
        }
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const execution = results.results.find(r => r.name === "Tool 'search' execution");
      expect(execution?.status).toBe('pass');
    });

    it('should evaluate length expectations', async () => {
      const config: MCPTestConfig = {
        tools: {
          search: {
            args: { query: 'test' },
            expect: 'content.length > 0'
          }
        }
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const execution = results.results.find(r => r.name === "Tool 'search' execution");
      expect(execution?.status).toBe('pass');
    });

    it('should evaluate property path expectations', async () => {
      const config: MCPTestConfig = {
        tools: {
          calculate: {
            args: { expression: '2 + 2' },
            expect: "content[0].text === '4'"
          }
        }
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const execution = results.results.find(r => r.name === "Tool 'calculate' execution");
      expect(execution?.status).toBe('pass');
    });

    it('should evaluate function expectations', async () => {
      const config: MCPTestConfig = {
        tools: {
          search: {
            args: { query: 'test' },
            expect: (result: any) => result.content && result.content.length > 0
          }
        }
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const execution = results.results.find(r => r.name === "Tool 'search' execution");
      expect(execution?.status).toBe('pass');
    });
  });

  describe('Test Suite Results', () => {
    it('should calculate correct pass/fail counts', async () => {
      const config: MCPTestConfig = {
        tools: {
          search: { args: { query: 'test' } },
          nonexistent: { args: {} }
        }
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      expect(results.passed).toBeGreaterThan(0);
      expect(results.failed).toBeGreaterThan(0);
      expect(results.passed + results.failed + results.skipped).toBe(results.total);
    });

    it('should track individual test durations', async () => {
      const config: MCPTestConfig = {
        tools: ['search']
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      // Duration may be 0 for fast tests, just check it exists
      const testsWithDuration = results.results.filter(r => r.duration !== undefined);
      expect(testsWithDuration.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection failures gracefully', async () => {
      const MockClient = vi.mocked(MCPTestClient);
      MockClient.mockImplementationOnce(() => ({
        connect: vi.fn().mockRejectedValue(new Error('Connection refused')),
        disconnect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue(false),
        getCapabilities: vi.fn().mockResolvedValue({}),
        callTool: vi.fn().mockRejectedValue(new Error('Not connected')),
        readResource: vi.fn().mockRejectedValue(new Error('Not connected')),
        getPrompt: vi.fn().mockRejectedValue(new Error('Not connected'))
      }));

      const runner = new MCPTestRunner(mockServerConfig, {});
      const results = await runner.run();

      expect(results.failed).toBeGreaterThan(0);
      const connectionResult = results.results.find(r => r.name === 'Server Connection');
      expect(connectionResult?.status).toBe('fail');
    });

    it('should include error details in failed tests', async () => {
      const config: MCPTestConfig = {
        tools: {
          calculate: {
            args: { expression: 'invalid syntax {{{' }
          }
        }
      };

      const runner = new MCPTestRunner(mockServerConfig, config);
      const results = await runner.run();

      const execution = results.results.find(r => r.name === "Tool 'calculate' execution");
      expect(execution?.status).toBe('fail');
      expect(execution?.error).toBeDefined();
    });
  });
});

describe('Expectation Evaluator Edge Cases', () => {
  const mockServerConfig: MCPServerConfig = {
    command: 'node',
    args: ['./test-server.js']
  };

  it('should handle null values', async () => {
    vi.mocked(MCPTestClient).mockImplementationOnce(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue(true),
      getCapabilities: vi.fn().mockResolvedValue({ tools: [{ name: 'test' }] }),
      callTool: vi.fn().mockResolvedValue({ content: null }),
      readResource: vi.fn().mockResolvedValue({}),
      getPrompt: vi.fn().mockResolvedValue({})
    }));

    const config: MCPTestConfig = {
      tools: {
        test: {
          args: {},
          expect: 'exists'
        }
      }
    };

    const runner = new MCPTestRunner(mockServerConfig, config);
    const results = await runner.run();

    // The result exists but content is null
    const execution = results.results.find(r => r.name === "Tool 'test' execution");
    expect(execution).toBeDefined();
  });

  it('should handle deeply nested property access', async () => {
    vi.mocked(MCPTestClient).mockImplementationOnce(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue(true),
      getCapabilities: vi.fn().mockResolvedValue({ tools: [{ name: 'deep' }] }),
      callTool: vi.fn().mockResolvedValue({
        content: [{ data: { nested: { value: 'found' } } }]
      }),
      readResource: vi.fn().mockResolvedValue({}),
      getPrompt: vi.fn().mockResolvedValue({})
    }));

    const config: MCPTestConfig = {
      tools: {
        deep: {
          args: {},
          expect: "content[0].data.nested.value === 'found'"
        }
      }
    };

    const runner = new MCPTestRunner(mockServerConfig, config);
    const results = await runner.run();

    const execution = results.results.find(r => r.name === "Tool 'deep' execution");
    expect(execution?.status).toBe('pass');
  });
});
