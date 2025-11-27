/**
 * MCP Server Auto-Discovery and Test Generation
 *
 * This module connects to an MCP server, discovers all capabilities,
 * analyzes input schemas, and generates comprehensive test configurations.
 */

import { MCPTestClient } from './client.js';
import type { MCPServerConfig, MCPCapabilities, MCPTestConfig, ToolTestConfig } from './types.js';

export interface DiscoveryOptions {
  /** Depth of test generation: 'basic' | 'standard' | 'comprehensive' */
  depth?: 'basic' | 'standard' | 'comprehensive';
  /** Include edge case tests (empty inputs, boundary values) */
  includeEdgeCases?: boolean;
  /** Include negative tests (invalid inputs that should fail) */
  includeNegativeTests?: boolean;
  /** Generate snapshot tests for all outputs */
  generateSnapshots?: boolean;
  /** Timeout for discovery process */
  timeout?: number;
}

export interface DiscoveryResult {
  /** Server configuration used */
  server: MCPServerConfig;
  /** Discovered capabilities */
  capabilities: MCPCapabilities;
  /** Generated test configuration */
  tests: MCPTestConfig;
  /** Metadata about the discovery */
  metadata: {
    discoveredAt: string;
    toolCount: number;
    resourceCount: number;
    promptCount: number;
    generatedTestCount: number;
  };
}

export interface SchemaAnalysis {
  properties: PropertyInfo[];
  required: string[];
  hasComplexTypes: boolean;
}

