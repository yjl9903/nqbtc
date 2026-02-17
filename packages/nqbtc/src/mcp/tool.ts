import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { z } from 'zod';

import type { QBittorrent } from '@nqbt/core';

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
import { formatResultText } from './utils.js';

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

function registerNoArgsTool(
  server: McpServer,
  name: string,
  description: string,
  handler: () => Promise<unknown>
): void {
  server.registerTool(name, { description }, async () => {
    const result = await handler();
    return getToolResult(result);
  });
}

function registerToolWithArgs<TSchema extends z.ZodTypeAny>(
  server: McpServer,
  name: string,
  description: string,
  inputSchema: TSchema,
  handler: (args: z.infer<TSchema>) => Promise<unknown>
): void {
  (server.registerTool as (...args: unknown[]) => unknown)(
    name,
    { description, inputSchema },
    async (args: unknown) => {
      const result = await handler(args as z.infer<TSchema>);
      return getToolResult(result);
    }
  );
}

export function registerQbittorrentTools(server: McpServer, qbittorrent: QBittorrent): void {
  registerNoArgsTool(
    server,
    'get_application_version',
    'Get qBittorrent application version.',
    async () => {
      return qbittorrent.getApplicationVersion();
    }
  );

  registerNoArgsTool(server, 'get_api_version', 'Get qBittorrent WebUI API version.', async () => {
    return qbittorrent.getApiVersion();
  });

  registerNoArgsTool(server, 'get_build_info', 'Get qBittorrent build info.', async () => {
    return qbittorrent.getBuildInfo();
  });

  registerNoArgsTool(
    server,
    'get_application_preferences',
    'Get qBittorrent application preferences.',
    async () => {
      return qbittorrent.getApplicationPreferences();
    }
  );

  registerToolWithArgs(
    server,
    'set_application_preferences',
    'Set qBittorrent application preferences.',
    setApplicationPreferencesInputSchema,
    async (args) => {
      return qbittorrent.setApplicationPreferences(args.preferences);
    }
  );

  registerNoArgsTool(
    server,
    'get_default_save_path',
    'Get qBittorrent default save path.',
    async () => {
      return qbittorrent.getDefaultSavePath();
    }
  );

  registerNoArgsTool(server, 'get_cookies', 'Get qBittorrent cookies.', async () => {
    return qbittorrent.getCookies();
  });

  registerToolWithArgs(
    server,
    'set_cookies',
    'Set qBittorrent cookies.',
    setCookiesInputSchema,
    async (args) => {
      return qbittorrent.setCookies(args.cookies);
    }
  );

  registerToolWithArgs(
    server,
    'get_log',
    'Get qBittorrent main log entries.',
    getLogInputSchema,
    async (args) => {
      return qbittorrent.getLog(args);
    }
  );

  registerToolWithArgs(
    server,
    'get_peer_log',
    'Get qBittorrent peer log entries.',
    getPeerLogInputSchema,
    async (args) => {
      return qbittorrent.getPeerLog(args.lastKnownId);
    }
  );

  registerToolWithArgs(
    server,
    'get_main_data',
    'Get qBittorrent main sync data.',
    getMainDataInputSchema,
    async (args) => {
      return qbittorrent.getMainData(args.rid);
    }
  );

  registerToolWithArgs(
    server,
    'get_torrent_peers_data',
    'Get torrent peers data.',
    getTorrentPeersDataInputSchema,
    async (args) => {
      return qbittorrent.getTorrentPeersData(args.hash, args.rid);
    }
  );

  registerNoArgsTool(
    server,
    'get_global_transfer_info',
    'Get qBittorrent global transfer information. This method returns info you usually see in qBittorrent status bar.',
    async () => {
      return qbittorrent.getGlobalTransferInfo();
    }
  );

  registerNoArgsTool(
    server,
    'get_alternative_speed_limits_state',
    'Get alternative speed limits state.',
    async () => {
      return qbittorrent.getAlternativeSpeedLimitsState();
    }
  );

  registerNoArgsTool(
    server,
    'toggle_alternative_speed_limits',
    'Toggle alternative speed limits state.',
    async () => {
      return qbittorrent.toggleAlternativeSpeedLimits();
    }
  );

  registerNoArgsTool(
    server,
    'get_global_download_limit',
    'Get global download speed limit.',
    async () => {
      return qbittorrent.getGlobalDownloadLimit();
    }
  );

  registerToolWithArgs(
    server,
    'set_global_download_limit',
    'Set global download speed limit.',
    globalLimitInputSchema,
    async (args) => {
      return qbittorrent.setGlobalDownloadLimit(args.limitBytesPerSecond);
    }
  );

  registerNoArgsTool(
    server,
    'get_global_upload_limit',
    'Get global upload speed limit.',
    async () => {
      return qbittorrent.getGlobalUploadLimit();
    }
  );

  registerToolWithArgs(
    server,
    'set_global_upload_limit',
    'Set global upload speed limit.',
    globalLimitInputSchema,
    async (args) => {
      return qbittorrent.setGlobalUploadLimit(args.limitBytesPerSecond);
    }
  );

  registerToolWithArgs(
    server,
    'ban_peers',
    'Ban one or more peers by IP.',
    banPeersInputSchema,
    async (args) => {
      return qbittorrent.banPeers(args.peers);
    }
  );

  registerToolWithArgs(
    server,
    'get_torrent_list',
    'Get torrent list with optional filters.',
    getTorrentListInputSchema,
    async (args) => {
      return qbittorrent.getTorrentList(args);
    }
  );

  registerToolWithArgs(
    server,
    'get_torrent_generic_properties',
    'Get generic properties of a torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentGenericProperties(args.hash);
    }
  );

  registerToolWithArgs(
    server,
    'get_torrent_trackers',
    'Get trackers of a torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentTrackers(args.hash);
    }
  );

  registerToolWithArgs(
    server,
    'get_torrent_web_seeds',
    'Get web seeds of a torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentWebSeeds(args.hash);
    }
  );

  registerToolWithArgs(
    server,
    'get_torrent_contents',
    'Get files of a torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentContents(args.hash);
    }
  );

  registerToolWithArgs(
    server,
    'get_torrent_pieces_states',
    'Get piece states of a torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentPiecesStates(args.hash);
    }
  );

  registerToolWithArgs(
    server,
    'get_torrent_pieces_hashes',
    'Get piece hashes of a torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentPiecesHashes(args.hash);
    }
  );

  registerToolWithArgs(
    server,
    'stop_torrents',
    'Stop one or more torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.stopTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'start_torrents',
    'Start one or more torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.startTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'pause_torrents',
    'Pause one or more torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.pauseTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'resume_torrents',
    'Resume one or more torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.resumeTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'delete_torrents',
    'Delete one or more torrents.',
    deleteTorrentsInputSchema,
    async (args) => {
      return qbittorrent.deleteTorrents(args.hashes, args.deleteFiles);
    }
  );

  registerToolWithArgs(
    server,
    'recheck_torrents',
    'Force recheck one or more torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.recheckTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'reannounce_torrents',
    'Reannounce one or more torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.reannounceTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'edit_trackers',
    'Edit a tracker URL on a torrent.',
    editTrackersInputSchema,
    async (args) => {
      return qbittorrent.editTrackers(args.hash, args.origUrl, args.newUrl);
    }
  );

  registerToolWithArgs(
    server,
    'remove_trackers',
    'Remove trackers from a torrent.',
    removeTrackersInputSchema,
    async (args) => {
      return qbittorrent.removeTrackers(args.hash, args.urls);
    }
  );

  registerToolWithArgs(
    server,
    'add_new_torrent',
    'Add a new torrent from bytes. `torrent` accepts base64 string or byte array.',
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
    server,
    'add_new_magnet',
    'Add new torrent(s) by magnet URL(s).',
    addNewMagnetInputSchema,
    async (args) => {
      return qbittorrent.addNewMagnet(args.urls, args.options);
    }
  );

  registerToolWithArgs(
    server,
    'add_trackers_to_torrent',
    'Add trackers to a torrent.',
    addTrackersToTorrentInputSchema,
    async (args) => {
      return qbittorrent.addTrackersToTorrent(args.hash, args.urls);
    }
  );

  registerToolWithArgs(
    server,
    'add_peers',
    'Add peers to a torrent.',
    addPeersInputSchema,
    async (args) => {
      return qbittorrent.addPeers(args.hash, args.peers);
    }
  );

  registerToolWithArgs(
    server,
    'set_torrent_share_limits',
    'Set share limits for one or more torrents.',
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
    server,
    'increase_torrent_priority',
    'Increase queue priority for torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.increaseTorrentPriority(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'decrease_torrent_priority',
    'Decrease queue priority for torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.decreaseTorrentPriority(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'maximal_torrent_priority',
    'Move torrents to maximal queue priority.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.maximalTorrentPriority(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'minimal_torrent_priority',
    'Move torrents to minimal queue priority.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.minimalTorrentPriority(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'set_file_priority',
    'Set file priority inside a torrent.',
    setFilePriorityInputSchema,
    async (args) => {
      return qbittorrent.setFilePriority(args.hash, args.fileIds, args.priority);
    }
  );

  registerToolWithArgs(
    server,
    'get_torrent_download_limit',
    'Get per-torrent download speed limit.',
    torrentLimitInputSchema,
    async (args) => {
      return qbittorrent.getTorrentDownloadLimit(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'set_torrent_download_limit',
    'Set per-torrent download speed limit.',
    setTorrentLimitInputSchema,
    async (args) => {
      return qbittorrent.setTorrentDownloadLimit(args.hashes, args.limitBytesPerSecond);
    }
  );

  registerToolWithArgs(
    server,
    'get_torrent_upload_limit',
    'Get per-torrent upload speed limit.',
    torrentLimitInputSchema,
    async (args) => {
      return qbittorrent.getTorrentUploadLimit(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'set_torrent_upload_limit',
    'Set per-torrent upload speed limit.',
    setTorrentLimitInputSchema,
    async (args) => {
      return qbittorrent.setTorrentUploadLimit(args.hashes, args.limitBytesPerSecond);
    }
  );

  registerToolWithArgs(
    server,
    'set_torrent_location',
    'Set save location for torrents.',
    setTorrentLocationInputSchema,
    async (args) => {
      return qbittorrent.setTorrentLocation(args.hashes, args.location);
    }
  );

  registerToolWithArgs(
    server,
    'set_torrent_name',
    'Rename a torrent.',
    setTorrentNameInputSchema,
    async (args) => {
      return qbittorrent.setTorrentName(args.hash, args.name);
    }
  );

  registerToolWithArgs(
    server,
    'set_torrent_category',
    'Set category for torrents.',
    setTorrentCategoryInputSchema,
    async (args) => {
      return qbittorrent.setTorrentCategory(args.hashes, args.category);
    }
  );

  registerToolWithArgs(
    server,
    'set_automatic_torrent_management',
    'Set automatic torrent management for torrents.',
    setAutomaticTorrentManagementInputSchema,
    async (args) => {
      return qbittorrent.setAutomaticTorrentManagement(args.hashes, args.enable);
    }
  );

  registerToolWithArgs(
    server,
    'toggle_sequential_download',
    'Toggle sequential download for torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.toggleSequentialDownload(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'set_first_last_piece_priority',
    'Toggle first/last piece priority for torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.setFirstLastPiecePriority(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'set_force_start',
    'Set force-start state for torrents.',
    setTorrentBooleanStateInputSchema,
    async (args) => {
      return qbittorrent.setForceStart(args.hashes, args.value);
    }
  );

  registerToolWithArgs(
    server,
    'set_super_seeding',
    'Set super-seeding state for torrents.',
    setTorrentBooleanStateInputSchema,
    async (args) => {
      return qbittorrent.setSuperSeeding(args.hashes, args.value);
    }
  );

  registerNoArgsTool(server, 'get_all_categories', 'Get all categories.', async () => {
    return qbittorrent.getAllCategories();
  });

  registerToolWithArgs(
    server,
    'add_new_category',
    'Create a new category.',
    addNewCategoryInputSchema,
    async (args) => {
      return qbittorrent.addNewCategory(args.category, args.savePath);
    }
  );

  registerToolWithArgs(
    server,
    'edit_category',
    'Edit category save path.',
    editCategoryInputSchema,
    async (args) => {
      return qbittorrent.editCategory(args.category, args.savePath);
    }
  );

  registerToolWithArgs(
    server,
    'remove_categories',
    'Remove one or more categories.',
    removeCategoriesInputSchema,
    async (args) => {
      return qbittorrent.removeCategories(args.categories);
    }
  );

  registerToolWithArgs(
    server,
    'add_torrent_tags',
    'Add tags to torrents.',
    addTorrentTagsInputSchema,
    async (args) => {
      return qbittorrent.addTorrentTags(args.hashes, args.tags);
    }
  );

  registerToolWithArgs(
    server,
    'remove_torrent_tags',
    'Remove tags from torrents.',
    removeTorrentTagsInputSchema,
    async (args) => {
      return qbittorrent.removeTorrentTags(args.hashes, args.tags);
    }
  );

  registerNoArgsTool(server, 'get_all_tags', 'Get all tags.', async () => {
    return qbittorrent.getAllTags();
  });

  registerToolWithArgs(
    server,
    'create_tags',
    'Create one or more tags.',
    tagsInputSchema,
    async (args) => {
      return qbittorrent.createTags(args.tags);
    }
  );

  registerToolWithArgs(
    server,
    'delete_tags',
    'Delete one or more tags.',
    tagsInputSchema,
    async (args) => {
      return qbittorrent.deleteTags(args.tags);
    }
  );

  registerToolWithArgs(
    server,
    'rename_file',
    'Rename a file in a torrent.',
    renamePathInputSchema,
    async (args) => {
      return qbittorrent.renameFile(args.hash, args.oldPath, args.newPath);
    }
  );

  registerToolWithArgs(
    server,
    'rename_folder',
    'Rename a folder in a torrent.',
    renamePathInputSchema,
    async (args) => {
      return qbittorrent.renameFolder(args.hash, args.oldPath, args.newPath);
    }
  );
}
