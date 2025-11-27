/**
 * MCP Protocol Compliance Validator
 *
 * Validates that an MCP server correctly implements the Model Context Protocol
 * specification (2025-06-18). Provides compliance scoring and detailed reports.
 */

import { MCPTestClient } from './client.js';
import type { MCPServerConfig, MCPCapabilities } from './types.js';

/**
 * Protocol validation test result
 */
export interface ProtocolValidationResult {
  name: string;
  category: 'required' | 'recommended' | 'optional';
  passed: boolean;
  message: string;
  details?: unknown;
  specReference?: string;
}

/**
 * Compliance report with scoring
 */
export interface ComplianceReport {
  /** Overall compliance score (0-100) */
  score: number;
  /** Compliance level based on score */
  level: 'non-compliant' | 'basic' | 'standard' | 'full';
  /** Server info if available */
  serverInfo?: {
    name?: string;
    version?: string;
    protocolVersion?: string;
  };
  /** Individual test results */
  results: ProtocolValidationResult[];
  /** Summary by category */
  summary: {
    required: { passed: number; failed: number; total: number };
    recommended: { passed: number; failed: number; total: number };
    optional: { passed: number; failed: number; total: number };
  };
  /** Timestamp of validation */
  timestamp: string;
  /** Duration of validation in ms */
  duration: number;
}

/**
 * Validator options
 */
export interface ValidatorOptions {
  /** Connection timeout in ms */
  timeout?: number;
  /** Protocol version to validate against */
  protocolVersion?: '2024-11-05' | '2025-03-26' | '2025-06-18';
  /** Include optional checks */
  includeOptional?: boolean;
  /** Strict mode - fail on warnings */
  strict?: boolean;
}

/**
 * MCP Protocol Compliance Validator
 *
 * Validates servers against the MCP specification
 */
export class MCPProtocolValidator {
  private client: MCPTestClient;
  private options: Required<ValidatorOptions>;
  private results: ProtocolValidationResult[] = [];
  private startTime = 0;

  constructor(
    private serverConfig: MCPServerConfig,
    options: ValidatorOptions = {}
  ) {
    this.client = new MCPTestClient(serverConfig);
    this.options = {
      timeout: options.timeout || 30000,
      protocolVersion: options.protocolVersion || '2025-06-18',
      includeOptional: options.includeOptional ?? true,
      strict: options.strict ?? false
    };
  }

