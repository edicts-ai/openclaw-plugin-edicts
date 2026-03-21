import { renderPlain } from 'edicts';
import type { EdictStore } from 'edicts';
import type { ResolvedConfig } from './config.js';

/**
 * Creates the before_prompt_build hook that injects edicts into system context.
 * v1: injects all edicts (autoInjectFilter = "all").
 */
export function createContextHook(
  store: EdictStore,
  config: ResolvedConfig,
): () => Promise<{ appendSystemContext?: string } | Record<string, never>> {
  return async () => {
    try {
      await store.load();
    } catch {
      // File doesn't exist yet — empty store, nothing to inject
      return {};
    }

    const edicts = await store.all();

    if (edicts.length === 0) {
      return {};
    }

    const rendered = renderPlain(edicts);
    const appendSystemContext = wrapEdicts(rendered);

    return { appendSystemContext };
  };
}

function wrapEdicts(rendered: string): string {
  return [
    '## Edicts (Standing Instructions)',
    'The following are your standing instructions. Follow them unless explicitly overridden.',
    '',
    rendered,
  ].join('\n');
}
