import { describe, it, expect } from 'vitest';
import { resolveConfig } from '../src/config.js';

describe('resolveConfig', () => {
  it('returns defaults for empty input', () => {
    const cfg = resolveConfig({});
    expect(cfg).toEqual({
      path: 'edicts.yaml',
      format: 'yaml',
      autoInject: true,
      autoInjectFilter: 'all',
      tokenBudget: 2000,
    });
  });

  it('infers json format from .json path', () => {
    const cfg = resolveConfig({ path: 'data/edicts.json' });
    expect(cfg.format).toBe('json');
    expect(cfg.path).toBe('data/edicts.json');
  });

  it('explicit format overrides path inference', () => {
    const cfg = resolveConfig({ path: 'edicts.json', format: 'yaml' });
    expect(cfg.format).toBe('yaml');
  });

  it('respects user-provided values', () => {
    const cfg = resolveConfig({
      path: 'custom.yaml',
      autoInject: false,
      tokenBudget: 5000,
    });
    expect(cfg.path).toBe('custom.yaml');
    expect(cfg.autoInject).toBe(false);
    expect(cfg.tokenBudget).toBe(5000);
  });

  it('autoInjectFilter is always "all" in v1', () => {
    const cfg = resolveConfig({ autoInjectFilter: 'something-else' });
    expect(cfg.autoInjectFilter).toBe('all');
  });
});
