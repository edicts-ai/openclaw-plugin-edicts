import type { EdictStore } from 'edicts';
import type { EdictInput, FindQuery } from 'edicts';
import {
  EdictNotFoundError,
  EdictValidationError,
  EdictBudgetExceededError,
  EdictCountLimitError,
  EdictCategoryError,
} from 'edicts';

type ToolResult = { content: Array<{ type: 'text'; text: string }> };
type Tool = {
  name: string;
  description: string;
  parameters: unknown;
  execute: (id: string, params?: any) => Promise<ToolResult>;
};

function text(msg: string): ToolResult {
  return { content: [{ type: 'text', text: msg }] };
}

function serialize(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function friendlyError(err: unknown): string {
  if (err instanceof EdictNotFoundError) return `No edict found with id '${(err as any).id ?? 'unknown'}'`;
  if (err instanceof EdictValidationError) return `Validation error: ${err.message}`;
  if (err instanceof EdictBudgetExceededError) return `Token budget exceeded: ${err.message}`;
  if (err instanceof EdictCountLimitError) return `Edict count limit reached: ${err.message}`;
  if (err instanceof EdictCategoryError) return `Category error: ${err.message}`;
  if (err instanceof Error) return err.message;
  return String(err);
}

const TOOL_NAMES = [
  'edicts_list',
  'edicts_add',
  'edicts_update',
  'edicts_remove',
  'edicts_search',
  'edicts_stats',
  'edicts_review',
] as const;

async function ensureLoaded(store: EdictStore): Promise<EdictStore> {
  await store.load();
  return store;
}

function buildTools(store: EdictStore): Tool[] {
  return [
    {
      name: 'edicts_list',
      description: 'List edicts with optional filtering by category, tags, or ttl.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          ttl: { type: 'string', enum: ['ephemeral', 'event', 'durable', 'permanent'] },
          limit: { type: 'number' },
        },
      },
      async execute(_id: string, params: FindQuery & { limit?: number } = {}) {
        try {
          const s = await ensureLoaded(store);
          let results = await s.find(params);
          if (typeof params.limit === 'number' && params.limit > 0) {
            results = results.slice(0, params.limit);
          }
          if (results.length === 0) return text('No edicts found matching the criteria.');
          return text(`${results.length} edict(s) found:\n\n${serialize(results)}`);
        } catch (err) {
          return text(`Error listing edicts: ${friendlyError(err)}`);
        }
      },
    },
    {
      name: 'edicts_add',
      description: 'Create a new edict (standing instruction).',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          text: { type: 'string' },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'string', enum: ['verified', 'inferred', 'user'] },
          source: { type: 'string' },
          key: { type: 'string' },
          ttl: { type: 'string', enum: ['ephemeral', 'event', 'durable', 'permanent'] },
          expiresAt: { type: 'string' },
        },
        required: ['text', 'category'],
      },
      async execute(_id: string, params: EdictInput) {
        try {
          const s = await ensureLoaded(store);
          const result = await s.add(params);
          return text(`Edict created:\n${serialize(result)}`);
        } catch (err) {
          return text(`Error adding edict: ${friendlyError(err)}`);
        }
      },
    },
    {
      name: 'edicts_update',
      description: 'Update an existing edict by id.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          text: { type: 'string' },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'string', enum: ['verified', 'inferred', 'user'] },
          ttl: { type: 'string', enum: ['ephemeral', 'event', 'durable', 'permanent'] },
          expiresAt: { type: 'string' },
        },
        required: ['id'],
      },
      async execute(_id: string, params: { id: string } & Partial<EdictInput>) {
        try {
          const { id, ...patch } = params;
          const s = await ensureLoaded(store);
          const result = await s.update(id, patch);
          return text(`Edict updated:\n${serialize(result)}`);
        } catch (err) {
          return text(`Error updating edict: ${friendlyError(err)}`);
        }
      },
    },
    {
      name: 'edicts_remove',
      description: 'Remove an edict.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      async execute(_id: string, params: { id: string }) {
        try {
          const s = await ensureLoaded(store);
          const result = await s.remove(params.id);
          return text(`Edict removed:\n${serialize(result)}`);
        } catch (err) {
          return text(`Error removing edict: ${friendlyError(err)}`);
        }
      },
    },
    {
      name: 'edicts_search',
      description: 'Free-text search across edicts.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          query: { type: 'string' },
          limit: { type: 'number' },
        },
        required: ['query'],
      },
      async execute(_id: string, params: { query: string; limit?: number }) {
        try {
          const s = await ensureLoaded(store);
          let results = await s.search(params.query);
          if (typeof params.limit === 'number' && params.limit > 0) {
            results = results.slice(0, params.limit);
          }
          if (results.length === 0) return text('No edicts matched the search query.');
          return text(`${results.length} match(es):\n\n${serialize(results)}`);
        } catch (err) {
          return text(`Error searching edicts: ${friendlyError(err)}`);
        }
      },
    },
    {
      name: 'edicts_stats',
      description: 'Show edict store statistics.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
      async execute() {
        try {
          const s = await ensureLoaded(store);
          const stats = await s.stats();
          return text(`Edict store statistics:\n\n${serialize(stats)}`);
        } catch (err) {
          return text(`Error fetching stats: ${friendlyError(err)}`);
        }
      },
    },
    {
      name: 'edicts_review',
      description: 'Review and optionally clean up stale/expired edicts.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: { type: 'string', enum: ['preview', 'compact'] },
        },
      },
      async execute(_id: string, params: { action?: 'preview' | 'compact' } = {}) {
        try {
          const s = await ensureLoaded(store);
          const action = params.action ?? 'preview';
          if (action === 'compact') {
            const result = await s.compact();
            return text(`Compaction complete:\n\n${serialize(result)}`);
          }
          const result = await s.review();
          return text(`Review (preview):\n\n${serialize(result)}`);
        } catch (err) {
          return text(`Error reviewing edicts: ${friendlyError(err)}`);
        }
      },
    },
  ];
}

/**
 * Register all edicts tools with the OpenClaw plugin API.
 * Tools are required (always available when plugin is enabled).
 */
export function registerEdictTools(
  api: { registerTool: (factory: () => Tool[], opts?: { names?: string[]; optional?: boolean }) => void },
  store: EdictStore,
): void {
  api.registerTool(() => buildTools(store), {
    names: [...TOOL_NAMES],
    optional: false,
  });
}
