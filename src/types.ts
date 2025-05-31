export interface MCPTestConfig {
  tools?: string[] | Record<string, ToolTestConfig>;
  resources?: string[] | Record<string, ResourceTestConfig>;
  prompts?: string[] | Record<string, PromptTestConfig>;
  timeout?: number;
  maxRetries?: number;
}

export interface ToolTestConfig {
  args?: Record<string, unknown>;
  expect?: string | ((result: unknown) => boolean);
  shouldThrow?: boolean;
}

export interface ResourceTestConfig {
  expect?: string | ((content: unknown) => boolean);
  shouldExist?: boolean;
}

export interface PromptTestConfig {
  args?: Record<string, unknown>;
  expect?: string | ((result: unknown) => boolean);
}

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface TestResult {
  name: string;
  type: 'connection' | 'capability' | 'tool' | 'resource' | 'prompt';
  status: 'pass' | 'fail' | 'skip';
  message?: string;
  error?: Error;
  duration?: number;
}

export interface TestSuite {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  results: TestResult[];
  duration: number;
}

export interface MCPCapabilities {
  tools?: Array<{ name: string; description?: string; inputSchema?: object }>;
  resources?: Array<{ uri: string; name?: string; description?: string; mimeType?: string }>;
  prompts?: Array<{ name: string; description?: string; arguments?: object }>;
}