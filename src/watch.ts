/**
 * Watch Mode for MCP-Jest
 *
 * Monitors file changes and automatically re-runs tests.
 * Supports smart re-running based on what changed.
 */

import { watch, FSWatcher } from 'fs';
import { resolve, relative, dirname } from 'path';
import { MCPTestRunner } from './runner.js';
import type { MCPServerConfig, MCPTestConfig, TestSuite } from './types.js';

/**
 * Watch mode options
 */
export interface WatchOptions {
  /** Directories/files to watch */
  paths?: string[];
  /** File patterns to include (glob-style) */
  include?: string[];
  /** File patterns to exclude (glob-style) */
  exclude?: string[];
  /** Debounce delay in ms */
  debounce?: number;
  /** Clear console on re-run */
  clearOnRerun?: boolean;
  /** Run all tests on start */
  runOnStart?: boolean;
  /** Callback for test results */
  onResults?: (results: TestSuite) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Watch mode state
 */
interface WatchState {
  isRunning: boolean;
  lastRun: Date | null;
  runCount: number;
  lastChangedFile: string | null;
}

/**
 * Watch Mode Manager
 *
 * Watches for file changes and triggers test re-runs
 */
export class WatchMode {
  private watchers: FSWatcher[] = [];
  private options: Required<WatchOptions>;
  private state: WatchState = {
    isRunning: false,
    lastRun: null,
    runCount: 0,
    lastChangedFile: null
  };
  private debounceTimer: NodeJS.Timeout | null = null;
  private abortController: AbortController | null = null;

  constructor(
    private serverConfig: MCPServerConfig,
    private testConfig: MCPTestConfig,
    options: WatchOptions = {}
  ) {
    this.options = {
      paths: options.paths || [process.cwd()],
      include: options.include || ['**/*.js', '**/*.ts', '**/*.json', '**/*.mjs'],
      exclude: options.exclude || ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/__snapshots__/**'],
      debounce: options.debounce ?? 300,
      clearOnRerun: options.clearOnRerun ?? true,
      runOnStart: options.runOnStart ?? true,
      onResults: options.onResults || (() => {}),
      onError: options.onError || ((err) => console.error('Watch error:', err)),
      verbose: options.verbose ?? false
    };
  }

  /**
   * Start watch mode
   */
  async start(): Promise<void> {
    this.printBanner();

    // Set up file watchers
    for (const watchPath of this.options.paths) {
      this.setupWatcher(resolve(watchPath));
    }

    // Run tests on start if configured
    if (this.options.runOnStart) {
      await this.runTests('Initial run');
    }

    // Handle process signals for cleanup
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());

    this.log('Watch mode started. Waiting for changes...');
    this.printHelp();
  }

  /**
   * Stop watch mode
   */
  stop(): void {
    // Abort any running tests
    if (this.abortController) {
      this.abortController.abort();
    }

    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Close all watchers
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];

    console.log('\n👋 Watch mode stopped.');
    process.exit(0);
  }

  /**
   * Set up file watcher for a path
   */
  private setupWatcher(watchPath: string): void {
    try {
      const watcher = watch(
        watchPath,
        { recursive: true },
        (eventType, filename) => {
          if (filename && this.shouldProcessFile(filename)) {
            this.handleFileChange(filename, eventType);
          }
        }
      );

      watcher.on('error', (error) => {
        this.options.onError(error);
      });

      this.watchers.push(watcher);
      this.log(`Watching: ${watchPath}`);
    } catch (error) {
      this.options.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Check if file should trigger re-run
   */
  private shouldProcessFile(filename: string): boolean {
    // Check excludes
    for (const pattern of this.options.exclude) {
      if (this.matchGlob(filename, pattern)) {
        return false;
      }
    }

    // Check includes
    for (const pattern of this.options.include) {
      if (this.matchGlob(filename, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Simple glob matching (supports ** and *)
   */
  private matchGlob(path: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/{{GLOBSTAR}}/g, '.*')
      .replace(/\//g, '\\/');

    return new RegExp(`^${regexPattern}$`).test(path) ||
      new RegExp(regexPattern).test(path);
  }

  /**
   * Handle file change event
   */
  private handleFileChange(filename: string, eventType: string): void {
    this.state.lastChangedFile = filename;

    // Debounce multiple rapid changes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.runTests(`File changed: ${filename}`);
    }, this.options.debounce);
  }

  /**
   * Run tests
   */
  private async runTests(reason: string): Promise<void> {
    // Don't run if already running
    if (this.state.isRunning) {
      this.log('Tests already running, queuing...');
      return;
    }

    this.state.isRunning = true;
    this.state.runCount++;
    this.abortController = new AbortController();

    // Clear console if configured
    if (this.options.clearOnRerun) {
      console.clear();
      this.printBanner();
    }

    console.log(`\n🔄 ${reason}`);
    console.log('─'.repeat(60));

    const startTime = Date.now();

    try {
      const runner = new MCPTestRunner(this.serverConfig, this.testConfig);
      const results = await runner.run();

      this.state.lastRun = new Date();
      this.options.onResults(results);

      // Print results
      this.printResults(results, Date.now() - startTime);

    } catch (error) {
      console.error(`\n❌ Test run failed: ${error instanceof Error ? error.message : String(error)}`);
      this.options.onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.state.isRunning = false;
      this.abortController = null;

      console.log('\n⏳ Waiting for changes...');
      this.printHelp();
    }
  }

  /**
   * Print watch mode banner
   */
  private printBanner(): void {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║              MCP-JEST WATCH MODE                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
  }

  /**
   * Print test results
   */
  private printResults(results: TestSuite, duration: number): void {
    const passRate = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;
    const statusIcon = results.failed === 0 ? '✅' : '❌';

    console.log('');
    console.log(`${statusIcon} Tests: ${results.passed} passed, ${results.failed} failed, ${results.total} total`);
    console.log(`   Pass rate: ${passRate}%`);
    console.log(`   Duration: ${duration}ms`);

    // Print failed tests
    if (results.failed > 0) {
      console.log('');
      console.log('Failed Tests:');
      for (const result of results.results) {
        if (result.status === 'fail') {
          console.log(`   ❌ ${result.name}`);
          if (result.message) {
            console.log(`      ${result.message}`);
          }
        }
      }
    }
  }

  /**
   * Print help information
   */
  private printHelp(): void {
    console.log('');
    console.log('Press Ctrl+C to exit watch mode');
  }

  /**
   * Log verbose messages
   */
  private log(message: string): void {
    if (this.options.verbose) {
      console.log(`[watch] ${message}`);
    }
  }

  /**
   * Get current state
   */
  getState(): Readonly<WatchState> {
    return { ...this.state };
  }

  /**
   * Force a test run
   */
  async forceRun(): Promise<void> {
    await this.runTests('Manual trigger');
  }
}

/**
 * Start watch mode (convenience function)
 */
export async function startWatchMode(
  serverConfig: MCPServerConfig,
  testConfig: MCPTestConfig,
  options?: WatchOptions
): Promise<WatchMode> {
  const watchMode = new WatchMode(serverConfig, testConfig, options);
  await watchMode.start();
  return watchMode;
}
