import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Create a demo MCP server for testing
const server = new McpServer({ name: "demo-server", version: "1.0.0" });

// Add tools
server.tool("add", 
  { a: z.number(), b: z.number() }, 
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

server.tool("search",
  { query: z.string() },
  async ({ query }) => ({
    content: [{ 
      type: "text", 
      text: `Search results for: ${query}\n1. Result one\n2. Result two\n3. Result three` 
    }]
  })
);

server.tool("echo",
  { message: z.string() },
  async ({ message }) => ({
    content: [{ type: "text", text: `Echo: ${message}` }]
  })
);

// Add resources
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{ 
      uri: uri.href, 
      text: `Hello, ${name}! Welcome to the demo MCP server.`,
      mimeType: "text/plain"
    }]
  })
);

// Add prompts
server.prompt(
  "review-code",
  { code: z.string() },
  ({ code }) => ({
    messages: [{
      role: "user",
      content: { 
        type: "text", 
        text: `Please review this code and provide feedback:\n\n\`\`\`\n${code}\n\`\`\`` 
      }
    }]
  })
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Demo MCP server started successfully");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});