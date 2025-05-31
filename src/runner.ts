import { MCPTestClient } from './client.js';
import type { 
  MCPTestConfig, 
  MCPServerConfig, 
  TestResult, 
  TestSuite, 
  ToolTestConfig,
  ResourceTestConfig,
  PromptTestConfig,
  MCPCapabilities 
} from './types.js';

export class MCPTestRunner {
  private client: MCPTestClient;
  private results: TestResult[] = [];
  private startTime = 0;

  constructor(
    private serverConfig: MCPServerConfig,
    private testConfig: MCPTestConfig
  ) {
    this.client = new MCPTestClient(serverConfig);
  }

  async run(): Promise<TestSuite> {
    this.startTime = Date.now();
    this.results = [];

    try {
      // Test connection
      await this.testConnection();

      // Get server capabilities
      const capabilities = await this.getCapabilities();

      // Test capabilities match expectations
      await this.testCapabilities(capabilities);

      // Test tools
      await this.testTools(capabilities);

      // Test resources
      await this.testResources(capabilities);

      // Test prompts
      await this.testPrompts(capabilities);

    } catch (error) {
      this.addResult({
        name: 'Test Suite',
        type: 'connection',
        status: 'fail',
        message: `Test suite failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      });
    } finally {
      await this.cleanup();
    }

    return this.createTestSuite();
  }

  private async testConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const timeout = this.testConfig.timeout || 30000;
      await this.client.connect(timeout);
      
      // Test ping if server supports it
      const canPing = await this.client.ping();
      
      this.addResult({
        name: 'Server Connection',
        type: 'connection',
        status: 'pass',
        message: `Successfully connected to MCP server${canPing ? ' (ping successful)' : ''}`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        name: 'Server Connection',
        type: 'connection',
        status: 'fail',
        message: `Failed to connect to server: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  private async getCapabilities(): Promise<MCPCapabilities> {
    const startTime = Date.now();
    
    try {
      const capabilities = await this.client.getCapabilities();
      
      this.addResult({
        name: 'Capability Discovery',
        type: 'capability',
        status: 'pass',
        message: `Found ${capabilities.tools?.length || 0} tools, ${capabilities.resources?.length || 0} resources, ${capabilities.prompts?.length || 0} prompts`,
        duration: Date.now() - startTime
      });
      
      return capabilities;
    } catch (error) {
      this.addResult({
        name: 'Capability Discovery',
        type: 'capability',
        status: 'fail',
        message: `Failed to get capabilities: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  private async testCapabilities(capabilities: MCPCapabilities): Promise<void> {
    // Test expected tools exist
    if (this.testConfig.tools) {
      const expectedTools = Array.isArray(this.testConfig.tools) 
        ? this.testConfig.tools 
        : Object.keys(this.testConfig.tools);
      
      const availableTools = capabilities.tools?.map(t => t.name) || [];
      
      for (const toolName of expectedTools) {
        if (availableTools.includes(toolName)) {
          this.addResult({
            name: `Tool '${toolName}' exists`,
            type: 'capability',
            status: 'pass',
            message: `Tool '${toolName}' is available`
          });
        } else {
          this.addResult({
            name: `Tool '${toolName}' exists`,
            type: 'capability',
            status: 'fail',
            message: `Expected tool '${toolName}' not found. Available tools: ${availableTools.join(', ')}`
          });
        }
      }
    }

    // Test expected resources exist
    if (this.testConfig.resources) {
      const expectedResources = Array.isArray(this.testConfig.resources)
        ? this.testConfig.resources
        : Object.keys(this.testConfig.resources);
      
      const availableResources = capabilities.resources?.map(r => r.uri) || [];
      
      for (const resourcePattern of expectedResources) {
        // Simple pattern matching - could be enhanced
        const found = availableResources.some(uri => 
          this.matchesPattern(uri, resourcePattern)
        );
        
        if (found) {
          this.addResult({
            name: `Resource '${resourcePattern}' exists`,
            type: 'capability',
            status: 'pass',
            message: `Resource pattern '${resourcePattern}' matched`
          });
        } else {
          this.addResult({
            name: `Resource '${resourcePattern}' exists`,
            type: 'capability',
            status: 'fail',
            message: `Expected resource pattern '${resourcePattern}' not found. Available: ${availableResources.join(', ')}`
          });
        }
      }
    }

    // Test expected prompts exist
    if (this.testConfig.prompts) {
      const expectedPrompts = Array.isArray(this.testConfig.prompts)
        ? this.testConfig.prompts
        : Object.keys(this.testConfig.prompts);
      
      const availablePrompts = capabilities.prompts?.map(p => p.name) || [];
      
      for (const promptName of expectedPrompts) {
        if (availablePrompts.includes(promptName)) {
          this.addResult({
            name: `Prompt '${promptName}' exists`,
            type: 'capability',
            status: 'pass',
            message: `Prompt '${promptName}' is available`
          });
        } else {
          this.addResult({
            name: `Prompt '${promptName}' exists`,
            type: 'capability',
            status: 'fail',
            message: `Expected prompt '${promptName}' not found. Available prompts: ${availablePrompts.join(', ')}`
          });
        }
      }
    }
  }

  private async testTools(capabilities: MCPCapabilities): Promise<void> {
    if (!this.testConfig.tools) return;

    const toolsToTest = Array.isArray(this.testConfig.tools)
      ? this.testConfig.tools.reduce((acc, name) => ({ ...acc, [name]: {} }), {})
      : this.testConfig.tools;

    for (const [toolName, config] of Object.entries(toolsToTest)) {
      await this.testTool(toolName, config as ToolTestConfig);
    }
  }

  private async testTool(name: string, config: ToolTestConfig): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await this.client.callTool(name, config.args || {});
      
      // Validate result if expectation provided
      if (config.expect) {
        const isValid = typeof config.expect === 'function' 
          ? config.expect(result)
          : this.evaluateExpectation(result, config.expect);
        
        if (isValid) {
          this.addResult({
            name: `Tool '${name}' execution`,
            type: 'tool',
            status: 'pass',
            message: `Tool executed successfully and met expectations`,
            duration: Date.now() - startTime
          });
        } else {
          this.addResult({
            name: `Tool '${name}' execution`,
            type: 'tool',
            status: 'fail',
            message: `Tool executed but did not meet expectations: ${config.expect}`,
            duration: Date.now() - startTime
          });
        }
      } else {
        this.addResult({
          name: `Tool '${name}' execution`,
          type: 'tool',
          status: 'pass',
          message: `Tool executed successfully`,
          duration: Date.now() - startTime
        });
      }
    } catch (error) {
      if (config.shouldThrow) {
        this.addResult({
          name: `Tool '${name}' execution`,
          type: 'tool',
          status: 'pass',
          message: `Tool correctly threw an error as expected`,
          duration: Date.now() - startTime
        });
      } else {
        this.addResult({
          name: `Tool '${name}' execution`,
          type: 'tool',
          status: 'fail',
          message: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
          error: error instanceof Error ? error : new Error(String(error)),
          duration: Date.now() - startTime
        });
      }
    }
  }

  private async testResources(capabilities: MCPCapabilities): Promise<void> {
    if (!this.testConfig.resources) return;

    const resourcesToTest = Array.isArray(this.testConfig.resources)
      ? this.testConfig.resources.reduce((acc, uri) => ({ ...acc, [uri]: {} }), {})
      : this.testConfig.resources;

    for (const [pattern, config] of Object.entries(resourcesToTest)) {
      // Find matching resources
      const matchingResources = capabilities.resources?.filter(r => 
        this.matchesPattern(r.uri, pattern)
      ) || [];

      if (matchingResources.length === 0) {
        this.addResult({
          name: `Resource '${pattern}' test`,
          type: 'resource',
          status: 'fail',
          message: `No resources found matching pattern '${pattern}'`
        });
        continue;
      }

      // Check if this is a count expectation
      const resourceConfig = config as ResourceTestConfig;
      if (resourceConfig.expect && typeof resourceConfig.expect === 'string' && 
          resourceConfig.expect.includes('count')) {
        // Test the count of matching resources
        await this.testResourceCount(pattern, matchingResources.length, resourceConfig);
      } else {
        // Test first matching resource (existing behavior)
        await this.testResource(matchingResources[0].uri, resourceConfig);
      }
    }
  }

  private async testResourceCount(pattern: string, count: number, config: ResourceTestConfig): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Validate count if expectation provided
      if (config.expect) {
        const isValid = typeof config.expect === 'function'
          ? config.expect(count)
          : this.evaluateExpectation(count, config.expect);
        
        if (isValid) {
          this.addResult({
            name: `Resource count '${pattern}'`,
            type: 'resource',
            status: 'pass',
            message: `Found ${count} resources matching pattern '${pattern}' and met expectations`,
            duration: Date.now() - startTime
          });
        } else {
          this.addResult({
            name: `Resource count '${pattern}'`,
            type: 'resource',
            status: 'fail',
            message: `Found ${count} resources matching pattern '${pattern}' but did not meet expectations: ${config.expect}`,
            duration: Date.now() - startTime
          });
        }
      } else {
        this.addResult({
          name: `Resource count '${pattern}'`,
          type: 'resource',
          status: 'pass',
          message: `Found ${count} resources matching pattern '${pattern}'`,
          duration: Date.now() - startTime
        });
      }
    } catch (error) {
      this.addResult({
        name: `Resource count '${pattern}'`,
        type: 'resource',
        status: 'fail',
        message: `Resource count test failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime
      });
    }
  }

  private async testResource(uri: string, config: ResourceTestConfig): Promise<void> {
    const startTime = Date.now();
    
    try {
      const content = await this.client.readResource(uri);
      
      // Validate content if expectation provided
      if (config.expect) {
        const isValid = typeof config.expect === 'function'
          ? config.expect(content)
          : this.evaluateExpectation(content, config.expect);
        
        if (isValid) {
          this.addResult({
            name: `Resource '${uri}' read`,
            type: 'resource',
            status: 'pass',
            message: `Resource read successfully and met expectations`,
            duration: Date.now() - startTime
          });
        } else {
          this.addResult({
            name: `Resource '${uri}' read`,
            type: 'resource',
            status: 'fail',
            message: `Resource read but did not meet expectations: ${config.expect}`,
            duration: Date.now() - startTime
          });
        }
      } else {
        this.addResult({
          name: `Resource '${uri}' read`,
          type: 'resource',
          status: 'pass',
          message: `Resource read successfully`,
          duration: Date.now() - startTime
        });
      }
    } catch (error) {
      this.addResult({
        name: `Resource '${uri}' read`,
        type: 'resource',
        status: 'fail',
        message: `Resource read failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime
      });
    }
  }

  private async testPrompts(capabilities: MCPCapabilities): Promise<void> {
    if (!this.testConfig.prompts) return;

    const promptsToTest = Array.isArray(this.testConfig.prompts)
      ? this.testConfig.prompts.reduce((acc, name) => ({ ...acc, [name]: {} }), {})
      : this.testConfig.prompts;

    for (const [promptName, config] of Object.entries(promptsToTest)) {
      await this.testPrompt(promptName, config as PromptTestConfig);
    }
  }

  private async testPrompt(name: string, config: PromptTestConfig): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await this.client.getPrompt(name, config.args || {});
      
      // Validate result if expectation provided
      if (config.expect) {
        const isValid = typeof config.expect === 'function'
          ? config.expect(result)
          : this.evaluateExpectation(result, config.expect);
        
        if (isValid) {
          this.addResult({
            name: `Prompt '${name}' execution`,
            type: 'prompt',
            status: 'pass',
            message: `Prompt executed successfully and met expectations`,
            duration: Date.now() - startTime
          });
        } else {
          this.addResult({
            name: `Prompt '${name}' execution`,
            type: 'prompt',
            status: 'fail',
            message: `Prompt executed but did not meet expectations: ${config.expect}`,
            duration: Date.now() - startTime
          });
        }
      } else {
        this.addResult({
          name: `Prompt '${name}' execution`,
          type: 'prompt',
          status: 'pass',
          message: `Prompt executed successfully`,
          duration: Date.now() - startTime
        });
      }
    } catch (error) {
      this.addResult({
        name: `Prompt '${name}' execution`,
        type: 'prompt',
        status: 'fail',
        message: `Prompt execution failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime
      });
    }
  }

  private matchesPattern(value: string, pattern: string): boolean {
    // Simple glob-style pattern matching
    const regex = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regex}$`).test(value);
  }

  private evaluateExpectation(value: unknown, expectation: string): boolean {
    // Safe expectation evaluation without eval
    try {
      // Handle common expectation patterns
      if (expectation === 'exists') {
        return value !== null && value !== undefined;
      }
      
      // Check for property access patterns (e.g., "content[0].text === '8'")
      if (expectation.includes('.') || expectation.includes('[')) {
        return this.evaluatePropertyExpectation(value, expectation);
      }
      
      if (expectation.includes('length')) {
        const match = expectation.match(/length\s*([><=]+)\s*(\d+)/);
        if (match) {
          const operator = match[1];
          const expected = parseInt(match[2], 10);
          const actualLength = Array.isArray(value) ? value.length : 
                              typeof value === 'string' ? value.length : 0;
          
          switch (operator) {
            case '>': return actualLength > expected;
            case '>=': return actualLength >= expected;
            case '<': return actualLength < expected;
            case '<=': return actualLength <= expected;
            case '==': case '===': return actualLength === expected;
            default: return false;
          }
        }
      }
      
      if (expectation.includes('count')) {
        const match = expectation.match(/count\s*([><=]+)\s*(\d+)/);
        if (match) {
          const operator = match[1];
          const expected = parseInt(match[2], 10);
          const actualCount = Array.isArray(value) ? value.length : 0;
          
          switch (operator) {
            case '>': return actualCount > expected;
            case '>=': return actualCount >= expected;
            case '<': return actualCount < expected;
            case '<=': return actualCount <= expected;
            case '==': case '===': return actualCount === expected;
            default: return false;
          }
        }
      }
      
      // Simple string contains check
      if (expectation.startsWith('contains:')) {
        const substring = expectation.slice(9);
        return typeof value === 'string' && value.includes(substring);
      }
      
      return false;
    } catch {
      return false;
    }
  }

  private evaluatePropertyExpectation(value: unknown, expectation: string): boolean {
    try {
      // Handle patterns like "content[0].text === '8'" or "results.length > 0"
      
      // Split on comparison operators to get property path and expected value  
      const comparisonMatch = expectation.match(/^(.+?)\s*(===|==|!==|!=|>=|<=|>|<)\s*(.+)$/);
      if (comparisonMatch) {
        const [, propertyPath, operator, expectedValueStr] = comparisonMatch;
        const actualValue = this.getPropertyValue(value, propertyPath.trim());
        const expectedValue = this.parseExpectedValue(expectedValueStr.trim());
        
        return this.compareValues(actualValue, operator, expectedValue);
      }
      
      // Handle simple property existence checks (e.g., "content && content.length > 0")
      if (expectation.includes('&&')) {
        const parts = expectation.split('&&').map(part => part.trim());
        return parts.every(part => {
          if (part.includes('>') || part.includes('<') || part.includes('===')) {
            return this.evaluatePropertyExpectation(value, part);
          } else {
            const propValue = this.getPropertyValue(value, part);
            return Boolean(propValue);
          }
        });
      }
      
      // Handle simple property path (e.g., "content.length")
      const propValue = this.getPropertyValue(value, expectation);
      return Boolean(propValue);
      
    } catch {
      return false;
    }
  }

  private getPropertyValue(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== 'object') return undefined;
    
    try {
      return path.split('.').reduce((current, key) => {
        if (current === null || current === undefined) return undefined;
        
        // Handle array access like "content[0]"
        if (key.includes('[') && key.includes(']')) {
          const match = key.match(/^(.+?)\[(\d+)\]$/);
          if (match) {
            const [, propName, indexStr] = match;
            const index = parseInt(indexStr, 10);
            const arrayValue = (current as any)[propName];
            return Array.isArray(arrayValue) ? arrayValue[index] : undefined;
          }
        }
        
        return (current as any)[key];
      }, obj);
    } catch {
      return undefined;
    }
  }

  private parseExpectedValue(str: string): unknown {
    // Remove quotes for strings
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
      return str.slice(1, -1);
    }
    
    // Parse numbers
    if (/^\d+(\.\d+)?$/.test(str)) {
      return parseFloat(str);
    }
    
    // Parse booleans
    if (str === 'true') return true;
    if (str === 'false') return false;
    if (str === 'null') return null;
    if (str === 'undefined') return undefined;
    
    // Return as string for everything else
    return str;
  }

  private compareValues(actual: unknown, operator: string, expected: unknown): boolean {
    switch (operator) {
      case '===': return actual === expected;
      case '==': return actual == expected;
      case '!==': return actual !== expected;
      case '!=': return actual != expected;
      case '>': return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
      case '>=': return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
      case '<': return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
      case '<=': return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
      default: return false;
    }
  }

  private addResult(result: Omit<TestResult, 'duration'> & { duration?: number }): void {
    this.results.push({
      duration: 0,
      ...result
    });
  }

  private async cleanup(): Promise<void> {
    try {
      await this.client.disconnect();
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  private createTestSuite(): TestSuite {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;

    return {
      total: this.results.length,
      passed,
      failed,
      skipped,
      results: this.results,
      duration: Date.now() - this.startTime
    };
  }
}