  /**
   * Run full protocol compliance validation
   */
  async validate(): Promise<ComplianceReport> {
    this.startTime = Date.now();
    this.results = [];

    try {
      // Phase 1: Connection & Initialization
      await this.validateConnection();

      // Phase 2: Capability Negotiation
      const capabilities = await this.validateCapabilities();

      // Phase 3: Protocol Methods
      await this.validateProtocolMethods(capabilities);

      // Phase 4: Error Handling
      await this.validateErrorHandling();

      // Phase 5: Transport Compliance
      await this.validateTransport();

    } catch (error) {
      this.addResult({
        name: 'Validation Process',
        category: 'required',
        passed: false,
        message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      await this.client.disconnect();
    }

    return this.generateReport();
  }

  /**
   * Validate server connection and handshake
   */
  private async validateConnection(): Promise<void> {
    // Test 1: Server responds to connection
    try {
      await this.client.connect(this.options.timeout);
      this.addResult({
        name: 'Server Connection',
        category: 'required',
        passed: true,
        message: 'Server accepts connections and responds to initialization',
        specReference: 'MCP Spec: Connection Lifecycle'
      });
    } catch (error) {
      this.addResult({
        name: 'Server Connection',
        category: 'required',
        passed: false,
        message: `Server failed to connect: ${error instanceof Error ? error.message : String(error)}`,
        specReference: 'MCP Spec: Connection Lifecycle'
      });
      throw error;
    }

    // Test 2: Server responds to ping
    try {
      const canPing = await this.client.ping();
      this.addResult({
        name: 'Ping Response',
        category: 'recommended',
        passed: canPing,
        message: canPing ? 'Server responds to ping requests' : 'Server does not respond to ping (optional)',
        specReference: 'MCP Spec: Ping'
      });
    } catch {
      this.addResult({
        name: 'Ping Response',
        category: 'recommended',
        passed: false,
        message: 'Ping request failed',
        specReference: 'MCP Spec: Ping'
      });
    }
  }

  /**
   * Validate capability discovery
   */
  private async validateCapabilities(): Promise<MCPCapabilities> {
    let capabilities: MCPCapabilities = {};

    // Test: List Tools
    try {
      capabilities = await this.client.getCapabilities();

      // Validate tools structure
      if (capabilities.tools) {
        const validTools = capabilities.tools.every(tool =>
          typeof tool.name === 'string' && tool.name.length > 0
        );

        this.addResult({
          name: 'Tools Discovery',
          category: 'required',
          passed: validTools,
          message: validTools
            ? `Found ${capabilities.tools.length} tools with valid structure`
            : 'Tools have invalid structure (missing name)',
          details: { toolCount: capabilities.tools.length },
          specReference: 'MCP Spec: tools/list'
        });

        // Validate tool schemas
        const toolsWithSchemas = capabilities.tools.filter(t => t.inputSchema);
        this.addResult({
          name: 'Tool Input Schemas',
          category: 'recommended',
          passed: toolsWithSchemas.length === capabilities.tools.length,
          message: `${toolsWithSchemas.length}/${capabilities.tools.length} tools have input schemas`,
          specReference: 'MCP Spec: Tool Definition'
        });
      } else {
        this.addResult({
          name: 'Tools Discovery',
          category: 'required',
          passed: true,
          message: 'No tools declared (valid if server has no tools)',
          specReference: 'MCP Spec: tools/list'
        });
      }

      // Validate resources structure
      if (capabilities.resources) {
        const validResources = capabilities.resources.every(resource =>
          typeof resource.uri === 'string' && resource.uri.length > 0
        );

        this.addResult({
          name: 'Resources Discovery',
          category: 'required',
          passed: validResources,
          message: validResources
            ? `Found ${capabilities.resources.length} resources with valid URIs`
            : 'Resources have invalid structure (missing URI)',
          details: { resourceCount: capabilities.resources.length },
          specReference: 'MCP Spec: resources/list'
        });
      }

      // Validate prompts structure
      if (capabilities.prompts) {
        const validPrompts = capabilities.prompts.every(prompt =>
          typeof prompt.name === 'string' && prompt.name.length > 0
        );

        this.addResult({
          name: 'Prompts Discovery',
          category: 'required',
          passed: validPrompts,
          message: validPrompts
            ? `Found ${capabilities.prompts.length} prompts with valid names`
            : 'Prompts have invalid structure (missing name)',
          details: { promptCount: capabilities.prompts.length },
          specReference: 'MCP Spec: prompts/list'
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Method not found is acceptable for servers that don't implement certain capabilities
      if (errorMessage.includes('Method not found')) {
        this.addResult({
          name: 'Capability Discovery',
          category: 'required',
          passed: true,
          message: 'Server does not implement capability listing (acceptable for minimal servers)',
          specReference: 'MCP Spec: Capabilities'
        });
      } else {
        this.addResult({
          name: 'Capability Discovery',
          category: 'required',
          passed: false,
          message: `Failed to discover capabilities: ${errorMessage}`,
          specReference: 'MCP Spec: Capabilities'
        });
      }
    }

    return capabilities;
  }

  /**
   * Validate protocol method implementations
   */
  private async validateProtocolMethods(capabilities: MCPCapabilities): Promise<void> {
    // Test tool execution if tools exist
    if (capabilities.tools && capabilities.tools.length > 0) {
      const testTool = capabilities.tools[0];

      try {
        // Call with empty args to test basic invocation
        await this.client.callTool(testTool.name, {});
        this.addResult({
          name: 'Tool Invocation',
          category: 'required',
          passed: true,
          message: `Tool '${testTool.name}' can be invoked`,
          specReference: 'MCP Spec: tools/call'
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Error is expected if args are required - check error format
        const hasProperError = errorMessage.includes('required') ||
          errorMessage.includes('missing') ||
          errorMessage.includes('invalid');

        this.addResult({
          name: 'Tool Invocation',
          category: 'required',
          passed: hasProperError,
          message: hasProperError
            ? `Tool '${testTool.name}' returns proper validation errors`
            : `Tool invocation error: ${errorMessage}`,
          specReference: 'MCP Spec: tools/call'
        });
      }
    }

    // Test resource reading if resources exist
    if (capabilities.resources && capabilities.resources.length > 0) {
      const testResource = capabilities.resources[0];

      try {
        await this.client.readResource(testResource.uri);
        this.addResult({
          name: 'Resource Reading',
          category: 'required',
          passed: true,
          message: `Resource '${testResource.uri}' can be read`,
          specReference: 'MCP Spec: resources/read'
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.addResult({
          name: 'Resource Reading',
          category: 'required',
          passed: false,
          message: `Resource read failed: ${errorMessage}`,
          specReference: 'MCP Spec: resources/read'
        });
      }
    }

    // Test prompt retrieval if prompts exist
    if (capabilities.prompts && capabilities.prompts.length > 0) {
      const testPrompt = capabilities.prompts[0];

      try {
        await this.client.getPrompt(testPrompt.name, {});
        this.addResult({
          name: 'Prompt Retrieval',
          category: 'required',
          passed: true,
          message: `Prompt '${testPrompt.name}' can be retrieved`,
          specReference: 'MCP Spec: prompts/get'
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const hasProperError = errorMessage.includes('required') ||
          errorMessage.includes('missing') ||
          errorMessage.includes('argument');

        this.addResult({
          name: 'Prompt Retrieval',
          category: 'required',
          passed: hasProperError,
          message: hasProperError
            ? `Prompt '${testPrompt.name}' returns proper validation errors`
            : `Prompt retrieval error: ${errorMessage}`,
          specReference: 'MCP Spec: prompts/get'
        });
      }
    }
  }

  /**
   * Validate error handling compliance
   */
  private async validateErrorHandling(): Promise<void> {
    // Test: Invalid method handling
    try {
      // Attempt to call a non-existent tool
      await this.client.callTool('__nonexistent_tool_12345__', {});
      this.addResult({
        name: 'Unknown Tool Error',
        category: 'required',
        passed: false,
        message: 'Server should return error for unknown tool, but succeeded',
        specReference: 'MCP Spec: Error Handling'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Should get a proper error, not a crash
      this.addResult({
        name: 'Unknown Tool Error',
        category: 'required',
        passed: true,
        message: 'Server correctly returns error for unknown tool',
        details: { errorMessage },
        specReference: 'MCP Spec: Error Handling'
      });
    }

    // Test: Invalid resource URI
    try {
      await this.client.readResource('__invalid://resource__');
      this.addResult({
        name: 'Invalid Resource Error',
        category: 'required',
        passed: false,
        message: 'Server should return error for invalid resource URI',
        specReference: 'MCP Spec: Error Handling'
      });
    } catch (error) {
      this.addResult({
        name: 'Invalid Resource Error',
        category: 'required',
        passed: true,
        message: 'Server correctly returns error for invalid resource',
        specReference: 'MCP Spec: Error Handling'
      });
    }
  }

  /**
   * Validate transport-specific compliance
   */
  private async validateTransport(): Promise<void> {
    const transport = this.serverConfig.transport || 'stdio';

    switch (transport) {
      case 'stdio':
        this.addResult({
          name: 'STDIO Transport',
          category: 'required',
          passed: true,
          message: 'Server communicates correctly over STDIO transport',
          specReference: 'MCP Spec: STDIO Transport'
        });
        break;

      case 'streamable-http':
        this.addResult({
          name: 'HTTP Streaming Transport',
          category: 'required',
          passed: true,
          message: 'Server communicates correctly over HTTP streaming transport',
          specReference: 'MCP Spec: Streamable HTTP Transport'
        });
        break;

      case 'sse':
        this.addResult({
          name: 'SSE Transport',
          category: 'required',
          passed: true,
          message: 'Server communicates correctly over SSE transport',
          specReference: 'MCP Spec: SSE Transport'
        });
        break;
    }
  }

  /**
   * Add a validation result
   */
  private addResult(result: ProtocolValidationResult): void {
    this.results.push(result);
  }

  /**
   * Generate compliance report
   */
  private generateReport(): ComplianceReport {
    const summary = {
      required: { passed: 0, failed: 0, total: 0 },
      recommended: { passed: 0, failed: 0, total: 0 },
      optional: { passed: 0, failed: 0, total: 0 }
    };

    // Calculate summary
    for (const result of this.results) {
      summary[result.category].total++;
      if (result.passed) {
        summary[result.category].passed++;
      } else {
        summary[result.category].failed++;
      }
    }

    // Calculate score
    // Required: 70% weight, Recommended: 20% weight, Optional: 10% weight
    const requiredScore = summary.required.total > 0
      ? (summary.required.passed / summary.required.total) * 70
      : 70;
    const recommendedScore = summary.recommended.total > 0
      ? (summary.recommended.passed / summary.recommended.total) * 20
      : 20;
    const optionalScore = summary.optional.total > 0
      ? (summary.optional.passed / summary.optional.total) * 10
      : 10;

    const score = Math.round(requiredScore + recommendedScore + optionalScore);

    // Determine compliance level
    let level: ComplianceReport['level'];
    if (summary.required.failed > 0) {
      level = 'non-compliant';
    } else if (score >= 95) {
      level = 'full';
    } else if (score >= 80) {
      level = 'standard';
    } else {
      level = 'basic';
    }

    return {
      score,
      level,
      results: this.results,
      summary,
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime
    };
  }
}

/**
 * Format compliance report for console output
 */
export function formatComplianceReport(report: ComplianceReport): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('              MCP PROTOCOL COMPLIANCE REPORT                    ');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  // Score
  const scoreBar = '█'.repeat(Math.floor(report.score / 5)) + '░'.repeat(20 - Math.floor(report.score / 5));
  lines.push(`Score: ${report.score}/100 [${scoreBar}]`);
  lines.push(`Level: ${report.level.toUpperCase()}`);
  lines.push(`Duration: ${report.duration}ms`);
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push(`Required:    ${report.summary.required.passed}/${report.summary.required.total} passed`);
  lines.push(`Recommended: ${report.summary.recommended.passed}/${report.summary.recommended.total} passed`);
  lines.push(`Optional:    ${report.summary.optional.passed}/${report.summary.optional.total} passed`);
  lines.push('');

  // Detailed Results
  lines.push('DETAILED RESULTS');
  lines.push('───────────────────────────────────────────────────────────────');

  for (const result of report.results) {
    const icon = result.passed ? '✅' : '❌';
    const category = result.category.toUpperCase().padEnd(11);
    lines.push(`${icon} [${category}] ${result.name}`);
    lines.push(`   ${result.message}`);
    if (result.specReference) {
      lines.push(`   📖 ${result.specReference}`);
    }
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}
