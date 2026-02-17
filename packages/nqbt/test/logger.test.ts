import { describe, expect, it } from 'vitest';

import type { GetLogOptions, LogEntry, PeerLogEntry } from '@nqbt/core';
import { QBittorrentLogPersister } from '../src/logger.js';

type LogClientLike = ConstructorParameters<typeof QBittorrentLogPersister>[0];

class FakeLogClient {
  constructor(
    private readonly mainLogs: LogEntry[],
    private readonly peerLogs: PeerLogEntry[]
  ) {}

  async getLog(options: GetLogOptions = {}): Promise<LogEntry[]> {
    if (options.lastKnownId === undefined) {
      return this.mainLogs;
    }
    return this.mainLogs.filter((entry) => entry.id > options.lastKnownId!);
  }

  async getPeerLog(lastKnownId?: number): Promise<PeerLogEntry[]> {
    if (lastKnownId === undefined) {
      return this.peerLogs;
    }
    return this.peerLogs.filter((entry) => entry.id > lastKnownId);
  }
}

describe('QBittorrentLogPersister', () => {
  it('syncs main logs on demand and keeps cache across calls', async () => {
    const mainLogs: LogEntry[] = [
      { id: 1, message: 'startup', timestamp: 1000, type: 1 },
      { id: 2, message: 'downloading', timestamp: 1001, type: 2 },
      { id: 3, message: 'warning', timestamp: 1002, type: 4 }
    ];
    const peerLogs: PeerLogEntry[] = [];

    const persister = new QBittorrentLogPersister(
      new FakeLogClient(mainLogs, peerLogs) as unknown as LogClientLike
    );

    expect((await persister.getMainLogs()).map((entry) => entry.id)).toEqual([1, 2, 3]);

    mainLogs.push({ id: 4, message: 'new log', timestamp: 1003, type: 2 });
    expect((await persister.getMainLogs()).map((entry) => entry.id)).toEqual([1, 2, 3, 4]);
  });

  it('filters main logs by original level options', async () => {
    const persister = new QBittorrentLogPersister(
      new FakeLogClient(
        [
          { id: 1, message: 'normal', timestamp: 1000, type: 1 },
          { id: 2, message: 'info', timestamp: 1001, type: 2 },
          { id: 3, message: 'warning', timestamp: 1002, type: 4 },
          { id: 4, message: 'critical', timestamp: 1003, type: 8 }
        ],
        []
      ) as unknown as LogClientLike
    );

    expect(
      (
        await persister.getMainLogs({ normal: false, info: false, warning: true, critical: true })
      ).map((entry) => entry.id)
    ).toEqual([3, 4]);
    expect((await persister.getMainLogs({ lastKnownId: 2 })).map((entry) => entry.id)).toEqual([
      3, 4
    ]);
  });

  it('syncs peer logs on demand', async () => {
    const peerLogs: PeerLogEntry[] = [
      { id: 10, ip: '1.1.1.1', timestamp: 2000, blocked: true, reason: 'banned' },
      { id: 11, ip: '2.2.2.2', timestamp: 2001, blocked: false, reason: '' }
    ];

    const persister = new QBittorrentLogPersister(
      new FakeLogClient([], peerLogs) as unknown as LogClientLike
    );

    expect((await persister.getPeerLogs()).map((entry) => entry.id)).toEqual([10, 11]);

    peerLogs.push({ id: 12, ip: '3.3.3.3', timestamp: 2002, blocked: false, reason: '' });
    expect((await persister.getPeerLogs()).map((entry) => entry.id)).toEqual([10, 11, 12]);
  });
});
