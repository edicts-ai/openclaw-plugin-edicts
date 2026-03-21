import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { EdictStore } from 'edicts';
import { resolveConfig } from './src/config.js';
import { createContextHook } from './src/context.js';
import { registerEdictTools } from './src/tools.js';

/**
 * OpenClaw plugin API surface — types inferred from OpenClaw runtime.
 * No compile-time dependency on OpenClaw; the runtime provides the API object.
 */
export interface OpenClawPluginApi {
  pluginConfig?: Record<string, unknown>;
  workspaceDir: string;
  registerTool(
    factory: () => Array<{
      name: string;
      description: string;
      parameters: unknown;
      execute: (id: string, params: any) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;
    }>,
    opts?: { names?: string[]; optional?: boolean },
  ): void;
  on(
    hookName: 'before_prompt_build',
    handler: () => Promise<{ appendSystemContext?: string } | Record<string, never>>,
  ): void;
}

/**
 * Create a starter edicts.yaml if the file doesn't exist yet.
 * For OpenClaw users this means zero bootstrapping — install the plugin and go.
 */
function ensureEdictsFile(filePath: string): void {
  if (existsSync(filePath)) return;
  const now = new Date().toISOString();
  const template = [
    'version: 1',
    'config:',
    '  maxEdicts: 200',
    '  tokenBudget: 4000',
    '  categories: []',
    'edicts: []',
    'history: []',
    '',
  ].join('\n');
  writeFileSync(filePath, template, 'utf-8');
}

const plugin = {
  id: 'edicts',
  name: 'Edicts',
  description: 'Inject agent edicts into context and expose CRUD tools.',

  register(api: OpenClawPluginApi) {
    const config = resolveConfig(api.pluginConfig ?? {});

    if (!api.workspaceDir) {
      // Install-time probe — workspace not available yet. Skip initialization.
      return;
    }

    const storePath = path.resolve(api.workspaceDir, config.path);

    // Auto-create edicts file on first run — no manual init needed
    ensureEdictsFile(storePath);

    const store = new EdictStore({
      path: storePath,
      format: config.format,
      tokenBudget: config.tokenBudget,
      autoSave: true,
    });

    registerEdictTools(api, store);

    if (config.autoInject) {
      api.on('before_prompt_build', createContextHook(store, config));
    }
  },
};

export default plugin;
