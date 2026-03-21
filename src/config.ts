export interface ResolvedConfig {
  path: string;
  format: 'yaml' | 'json';
  autoInject: boolean;
  autoInjectFilter: 'all';
  tokenBudget: number;
}

/**
 * Merge user-provided plugin config over defaults.
 * Infers format from path extension when not explicitly set.
 */
export function resolveConfig(raw: Record<string, unknown>): ResolvedConfig {
  const userPath = typeof raw.path === 'string' ? raw.path : 'edicts.yaml';

  let format: 'yaml' | 'json';
  if (raw.format === 'json' || raw.format === 'yaml') {
    format = raw.format;
  } else {
    format = userPath.endsWith('.json') ? 'json' : 'yaml';
  }

  return {
    path: userPath,
    format,
    autoInject: typeof raw.autoInject === 'boolean' ? raw.autoInject : true,
    autoInjectFilter: 'all',
    tokenBudget: typeof raw.tokenBudget === 'number' ? raw.tokenBudget : 2000,
  };
}
