import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { QBittorrentLogPersister, type QBittorrent } from 'nqbt';

import { version } from '../../package.json';

import { registerQbittorrentTools } from './tool.js';
import { registerQbittorrentResources } from './resource.js';

export interface CreateQbittorrentMcpServerOptions {}

export function createQbittorrentMcpServer(
  qbittorrent: QBittorrent,
  _options: CreateQbittorrentMcpServerOptions
): McpServer {
  const server = new McpServer(
    {
      name: 'nqbtc',
      title: 'nqbtc qBittorrent MCP Server',
      version,
      description:
        'qBittorrent is the underlying BitTorrent client that downloads and seeds data. nqbtc MCP server is a control bridge on top of qBittorrent WebUI API: models call snake_case tools (for example get_torrent_list, add_new_torrent) and read qbittorrent://* resources exposed by this server to query or mutate qBittorrent state (torrents, trackers, categories, tags, limits, and preferences).',
      icons: [
        {
          src: 'https://raw.githubusercontent.com/qbittorrent/qBittorrent/refs/heads/master/src/icons/qbittorrent.ico',
          mimeType: 'image/x-icon'
        }
      ],
      websiteUrl: 'https://github.com/yjl9903/nqbtc'
    },
    {
      instructions:
        'Safety policy: default to read-only operations. Do not run destructive or state-changing actions unless the user explicitly asks for that exact action. Treat delete, remove, rename, stop/pause, recheck/reannounce, and preference changes as high-risk; require explicit intent from the current user request. Never use hashes="all" for destructive operations unless the user explicitly includes "all". Prefer targeted hashes and minimal scope. Before mutating state, first read current state and describe planned changes briefly. After mutation, verify by reading back and report the result. If a tool call fails or returns an unexpected error, call get_log first; if the issue may involve peers/connection blocking, also call get_peer_log, then respond with findings. For add_new_torrent, "torrent" must be base64 string or byte array.'
    }
  );

  const logger = new QBittorrentLogPersister(qbittorrent);

  registerQbittorrentTools(server, qbittorrent, logger);
  registerQbittorrentResources(server, qbittorrent, logger);

  return server;
}

export async function startQbittorrentMcpServer(
  qbittorrent: QBittorrent,
  options: CreateQbittorrentMcpServerOptions
): Promise<McpServer> {
  const server = createQbittorrentMcpServer(qbittorrent, options);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  return server;
}
