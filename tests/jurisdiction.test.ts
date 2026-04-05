import { describe, it, expect } from 'vitest';
import { validateJurisdiction } from '../src/jurisdiction.js';

describe('jurisdiction validation', () => {
  it('accepts CH', () => {
    const result = validateJurisdiction('CH');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.jurisdiction).toBe('CH');
    }
  });

  it('accepts lowercase ch', () => {
    const result = validateJurisdiction('ch');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.jurisdiction).toBe('CH');
    }
  });

  it('defaults to CH when undefined', () => {
    const result = validateJurisdiction(undefined);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.jurisdiction).toBe('CH');
    }
  });

  it('rejects FR', () => {
    const result = validateJurisdiction('FR');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.error).toBe('jurisdiction_not_supported');
      expect(result.error.supported).toContain('CH');
    }
  });

  it('rejects DE', () => {
    const result = validateJurisdiction('DE');
    expect(result.valid).toBe(false);
  });

  it('rejects empty string', () => {
    const result = validateJurisdiction('');
    expect(result.valid).toBe(false);
  });
});
