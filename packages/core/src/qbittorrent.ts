import { parse as cookieParse } from 'cookie';

import type {
  AddNewMagnetOptions,
  AddNewTorrentOptions,
  BuildInfo,
  DownloadSpeed,
  GetTorrentListOptions,
  Preferences,
  Torrent,
  TorrentCategories,
  TorrentFile,
  TorrentFilePriority,
  TorrentPeersResponse,
  TorrentPieceState,
  TorrentProperties,
  TorrentTrackers,
  UploadSpeed,
  WebSeed
} from './types.js';

import {
  isGreater,
  joinURL,
  normalizeHashes,
  normalizeList,
  objToUrlSearchParams
} from './utils.js';

type RequestInitWithDispatcher = RequestInit & {
  dispatcher?: unknown;
};

export interface QBittorrentClientState {
  /**
   * Runtime authentication state for WebUI requests.
   */
  auth?: {
    /**
     * qBittorrent session id (`SID`) from `/auth/login`.
     */
    sid: string;

    /**
     * Session expiration time derived from cookie attributes.
     */
    expires: Date;
  };

  /**
   * Cached server version information used for v4/v5 API compatibility handling.
   */
  version?: {
    /**
     * Raw application version returned by `/app/version`.
     */
    application: string;

    /**
     * `true` when server version is `>= 5.0.0`.
     */
    isVersion5OrHigher: boolean;
  };
}

export interface QBittorrentClientConfig {
  /**
   * WebUI API base URL.
   * @default 'http://localhost:9091/api/v2'
   */
  baseURL: string;

  /**
   * Username for `/auth/login`.
   */
  username?: string;

  /**
   * Password for `/auth/login`.
   */
  password?: string;

  /**
   * Override the built-in `fetch` implementation.
   */
  fetch?: typeof fetch;

  /**
   * Custom dispatcher passed to `fetch` (for example an undici proxy agent).
   */
  dispatcher?: RequestInitWithDispatcher['dispatcher'];

  /**
   * Request timeout in milliseconds.
   * @default 5000
   */
  timeout?: number;
}

const defaults: QBittorrentClientConfig = {
  baseURL: 'http://localhost:9091/api/v2',
  username: '',
  password: '',
  timeout: 5000
};

export class QBittorrent {
  /**
   * Effective runtime configuration.
   */
  public readonly config: QBittorrentClientConfig;

  /**
   * Mutable runtime state (auth and version cache).
   */
  public readonly state: QBittorrentClientState = {};

  /**
   * Create a qBittorrent WebUI API client.
   * @param config Partial client configuration merged with defaults.
   */
  public constructor(config: Partial<QBittorrentClientConfig> = {}) {
    this.config = { ...defaults, ...config };
  }

  // Authentication

