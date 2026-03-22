import type { EdictStore } from 'edicts';
import type { ResolvedConfig } from './config.js';

/**
 * Creates the before_prompt_build hook that injects edicts into system context.
 * v1: injects all edicts (autoInjectFilter = "all").
 */
export function createContextHook(
  store: EdictStore,
  config: ResolvedConfig,
): () => Promise<{ prependSystemContext?: string } | Record<string, never>> {
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

    const rendered = renderEdictTexts(edicts);
    const prependSystemContext = wrapEdicts(rendered);

    return { prependSystemContext };
  };
}

function renderEdictTexts(edicts: Array<{ text: string; category?: string }>): string {
  return edicts.map((edict) => {
    const prefix = edict.category ? `[${edict.category}] ` : '';
    return `- ${prefix}${edict.text}`;
  }).join('\n');
}

function wrapEdicts(rendered: string): string {
  return [
    '## EDICTS — BINDING STANDING INSTRUCTIONS',
    '',
    'The following are standing instructions provided by the user for this workspace/session.',
    'Treat them as binding operational rules unless explicitly overridden by the user.',
    'These edicts complement the system and developer instructions. If there is a conflict, follow higher-priority instructions first, then these edicts.',
    'This block is the canonical, live list of edicts. If prior conversation context mentions edicts that are not listed here, they have been removed — do not reference them.',
    '',
    rendered,
    '',
    '## END EDICTS',
  ].join('\n');
}
