export interface MCPTestConfig {
  tools?: string[] | Record<string, ToolTestConfig>;
  resources?: string[] | Record<string, ResourceTestConfig>;
  prompts?: string[] | Record<string, PromptTestConfig>;
  timeout?: number;
  maxRetries?: number;
  filter?: string;
  skip?: string;
}

export interface ToolTestConfig {
  args?: Record<string, unknown>;
  expect?: string | ((result: unknown) => boolean);
  shouldThrow?: boolean;
  snapshot?: boolean | string | SnapshotConfig;
}

export interface ResourceTestConfig {
  expect?: string | ((content: unknown) => boolean);
  shouldExist?: boolean;
  snapshot?: boolean | string | SnapshotConfig;
}

export interface PromptTestConfig {
  args?: Record<string, unknown>;
  expect?: string | ((result: unknown) => boolean);
  snapshot?: boolean | string | SnapshotConfig;
}

export interface SnapshotConfig {
  name?: string;
  properties?: string[];
  exclude?: string[];
  updateSnapshot?: boolean;
}

export interface Snapshot {
  name: string;
  timestamp: string;
  data: unknown;
  metadata?: {
    testType: 'tool' | 'resource' | 'prompt';
    testName: string;
    serverCommand?: string;
  };
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