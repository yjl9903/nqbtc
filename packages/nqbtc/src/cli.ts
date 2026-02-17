import { breadc } from 'breadc';

import { QBittorrent } from 'nqbt';

import { version, description } from '../package.json';

import { startQbittorrentMcpServer } from './mcp/index.js';

const cli = breadc('nqbtc', { version, description });

cli
  .command('mcp', 'Start mcp server')
  .option('--base-url <string>', 'qBittorrent WebUI API base URL')
  .option('--username <string>', 'qBittorrent WebUI API auth username')
  .option('--password <string>', 'qBittorrent WebUI API auth password')
  .action(async (options) => {
    const qbittorrent = new QBittorrent({
      baseURL: options.baseUrl,
      username: options.username,
      password: options.password
    });

    return await startQbittorrentMcpServer(qbittorrent, {});
  });

await cli.run(process.argv.slice(2)).catch((err) => console.error(err));
