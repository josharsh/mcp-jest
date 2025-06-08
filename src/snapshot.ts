import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { Snapshot, SnapshotConfig } from './types.js';

export class SnapshotManager {
  private snapshotDir: string;
  private updateSnapshots: boolean;
  private snapshots: Map<string, Snapshot> = new Map();

  constructor(
    baseDir: string = process.cwd(),
    updateSnapshots: boolean = process.env.UPDATE_SNAPSHOTS === 'true'
  ) {
    this.snapshotDir = path.join(baseDir, '__snapshots__');
    this.updateSnapshots = updateSnapshots;
  }

  async init(): Promise<void> {
    try {
      await fs.mkdir(this.snapshotDir, { recursive: true });
      await this.loadSnapshots();
    } catch (error) {
      console.warn('Failed to initialize snapshot directory:', error);
    }
  }

  private async loadSnapshots(): Promise<void> {
    try {
      const files = await fs.readdir(this.snapshotDir);
      const snapshotFiles = files.filter(f => f.endsWith('.snap.json'));
      
      for (const file of snapshotFiles) {
        const content = await fs.readFile(path.join(this.snapshotDir, file), 'utf-8');
        const snapshot = JSON.parse(content) as Snapshot;
        this.snapshots.set(snapshot.name, snapshot);
      }
    } catch (error) {
      // Directory might not exist yet, which is fine
    }
  }

  generateSnapshotName(
    testType: 'tool' | 'resource' | 'prompt',
    testName: string,
    customName?: string
  ): string {
    if (customName) {
      return customName;
    }
    
    // Create a deterministic name based on test type and name
    const base = `${testType}-${testName}`;
    const hash = createHash('md5').update(base).digest('hex').substring(0, 8);
    return `${base}-${hash}`;
  }

  async captureSnapshot(
    name: string,
    data: unknown,
    metadata?: Snapshot['metadata']
  ): Promise<void> {
    const snapshot: Snapshot = {
      name,
      timestamp: new Date().toISOString(),
      data: this.normalizeData(data),
      metadata
    };

    if (this.updateSnapshots) {
      await this.saveSnapshot(snapshot);
      this.snapshots.set(name, snapshot);
    }
  }

  async compareSnapshot(
    name: string,
    actualData: unknown,
    config?: SnapshotConfig
  ): Promise<{ match: boolean; diff?: string; existingSnapshot?: Snapshot }> {
    const normalized = this.normalizeData(actualData);
    const processedData = config ? this.processSnapshotConfig(normalized, config) : normalized;
    
    const existingSnapshot = this.snapshots.get(name);
    
    if (!existingSnapshot) {
      if (this.updateSnapshots) {
        // Create new snapshot
        await this.captureSnapshot(name, processedData);
        return { match: true };
      }
      return { 
        match: false, 
        diff: `Snapshot "${name}" does not exist. Run with UPDATE_SNAPSHOTS=true to create it.` 
      };
    }

    const processedExisting = config ? 
      this.processSnapshotConfig(existingSnapshot.data, config) : 
      existingSnapshot.data;

    const match = this.deepEqual(processedData, processedExisting);
    
    if (!match) {
      if (this.updateSnapshots) {
        // Update existing snapshot
        await this.captureSnapshot(name, processedData, existingSnapshot.metadata);
        return { match: true };
      }
      
      const diff = this.generateDiff(processedExisting, processedData);
      return { match: false, diff, existingSnapshot };
    }

    return { match: true, existingSnapshot };
  }

  private processSnapshotConfig(data: unknown, config: SnapshotConfig): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    let processed: any = data;

    // Extract specific properties if specified
    if (config.properties && config.properties.length > 0) {
      processed = {};
      for (const prop of config.properties) {
        const value = this.getNestedProperty(data, prop);
        this.setNestedProperty(processed, prop, value);
      }
    }

    // Exclude properties if specified
    if (config.exclude && config.exclude.length > 0) {
      processed = this.deepClone(processed);
      for (const prop of config.exclude) {
        this.deleteNestedProperty(processed, prop);
      }
    }

