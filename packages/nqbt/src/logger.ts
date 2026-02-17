import type { QBittorrent, LogEntry, PeerLogEntry, GetLogOptions } from '@nqbt/core';

/**
 * Minimal in-memory log persister.
 */
export class QBittorrentLogPersister {
  private readonly client: QBittorrent;

  private mainLogs: LogEntry[] = [];

  private peerLogs: PeerLogEntry[] = [];

  private runningMain: Promise<LogEntry[]> | undefined;

  private runningPeer: Promise<PeerLogEntry[]> | undefined;

  public constructor(client: QBittorrent) {
    this.client = client;
  }

  /**
   * Fetch all main logs and replace local cache.
   */
  private async syncMainLogs() {
    if (this.runningMain) return this.runningMain;
    return (this.runningMain = (async () => {
      try {
        let page = 0;
        while (page < 10) {
          const mainLogs = await this.client.getLog({ lastKnownId: this.mainLogs.at(-1)?.id });
          if (mainLogs.length <= 0) break;
          this.mainLogs = [...this.mainLogs, ...mainLogs].sort((a, b) => a.id - b.id);
          page += 1;
        }
      } finally {
        this.runningMain = undefined;
      }
      return this.mainLogs;
    })());
  }

  /**
   * Fetch all peer logs and replace local cache.
   */
  private async syncPeerLogs() {
    if (this.runningPeer) return this.runningPeer;
    return (this.runningPeer = (async () => {
      try {
        let page = 0;
        while (page < 10) {
          const peerLogs = await this.client.getPeerLog(this.peerLogs.at(-1)?.id);
          if (peerLogs.length <= 0) break;
          this.peerLogs = [...this.peerLogs, ...peerLogs].sort((a, b) => a.id - b.id);
          page += 1;
        }
      } finally {
        this.runningPeer = undefined;
      }
      return this.peerLogs;
    })());
  }

  /**
   * Clear local cache.
   */
  public clear(): void {
    this.mainLogs = [];
    this.peerLogs = [];
  }

  /**
   * Query persisted main logs with simple filter/sort options.
   */
  public async getMainLogs(query: GetLogOptions = {}): Promise<LogEntry[]> {
    const allowNormal = query.normal ?? true;
    const allowInfo = query.info ?? true;
    const allowWarning = query.warning ?? true;
    const allowCritical = query.critical ?? true;

    await this.syncMainLogs();

    const rows = this.mainLogs.filter((entry) => {
      if (query.lastKnownId !== undefined && entry.id <= query.lastKnownId) {
        return false;
      }

      if (entry.type === 1 && !allowNormal) {
        return false;
      }
      if (entry.type === 2 && !allowInfo) {
        return false;
      }
      if (entry.type === 4 && !allowWarning) {
        return false;
      }
      if (entry.type === 8 && !allowCritical) {
        return false;
      }

      return true;
    });

    return rows;
  }

  /**
   * Query persisted peer logs with simple filter/sort options.
   */
  public async getPeerLogs(): Promise<PeerLogEntry[]> {
    return await this.syncPeerLogs();
  }
}
