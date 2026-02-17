import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { z } from 'zod';

import type { QBittorrent, QBittorrentLogPersister } from 'nqbt';

import {
  addNewCategoryInputSchema,
  addNewMagnetInputSchema,
  addPeersInputSchema,
  addNewTorrentInputSchema,
  addTorrentTagsInputSchema,
  addTrackersToTorrentInputSchema,
  banPeersInputSchema,
  deleteTorrentsInputSchema,
  editCategoryInputSchema,
  editTrackersInputSchema,
  getLogInputSchema,
  getMainDataInputSchema,
  getPeerLogInputSchema,
  getTorrentListInputSchema,
  getTorrentPeersDataInputSchema,
  globalLimitInputSchema,
  hashInputSchema,
  hashesInputSchema,
  removeCategoriesInputSchema,
  removeTorrentTagsInputSchema,
  removeTrackersInputSchema,
  renamePathInputSchema,
  setApplicationPreferencesInputSchema,
  setAutomaticTorrentManagementInputSchema,
  setCookiesInputSchema,
  setTorrentBooleanStateInputSchema,
  setFilePriorityInputSchema,
  setTorrentCategoryInputSchema,
  setTorrentLimitInputSchema,
  setTorrentLocationInputSchema,
  setTorrentNameInputSchema,
  setTorrentShareLimitsInputSchema,
  tagsInputSchema,
  torrentLimitInputSchema
} from './schema.js';
import type { McpErrorPayload } from './utils.js';
import { formatResultText, runWithMcpErrorPayload } from './utils.js';

function getToolResult(result: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: formatResultText(result)
      }
    ],
    structuredContent: {
      result
    }
  };
}

function getToolErrorResult(payload: McpErrorPayload) {
  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: formatResultText(payload)
      }
    ],
    structuredContent: payload
  };
}

function createToolRegistrars(server: McpServer, logger: QBittorrentLogPersister) {
  function registerNoArgsTool(
    name: string,
    description: string,
    handler: () => Promise<unknown>
  ): void {
    server.registerTool(name, { description }, async () => {
      const execution = await runWithMcpErrorPayload(logger, handler);
      if (execution.ok) {
        const result = execution.data;
        return getToolResult(result);
      }

      return getToolErrorResult(execution.error);
    });
  }

  function registerToolWithArgs<TSchema extends z.ZodTypeAny>(
    name: string,
    description: string,
    inputSchema: TSchema,
    handler: (args: z.infer<TSchema>) => Promise<unknown>
  ): void {
    (server.registerTool as (...args: unknown[]) => unknown)(
      name,
      { description, inputSchema },
      async (args: unknown) => {
        const execution = await runWithMcpErrorPayload(logger, async () => {
          return handler(args as z.infer<TSchema>);
        });
        if (execution.ok) {
          const result = execution.data;
          return getToolResult(result);
        }

        return getToolErrorResult(execution.error);
      }
    );
  }

  return {
    registerNoArgsTool,
    registerToolWithArgs
  };
}

