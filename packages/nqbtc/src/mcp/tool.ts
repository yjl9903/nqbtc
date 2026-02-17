import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { z } from 'zod';

import type { QBittorrent } from '@nqbt/core';

import {
  addNewCategoryInputSchema,
  addNewMagnetInputSchema,
  addNewTorrentInputSchema,
  addTorrentTagsInputSchema,
  addTrackersToTorrentInputSchema,
  deleteTorrentsInputSchema,
  editCategoryInputSchema,
  editTrackersInputSchema,
  getTorrentListInputSchema,
  getTorrentPeersDataInputSchema,
  hashInputSchema,
  hashesInputSchema,
  removeCategoriesInputSchema,
  removeTorrentTagsInputSchema,
  removeTrackersInputSchema,
  renamePathInputSchema,
  setApplicationPreferencesInputSchema,
  setFilePriorityInputSchema,
  setTorrentCategoryInputSchema,
  setTorrentLimitInputSchema,
  setTorrentLocationInputSchema,
  setTorrentNameInputSchema,
  tagsInputSchema,
  torrentLimitInputSchema
} from './schema.js';

function formatResult(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getToolResult(result: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: formatResult(result)
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
    'qbittorrent.getApplicationVersion',
    'Get qBittorrent application version.',
    async () => {
      return qbittorrent.getApplicationVersion();
    }
  );

  registerNoArgsTool(
    server,
    'qbittorrent.getApiVersion',
    'Get qBittorrent WebUI API version.',
    async () => {
      return qbittorrent.getApiVersion();
    }
  );

  registerNoArgsTool(
    server,
    'qbittorrent.getBuildInfo',
    'Get qBittorrent build info.',
    async () => {
      return qbittorrent.getBuildInfo();
    }
  );

  registerNoArgsTool(
    server,
    'qbittorrent.getApplicationPreferences',
    'Get qBittorrent application preferences.',
    async () => {
      return qbittorrent.getApplicationPreferences();
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.setApplicationPreferences',
    'Set qBittorrent application preferences.',
    setApplicationPreferencesInputSchema,
    async (args) => {
      return qbittorrent.setApplicationPreferences(args.preferences);
    }
  );

  registerNoArgsTool(
    server,
    'qbittorrent.getDefaultSavePath',
    'Get qBittorrent default save path.',
    async () => {
      return qbittorrent.getDefaultSavePath();
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.getTorrentPeersData',
    'Get torrent peers data.',
    getTorrentPeersDataInputSchema,
    async (args) => {
      return qbittorrent.getTorrentPeersData(args.hash, args.rid);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.getTorrentList',
    'Get torrent list with optional filters.',
    getTorrentListInputSchema,
    async (args) => {
      return qbittorrent.getTorrentList(args);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.getTorrentGenericProperties',
    'Get generic properties of a torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentGenericProperties(args.hash);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.getTorrentTrackers',
    'Get trackers of a torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentTrackers(args.hash);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.getTorrentWebSeeds',
    'Get web seeds of a torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentWebSeeds(args.hash);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.getTorrentContents',
    'Get files of a torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentContents(args.hash);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.getTorrentPiecesStates',
    'Get piece states of a torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentPiecesStates(args.hash);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.getTorrentPiecesHashes',
    'Get piece hashes of a torrent.',
    hashInputSchema,
    async (args) => {
      return qbittorrent.getTorrentPiecesHashes(args.hash);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.stopTorrents',
    'Stop one or more torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.stopTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.startTorrents',
    'Start one or more torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.startTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.deleteTorrents',
    'Delete one or more torrents.',
    deleteTorrentsInputSchema,
    async (args) => {
      return qbittorrent.deleteTorrents(args.hashes, args.deleteFiles);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.recheckTorrents',
    'Force recheck one or more torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.recheckTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.reannounceTorrents',
    'Reannounce one or more torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.reannounceTorrents(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.editTrackers',
    'Edit a tracker URL on a torrent.',
    editTrackersInputSchema,
    async (args) => {
      return qbittorrent.editTrackers(args.hash, args.origUrl, args.newUrl);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.removeTrackers',
    'Remove trackers from a torrent.',
    removeTrackersInputSchema,
    async (args) => {
      return qbittorrent.removeTrackers(args.hash, args.urls);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.addNewTorrent',
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
    'qbittorrent.addNewMagnet',
    'Add new torrent(s) by magnet URL(s).',
    addNewMagnetInputSchema,
    async (args) => {
      return qbittorrent.addNewMagnet(args.urls, args.options);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.addTrackersToTorrent',
    'Add trackers to a torrent.',
    addTrackersToTorrentInputSchema,
    async (args) => {
      return qbittorrent.addTrackersToTorrent(args.hash, args.urls);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.increaseTorrentPriority',
    'Increase queue priority for torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.increaseTorrentPriority(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.decreaseTorrentPriority',
    'Decrease queue priority for torrents.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.decreaseTorrentPriority(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.maximalTorrentPriority',
    'Move torrents to maximal queue priority.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.maximalTorrentPriority(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.minimalTorrentPriority',
    'Move torrents to minimal queue priority.',
    hashesInputSchema,
    async (args) => {
      return qbittorrent.minimalTorrentPriority(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.setFilePriority',
    'Set file priority inside a torrent.',
    setFilePriorityInputSchema,
    async (args) => {
      return qbittorrent.setFilePriority(args.hash, args.fileIds, args.priority);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.getTorrentDownloadLimit',
    'Get per-torrent download speed limit.',
    torrentLimitInputSchema,
    async (args) => {
      return qbittorrent.getTorrentDownloadLimit(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.setTorrentDownloadLimit',
    'Set per-torrent download speed limit.',
    setTorrentLimitInputSchema,
    async (args) => {
      return qbittorrent.setTorrentDownloadLimit(args.hashes, args.limitBytesPerSecond);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.getTorrentUploadLimit',
    'Get per-torrent upload speed limit.',
    torrentLimitInputSchema,
    async (args) => {
      return qbittorrent.getTorrentUploadLimit(args.hashes);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.setTorrentUploadLimit',
    'Set per-torrent upload speed limit.',
    setTorrentLimitInputSchema,
    async (args) => {
      return qbittorrent.setTorrentUploadLimit(args.hashes, args.limitBytesPerSecond);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.setTorrentLocation',
    'Set save location for torrents.',
    setTorrentLocationInputSchema,
    async (args) => {
      return qbittorrent.setTorrentLocation(args.hashes, args.location);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.setTorrentName',
    'Rename a torrent.',
    setTorrentNameInputSchema,
    async (args) => {
      return qbittorrent.setTorrentName(args.hash, args.name);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.setTorrentCategory',
    'Set category for torrents.',
    setTorrentCategoryInputSchema,
    async (args) => {
      return qbittorrent.setTorrentCategory(args.hashes, args.category);
    }
  );

  registerNoArgsTool(server, 'qbittorrent.getAllCategories', 'Get all categories.', async () => {
    return qbittorrent.getAllCategories();
  });

  registerToolWithArgs(
    server,
    'qbittorrent.addNewCategory',
    'Create a new category.',
    addNewCategoryInputSchema,
    async (args) => {
      return qbittorrent.addNewCategory(args.category, args.savePath);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.editCategory',
    'Edit category save path.',
    editCategoryInputSchema,
    async (args) => {
      return qbittorrent.editCategory(args.category, args.savePath);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.removeCategories',
    'Remove one or more categories.',
    removeCategoriesInputSchema,
    async (args) => {
      return qbittorrent.removeCategories(args.categories);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.addTorrentTags',
    'Add tags to torrents.',
    addTorrentTagsInputSchema,
    async (args) => {
      return qbittorrent.addTorrentTags(args.hashes, args.tags);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.removeTorrentTags',
    'Remove tags from torrents.',
    removeTorrentTagsInputSchema,
    async (args) => {
      return qbittorrent.removeTorrentTags(args.hashes, args.tags);
    }
  );

  registerNoArgsTool(server, 'qbittorrent.getAllTags', 'Get all tags.', async () => {
    return qbittorrent.getAllTags();
  });

  registerToolWithArgs(
    server,
    'qbittorrent.createTags',
    'Create one or more tags.',
    tagsInputSchema,
    async (args) => {
      return qbittorrent.createTags(args.tags);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.deleteTags',
    'Delete one or more tags.',
    tagsInputSchema,
    async (args) => {
      return qbittorrent.deleteTags(args.tags);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.renameFile',
    'Rename a file in a torrent.',
    renamePathInputSchema,
    async (args) => {
      return qbittorrent.renameFile(args.hash, args.oldPath, args.newPath);
    }
  );

  registerToolWithArgs(
    server,
    'qbittorrent.renameFolder',
    'Rename a folder in a torrent.',
    renamePathInputSchema,
    async (args) => {
      return qbittorrent.renameFolder(args.hash, args.oldPath, args.newPath);
    }
  );
}
