import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { MCPServerConfig, MCPCapabilities, TestResult } from './types.js';

export class MCPTestClient {
  private client?: Client;
  private transport?: StdioClientTransport;
  
  constructor(private serverConfig: MCPServerConfig) {}

  async connect(timeout: number = 30000): Promise<void> {
    try {
      this.transport = new StdioClientTransport({
        command: this.serverConfig.command,
        args: this.serverConfig.args || [],
        env: this.serverConfig.env
      });

      this.client = new Client({
        name: "mcp-jest-client",
        version: "1.0.0"
      }, {
        capabilities: {}
      });

      // Wrap connection with timeout
      await this.connectWithTimeout(timeout);
    } catch (error) {
      throw new Error(`Failed to connect to MCP server: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async connectWithTimeout(timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Server startup timeout after ${timeout}ms. Server may have failed to start or is not responding.`));
      }, timeout);

      this.client!.connect(this.transport!)
        .then(() => {
          clearTimeout(timeoutId);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = undefined;
    }
    if (this.transport) {
      await this.transport.close();
      this.transport = undefined;
    }
  }

  async getCapabilities(): Promise<MCPCapabilities> {
    if (!this.client) {
      throw new Error('Client not connected. Call connect() first.');
    }

    try {
      // List tools
      const toolsResponse = await this.client.listTools();

      // List resources  
      const resourcesResponse = await this.client.listResources();

      // List prompts
      const promptsResponse = await this.client.listPrompts();

      return {
        tools: toolsResponse.tools || [],
        resources: resourcesResponse.resources || [],
        prompts: promptsResponse.prompts || []
      };
    } catch (error) {
      throw new Error(`Failed to get capabilities: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.client) {
      throw new Error('Client not connected. Call connect() first.');
    }

    try {
      const response = await this.client.callTool({
        name,
        arguments: args
      });

      return response;
    } catch (error) {
      throw new Error(`Tool '${name}' failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async readResource(uri: string): Promise<unknown> {
    if (!this.client) {
      throw new Error('Client not connected. Call connect() first.');
    }

    try {
      const response = await this.client.readResource({ uri });

      return response;
    } catch (error) {
      throw new Error(`Resource '${uri}' failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPrompt(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.client) {
      throw new Error('Client not connected. Call connect() first.');
    }

    try {
      const response = await this.client.getPrompt({
        name,
        arguments: args as Record<string, string>
      });

      return response;
    } catch (error) {
      throw new Error(`Prompt '${name}' failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async ping(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}