import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { QBittorrent, QBittorrentLogPersister } from 'nqbt';
import { describe, expect, it, vi } from 'vitest';

import { setTorrentShareLimitsInputSchema } from '../src/mcp/schema.js';
import { registerQbittorrentTools } from '../src/mcp/tool.js';

describe('share limit MCP tool', () => {
  it.each([undefined, 'Default', 'Stop', 'Remove', 'RemoveWithContent', 'EnableSuperSeeding'])(
    'accepts and forwards shareLimitAction %s',
    async (shareLimitAction) => {
      const registerTool = vi.fn();
      const setTorrentShareLimits = vi.fn().mockResolvedValue(true);
      registerQbittorrentTools(
        { registerTool } as unknown as McpServer,
        { setTorrentShareLimits } as unknown as QBittorrent,
        {} as QBittorrentLogPersister
      );
      const args = setTorrentShareLimitsInputSchema.parse({
        hashes: ['abc', 'def'],
        ratioLimit: 2,
        seedingTimeLimit: -1,
        inactiveSeedingTimeLimit: 0,
        ...(shareLimitAction === undefined ? {} : { shareLimitAction })
      });
      const registration = registerTool.mock.calls.find(
        ([name]) => name === 'set_torrent_share_limits'
      )!;

      const result = await registration[2](args);

      expect(result.structuredContent).toEqual({ result: true });
      expect(setTorrentShareLimits).toHaveBeenCalledWith(['abc', 'def'], {
        ratioLimit: 2,
        seedingTimeLimit: -1,
        inactiveSeedingTimeLimit: 0,
        shareLimitAction
      });
    }
  );

  it.each(['Pause', 'stop', 0])('rejects unsupported action %s', (shareLimitAction) => {
    expect(
      setTorrentShareLimitsInputSchema.safeParse({
        hashes: 'all',
        ratioLimit: -2,
        seedingTimeLimit: -2,
        shareLimitAction
      }).success
    ).toBe(false);
  });
});
