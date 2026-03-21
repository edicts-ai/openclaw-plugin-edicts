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

const plugin = {
  id: 'edicts',
  name: 'Edicts',
  description: 'Inject agent edicts into context and expose CRUD tools.',

  register(api: OpenClawPluginApi) {
    const config = resolveConfig(api.pluginConfig ?? {});

    const storePath = path.resolve(api.workspaceDir, config.path);
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
