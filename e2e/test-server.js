#!/usr/bin/env node

/**
 * Simple MCP Test Server for E2E Testing
 *
 * Implements a minimal MCP server with tools, resources, and prompts
 * for testing mcp-jest functionality.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server({
  name: 'test-server',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {},
    resources: {},
    prompts: {}
  }
});

// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      inputSchema: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'Mathematical expression' }
        },
        required: ['expression']
      }
    },
    {
      name: 'echo',
      description: 'Echo back the input',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Message to echo' }
        },
        required: ['message']
      }
    },
    {
      name: 'greet',
      description: 'Generate a greeting',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name to greet' }
        },
        required: ['name']
      }
    }
  ]
}));

// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'calculate':
      try {
        const expr = args?.expression || '';
        if (!/^[\d\s+\-*/().]+$/.test(expr)) {
          return {
            content: [{ type: 'text', text: 'Error: Invalid expression' }],
            isError: true
          };
        }
        const result = Function(`"use strict"; return (${expr})`)();
        return {
          content: [{ type: 'text', text: String(result) }]
        };
      } catch (e) {
        return {
          content: [{ type: 'text', text: `Error: ${e.message}` }],
          isError: true
        };
      }

    case 'echo':
      return {
        content: [{ type: 'text', text: args?.message || '' }]
      };

    case 'greet':
      return {
        content: [{ type: 'text', text: `Hello, ${args?.name || 'World'}!` }]
      };

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true
      };
  }
});

// List Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'config://settings',
      name: 'Application Settings',
      description: 'Current application configuration',
      mimeType: 'application/json'
    },
    {
      uri: 'data://users',
      name: 'User Data',
      description: 'List of users',
      mimeType: 'application/json'
    }
  ]
}));

// Read Resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'config://settings':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            theme: 'dark',
            language: 'en',
            version: '1.0.0'
          }, null, 2)
        }]
      };

    case 'data://users':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify([
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
          ], null, 2)
        }]
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// List Prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: 'code-review',
      description: 'Review code for best practices',
      arguments: [
        { name: 'language', description: 'Programming language', required: true },
        { name: 'code', description: 'Code to review', required: true }
      ]
    }
  ]
}));

// Get Prompt
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'code-review') {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please review this ${args?.language || 'code'} code:\n\n${args?.code || '// No code provided'}`
          }
        }
      ]
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Test MCP server started');
}

main().catch(console.error);
