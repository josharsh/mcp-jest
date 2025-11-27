import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['e2e/test-server.js']
});

const client = new Client({ name: 'debug', version: '1.0.0' }, { capabilities: {} });

async function main() {
  await client.connect(transport);

  console.log('=== Tool Response ===');
  const toolResult = await client.callTool({ name: 'calculate', arguments: { expression: '2 + 2' } });
  console.log(JSON.stringify(toolResult, null, 2));

  console.log('\n=== Prompt Response ===');
  const promptResult = await client.getPrompt({ name: 'code-review', arguments: { language: 'js', code: 'test' } });
  console.log(JSON.stringify(promptResult, null, 2));

  await client.close();
  await transport.close();
}

main().catch(console.error);