export function registerQbittorrentTools(
  server: McpServer,
  qbittorrent: QBittorrent,
  logger: QBittorrentLogPersister
): void {
  const { registerNoArgsTool, registerToolWithArgs } = createToolRegistrars(server, logger);

  registerNoArgsTool(
    'get_application_version',
    'Read-only. Get qBittorrent application version string from /app/version.',
    async () => {
      return qbittorrent.getApplicationVersion();
    }
  );

  registerNoArgsTool(
    'get_api_version',
    'Read-only. Get qBittorrent WebUI API version from /app/webapiVersion.',
    async () => {
      return qbittorrent.getApiVersion();
    }
  );

  registerNoArgsTool(
    'get_build_info',
    'Read-only. Get qBittorrent build/runtime info (Qt, libtorrent, OpenSSL, etc.).',
    async () => {
      return qbittorrent.getBuildInfo();
    }
  );

  registerNoArgsTool(
    'get_application_preferences',
    'Read-only. Get full qBittorrent preferences object.',
    async () => {
      return qbittorrent.getApplicationPreferences();
    }
  );

  registerToolWithArgs(
    'set_application_preferences',
    'Mutating. Update qBittorrent preferences with provided partial preferences object.',
    setApplicationPreferencesInputSchema,
    async (args) => {
      return qbittorrent.setApplicationPreferences(args.preferences);
    }
  );

  registerNoArgsTool(
    'get_default_save_path',
    'Read-only. Get qBittorrent default save path.',
    async () => {
      return qbittorrent.getDefaultSavePath();
    }
  );

  registerNoArgsTool(
    'get_cookies',
    'Read-only. Get qBittorrent WebUI HTTP cookies list.',
    async () => {
      return qbittorrent.getCookies();
    }
  );

  registerToolWithArgs(
    'set_cookies',
    'Mutating. Upsert qBittorrent cookies used by WebUI HTTP requests.',
    setCookiesInputSchema,
    async (args) => {
      return qbittorrent.setCookies(args.cookies);
    }
  );

  registerToolWithArgs(
    'get_log',
    'Read-only. Get qBittorrent main log entries. lastKnownId is an incremental cursor (returns entries with id > lastKnownId).',
    getLogInputSchema,
    async (args) => {
      return qbittorrent.getLog(args);
    }
  );

  registerToolWithArgs(
    'get_peer_log',
    'Read-only. Get peer-related log entries. lastKnownId is an incremental cursor (returns entries with id > lastKnownId).',
    getPeerLogInputSchema,
    async (args) => {
      return qbittorrent.getPeerLog(args.lastKnownId);
    }
  );

  registerToolWithArgs(
    'get_main_data',
    'Read-only. Get global sync snapshot/delta from /sync/maindata. Use rid for incremental polling.',
    getMainDataInputSchema,
    async (args) => {
      return qbittorrent.getMainData(args.rid);
    }
  );

  registerToolWithArgs(
    'get_torrent_peers_data',
    'Read-only. Get peer list and peer delta for one torrent (hash + optional rid).',
    getTorrentPeersDataInputSchema,
    async (args) => {
      return qbittorrent.getTorrentPeersData(args.hash, args.rid);
    }
  );

  registerNoArgsTool(
    'get_global_transfer_info',
    'Read-only. Get global transfer state (rates, totals, limits, connection status).',
    async () => {
      return qbittorrent.getGlobalTransferInfo();
    }
  );

  registerNoArgsTool(
    'get_alternative_speed_limits_state',
    'Read-only. Get whether alternative speed limits mode is enabled.',
    async () => {
      return qbittorrent.getAlternativeSpeedLimitsState();
    }
  );

  registerNoArgsTool(
    'toggle_alternative_speed_limits',
    'Mutating. Toggle alternative speed limits mode.',
    async () => {
      return qbittorrent.toggleAlternativeSpeedLimits();
    }
  );

  registerNoArgsTool(
    'get_global_download_limit',
    'Read-only. Get global download speed limit in bytes/second (0 means unlimited).',
    async () => {
      return qbittorrent.getGlobalDownloadLimit();
    }
  );

  registerToolWithArgs(
    'set_global_download_limit',
    'Mutating. Set global download speed limit in bytes/second (0 means unlimited).',
    globalLimitInputSchema,
    async (args) => {
      return qbittorrent.setGlobalDownloadLimit(args.limitBytesPerSecond);
    }
  );

  registerNoArgsTool(
    'get_global_upload_limit',
    'Read-only. Get global upload speed limit in bytes/second (0 means unlimited).',
    async () => {
      return qbittorrent.getGlobalUploadLimit();
    }
  );

  registerToolWithArgs(
    'set_global_upload_limit',
    'Mutating. Set global upload speed limit in bytes/second (0 means unlimited).',
    globalLimitInputSchema,
    async (args) => {
      return qbittorrent.setGlobalUploadLimit(args.limitBytesPerSecond);
    }
  );

  registerToolWithArgs(
    'ban_peers',
    'Mutating. Ban one or more peers globally by IP.',
    banPeersInputSchema,
    async (args) => {
      return qbittorrent.banPeers(args.peers);
    }
  );

  registerToolWithArgs(
    'get_torrent_list',
    'Read-only. List torrents with optional filters/sorting/pagination.',
    getTorrentListInputSchema,
    async (args) => {
      return qbittorrent.getTorrentList(args);
    }
  );

  registerToolWithArgs(
    'get_torrent_generic_properties',
    'Read-only. Get detailed generic properties for one torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentGenericProperties(args.hash);
    }
  );

  registerToolWithArgs(
    'get_torrent_trackers',
    'Read-only. Get trackers for one torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentTrackers(args.hash);
    }
  );

  registerToolWithArgs(
    'get_torrent_web_seeds',
    'Read-only. Get web seeds for one torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentWebSeeds(args.hash);
    }
  );

  registerToolWithArgs(
    'get_torrent_contents',
    'Read-only. Get file list for one torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentContents(args.hash);
    }
  );

  registerToolWithArgs(
    'get_torrent_pieces_states',
    'Read-only. Get piece state array for one torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentPiecesStates(args.hash);
    }
  );

  registerToolWithArgs(
    'get_torrent_pieces_hashes',
    'Read-only. Get piece hash array for one torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentPiecesHashes(args.hash);
    }
  );

  registerToolWithArgs(
    'stop_torrents',
    'Mutating. Stop selected torrents (supports one hash, multiple hashes, or "all").',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.stopTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    'start_torrents',
    'Mutating. Start selected torrents (supports one hash, multiple hashes, or "all").',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.startTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    'pause_torrents',
    'Mutating. Pause selected torrents (alias of stop behavior for compatibility).',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.pauseTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    'resume_torrents',
    'Mutating. Resume selected torrents (alias of start behavior for compatibility).',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.resumeTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    'delete_torrents',
    'Mutating and high-risk. Delete selected torrents, optionally including downloaded files.',
    deleteTorrentsInputSchema,
    async (args) => {
      return qbittorrent.deleteTorrents(args.hashes, args.deleteFiles);
    }
  );

  registerToolWithArgs(
    'recheck_torrents',
    'Mutating. Force recheck selected torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.recheckTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    'reannounce_torrents',
    'Mutating. Reannounce selected torrents to trackers.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.reannounceTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    'edit_trackers',
    'Mutating. Replace one tracker URL on a torrent.',
    editTrackersInputSchema,
    async (args) => {
      return qbittorrent.editTrackers(args.hash, args.origUrl, args.newUrl);
    }
  );

  registerToolWithArgs(
    'remove_trackers',
    'Mutating. Remove tracker URL(s) from a torrent.',
    removeTrackersInputSchema,
    async (args) => {
      return qbittorrent.removeTrackers(args.hash, args.urls);
    }
  );

  registerToolWithArgs(
    'add_new_torrent',
    'Mutating. Add a torrent from raw bytes. "torrent" accepts base64 string or byte array. For reliable category/tag assignment, create category/tag first.',
    addNewTorrentInputSchema,
    async (args) => {
      const torrent =
        typeof args.torrent === 'string'
          ? new Uint8Array(Buffer.from(args.torrent, 'base64'))
          : new Uint8Array(args.torrent);

      return qbittorrent.addNewTorrent(torrent, args.options);
    }
  );

  registerToolWithArgs(
    'add_new_magnet',
    'Mutating. Add one or more torrents by magnet URL(s). For reliable category/tag assignment, create category/tag first.',
    addNewMagnetInputSchema,
    async (args) => {
      return qbittorrent.addNewMagnet(args.urls, args.options);
    }
  );

  registerToolWithArgs(
    'add_trackers_to_torrent',
    'Mutating. Add tracker URL(s) to a torrent.',
    addTrackersToTorrentInputSchema,
    async (args) => {
      return qbittorrent.addTrackersToTorrent(args.hash, args.urls);
    }
  );

  registerToolWithArgs(
    'add_peers',
    'Mutating. Add peer endpoint(s) (typically ip:port) to a torrent.',
    addPeersInputSchema,
    async (args) => {
      return qbittorrent.addPeers(args.hash, args.peers);
    }
  );

  registerToolWithArgs(
    'set_torrent_share_limits',
    'Mutating. Set share ratio/time limits for selected torrents.',
    setTorrentShareLimitsInputSchema,
    async (args) => {
      return qbittorrent.setTorrentShareLimits(args.hashes, {
        ratioLimit: args.ratioLimit,
        seedingTimeLimit: args.seedingTimeLimit,
        inactiveSeedingTimeLimit: args.inactiveSeedingTimeLimit
      });
    }
  );

  registerToolWithArgs(
    'increase_torrent_priority',
    'Mutating. Increase queue priority by one step for selected torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.increaseTorrentPriority(args.hashes);
    }
  );

  registerToolWithArgs(
    'decrease_torrent_priority',
    'Mutating. Decrease queue priority by one step for selected torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.decreaseTorrentPriority(args.hashes);
    }
  );

  registerToolWithArgs(
    'maximal_torrent_priority',
    'Mutating. Move selected torrents to top queue priority.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.maximalTorrentPriority(args.hashes);
    }
  );

  registerToolWithArgs(
    'minimal_torrent_priority',
    'Mutating. Move selected torrents to bottom queue priority.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.minimalTorrentPriority(args.hashes);
    }
  );

  registerToolWithArgs(
    'set_file_priority',
    'Mutating. Set priority for one or more files inside a torrent.',
    setFilePriorityInputSchema,
    async (args) => {
      return qbittorrent.setFilePriority(args.hash, args.fileIds, args.priority);
    }
  );

  registerToolWithArgs(
    'get_torrent_download_limit',
    'Read-only. Get per-torrent download speed limit(s) in bytes/second.',
    torrentLimitInputSchema,
    async (args) => {
      return qbittorrent.getTorrentDownloadLimit(args.hashes);
    }
  );

  registerToolWithArgs(
    'set_torrent_download_limit',
    'Mutating. Set per-torrent download speed limit in bytes/second (0 means unlimited).',
    setTorrentLimitInputSchema,
    async (args) => {
      return qbittorrent.setTorrentDownloadLimit(args.hashes, args.limitBytesPerSecond);
    }
  );

  registerToolWithArgs(
    'get_torrent_upload_limit',
    'Read-only. Get per-torrent upload speed limit(s) in bytes/second.',
    torrentLimitInputSchema,
    async (args) => {
      return qbittorrent.getTorrentUploadLimit(args.hashes);
    }
  );

  registerToolWithArgs(
    'set_torrent_upload_limit',
    'Mutating. Set per-torrent upload speed limit in bytes/second (0 means unlimited).',
    setTorrentLimitInputSchema,
    async (args) => {
      return qbittorrent.setTorrentUploadLimit(args.hashes, args.limitBytesPerSecond);
    }
  );

  registerToolWithArgs(
    'set_torrent_location',
    'Mutating. Move selected torrents to a new save path.',
    setTorrentLocationInputSchema,
    async (args) => {
      return qbittorrent.setTorrentLocation(args.hashes, args.location);
    }
  );

  registerToolWithArgs(
    'set_torrent_name',
    'Mutating. Rename a torrent display name.',
    setTorrentNameInputSchema,
    async (args) => {
      return qbittorrent.setTorrentName(args.hash, args.name);
    }
  );

  registerToolWithArgs(
    'set_torrent_category',
    'Mutating. Set or clear category for selected torrents.',
    setTorrentCategoryInputSchema,
    async (args) => {
      return qbittorrent.setTorrentCategory(args.hashes, args.category);
    }
  );

  registerToolWithArgs(
    'set_automatic_torrent_management',
    'Mutating. Enable/disable automatic torrent management for selected torrents.',
    setAutomaticTorrentManagementInputSchema,
    async (args) => {
      return qbittorrent.setAutomaticTorrentManagement(args.hashes, args.enable);
    }
  );

  registerToolWithArgs(
    'toggle_sequential_download',
    'Mutating. Toggle sequential download mode for selected torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.toggleSequentialDownload(args.hashes);
    }
  );

  registerToolWithArgs(
    'set_first_last_piece_priority',
    'Mutating. Toggle first/last piece priority for selected torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.setFirstLastPiecePriority(args.hashes);
    }
  );

  registerToolWithArgs(
    'set_force_start',
    'Mutating. Set force-start state for selected torrents.',
    setTorrentBooleanStateInputSchema,
    async (args) => {
      return qbittorrent.setForceStart(args.hashes, args.value);
    }
  );

  registerToolWithArgs(
    'set_super_seeding',
    'Mutating. Set super-seeding state for selected torrents.',
    setTorrentBooleanStateInputSchema,
    async (args) => {
      return qbittorrent.setSuperSeeding(args.hashes, args.value);
    }
  );

  registerNoArgsTool(
    'get_all_categories',
    'Read-only. Get all categories with their configured save paths.',
    async () => {
      return qbittorrent.getAllCategories();
    }
  );

  registerToolWithArgs(
    'add_new_category',
    'Mutating. Create a category (optionally with default save path).',
    addNewCategoryInputSchema,
    async (args) => {
      return qbittorrent.addNewCategory(args.category, args.savePath);
    }
  );

  registerToolWithArgs(
    'edit_category',
    'Mutating. Update a category default save path.',
    editCategoryInputSchema,
    async (args) => {
      return qbittorrent.editCategory(args.category, args.savePath);
    }
  );

  registerToolWithArgs(
    'remove_categories',
    'Mutating. Remove one or more categories.',
    removeCategoriesInputSchema,
    async (args) => {
      return qbittorrent.removeCategories(args.categories);
    }
  );

  registerToolWithArgs(
    'add_torrent_tags',
    'Mutating. Add tag(s) to selected torrents.',
    addTorrentTagsInputSchema,
    async (args) => {
      return qbittorrent.addTorrentTags(args.hashes, args.tags);
    }
  );

  registerToolWithArgs(
    'remove_torrent_tags',
    'Mutating. Remove tag(s) from selected torrents. Omit tags to remove all tags.',
    removeTorrentTagsInputSchema,
    async (args) => {
      return qbittorrent.removeTorrentTags(args.hashes, args.tags);
    }
  );

  registerNoArgsTool('get_all_tags', 'Read-only. Get all existing tags.', async () => {
    return qbittorrent.getAllTags();
  });

  registerToolWithArgs(
    'create_tags',
    'Mutating. Create one or more tags.',
    tagsInputSchema,
    async (args) => {
      return qbittorrent.createTags(args.tags);
    }
  );

  registerToolWithArgs(
    'delete_tags',
    'Mutating. Delete one or more tags.',
    tagsInputSchema,
    async (args) => {
      return qbittorrent.deleteTags(args.tags);
    }
  );

  registerToolWithArgs(
    'rename_file',
    'Mutating. Rename a file path inside a torrent.',
    renamePathInputSchema,
    async (args) => {
      return qbittorrent.renameFile(args.hash, args.oldPath, args.newPath);
    }
  );

  registerToolWithArgs(
    'rename_folder',
    'Mutating. Rename a folder path inside a torrent.',
    renamePathInputSchema,
    async (args) => {
      return qbittorrent.renameFolder(args.hash, args.oldPath, args.newPath);
    }
  );
}
