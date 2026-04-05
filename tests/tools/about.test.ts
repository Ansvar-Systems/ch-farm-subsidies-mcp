import { describe, it, expect } from 'vitest';
import { handleAbout } from '../../src/tools/about.js';

describe('about tool', () => {
  it('returns server name containing "Subsidies"', () => {
    const result = handleAbout();
    expect(result.name).toContain('Subsidies');
  });

  it('returns version string', () => {
    const result = handleAbout();
    expect(result.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('includes CH in jurisdiction list', () => {
    const result = handleAbout();
    expect(result.jurisdiction).toContain('CH');
  });

  it('has a disclaimer in _meta', () => {
    const result = handleAbout();
    expect(result._meta).toBeDefined();
    expect(result._meta.disclaimer).toBeTruthy();
    expect(result._meta.disclaimer.length).toBeGreaterThan(50);
  });

  it('lists data sources', () => {
    const result = handleAbout();
    expect(result.data_sources).toBeInstanceOf(Array);
    expect(result.data_sources.length).toBeGreaterThan(0);
  });

  it('includes tools count', () => {
    const result = handleAbout();
    expect(result.tools_count).toBe(10);
  });

  it('includes links', () => {
    const result = handleAbout();
    expect(result.links).toBeDefined();
    expect(result.links.repository).toContain('github.com');
  });
});