export interface PropertyInfo {
  name: string;
  type: string;
  description?: string;
  enum?: unknown[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

/**
 * Discovers MCP server capabilities and generates test configurations
 */
export class MCPDiscovery {
  private client: MCPTestClient;
  private options: Required<DiscoveryOptions>;

  constructor(
    private serverConfig: MCPServerConfig,
    options: DiscoveryOptions = {}
  ) {
    this.client = new MCPTestClient(serverConfig);
    this.options = {
      depth: options.depth || 'standard',
      includeEdgeCases: options.includeEdgeCases ?? true,
      includeNegativeTests: options.includeNegativeTests ?? true,
      generateSnapshots: options.generateSnapshots ?? false,
      timeout: options.timeout || 30000
    };
  }

  /**
   * Run discovery and generate test configuration
   */
  async discover(): Promise<DiscoveryResult> {
    try {
      // Connect to server
      await this.client.connect(this.options.timeout);

      // Get capabilities
      const capabilities = await this.client.getCapabilities();

      // Generate tests for each capability type
      const toolTests = this.generateToolTests(capabilities.tools || []);
      const resourceTests = this.generateResourceTests(capabilities.resources || []);
      const promptTests = this.generatePromptTests(capabilities.prompts || []);

      // Count generated tests
      const generatedTestCount =
        Object.keys(toolTests).length +
        Object.keys(resourceTests).length +
        Object.keys(promptTests).length;

      const tests: MCPTestConfig = {
        tools: toolTests,
        resources: resourceTests,
        prompts: promptTests,
        timeout: this.options.timeout
      };

      return {
        server: this.serverConfig,
        capabilities,
        tests,
        metadata: {
          discoveredAt: new Date().toISOString(),
          toolCount: capabilities.tools?.length || 0,
          resourceCount: capabilities.resources?.length || 0,
          promptCount: capabilities.prompts?.length || 0,
          generatedTestCount
        }
      };
    } finally {
      await this.client.disconnect();
    }
  }

  /**
   * Generate test configurations for tools
   */
  private generateToolTests(
    tools: NonNullable<MCPCapabilities['tools']>
  ): Record<string, ToolTestConfig> {
    const tests: Record<string, ToolTestConfig> = {};

    for (const tool of tools) {
      const schema = this.analyzeSchema(tool.inputSchema);

      // Generate primary test with valid inputs
      const primaryTest = this.generatePrimaryToolTest(tool.name, schema);
      tests[tool.name] = primaryTest;

      // Generate edge case tests based on depth
      if (this.options.includeEdgeCases && this.options.depth !== 'basic') {
        const edgeCases = this.generateEdgeCaseTests(tool.name, schema);
        for (const [name, test] of Object.entries(edgeCases)) {
          tests[name] = test;
        }
      }

      // Generate negative tests
      if (this.options.includeNegativeTests && this.options.depth === 'comprehensive') {
        const negativeTests = this.generateNegativeTests(tool.name, schema);
        for (const [name, test] of Object.entries(negativeTests)) {
          tests[name] = test;
        }
      }
    }

    return tests;
  }

  /**
   * Generate primary test for a tool with valid sample inputs
   */
  private generatePrimaryToolTest(
    toolName: string,
    schema: SchemaAnalysis
  ): ToolTestConfig {
    const args = this.generateSampleArgs(schema);

    const test: ToolTestConfig = {
      args,
      expect: 'content && content.length > 0'
    };

    if (this.options.generateSnapshots) {
      test.snapshot = {
        exclude: ['timestamp', 'id', 'requestId']
      };
    }

    return test;
  }

  /**
   * Generate edge case tests for boundary conditions
   */
  private generateEdgeCaseTests(
    toolName: string,
    schema: SchemaAnalysis
  ): Record<string, ToolTestConfig> {
    const tests: Record<string, ToolTestConfig> = {};

    for (const prop of schema.properties) {
      // Empty string test for string properties
      if (prop.type === 'string' && !schema.required.includes(prop.name)) {
        tests[`${toolName}:empty-${prop.name}`] = {
          args: { ...this.generateSampleArgs(schema), [prop.name]: '' },
          expect: 'exists' // Might succeed or fail gracefully
        };
      }

      // Boundary tests for numbers
      if (prop.type === 'number' || prop.type === 'integer') {
        if (prop.minimum !== undefined) {
          tests[`${toolName}:min-${prop.name}`] = {
            args: { ...this.generateSampleArgs(schema), [prop.name]: prop.minimum },
            expect: 'exists'
          };
        }
        if (prop.maximum !== undefined) {
          tests[`${toolName}:max-${prop.name}`] = {
            args: { ...this.generateSampleArgs(schema), [prop.name]: prop.maximum },
            expect: 'exists'
          };
        }
      }

      // Max length test for strings
      if (prop.type === 'string' && prop.maxLength !== undefined) {
        tests[`${toolName}:maxlen-${prop.name}`] = {
          args: {
            ...this.generateSampleArgs(schema),
            [prop.name]: 'x'.repeat(prop.maxLength)
          },
          expect: 'exists'
        };
      }
    }

    return tests;
  }

  /**
   * Generate negative tests that should fail
   */
  private generateNegativeTests(
    toolName: string,
    schema: SchemaAnalysis
  ): Record<string, ToolTestConfig> {
    const tests: Record<string, ToolTestConfig> = {};

    // Missing required fields
    for (const requiredField of schema.required) {
      const argsWithoutRequired = { ...this.generateSampleArgs(schema) };
      delete argsWithoutRequired[requiredField];

      tests[`${toolName}:missing-${requiredField}`] = {
        args: argsWithoutRequired,
        shouldThrow: true
      };
    }

    // Invalid types
    for (const prop of schema.properties) {
      if (prop.type === 'number' || prop.type === 'integer') {
        tests[`${toolName}:invalid-type-${prop.name}`] = {
          args: { ...this.generateSampleArgs(schema), [prop.name]: 'not-a-number' },
          shouldThrow: true
        };
      }

      // Out of bounds
      if (prop.type === 'number' && prop.maximum !== undefined) {
        tests[`${toolName}:exceed-max-${prop.name}`] = {
          args: { ...this.generateSampleArgs(schema), [prop.name]: prop.maximum + 1000 },
          shouldThrow: true
        };
      }
    }

    return tests;
  }

  /**
   * Generate test configurations for resources
   */
  private generateResourceTests(
    resources: NonNullable<MCPCapabilities['resources']>
  ): Record<string, { expect: string; snapshot?: boolean | object }> {
    const tests: Record<string, { expect: string; snapshot?: boolean | object }> = {};

    for (const resource of resources) {
      tests[resource.uri] = {
        expect: 'exists'
      };

      if (this.options.generateSnapshots) {
        tests[resource.uri].snapshot = {
          exclude: ['timestamp', 'lastModified']
        };
      }
    }

    return tests;
  }

  /**
   * Generate test configurations for prompts
   */
  private generatePromptTests(
    prompts: NonNullable<MCPCapabilities['prompts']>
  ): Record<string, { args?: Record<string, unknown>; expect: string; snapshot?: boolean | object }> {
    const tests: Record<string, { args?: Record<string, unknown>; expect: string; snapshot?: boolean | object }> = {};

    for (const prompt of prompts) {
      const schema = this.analyzeSchema(prompt.arguments);

      tests[prompt.name] = {
        args: this.generateSampleArgs(schema),
        expect: 'messages && messages.length > 0'
      };

      if (this.options.generateSnapshots) {
        tests[prompt.name].snapshot = {
          exclude: ['timestamp']
        };
      }
    }

    return tests;
  }

  /**
   * Analyze JSON Schema and extract property information
   */
  private analyzeSchema(schema: unknown): SchemaAnalysis {
    if (!schema || typeof schema !== 'object') {
      return { properties: [], required: [], hasComplexTypes: false };
    }

    const schemaObj = schema as Record<string, unknown>;
    const properties: PropertyInfo[] = [];
    const required = (schemaObj.required as string[]) || [];
    let hasComplexTypes = false;

    const props = schemaObj.properties as Record<string, unknown> | undefined;
    if (props) {
      for (const [name, propSchema] of Object.entries(props)) {
        if (propSchema && typeof propSchema === 'object') {
          const prop = propSchema as Record<string, unknown>;
          const type = prop.type as string || 'string';

          if (type === 'object' || type === 'array') {
            hasComplexTypes = true;
          }

          properties.push({
            name,
            type,
            description: prop.description as string | undefined,
            enum: prop.enum as unknown[] | undefined,
            default: prop.default,
            minimum: prop.minimum as number | undefined,
            maximum: prop.maximum as number | undefined,
            minLength: prop.minLength as number | undefined,
            maxLength: prop.maxLength as number | undefined,
            pattern: prop.pattern as string | undefined
          });
        }
      }
    }

    return { properties, required, hasComplexTypes };
  }

  /**
   * Generate sample arguments based on schema
   */
  private generateSampleArgs(schema: SchemaAnalysis): Record<string, unknown> {
    const args: Record<string, unknown> = {};

    for (const prop of schema.properties) {
      args[prop.name] = this.generateSampleValue(prop);
    }

    return args;
  }

  /**
   * Generate a sample value for a property
   */
  private generateSampleValue(prop: PropertyInfo): unknown {
    // Use enum value if available
    if (prop.enum && prop.enum.length > 0) {
      return prop.enum[0];
    }

    // Use default if available
    if (prop.default !== undefined) {
      return prop.default;
    }

    // Generate based on type
    switch (prop.type) {
      case 'string':
        return this.generateSampleString(prop);
      case 'number':
      case 'integer':
        return this.generateSampleNumber(prop);
      case 'boolean':
        return true;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return 'sample_value';
    }
  }

  /**
   * Generate sample string based on property constraints
   */
  private generateSampleString(prop: PropertyInfo): string {
    const name = prop.name.toLowerCase();

    // Smart defaults based on common property names
    if (name.includes('email')) return 'test@example.com';
    if (name.includes('url') || name.includes('uri')) return 'https://example.com';
    if (name.includes('path')) return '/tmp/test';
    if (name.includes('query') || name.includes('search')) return 'test query';
    if (name.includes('name')) return 'Test Name';
    if (name.includes('id')) return 'test-id-123';
    if (name.includes('code') || name.includes('language')) return 'javascript';
    if (name.includes('expression')) return '2 + 2';
    if (name.includes('content') || name.includes('text')) return 'Sample content for testing';

    // Use pattern if available to generate matching string
    if (prop.pattern) {
      // For simple patterns, try to generate a matching value
      if (prop.pattern === '^[a-z]+$') return 'test';
      if (prop.pattern === '^[A-Z]+$') return 'TEST';
      if (prop.pattern === '^\\d+$') return '12345';
    }

    // Respect length constraints
    let sample = 'test_value';
    if (prop.minLength && sample.length < prop.minLength) {
      sample = sample.padEnd(prop.minLength, '_');
    }
    if (prop.maxLength && sample.length > prop.maxLength) {
      sample = sample.substring(0, prop.maxLength);
    }

    return sample;
  }

  /**
   * Generate sample number based on property constraints
   */
  private generateSampleNumber(prop: PropertyInfo): number {
    const min = prop.minimum ?? 0;
    const max = prop.maximum ?? 100;

    // Return middle of range
    const mid = Math.floor((min + max) / 2);

    // For integers, ensure whole number
    if (prop.type === 'integer') {
      return Math.floor(mid);
    }

    return mid;
  }
}

/**
 * Format discovery results as a JavaScript/TypeScript test file
 */
export function formatAsTestFile(result: DiscoveryResult): string {
  const lines: string[] = [
    '// Auto-generated by mcp-jest discover',
    `// Server: ${result.server.command} ${(result.server.args || []).join(' ')}`,
    `// Generated: ${result.metadata.discoveredAt}`,
    `//${'-'.repeat(60)}`,
    '',
    'export default {'
  ];

  // Server config
  lines.push('  server: {');
  lines.push(`    command: '${result.server.command}',`);
  if (result.server.args && result.server.args.length > 0) {
    lines.push(`    args: [${result.server.args.map(a => `'${a}'`).join(', ')}],`);
  }
  if (result.server.transport && result.server.transport !== 'stdio') {
    lines.push(`    transport: '${result.server.transport}',`);
  }
  if (result.server.url) {
    lines.push(`    url: '${result.server.url}',`);
  }
  lines.push('  },');
  lines.push('');

  // Tests
  lines.push('  tests: {');

  // Tools
  if (Object.keys(result.tests.tools || {}).length > 0) {
    lines.push('    tools: {');
    for (const [name, config] of Object.entries(result.tests.tools || {})) {
      lines.push(`      '${name}': {`);
      if (config.args && Object.keys(config.args).length > 0) {
        lines.push(`        args: ${JSON.stringify(config.args)},`);
      }
      if (config.expect) {
        lines.push(`        expect: '${config.expect}',`);
      }
      if (config.shouldThrow) {
        lines.push(`        shouldThrow: true,`);
      }
      if (config.snapshot) {
        lines.push(`        snapshot: ${JSON.stringify(config.snapshot)},`);
      }
      lines.push('      },');
    }
    lines.push('    },');
  }

  // Resources
  if (Object.keys(result.tests.resources || {}).length > 0) {
    lines.push('    resources: {');
    for (const [uri, config] of Object.entries(result.tests.resources || {})) {
      const configObj = config as { expect: string; snapshot?: unknown };
      lines.push(`      '${uri}': {`);
      lines.push(`        expect: '${configObj.expect}',`);
      if (configObj.snapshot) {
        lines.push(`        snapshot: ${JSON.stringify(configObj.snapshot)},`);
      }
      lines.push('      },');
    }
    lines.push('    },');
  }

  // Prompts
  if (Object.keys(result.tests.prompts || {}).length > 0) {
    lines.push('    prompts: {');
    for (const [name, config] of Object.entries(result.tests.prompts || {})) {
      const configObj = config as { args?: Record<string, unknown>; expect: string; snapshot?: unknown };
      lines.push(`      '${name}': {`);
      if (configObj.args && Object.keys(configObj.args).length > 0) {
        lines.push(`        args: ${JSON.stringify(configObj.args)},`);
      }
      lines.push(`        expect: '${configObj.expect}',`);
      if (configObj.snapshot) {
        lines.push(`        snapshot: ${JSON.stringify(configObj.snapshot)},`);
      }
      lines.push('      },');
    }
    lines.push('    },');
  }

  lines.push(`    timeout: ${result.tests.timeout || 30000}`);
  lines.push('  }');
  lines.push('};');

  return lines.join('\n');
}

/**
 * Format discovery results as JSON config
 */
export function formatAsJson(result: DiscoveryResult): string {
  return JSON.stringify({
    server: result.server,
    tests: result.tests
  }, null, 2);
}
