import { breadc } from 'breadc';

import { version, description } from '../package.json';

const cli = breadc('nqbtc', { version, description });

cli
  .command('mcp', 'Start mcp server')
  .option('--base-url <string>', 'qBittorrent WebUI API base URL')
  .option('--username <string>', 'qBittorrent WebUI API auth username')
  .option('--password <string>', 'qBittorrent WebUI API auth password')
  .action(async () => {});

await cli.run(process.argv.slice(2)).catch((err) => console.error(err));
