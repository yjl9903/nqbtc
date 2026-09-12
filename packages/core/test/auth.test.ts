import { afterEach, describe, expect, it, vi } from 'vitest';

import { QBittorrent } from '../src/qbittorrent.js';

function createClient(setCookies: string[], legacyHeaders = false) {
  const headers = new Headers();
  for (const cookie of setCookies) {
    headers.append('set-cookie', cookie);
  }
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (input) => {
    const path = new URL(String(input)).pathname;
    if (path.endsWith('/auth/login')) {
      const response = new Response('Ok.', { headers });
      if (legacyHeaders) {
        Object.defineProperty(response.headers, 'getSetCookie', { value: undefined });
      }
      return response;
    }
    return new Response(path.endsWith('/app/version') ? 'v5.2.0' : 'Ok.');
  });
  // The public proxy port deliberately differs from the server's cookie port.
  const client = new QBittorrent({ baseURL: 'https://qbt.example/api/v2', fetch });
  return { client, fetch };
}

function requestCookies(fetch: ReturnType<typeof createClient>['fetch']) {
  return fetch.mock.calls
    .filter(([input]) => !String(input).endsWith('/auth/login'))
    .map(([, init]) => new Headers(init?.headers).get('cookie'));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('session cookies', () => {
  it.each(['SID', 'QBT_SID_8080', 'QBT_SID_9091', 'custom_session'])(
    'uses the server cookie %s for version checks, API calls and logout',
    async (name) => {
      const { client, fetch } = createClient([`${name}=session%2Fid==; Path=/; HttpOnly`]);

      await expect(client.login()).resolves.toBe(true);
      expect(client.state.auth).toMatchObject({ cookieName: name, sid: 'session%2Fid==' });
      await client.getApplicationVersion();
      await client.logout();

      expect(requestCookies(fetch)).toEqual(Array(3).fill(`${name}=session%2Fid==`));
      expect(client.state.auth).toBeUndefined();
      expect(client.state.version).toBeUndefined();
    }
  );

  it.each([false, true])(
    'selects the session from multiple cookies (legacy headers: %s)',
    async (legacy) => {
      const { client, fetch } = createClient(
        [
          'proxy=notSID=other; Expires=Wed, 01 Jan 2031 00:00:00 GMT; Path=/',
          'QBT_SID_8080=session; Expires=Thu, 01 Jan 2032 00:00:00 GMT; HttpOnly'
        ],
        legacy
      );

      await client.login();

      expect(requestCookies(fetch)).toEqual(['QBT_SID_8080=session']);
      expect(client.state.auth?.expires).toEqual(new Date('2032-01-01T00:00:00Z'));
    }
  );

  it.each(['Max-Age', 'max-age'])(
    'keeps expiration from %s and replaces the cookie on login',
    async (attribute) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const { client, fetch } = createClient([`QBT_SID_8080=first; ${attribute}=60`]);
      await client.login();
      expect(client.state.auth?.expires).toEqual(new Date('2026-01-01T00:01:00Z'));

      vi.setSystemTime(new Date('2026-01-01T00:02:00Z'));
      fetch.mockResolvedValueOnce(
        new Response('Ok.', { headers: { 'set-cookie': 'new_session=second; Path=/' } })
      );
      await client.getApplicationVersion();

      expect(requestCookies(fetch)).toEqual(['QBT_SID_8080=first', 'new_session=second']);
      expect(client.state.auth?.expires).toEqual(new Date('2026-01-01T01:02:00Z'));
    }
  );

  it.each([
    { cookies: [] },
    { cookies: ['QBT_SID_8080=; HttpOnly'] },
    { cookies: ['invalid; Path=/'] }
  ])('rejects missing or invalid session cookies: %j', async ({ cookies }) => {
    const { client, fetch } = createClient(cookies);
    await expect(client.login()).rejects.toThrow(/Cookie not found|Invalid cookie/);
    expect(client.state.auth).toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('supports manually supplied legacy auth state', async () => {
    const { client, fetch } = createClient([]);
    client.state.auth = { sid: 'legacy', expires: new Date(Date.now() + 60_000) };
    await client.getApplicationVersion();
    await client.logout();
    expect(requestCookies(fetch)).toEqual(['SID=legacy', 'SID=legacy']);
  });

  it('clears caches even if remote logout fails', async () => {
    const { client, fetch } = createClient(['QBT_SID_8080=session']);
    await client.login();
    fetch.mockResolvedValueOnce(new Response('failed', { status: 500 }));
    await expect(client.logout()).rejects.toThrow('Request failed: 500');
    expect(requestCookies(fetch).at(-1)).toBe('QBT_SID_8080=session');
    expect(client.state.auth).toBeUndefined();
    expect(client.state.version).toBeUndefined();
  });
});
