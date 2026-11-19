import { setTimeout as delay } from 'node:timers/promises';

import { z } from 'zod';
import { breadc, InputError } from 'breadc';

import { QBittorrent } from 'nqbt';

import { version, description } from '../package.json';

const cli = breadc('nqbtc', {
  version,
  description: {
    text: description,
    examples: [
      { command: 'nqbtc info', comment: 'Check the connected qBittorrent version' },
      { command: 'nqbtc mcp --help', comment: 'Show MCP server setup options' }
    ]
  }
})
  .option('--base-url <url>', 'WebUI API URL (env: QBITTORRENT_WEBUI_BASE_URL)')
  .option('--username <name>', 'WebUI username (env: QBITTORRENT_WEBUI_USERNAME)')
  .option('--password <password>', 'WebUI password (env: QBITTORRENT_WEBUI_PASSWORD)')
  .use(async (context, next) => {
    try {
      process.loadEnvFile();
    } catch {
      // The local .env file is optional. CLI flags and the process environment still apply.
    }

    const baseUrl = context.options.get('base-url');
    const username = context.options.get('username');
    const password = context.options.get('password');

    const qbittorrent = new QBittorrent({
      baseURL: baseUrl?.value() || process.env.QBITTORRENT_WEBUI_BASE_URL,
      username: username?.value() || process.env.QBITTORRENT_WEBUI_USERNAME,
      password: password?.value() || process.env.QBITTORRENT_WEBUI_PASSWORD
    });

    return next({ data: { qbittorrent } });
  });

cli
  .command('launch', {
    summary: 'Launch qBittorrent',
    examples: [{ command: 'nqbtc launch --shutdown 5000', comment: 'Restart after five seconds' }]
  })
  .option('--verbose', 'Print the launch result')
  .option('--shutdown [ms]', 'Shut down first, then wait before launching (default: 3000 ms)', {
    cast: z.coerce.number().int().min(0).max(2147483647).default(3000)
  })
  .action(async (options, context) => {
    const { launchQBittorrent } = await import('@nqbt/node');

    if (options.shutdown !== undefined) {
      try {
        const { qbittorrent } = context.data;
        await qbittorrent.getApplicationVersion();
        await qbittorrent.shutdownApplication();
        await delay(options.shutdown);
      } catch {}
    }

    const result = await launchQBittorrent();

    if (options.verbose) {
      console.log(result);
    }
  });

cli
  .command('shutdown', {
    summary: 'Shut down qBittorrent',
    text: 'Send a shutdown request to the application at the configured WebUI URL.'
  })
  .action(async (_options, context) => {
    return context.data.qbittorrent.shutdownApplication();
  });

cli
  .command('mcp', {
    summary: 'Start the qBittorrent MCP server',
    text: 'Run this command from an MCP client that uses stdio. WebUI settings can also be supplied in a local .env file.',
    examples: [{ command: 'nqbtc mcp --base-url=http://localhost:9091/api/v2' }]
  })
  .action(async (_options, context) => {
    const { startQbittorrentMcpServer } = await import('./mcp/index.js');
    return startQbittorrentMcpServer(context.data.qbittorrent, {});
  });

cli
  .command('info', {
    summary: 'Show qBittorrent version and build information',
    text: 'Query the application and WebUI API versions of the connected qBittorrent instance.'
  })
  .action(async (_options, context) => {
    const { qbittorrent } = context.data;
    const appVersion = await qbittorrent.getApplicationVersion();
    const apiVersion = await qbittorrent.getApiVersion();
    const buildInfo = await qbittorrent.getBuildInfo();

    console.log(`Application version  ${appVersion}`);
    console.log(`API version          v${apiVersion}`);
    console.log(`Build info           ${JSON.stringify(buildInfo)}`);
  });

await cli.run(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof InputError ? error.message : error);
  process.exitCode = 1;
});