    return processed;
  }

  private getNestedProperty(obj: any, path: string): unknown {
    const parts = path.split(/[\.\[\]]/).filter(Boolean);
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  private setNestedProperty(obj: any, path: string, value: unknown): void {
    const parts = path.split(/[\.\[\]]/).filter(Boolean);
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = isNaN(Number(parts[i + 1])) ? {} : [];
      }
      current = current[part];
    }
    
    if (parts.length > 0) {
      current[parts[parts.length - 1]] = value;
    }
  }

  private deleteNestedProperty(obj: any, path: string): void {
    const parts = path.split(/[\.\[\]]/).filter(Boolean);
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        return;
      }
      current = current[part];
    }
    
    delete current[parts[parts.length - 1]];
  }

  private normalizeData(data: unknown): unknown {
    // Sort object keys for consistent snapshots
    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        return data.map(item => this.normalizeData(item));
      }
      
      const sorted: Record<string, unknown> = {};
      const keys = Object.keys(data as object).sort();
      
      for (const key of keys) {
        sorted[key] = this.normalizeData((data as any)[key]);
      }
      
      return sorted;
    }
    
    return data;
  }

  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    
    if (a === null || b === null) return a === b;
    if (a === undefined || b === undefined) return a === b;
    
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object' && a !== null && b !== null) {
      const aObj = a as Record<string, unknown>;
      const bObj = b as Record<string, unknown>;
      
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!this.deepEqual(a[i], b[i])) return false;
        }
        return true;
      }
      
      const aKeys = Object.keys(aObj);
      const bKeys = Object.keys(bObj);
      
      if (aKeys.length !== bKeys.length) return false;
      
      for (const key of aKeys) {
        if (!bKeys.includes(key)) return false;
        if (!this.deepEqual(aObj[key], bObj[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }

  private deepClone(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (obj instanceof Object) {
      const cloned: Record<string, unknown> = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone((obj as any)[key]);
        }
      }
      return cloned;
    }
    return obj;
  }

  private generateDiff(expected: unknown, actual: unknown): string {
    const lines: string[] = [];
    this.generateDiffRecursive(expected, actual, '', lines);
    return lines.join('\n');
  }

  private generateDiffRecursive(
    expected: unknown,
    actual: unknown,
    path: string,
    lines: string[]
  ): void {
    if (this.deepEqual(expected, actual)) {
      return;
    }

    if (expected === undefined && actual !== undefined) {
      lines.push(`+ ${path}: ${JSON.stringify(actual, null, 2)}`);
      return;
    }

    if (expected !== undefined && actual === undefined) {
      lines.push(`- ${path}: ${JSON.stringify(expected, null, 2)}`);
      return;
    }

    if (typeof expected !== typeof actual) {
      lines.push(`- ${path}: ${JSON.stringify(expected, null, 2)}`);
      lines.push(`+ ${path}: ${JSON.stringify(actual, null, 2)}`);
      return;
    }

    if (typeof expected === 'object' && expected !== null && actual !== null) {
      const allKeys = new Set([
        ...Object.keys(expected as object),
        ...Object.keys(actual as object)
      ]);

      for (const key of allKeys) {
        const newPath = path ? `${path}.${key}` : key;
        this.generateDiffRecursive(
          (expected as any)[key],
          (actual as any)[key],
          newPath,
          lines
        );
      }
      return;
    }

    if (expected !== actual) {
      lines.push(`- ${path}: ${JSON.stringify(expected, null, 2)}`);
      lines.push(`+ ${path}: ${JSON.stringify(actual, null, 2)}`);
    }
  }

  private async saveSnapshot(snapshot: Snapshot): Promise<void> {
    const filename = `${snapshot.name}.snap.json`;
    const filepath = path.join(this.snapshotDir, filename);
    
    await fs.writeFile(
      filepath,
      JSON.stringify(snapshot, null, 2),
      'utf-8'
    );
  }

  async getSnapshotStats(): Promise<{
    total: number;
    updated: number;
    created: number;
  }> {
    // This would track statistics during a test run
    return {
      total: this.snapshots.size,
      updated: 0,
      created: 0
    };
  }
}