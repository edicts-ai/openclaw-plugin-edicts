import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EdictStore } from 'edicts';
import { createContextHook } from '../src/context.js';
import { resolveConfig } from '../src/config.js';

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'edicts-ctx-'));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe('createContextHook', () => {
  it('returns empty object when store has no edicts', async () => {
    const store = new EdictStore({ path: join(tempDir, 'edicts.yaml'), autoSave: true });
    const config = resolveConfig({});
    const hook = createContextHook(store, config);
    const result = await hook();
    expect(result).toEqual({});
  });

  it('injects edicts into appendSystemContext', async () => {
    const storePath = join(tempDir, 'edicts.yaml');
    const store = new EdictStore({ path: storePath, autoSave: true });
    await store.load();
    await store.add({ text: 'Always use TypeScript', category: 'coding' });
    await store.add({ text: 'Deploy on Fridays is banned', category: 'ops' });

    const config = resolveConfig({});
    const hook = createContextHook(store, config);
    const result = await hook();

    expect(result).toHaveProperty('appendSystemContext');
    const ctx = (result as { appendSystemContext: string }).appendSystemContext;
    expect(ctx).toContain('Edicts (Standing Instructions)');
    expect(ctx).toContain('Always use TypeScript');
    expect(ctx).toContain('Deploy on Fridays is banned');
  });

  it('returns empty when store file does not exist', async () => {
    const store = new EdictStore({ path: join(tempDir, 'nonexistent.yaml'), autoSave: true });
    const config = resolveConfig({});
    const hook = createContextHook(store, config);
    const result = await hook();
    expect(result).toEqual({});
  });
});