  /**
   * Authenticate against qBittorrent WebUI and cache `SID` cookie.
   * @returns `true` when authentication succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#login}
   */
  async login(): Promise<boolean> {
    const url = joinURL(this.config.baseURL, '/auth/login');
    const res = await this.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        username: this.config.username ?? '',
        password: this.config.password ?? ''
      }).toString(),
      redirect: 'manual'
    });

    const setCookies =
      (
        res.headers as Headers & {
          getSetCookie?: () => string[];
        }
      ).getSetCookie?.() ?? [res.headers.get('set-cookie')].filter(Boolean);

    const setCookie = setCookies.find((value) => value.includes('SID=')) ?? setCookies[0];

    if (!setCookie) {
      throw new Error('Cookie not found. Auth Failed.');
    }

    const cookie = cookieParse(setCookie);
    if (!cookie.SID) {
      throw new Error('Invalid cookie');
    }

    const expires = cookie.Expires ?? cookie.expires;
    const maxAge = cookie['Max-Age'] ?? cookie['max-age'];
    this.state.auth = {
      sid: cookie.SID,
      expires: expires
        ? new Date(expires)
        : maxAge
          ? new Date(Date.now() + Number(maxAge) * 1000)
          : new Date(Date.now() + 3_600_000)
    };

    // Check version after successful login
    await this.checkVersion();

    return true;
  }

  /**
   * Log out from qBittorrent WebUI and clear `SID` cookie cache.
   * @returns `true` when logout request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#logout}
   */
  async logout(): Promise<boolean> {
    const sid = this.state.auth?.sid;

    try {
      if (sid) {
        const url = joinURL(this.config.baseURL, '/auth/logout');
        await this.fetch(url, {
          method: 'POST',
          headers: {
            Cookie: `SID=${sid}`
          }
        });
      }
    } finally {
      // Always clear local caches, even when remote logout fails.
      delete this.state.auth;
      delete this.state.version;
    }

    return true;
  }

  // Application

  /**
   * Get application version string.
   * @returns Application version, for example `v5.0.5`.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-application-version}
   */
  async getApplicationVersion(): Promise<string> {
    const res = await this.request<string>(
      '/app/version',
      'GET',
      undefined,
      undefined,
      undefined,
      false
    );
    return res;
  }

  /**
   * Get supported WebUI API version.
   * @returns WebUI API version, for example `2.11.2`.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-api-version}
   */
  async getApiVersion(): Promise<string> {
    const res = await this.request<string>(
      '/app/webapiVersion',
      'GET',
      undefined,
      undefined,
      undefined,
      false
    );
    return res;
  }

  /**
   * Get qBittorrent build information.
   * @returns Build metadata such as library versions and platform details.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-build-info}
   */
  async getBuildInfo(): Promise<BuildInfo> {
    const res = await this.request<BuildInfo>('/app/buildInfo', 'GET');
    return res;
  }

  /**
   * Get current application preferences.
   * @returns Full preference object from qBittorrent.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-application-preferences}
   */
  async getApplicationPreferences(): Promise<Preferences> {
    const res = await this.request<Preferences>('/app/preferences', 'GET');
    return res;
  }

  /**
   * Update application preferences.
   * @param preferences Partial preference object; only provided keys are updated.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-application-preferences}
   */
  async setApplicationPreferences(preferences: Partial<Preferences>): Promise<boolean> {
    await this.request(
      '/app/setPreferences',
      'POST',
      undefined,
      objToUrlSearchParams({
        json: JSON.stringify(preferences)
      })
    );
    return true;
  }

  /**
   * Get default torrent save path.
   * @returns Absolute default save path configured in qBittorrent.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-default-save-path}
   */
  async getDefaultSavePath(): Promise<string> {
    const res = await this.request<string>(
      '/app/defaultSavePath',
      'GET',
      undefined,
      undefined,
      undefined,
      false
    );
    return res;
  }

  // Sync

  /**
   * Get peer list and incremental peer updates for a torrent.
   * @param hash Torrent hash.
   * @param rid Response id for incremental sync. Omit or `0` for full response.
   * @returns Peers payload with `full_update` flag and incremental changes.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-peers-data}
   */
  async getTorrentPeersData(hash: string, rid?: number): Promise<TorrentPeersResponse> {
    const params: { hash: string; rid?: number } = { hash };
    if (rid) {
      params.rid = rid;
    }

    const res = await this.request<TorrentPeersResponse>('/sync/torrentPeers', 'GET', params);
    return res;
  }

  // Torrent Management

  /**
   * Get torrent list.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-list}
   * @param options Query options.
   * @param options.hashes Filter by torrent hashes (`|`-separated).
   * @param options.filter State filter (v4 uses `paused`/`resumed`, v5 uses `stopped`/`running`; this client normalizes automatically).
   * @param options.category Filter by category. Empty string means "without category".
   * @param options.sort Sort field.
   * @param options.offset Pagination offset.
   * @param options.reverse Reverse sorting when `true`.
   * @param options.tag Filter by tag.
   * @param options.limit Maximum number of items to return.
   * @param options.isPrivate Filter private torrents.
   * @param options.includeTrackers Include tracker list in each torrent item (supported by newer API versions).
   * @returns Torrent list.
   */
  async getTorrentList({
    hashes,
    filter,
    category,
    sort,
    offset,
    reverse,
    tag,
    limit,
    isPrivate,
    includeTrackers
  }: GetTorrentListOptions = {}): Promise<Torrent[]> {
    const params: Record<string, string> = {};
    if (hashes) {
      params.hashes = normalizeHashes(hashes);
    }

    if (filter) {
      if (this.state.version?.isVersion5OrHigher) {
        if (filter === 'paused') {
          filter = 'stopped';
        } else if (filter === 'resumed') {
          filter = 'running';
        }
      } else if (filter === 'stopped') {
        // For versions < 5
        filter = 'paused';
      } else if (filter === 'running') {
        // For versions < 5
        filter = 'resumed';
      }
      params.filter = filter;
    }

    if (category !== undefined) {
      params.category = category;
    }

    if (tag !== undefined) {
      params.tag = tag;
    }

    if (offset !== undefined) {
      params.offset = `${offset}`;
    }

    if (limit !== undefined) {
      params.limit = `${limit}`;
    }

    if (sort) {
      params.sort = sort;
    }

    if (reverse) {
      params.reverse = JSON.stringify(reverse);
    }

    if (isPrivate) {
      params.private = JSON.stringify(isPrivate);
    }

    if (includeTrackers) {
      params.includeTrackers = JSON.stringify(includeTrackers);
    }

    const res = await this.request<Torrent[]>('/torrents/info', 'GET', params);

    return res;
  }

  /**
   * Get generic torrent properties.
   * @param hash Torrent hash.
   * @returns Generic torrent metadata and statistics.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-generic-properties}
   */
  async getTorrentGenericProperties(hash: string): Promise<TorrentProperties> {
    const res = await this.request<TorrentProperties>('/torrents/properties', 'GET', { hash });
    return res;
  }

  /**
   * Get tracker list of a torrent.
   * @param hash Torrent hash.
   * @returns Trackers attached to the torrent.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-trackers}
   */
  async getTorrentTrackers(hash: string): Promise<TorrentTrackers[]> {
    const res = await this.request<TorrentTrackers[]>('/torrents/trackers', 'GET', { hash });
    return res;
  }

  /**
   * Get web seed list of a torrent.
   * @param hash Torrent hash.
   * @returns Web seeds attached to the torrent.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-web-seeds}
   */
  async getTorrentWebSeeds(hash: string): Promise<WebSeed[]> {
    const res = await this.request<WebSeed[]>('/torrents/webseeds', 'GET', { hash });
    return res;
  }

  /**
   * Get file list of a torrent.
   * @param hash Torrent hash.
   * @returns Files contained in the torrent.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-contents}
   */
  async getTorrentContents(hash: string): Promise<TorrentFile[]> {
    const res = await this.request<TorrentFile[]>('/torrents/files', 'GET', { hash });
    return res;
  }

  /**
   * Get state of each piece in a torrent.
   * @param hash Torrent hash.
   * @returns Piece states in piece order.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-pieces-states}
   */
  async getTorrentPiecesStates(hash: string): Promise<TorrentPieceState[]> {
    const res = await this.request<TorrentPieceState[]>('/torrents/pieceStates', 'GET', { hash });
    return res;
  }

  /**
   * Get hashes for all pieces of a torrent.
   * @param hash Torrent hash.
   * @returns Piece hashes in piece order.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-pieces-hashes}
   */
  async getTorrentPiecesHashes(hash: string): Promise<string[]> {
    const res = await this.request<string[]>('/torrents/pieceHashes', 'GET', { hash });
    return res;
  }

  /**
   * Stop/pause torrent(s).
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @returns `true` when request succeeds.
   * @remarks Uses `/torrents/stop` on qBittorrent v5+, falls back to `/torrents/pause` for older versions.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#stop-torrents}
   */
  async stopTorrents(hashes: string | string[] | 'all'): Promise<boolean> {
    const endpoint = this.state.version?.isVersion5OrHigher ? '/torrents/stop' : '/torrents/pause';
    const data = { hashes: normalizeHashes(hashes) };
    await this.request(endpoint, 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Stop/pause torrent(s).
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @returns `true` when request succeeds.
   * @remarks Uses `/torrents/stop` on qBittorrent v5+, falls back to `/torrents/pause` for older versions.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#stop-torrents}
   */
  async pauseTorrents(hashes: string | string[] | 'all'): Promise<boolean> {
    return this.stopTorrents(hashes);
  }

  /**
   * Start/resume torrent(s).
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @returns `true` when request succeeds.
   * @remarks Uses `/torrents/start` on qBittorrent v5+, falls back to `/torrents/resume` for older versions.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#start-torrents}
   */
  async startTorrents(hashes: string | string[] | 'all'): Promise<boolean> {
    const endpoint = this.state.version?.isVersion5OrHigher
      ? '/torrents/start'
      : '/torrents/resume';
    const data = { hashes: normalizeHashes(hashes) };
    await this.request(endpoint, 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Start/resume torrent(s).
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @returns `true` when request succeeds.
   * @remarks Uses `/torrents/start` on qBittorrent v5+, falls back to `/torrents/resume` for older versions.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#start-torrents}
   */
  async resumeTorrents(hashes: string | string[] | 'all'): Promise<boolean> {
    return this.startTorrents(hashes);
  }

  /**
   * Delete torrent(s) from client.
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @param deleteFiles When `true`, delete downloaded data from disk as well.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#delete-torrents}
   */
  async deleteTorrents(hashes: string | string[] | 'all', deleteFiles = false): Promise<boolean> {
    const data = {
      hashes: normalizeHashes(hashes),
      deleteFiles
    };
    await this.request(
      '/torrents/delete',
      'POST',
      undefined,
      objToUrlSearchParams(data),
      undefined,
      false
    );
    return true;
  }

  /**
   * Force recheck torrent data.
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#recheck-torrents}
   */
  async recheckTorrents(hashes: string | string[] | 'all'): Promise<boolean> {
    const data = { hashes: normalizeHashes(hashes) };
    await this.request('/torrents/recheck', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Reannounce torrent(s) to tracker(s).
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#reannounce-torrents}
   */
  async reannounceTorrents(hashes: string | string[] | 'all'): Promise<boolean> {
    const data = { hashes: normalizeHashes(hashes) };
    await this.request('/torrents/reannounce', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Edit a tracker URL for a torrent.
   * @param hash Torrent hash.
   * @param origUrl Existing tracker URL.
   * @param newUrl New tracker URL.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#edit-trackers}
   */
  async editTrackers(hash: string, origUrl: string, newUrl: string): Promise<boolean> {
    const data = { hash, origUrl, newUrl };
    await this.request('/torrents/editTrackers', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Remove trackers from a torrent.
   * @param hash Torrent hash.
   * @param urls Tracker URL or multiple tracker URLs. Multiple values are joined by `|`.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#remove-trackers}
   */
  async removeTrackers(hash: string, urls: string | string[]): Promise<boolean> {
    const data = { hash, urls: normalizeList(urls, '|') };
    await this.request('/torrents/removeTrackers', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Add a torrent from raw `.torrent` data.
   * @param torrent Binary torrent bytes.
   * @param options Optional add-torrent form fields from WebUI API.
   * @returns `true` when torrent is accepted by qBittorrent.
   * @remarks On qBittorrent v5+, the API uses `stopped` instead of `paused`; this client maps automatically.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#add-new-torrent}
   */
  async addNewTorrent(
    torrent: Uint8Array<ArrayBuffer>,
    options: Partial<AddNewTorrentOptions> = {}
  ): Promise<boolean> {
    const form = new FormData();

    // remove options.filename, not used in form
    if (options.filename) {
      delete options.filename;
    }

    const type = { type: 'application/x-bittorrent' };
    const file = new File([torrent], options.filename ?? 'torrent', type);
    form.set('file', file);

    if (options) {
      // Handle version-specific paused/stopped parameter
      if (this.state.version?.isVersion5OrHigher && options.paused !== undefined) {
        if (options.stopped === undefined) {
          options.stopped = options.paused;
        }
        delete options.paused;
      }

      if (Array.isArray(options.tags)) {
        options.tags = normalizeList(options.tags, ',');
      }

      // disable savepath when autoTMM is defined
      if (options.useAutoTMM === true) {
        options.savepath = '';
      }

      for (const [key, value] of Object.entries(options)) {
        if (value === undefined || value === null) {
          continue;
        }
        form.append(key, `${value}`);
      }
    }

    const res = await this.request<string>(
      '/torrents/add',
      'POST',
      undefined,
      form,
      undefined,
      false
    );

    if (res === 'Fails.') {
      throw new Error('Failed to add torrent');
    }

    return true;
  }

  /**
   * Add torrent(s) by magnet URL(s).
   * @param urls Magnet URL or multiple magnet URLs.
   * Multiple values are joined by newline characters.
   * @param options Optional add-torrent form fields from WebUI API.
   * @returns `true` when torrent(s) are accepted by qBittorrent.
   * @remarks On qBittorrent v5+, the API uses `stopped` instead of `paused`; this client maps automatically.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#add-new-torrent}
   */
  async addNewMagnet(
    urls: string | string[],
    options: Partial<AddNewMagnetOptions> = {}
  ): Promise<boolean> {
    const form = new FormData();
    form.append('urls', normalizeList(urls, '\n'));

    if (options) {
      // Handle version-specific paused/stopped parameter
      if (this.state.version?.isVersion5OrHigher && options.paused !== undefined) {
        if (options.stopped === undefined) {
          options.stopped = options.paused;
        }
        delete options.paused;
      }

      if (Array.isArray(options.tags)) {
        options.tags = normalizeList(options.tags, ',');
      }

      // disable savepath when autoTMM is defined
      if (options.useAutoTMM === true) {
        options.savepath = '';
      }

      for (const [key, value] of Object.entries(options)) {
        if (value === undefined || value === null) {
          continue;
        }
        form.append(key, `${value}`);
      }
    }

    const res = await this.request<string>(
      '/torrents/add',
      'POST',
      undefined,
      form,
      undefined,
      false
    );

    if (res === 'Fails.') {
      throw new Error('Failed to add torrent');
    }

    return true;
  }

  /**
   * Add trackers to a torrent.
   * @param hash Torrent hash.
   * @param urls Tracker URL or multiple tracker URLs.
   * Multiple values are joined by newline characters.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#add-trackers-to-torrent}
   */
  async addTrackersToTorrent(hash: string, urls: string | string[]): Promise<boolean> {
    const data = { hash, urls: normalizeList(urls, '\n') };
    await this.request('/torrents/addTrackers', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Increase queue priority of torrent(s) by one step.
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#increase-torrent-priority}
   */
  async increaseTorrentPriority(hashes: string | string[] | 'all'): Promise<boolean> {
    const data = { hashes: normalizeHashes(hashes) };
    await this.request('/torrents/increasePrio', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Decrease queue priority of torrent(s) by one step.
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#decrease-torrent-priority}
   */
  async decreaseTorrentPriority(hashes: string | string[] | 'all'): Promise<boolean> {
    const data = { hashes: normalizeHashes(hashes) };
    await this.request('/torrents/decreasePrio', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Move torrent(s) to the top of queue priority.
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#maximal-torrent-priority}
   */
  async maximalTorrentPriority(hashes: string | string[] | 'all'): Promise<boolean> {
    const data = { hashes: normalizeHashes(hashes) };
    await this.request('/torrents/topPrio', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Move torrent(s) to the bottom of queue priority.
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#minimal-torrent-priority}
   */
  async minimalTorrentPriority(hashes: string | string[] | 'all'): Promise<boolean> {
    const data = { hashes: normalizeHashes(hashes) };
    await this.request('/torrents/bottomPrio', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Set one or more file priorities inside a torrent.
   * @param hash Torrent hash.
   * @param fileIds File index/id or multiple ids.
   * @param priority Target file priority.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-file-priority}
   */
  async setFilePriority(
    hash: string,
    fileIds: string | string[],
    priority: TorrentFilePriority
  ): Promise<boolean> {
    await this.request<TorrentFile[]>(
      '/torrents/filePrio',
      'POST',
      undefined,
      objToUrlSearchParams({
        hash,
        id: normalizeHashes(fileIds),
        priority: priority.toString()
      }),
      undefined,
      false
    );
    return true;
  }

  /**
   * Get per-torrent download speed limit(s).
   * @param hash Torrent hash or multiple torrent hashes.
   * @returns Mapping from torrent hash to limit in bytes/second (0 means unlimited).
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-download-limit}
   */
  async getTorrentDownloadLimit(hash: string | string[]): Promise<DownloadSpeed> {
    const downloadLimit = await this.request<DownloadSpeed>(
      '/torrents/downloadLimit',
      'POST',
      undefined,
      objToUrlSearchParams({
        hashes: normalizeHashes(hash)
      })
    );
    return downloadLimit;
  }

  /**
   * Set per-torrent download speed limit.
   * @param hash Torrent hash or multiple torrent hashes.
   * @param limitBytesPerSecond Limit in bytes/second (`0` means unlimited).
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-torrent-download-limit}
   */
  async setTorrentDownloadLimit(
    hash: string | string[],
    limitBytesPerSecond: number
  ): Promise<boolean> {
    const data = {
      limit: limitBytesPerSecond.toString(),
      hashes: normalizeHashes(hash)
    };

    await this.request('/torrents/setDownloadLimit', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Get per-torrent upload speed limit(s).
   * @param hash Torrent hash or multiple torrent hashes.
   * @returns Mapping from torrent hash to limit in bytes/second (0 means unlimited).
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-upload-limit}
   */
  async getTorrentUploadLimit(hash: string | string[]): Promise<UploadSpeed> {
    const UploadLimit = await this.request<UploadSpeed>(
      '/torrents/uploadLimit',
      'POST',
      undefined,
      objToUrlSearchParams({
        hashes: normalizeHashes(hash)
      })
    );
    return UploadLimit;
  }

  /**
   * Set per-torrent upload speed limit.
   * @param hash Torrent hash or multiple torrent hashes.
   * @param limitBytesPerSecond Limit in bytes/second (`0` means unlimited).
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-torrent-upload-limit}
   */
  async setTorrentUploadLimit(
    hash: string | string[],
    limitBytesPerSecond: number
  ): Promise<boolean> {
    const data = {
      limit: limitBytesPerSecond.toString(),
      hashes: normalizeHashes(hash)
    };

    await this.request('/torrents/setUploadLimit', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Set save location for torrent data.
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @param location Target absolute path.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-torrent-location}
   */
  async setTorrentLocation(hashes: string | string[] | 'all', location: string): Promise<boolean> {
    const data = {
      location,
      hashes: normalizeHashes(hashes)
    };
    await this.request('/torrents/setLocation', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Rename a torrent.
   * @param hash Torrent hash.
   * @param name New torrent name.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-torrent-name}
   */
  async setTorrentName(hash: string, name: string): Promise<boolean> {
    const data = { hash, name };
    await this.request('/torrents/rename', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Set category for torrent(s).
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @param category Category name. Empty string removes category assignment.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-torrent-category}
   */
  async setTorrentCategory(hashes: string | string[] | 'all', category = ''): Promise<boolean> {
    const data = {
      hashes: normalizeHashes(hashes),
      category
    };
    await this.request('/torrents/setCategory', 'POST', undefined, objToUrlSearchParams(data));
    return true;
  }

  /**
   * Get all existing categories.
   * @returns Category map keyed by category name.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-all-categories}
   */
  async getAllCategories(): Promise<TorrentCategories> {
    const res = await this.request<TorrentCategories>('/torrents/categories', 'GET');
    return res;
  }

  /**
   * Create a new category.
   * @param category Category name.
   * @param savePath Default save path for this category. Empty string keeps default behavior.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#add-new-category}
   */
  async addNewCategory(category: string, savePath = ''): Promise<boolean> {
    const data = { category, savePath };
    await this.request(
      '/torrents/createCategory',
      'POST',
      undefined,
      objToUrlSearchParams(data),
      undefined,
      false
    );
    return true;
  }

  /**
   * Edit category default save path.
   * @param category Category name.
   * @param savePath New default save path.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#edit-category}
   */
  async editCategory(category: string, savePath = ''): Promise<boolean> {
    const data = { category, savePath };
    await this.request(
      '/torrents/editCategory',
      'POST',
      undefined,
      objToUrlSearchParams(data),
      undefined,
      false
    );
    return true;
  }

  /**
   * Remove one or more categories.
   * @param categories Category name or multiple category names.
   * Multiple values are joined by newline characters.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#remove-categories}
   */
  async removeCategories(categories: string | string[]): Promise<boolean> {
    const data = { categories: normalizeList(categories, '\n') };
    await this.request(
      '/torrents/removeCategories',
      'POST',
      undefined,
      objToUrlSearchParams(data),
      undefined,
      false
    );
    return true;
  }

  /**
   * Add tags to torrent(s).
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @param tags Tag name or multiple tag names.
   * Multiple values are joined by commas.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#add-torrent-tags}
   */
  async addTorrentTags(
    hashes: string | string[] | 'all',
    tags: string | string[]
  ): Promise<boolean> {
    const data = { hashes: normalizeHashes(hashes), tags: normalizeList(tags, ',') };
    await this.request(
      '/torrents/addTags',
      'POST',
      undefined,
      objToUrlSearchParams(data),
      undefined,
      false
    );
    return true;
  }

  /**
   * Remove tags from torrent(s).
   * @param hashes Torrent hash, multiple hashes, or `all`.
   * @param tags Tag name or multiple tag names. Omit to remove all tags.
   * Multiple values are joined by commas.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#remove-torrent-tags}
   */
  async removeTorrentTags(
    hashes: string | string[] | 'all',
    tags?: string | string[]
  ): Promise<boolean> {
    const data: Record<string, string> = { hashes: normalizeHashes(hashes) };
    if (tags !== undefined) {
      data.tags = normalizeList(tags, ',');
    }

    await this.request(
      '/torrents/removeTags',
      'POST',
      undefined,
      objToUrlSearchParams(data),
      undefined,
      false
    );
    return true;
  }

  /**
   * Get all existing torrent tags.
   * @returns Tag names.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-all-tags}
   */
  async getAllTags(): Promise<string[]> {
    const res = await this.request<string[]>('/torrents/tags', 'GET');
    return res;
  }

  /**
   * Create one or more tags.
   * @param tags Tag name or multiple tag names.
   * Multiple values are joined by commas.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#create-tags}
   */
  async createTags(tags: string | string[]): Promise<boolean> {
    const data = { tags: normalizeList(tags, ',') };
    await this.request(
      '/torrents/createTags',
      'POST',
      undefined,
      objToUrlSearchParams(data),
      undefined,
      false
    );
    return true;
  }

  /**
   * Delete one or more tags.
   * @param tags Tag name or multiple tag names.
   * Multiple values are joined by commas.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#delete-tags}
   */
  async deleteTags(tags: string | string[]): Promise<boolean> {
    const data = { tags: normalizeList(tags, ',') };
    await this.request(
      '/torrents/deleteTags',
      'POST',
      undefined,
      objToUrlSearchParams(data),
      undefined,
      false
    );
    return true;
  }

  /**
   * Rename a file inside a torrent.
   * @param hash Torrent hash.
   * @param oldPath Existing file path inside the torrent.
   * @param newPath New file path inside the torrent.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#rename-file}
   */
  async renameFile(hash: string, oldPath: string, newPath: string): Promise<boolean> {
    await this.request<string>(
      '/torrents/renameFile',
      'POST',
      undefined,
      objToUrlSearchParams({
        hash,
        oldPath,
        newPath
      }),
      undefined,
      false
    );

    return true;
  }

  /**
   * Rename a folder inside a torrent.
   * @param hash Torrent hash.
   * @param oldPath Existing folder path inside the torrent.
   * @param newPath New folder path inside the torrent.
   * @returns `true` when request succeeds.
   * {@link https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#rename-folder}
   */
  async renameFolder(hash: string, oldPath: string, newPath: string): Promise<boolean> {
    await this.request<string>(
      '/torrents/renameFolder',
      'POST',
      undefined,
      objToUrlSearchParams({
        hash,
        oldPath,
        newPath
      }),
      undefined,
      false
    );

    return true;
  }

  /**
   * Execute an authenticated WebUI API request.
   * @typeParam T Expected response type.
   * @param path API path relative to `baseURL`.
   * @param method HTTP method.
   * @param params Query string parameters.
   * @param body Request body for `POST` endpoints.
   * @param headers Additional request headers.
   * @param isJson When `true`, parse response as JSON; otherwise return plain text.
   * @returns Parsed response payload.
   */
  private async request<T>(
    path: string,
    method: 'GET' | 'POST',
    params?: Record<string, string | number>,
    body?: URLSearchParams | FormData,
    headers: Record<string, string> = {},
    isJson = true
  ): Promise<T> {
    if (
      !this.state.auth?.sid ||
      !this.state.auth.expires ||
      this.state.auth.expires.getTime() < Date.now()
    ) {
      const authed = await this.login();
      if (!authed) {
        throw new Error('Auth Failed');
      }
    }

    const url = new URL(joinURL(this.config.baseURL, path));
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, `${value}`);
      }
    }

    const res = await this.fetch(url.toString(), {
      method,
      headers: {
        Cookie: `SID=${this.state.auth!.sid ?? ''}`,
        ...headers
      },
      body
    });

    if (isJson) {
      return (await res.json()) as T;
    }

    return (await res.text()) as T;
  }

  /**
   * Low-level fetch wrapper with optional dispatcher and timeout support.
   * Throws on non-2xx responses with response body included in the error message.
   */
  private async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    const fetchImpl = this.config.fetch ?? globalThis.fetch;
    if (!fetchImpl) {
      throw new Error('Fetch API is not available');
    }

    const requestInit: RequestInitWithDispatcher = { ...init };
    if (this.config.dispatcher !== undefined) {
      requestInit.dispatcher = this.config.dispatcher;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (this.config.timeout && this.config.timeout > 0) {
      const controller = new AbortController();
      requestInit.signal = controller.signal;
      timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    }

    try {
      const resp = await (
        fetchImpl as (input: string, init?: RequestInitWithDispatcher) => Promise<Response>
      )(url, requestInit);

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Request failed: ${resp.status} ${resp.statusText} ${errorText}`.trim());
      }

      return resp;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Detect and cache server version for API compatibility behavior.
   */
  private async checkVersion(): Promise<void> {
    if (!this.state.version?.application) {
      const newVersion = await this.getApplicationVersion();
      // Remove potential 'v' prefix and any extra info after version number
      const cleanVersion = newVersion.replace(/^v/, '').split('-')[0]!;
      this.state.version = {
        application: newVersion,
        isVersion5OrHigher: cleanVersion === '5.0.0' || isGreater(cleanVersion, '5.0.0')
      };
    }
  }
}
