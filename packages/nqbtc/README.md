# nqbtc

[![version](https://img.shields.io/npm/v/nqbtc?label=nqbtc)](https://www.npmjs.com/package/nqbtc)
[![MCP Badge](https://lobehub.com/badge/mcp/yjl9903-nqbtc?style=plastic)](https://lobehub.com/mcp/yjl9903-nqbtc)
[![CI](https://github.com/yjl9903/nqbt/actions/workflows/ci.yml/badge.svg)](https://github.com/yjl9903/nqbt/actions/workflows/ci.yml)

Run qBittorrent MCP server.

## Requirements

- Node.js 24 or newer
- qBittorrent and make sure WebUI enabled
- Any MCP client

## Getting started

**Standard config** works in most of the tools (replace the `--base-url=...` with your real qBittorrent WebUI url).

```json
{
  "mcpServers": {
    "nqbtc": {
      "command": "npx",
      "args": [
        "nqbtc",
        "mcp",
        "--base-url=http://localhost:9091/api/v2"
      ]
    }
  }
}
```

You can also config username and password of WebUI with `--username=xxx` and `--password=yyy` options. Add these options your MCP command args.

```bash
npx nqbtc mcp --base-url=http://localhost:9091/api/v2 --username=xxx --password=yyy
```

## License

MIT License © 2025 [XLor](https://github.com/yjl9903)
