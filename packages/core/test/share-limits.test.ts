import { describe, expect, it, vi } from 'vitest';

import { QBittorrent } from '../src/qbittorrent.js';
import type { ShareLimitAction } from '../src/types.js';

function createClient() {
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (_input, init) => {
    const body = init?.body as URLSearchParams;
    // qBittorrent 5.2 rejects the request if any of these parameters is missing.
    for (const key of [
      'hashes',
      'ratioLimit',
      'seedingTimeLimit',
      'inactiveSeedingTimeLimit',
      'shareLimitAction'
    ]) {
      if (!body.has(key)) {
        return new Response(`Missing required parameter: ${key}`, { status: 400 });
      }
    }
    return new Response('');
  });
  const client = new QBittorrent({ baseURL: 'https://qbt.example/api/v2', fetch });
  client.state.auth = { sid: 'session', expires: new Date(Date.now() + 60_000) };
  return { client, fetch };
}

describe('setTorrentShareLimits', () => {
  it.each([
    { hashes: 'abc', expectedHashes: 'abc' },
    { hashes: ['abc', 'def'], expectedHashes: 'abc|def' },
    { hashes: 'all', expectedHashes: 'all' }
  ])(
    'fills required defaults for legacy callers using $hashes',
    async ({ hashes, expectedHashes }) => {
      const { client, fetch } = createClient();

      await expect(
        client.setTorrentShareLimits(hashes, { ratioLimit: 1.5, seedingTimeLimit: -1 })
      ).resolves.toBe(true);

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = fetch.mock.calls[0]!;
      expect(url).toBe('https://qbt.example/api/v2/torrents/setShareLimits');
      expect(init?.method).toBe('POST');
      expect(Object.fromEntries(init?.body as URLSearchParams)).toEqual({
        hashes: expectedHashes,
        ratioLimit: '1.5',
        seedingTimeLimit: '-1',
        inactiveSeedingTimeLimit: '-2',
        shareLimitAction: 'Default'
      });
    }
  );

  it.each<ShareLimitAction>([
    'Default',
    'Stop',
    'Remove',
    'RemoveWithContent',
    'EnableSuperSeeding'
  ])('sends the explicit %s action', async (shareLimitAction) => {
    const { client, fetch } = createClient();
    await client.setTorrentShareLimits('abc', {
      ratioLimit: -2,
      seedingTimeLimit: 0,
      inactiveSeedingTimeLimit: 0,
      shareLimitAction
    });
    expect(Object.fromEntries(fetch.mock.calls[0]![1]?.body as URLSearchParams)).toEqual({
      hashes: 'abc',
      ratioLimit: '-2',
      seedingTimeLimit: '0',
      inactiveSeedingTimeLimit: '0',
      shareLimitAction
    });
  });

  it.each([-2, -1, 120])('preserves the explicit inactive limit %s', async (limit) => {
    const { client, fetch } = createClient();
    await client.setTorrentShareLimits('abc', {
      ratioLimit: 0,
      seedingTimeLimit: -2,
      inactiveSeedingTimeLimit: limit
    });
    const body = fetch.mock.calls[0]![1]?.body as URLSearchParams;
    expect(body.get('inactiveSeedingTimeLimit')).toBe(String(limit));
  });
});
