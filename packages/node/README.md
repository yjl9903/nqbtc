# @nqbt/node

[![version](https://img.shields.io/npm/v/@nqbt/node?label=@nqbt/node)](https://www.npmjs.com/package/@nqbt/node)
[![CI](https://github.com/yjl9903/nqbt/actions/workflows/ci.yml/badge.svg)](https://github.com/yjl9903/nqbt/actions/workflows/ci.yml)

Node-focused helpers for `nqbt`.

## Installation

```bash
npm install @nqbt/node
```

## Launch qBittorrent

Use `launchQBittorrent` to directly open qBittorrent application.

```ts
import { launchQBittorrent } from '@nqbt/node';

const result = await launchQBittorrent();

console.log(result.command, result.pid);
```

### API

```ts
interface LaunchQBittorrentOptions {
  executablePath?: string;
  args?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

interface LaunchQBittorrentResult {
  platform: NodeJS.Platform;
  command: string;
  args: string[];
  pid?: number;
  attempts: string[];
}
```

### Platform behavior

- `macOS`: uses `open -a qBittorrent` by default.
- `Windows`: tries `qbittorrent.exe`, then `qbittorrent`, then default install paths under `Program Files`.
- `Linux`: tries `qbittorrent`.

To bypass auto detection, pass `executablePath` manually.

```ts
await launchQBittorrent({
  executablePath: '/Applications/qBittorrent.app/Contents/MacOS/qBittorrent',
  args: ['--profile=/tmp/qb']
});
```

## License

MIT License © 2025 [XLor](https://github.com/yjl9903)
