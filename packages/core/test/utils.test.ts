import { describe, expect, it } from 'vitest';

import { normalizeHashes, normalizeList } from '../src/utils.js';

describe('utils', () => {
  it('normalizes hash arrays with | delimiter', () => {
    expect(normalizeHashes(['h1', 'h2'])).toBe('h1|h2');
  });

  it('keeps single value unchanged', () => {
    expect(normalizeList('tag1', ',')).toBe('tag1');
  });

  it('joins arrays with provided delimiter', () => {
    expect(normalizeList(['tag1', 'tag2'], ',')).toBe('tag1,tag2');
    expect(normalizeList(['u1', 'u2'], '\n')).toBe('u1\nu2');
  });
});
