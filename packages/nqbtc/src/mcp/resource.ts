import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { QBittorrent } from '@nqbt/core';

import { JSON_MIME_TYPE, toJsonResource } from './utils.js';

function normalizeVariable(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function decodeTemplateVariable(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function registerQbittorrentResources(server: McpServer, qbittorrent: QBittorrent): void {
  server.registerResource(
    'qbittorrent.torrents',
    'qbittorrent://torrents',
    {
      title: 'qBittorrent Torrents',
      description: 'All torrents from qBittorrent.',
      mimeType: JSON_MIME_TYPE
    },
    async (uri) => {
      const torrents = await qbittorrent.getTorrentList();
      return toJsonResource(uri.toString(), torrents);
    }
  );

  const torrentTemplate = new ResourceTemplate('qbittorrent://torrents/{hash}', {
    list: async () => {
      const torrents = await qbittorrent.getTorrentList();
      return {
        resources: torrents.map((torrent) => ({
          name: torrent.name,
          uri: `qbittorrent://torrents/${torrent.hash}`,
          mimeType: JSON_MIME_TYPE
        }))
      };
    },
    complete: {
      hash: async (value) => {
        const torrents = await qbittorrent.getTorrentList();
        return torrents
          .map((torrent) => torrent.hash)
          .filter((hash) => hash.toLowerCase().startsWith(value.toLowerCase()));
      }
    }
  });

  server.registerResource(
    'qbittorrent.torrent',
    torrentTemplate,
    {
      title: 'qBittorrent Torrent Details',
      description: 'Detailed view for a single torrent hash.',
      mimeType: JSON_MIME_TYPE
    },
    async (uri, variables) => {
      const hash = normalizeVariable(variables.hash);
      if (!hash) {
        throw new Error('Missing required template variable: hash');
      }

      const [list, properties, trackers, files] = await Promise.all([
        qbittorrent.getTorrentList({ hashes: hash }),
        qbittorrent.getTorrentGenericProperties(hash),
        qbittorrent.getTorrentTrackers(hash),
        qbittorrent.getTorrentContents(hash)
      ]);

      return toJsonResource(uri.toString(), {
        hash,
        torrent: list[0] ?? null,
        properties,
        trackers,
        files
      });
    }
  );

  server.registerResource(
    'qbittorrent.categories',
    'qbittorrent://categories',
    {
      title: 'qBittorrent Categories',
      description: 'All torrent categories.',
      mimeType: JSON_MIME_TYPE
    },
    async (uri) => {
      const categories = await qbittorrent.getAllCategories();
      return toJsonResource(uri.toString(), categories);
    }
  );

  const categoryTemplate = new ResourceTemplate('qbittorrent://categories/{name}', {
    list: async () => {
      const categories = await qbittorrent.getAllCategories();
      return {
        resources: Object.entries(categories).map(([name]) => ({
          name,
          uri: `qbittorrent://categories/${encodeURIComponent(name)}`,
          mimeType: JSON_MIME_TYPE
        }))
      };
    },
    complete: {
      name: async (value) => {
        const categories = await qbittorrent.getAllCategories();
        return Object.keys(categories).filter((name) =>
          name.toLowerCase().startsWith(value.toLowerCase())
        );
      }
    }
  });

  server.registerResource(
    'qbittorrent.category',
    categoryTemplate,
    {
      title: 'qBittorrent Category Details',
      description: 'Details and torrents for a single category.',
      mimeType: JSON_MIME_TYPE
    },
    async (uri, variables) => {
      const rawName = normalizeVariable(variables.name);
      if (!rawName) {
        throw new Error('Missing required template variable: name');
      }

      const name = decodeTemplateVariable(rawName);
      const [categories, torrents] = await Promise.all([
        qbittorrent.getAllCategories(),
        qbittorrent.getTorrentList({ category: name })
      ]);

      return toJsonResource(uri.toString(), {
        name,
        category: categories[name] ?? null,
        torrents
      });
    }
  );

  server.registerResource(
    'qbittorrent.tags',
    'qbittorrent://tags',
    {
      title: 'qBittorrent Tags',
      description: 'All torrent tags.',
      mimeType: JSON_MIME_TYPE
    },
    async (uri) => {
      const tags = await qbittorrent.getAllTags();
      return toJsonResource(uri.toString(), tags);
    }
  );

  const tagTemplate = new ResourceTemplate('qbittorrent://tags/{name}', {
    list: async () => {
      const tags = await qbittorrent.getAllTags();
      return {
        resources: tags.map((name) => ({
          name,
          uri: `qbittorrent://tags/${encodeURIComponent(name)}`,
          mimeType: JSON_MIME_TYPE
        }))
      };
    },
    complete: {
      name: async (value) => {
        const tags = await qbittorrent.getAllTags();
        return tags.filter((name) => name.toLowerCase().startsWith(value.toLowerCase()));
      }
    }
  });

  server.registerResource(
    'qbittorrent.tag',
    tagTemplate,
    {
      title: 'qBittorrent Tag Details',
      description: 'Torrents for a single tag.',
      mimeType: JSON_MIME_TYPE
    },
    async (uri, variables) => {
      const rawName = normalizeVariable(variables.name);
      if (!rawName) {
        throw new Error('Missing required template variable: name');
      }

      const name = decodeTemplateVariable(rawName);
      const [tags, torrents] = await Promise.all([
        qbittorrent.getAllTags(),
        qbittorrent.getTorrentList({ tag: name })
      ]);

      return toJsonResource(uri.toString(), {
        name,
        exists: tags.includes(name),
        torrents
      });
    }
  );
}
