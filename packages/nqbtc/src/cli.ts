import { breadc } from 'breadc';
import { config } from 'dotenv';

import { QBittorrent } from 'nqbt';

import { version, description } from '../package.json';

import { startQbittorrentMcpServer } from './mcp/index.js';

const cli = breadc('nqbtc', { version, description })
  .option('--base-url <string>', 'qBittorrent WebUI API base URL')
  .option('--username <string>', 'qBittorrent WebUI API auth username')
  .option('--password <string>', 'qBittorrent WebUI API auth password')
  .use(async (context, next) => {
    config({ quiet: true });

    const baseUrl = context.options.get('base-url');
    const username = context.options.get('username');
    const password = context.options.get('password');

    const qbittorrent = new QBittorrent({
      baseURL: baseUrl?.value() || process.env.QBITTORRENT_WEBUI_BASE_URL,
      username: username?.value() || process.env.QBITTORRENT_WEBUI_USERNAME,
      password: password?.value() || process.env.QBITTORRENT_WEBUI_PASSWORD
    });

    try {
      return await next({ data: { qbittorrent } });
    } finally {
    }
  });

cli
  .command('launch', 'Launch qBittorrent application')
  .option('--verbose', 'Enable verbose log')
  .action(async (options, context) => {
    const { launchQBittorrent } = await import('@nqbt/node');

    const result = await launchQBittorrent();

    if (options.verbose) {
      console.log(result);
    }
  });

cli.command('shutdown', 'Shutdown qBittorrent application').action(async (_options, context) => {
  const { qbittorrent } = context.data;

  return await qbittorrent.shutdownApplication();
});

cli.command('mcp', 'Start mcp server').action(async (_options, context) => {
  const { qbittorrent } = context.data;

  return await startQbittorrentMcpServer(qbittorrent, {});
});

cli.command('info', 'Get qBittorent version info').action(async (_options, context) => {
  // TODO: extend version command

  const { qbittorrent } = context.data;

  const appVersion = await qbittorrent.getApplicationVersion();
  const apiVersion = await qbittorrent.getApiVersion();
  const buildInfo = await qbittorrent.getBuildInfo();

  console.log(`Application version  ${appVersion}`);
  console.log(`API version          v${apiVersion}`);
  console.log(`Build info           ${JSON.stringify(buildInfo)}`);
});

await cli.run(process.argv.slice(2)).catch((err) => console.error(err));
