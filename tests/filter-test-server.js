import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Create a test MCP server with various tools for filtering tests
const server = new McpServer({ name: "filter-test-server", version: "1.0.0" });

// User-related tools
server.tool("getUser", 
  { userId: z.string() }, 
  async ({ userId }) => ({
    content: [{ type: "text", text: `User data for ${userId}` }]
  })
);

server.tool("getUserProfile",
  { userId: z.string() },
  async ({ userId }) => ({
    content: [{ type: "text", text: `User profile for ${userId}` }]
  })
);

server.tool("updateUser",
  { userId: z.string(), data: z.object({}) },
  async ({ userId }) => ({
    content: [{ type: "text", text: `Updated user ${userId}` }]
  })
);

// Search-related tools
server.tool("search",
  { query: z.string() },
  async ({ query }) => ({
    content: [{ type: "text", text: `Search results for: ${query}` }]
  })
);

server.tool("searchAdvanced",
  { query: z.string(), filters: z.object({}).optional() },
  async ({ query }) => ({
    content: [{ type: "text", text: `Advanced search results for: ${query}` }]
  })
);

// Email-related tools
server.tool("sendEmail",
  { to: z.string(), subject: z.string(), body: z.string() },
  async ({ to }) => ({
    content: [{ type: "text", text: `Email sent to ${to}` }]
  })
);

server.tool("getEmails",
  { folder: z.string().optional() },
  async ({ folder }) => ({
    content: [{ type: "text", text: `Emails from ${folder || 'inbox'}` }]
  })
);

// Weather tools
server.tool("getWeather",
  { city: z.string() },
  async ({ city }) => ({
    content: [{ type: "text", text: `Weather in ${city}: Sunny, 72°F` }]
  })
);

server.tool("getForecast",
  { city: z.string(), days: z.number().optional() },
  async ({ city, days }) => ({
    content: [{ type: "text", text: `${days || 7}-day forecast for ${city}` }]
  })
);

// Math tools
server.tool("calculate",
  { expression: z.string() },
  async ({ expression }) => ({
    content: [{ type: "text", text: `Result: ${expression} = 42` }]
  })
);

server.tool("add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

// Add some resources
server.resource(
  "user-data",
  new ResourceTemplate("user://{id}", { list: undefined }),
  async (uri, { id }) => ({
    contents: [{ 
      uri: uri.href, 
      text: `User resource for ${id}`,
      mimeType: "text/plain"
    }]
  })
);

server.resource(
  "search-index",
  new ResourceTemplate("search://index", { list: undefined }),
  async (uri) => ({
    contents: [{ 
      uri: uri.href, 
      text: `Search index data`,
      mimeType: "text/plain"
    }]
  })
);

server.resource(
  "email-templates",
  new ResourceTemplate("email://templates/{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{ 
      uri: uri.href, 
      text: `Email template: ${name}`,
      mimeType: "text/plain"
    }]
  })
);

// Add some prompts
server.prompt(
  "userPrompt",
  { userId: z.string() },
  ({ userId }) => ({
    messages: [{
      role: "user",
      content: { 
        type: "text", 
        text: `Generate a summary for user ${userId}` 
      }
    }]
  })
);

server.prompt(
  "searchPrompt",
  { query: z.string() },
  ({ query }) => ({
    messages: [{
      role: "user",
      content: { 
        type: "text", 
        text: `Help me search for: ${query}` 
      }
    }]
  })
);

server.prompt(
  "emailPrompt",
  { context: z.string() },
  ({ context }) => ({
    messages: [{
      role: "user",
      content: { 
        type: "text", 
        text: `Draft an email about: ${context}` 
      }
    }]
  })
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Filter test MCP server started successfully");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});