import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EdictStore } from 'edicts';
import { registerEdictTools } from '../src/tools.js';

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'edicts-tools-'));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe('registerEdictTools', () => {
  it('registers 7 tools with optional=false', () => {
    const registerTool = vi.fn();
    const store = new EdictStore({ path: join(tempDir, 'e.yaml'), autoSave: true });

    registerEdictTools({ registerTool }, store);

    expect(registerTool).toHaveBeenCalledTimes(1);
    const [factory, opts] = registerTool.mock.calls[0];
    expect(opts).toMatchObject({ optional: false });
    expect(opts.names).toHaveLength(7);
    expect(opts.names).toContain('edicts_list');
    expect(opts.names).toContain('edicts_add');
    expect(opts.names).toContain('edicts_review');

    const tools = factory();
    expect(tools).toHaveLength(7);
  });

  it('edicts_add creates an edict and edicts_list returns it', async () => {
    const registerTool = vi.fn();
    const store = new EdictStore({ path: join(tempDir, 'e.yaml'), autoSave: true });
    registerEdictTools({ registerTool }, store);
    const tools = registerTool.mock.calls[0][0]();

    const addTool = tools.find((t: any) => t.name === 'edicts_add');
    const addResult = await addTool.execute('1', { text: 'Test edict', category: 'test' });
    expect(addResult.content[0].text).toContain('Edict created');

    const listTool = tools.find((t: any) => t.name === 'edicts_list');
    const listResult = await listTool.execute('2');
    expect(listResult.content[0].text).toContain('Test edict');
    expect(listResult.content[0].text).toContain('1 edict(s) found');
  });

  it('edicts_remove returns error for nonexistent id', async () => {
    const registerTool = vi.fn();
    const store = new EdictStore({ path: join(tempDir, 'e.yaml'), autoSave: true });
    registerEdictTools({ registerTool }, store);
    const tools = registerTool.mock.calls[0][0]();

    const removeTool = tools.find((t: any) => t.name === 'edicts_remove');
    const result = await removeTool.execute('1', { id: 'nonexistent' });
    expect(result.content[0].text).toContain('not_found');
  });

  it('edicts_search finds matching edicts', async () => {
    const registerTool = vi.fn();
    const store = new EdictStore({ path: join(tempDir, 'e.yaml'), autoSave: true });
    registerEdictTools({ registerTool }, store);
    const tools = registerTool.mock.calls[0][0]();

    const addTool = tools.find((t: any) => t.name === 'edicts_add');
    await addTool.execute('1', { text: 'Never deploy on Friday', category: 'ops' });
    await addTool.execute('2', { text: 'Use TypeScript always', category: 'dev' });

    const searchTool = tools.find((t: any) => t.name === 'edicts_search');
    const result = await searchTool.execute('3', { query: 'deploy' });
    expect(result.content[0].text).toContain('deploy');
    expect(result.content[0].text).toContain('1 match');
  });

  it('edicts_stats returns statistics', async () => {
    const registerTool = vi.fn();
    const store = new EdictStore({ path: join(tempDir, 'e.yaml'), autoSave: true });
    registerEdictTools({ registerTool }, store);
    const tools = registerTool.mock.calls[0][0]();

    const statsTool = tools.find((t: any) => t.name === 'edicts_stats');
    const result = await statsTool.execute('1');
    expect(result.content[0].text).toContain('statistics');
  });
});
