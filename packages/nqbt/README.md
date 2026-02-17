# nqbt

[![version](https://img.shields.io/npm/v/nqbtc?label=nqbtc)](https://www.npmjs.com/package/nqbtc)
[![CI](https://github.com/yjl9903/nqbt/actions/workflows/ci.yml/badge.svg)](https://github.com/yjl9903/nqbt/actions/workflows/ci.yml)

TypeScript qBittorrent WebUI API binding.

## Installation

```bash
npm i nqbt
```

## Usage

```ts
import { QBittorrent } from 'nqbt';

const client = new QBittorrent({
  baseURL: 'http://localhost:9091/api/v2',
  username: 'admin',
  password: 'adminadmin'
});

await client.login();

const version = await client.getApplicationVersion();
console.log('qBittorrent version:', version);

const torrents = await client.getTorrentList({
  filter: 'downloading',
  sort: 'dlspeed',
  reverse: true,
  limit: 10
});

console.log('downloading torrents:', torrents.length);

if (torrents[0]) {
  // qBittorrent v5 uses stop/start; v4 uses pause/resume.
  // Both method pairs are kept and auto-switch internally.
  await client.stopTorrents(torrents[0].hash);
  await client.startTorrents(torrents[0].hash);

  // Equivalent aliases:
  // await client.pauseTorrents(torrents[0].hash);
  // await client.resumeTorrents(torrents[0].hash);
}

await client.addNewMagnet('magnet:?xt=urn:btih:<YOUR_INFO_HASH>', {
  category: 'demo',
  tags: 'sample',
  paused: true
});

await client.logout();
```

## Reference

Official docs:

- [WebUI API (qBittorrent 5.0)](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0))
- [WebUI API (qBittorrent 4.1)](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-4.1))

Support TypeScript API:

| Category | TypeScript API | WebUI API |
| --- | --- | --- |
| Authentication | `login` | [login](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#login) |
| Authentication | `logout` | [logout](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#logout) |
| Application | `getApplicationVersion` | [get-application-version](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-application-version) |
| Application | `getApiVersion` | [get-api-version](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-api-version) |
| Application | `getBuildInfo` | [get-build-info](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-build-info) |
| Application | `getApplicationPreferences` | [get-application-preferences](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-application-preferences) |
| Application | `setApplicationPreferences` | [set-application-preferences](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-application-preferences) |
| Application | `getDefaultSavePath` | [get-default-save-path](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-default-save-path) |
| Application | `shutdownApplication` | [shutdown-application](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#shutdown-application) |
| Application | `getCookies` | [get-cookies](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-cookies) |
| Application | `setCookies` | [set-cookies](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-cookies) |
| Log | `getLog` | [get-log](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-log) |
| Log | `getPeerLog` | [get-peer-log](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-peer-log) |
| Sync | `getMainData` | [get-main-data](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-main-data) |
| Sync | `getTorrentPeersData` | [get-torrent-peers-data](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-peers-data) |
| Transfer info | `getGlobalTransferInfo` | [get-global-transfer-info](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-global-transfer-info) |
| Transfer info | `getAlternativeSpeedLimitsState` | [get-alternative-speed-limits-state](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-alternative-speed-limits-state) |
| Transfer info | `toggleAlternativeSpeedLimits` | [toggle-alternative-speed-limits](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#toggle-alternative-speed-limits) |
| Transfer info | `getGlobalDownloadLimit` | [get-global-download-limit](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-global-download-limit) |
| Transfer info | `setGlobalDownloadLimit` | [set-global-download-limit](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-global-download-limit) |
| Transfer info | `getGlobalUploadLimit` | [get-global-upload-limit](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-global-upload-limit) |
| Transfer info | `setGlobalUploadLimit` | [set-global-upload-limit](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-global-upload-limit) |
| Transfer info | `banPeers` | [ban-peers](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#ban-peers) |
| Torrent Management | `getTorrentList` | [get-torrent-list](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-list) |
| Torrent Management | `getTorrentGenericProperties` | [get-torrent-generic-properties](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-generic-properties) |
| Torrent Management | `getTorrentTrackers` | [get-torrent-trackers](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-trackers) |
| Torrent Management | `getTorrentWebSeeds` | [get-torrent-web-seeds](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-web-seeds) |
| Torrent Management | `getTorrentContents` | [get-torrent-contents](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-contents) |
| Torrent Management | `getTorrentPiecesStates` | [get-torrent-pieces-states](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-pieces-states) |
| Torrent Management | `getTorrentPiecesHashes` | [get-torrent-pieces-hashes](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-pieces-hashes) |
| Torrent Management | `stopTorrents` / `pauseTorrents` | [stop-torrents](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#stop-torrents) |
| Torrent Management | `startTorrents` / `resumeTorrents` | [resume-torrents](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#resume-torrents) |
| Torrent Management | `deleteTorrents` | [delete-torrents](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#delete-torrents) |
| Torrent Management | `recheckTorrents` | [recheck-torrents](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#recheck-torrents) |
| Torrent Management | `reannounceTorrents` | [reannounce-torrents](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#reannounce-torrents) |
| Torrent Management | `editTrackers` | [edit-trackers](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#edit-trackers) |
| Torrent Management | `removeTrackers` | [remove-trackers](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#remove-trackers) |
| Torrent Management | `addNewTorrent` / `addNewMagnet` | [add-new-torrent](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#add-new-torrent) |
| Torrent Management | `addTrackersToTorrent` | [add-trackers-to-torrent](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#add-trackers-to-torrent) |
| Torrent Management | `addPeers` | [add-peers](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#add-peers) |
| Torrent Management | `increaseTorrentPriority` | [increase-torrent-priority](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#increase-torrent-priority) |
| Torrent Management | `decreaseTorrentPriority` | [decrease-torrent-priority](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#decrease-torrent-priority) |
| Torrent Management | `maximalTorrentPriority` | [maximal-torrent-priority](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#maximal-torrent-priority) |
| Torrent Management | `minimalTorrentPriority` | [minimal-torrent-priority](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#minimal-torrent-priority) |
| Torrent Management | `setFilePriority` | [set-file-priority](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-file-priority) |
| Torrent Management | `setTorrentShareLimits` | [set-torrent-share-limits](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-torrent-share-limits) |
| Torrent Management | `getTorrentDownloadLimit` | [get-torrent-download-limit](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-download-limit) |
| Torrent Management | `setTorrentDownloadLimit` | [set-torrent-download-limit](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-torrent-download-limit) |
| Torrent Management | `getTorrentUploadLimit` | [get-torrent-upload-limit](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-torrent-upload-limit) |
| Torrent Management | `setTorrentUploadLimit` | [set-torrent-upload-limit](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-torrent-upload-limit) |
| Torrent Management | `setTorrentLocation` | [set-torrent-location](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-torrent-location) |
| Torrent Management | `setTorrentName` | [set-torrent-name](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-torrent-name) |
| Torrent Management | `setTorrentCategory` | [set-torrent-category](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-torrent-category) |
| Torrent Management | `setAutomaticTorrentManagement` | [set-automatic-torrent-management](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-automatic-torrent-management) |
| Torrent Management | `toggleSequentialDownload` | [toggle-sequential-download](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#toggle-sequential-download) |
| Torrent Management | `setFirstLastPiecePriority` | [set-firstlast-piece-priority](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-firstlast-piece-priority) |
| Torrent Management | `setForceStart` | [set-force-start](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-force-start) |
| Torrent Management | `setSuperSeeding` | [set-super-seeding](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#set-super-seeding) |
| Torrent Management | `getAllCategories` | [get-all-categories](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-all-categories) |
| Torrent Management | `addNewCategory` | [add-new-category](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#add-new-category) |
| Torrent Management | `editCategory` | [edit-category](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#edit-category) |
| Torrent Management | `removeCategories` | [remove-categories](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#remove-categories) |
| Torrent Management | `addTorrentTags` | [add-torrent-tags](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#add-torrent-tags) |
| Torrent Management | `removeTorrentTags` | [remove-torrent-tags](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#remove-torrent-tags) |
| Torrent Management | `getAllTags` | [get-all-tags](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#get-all-tags) |
| Torrent Management | `createTags` | [create-tags](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#create-tags) |
| Torrent Management | `deleteTags` | [delete-tags](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#delete-tags) |
| Torrent Management | `renameFile` | [rename-file](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#rename-file) |
| Torrent Management | `renameFolder` | [rename-folder](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-5.0)#rename-folder) |

> **Compatibility note**
>
> - `stopTorrents` and `pauseTorrents` are both available; both auto-switch to `/torrents/stop` (v5) or `/torrents/pause` (v4).
> - `startTorrents` and `resumeTorrents` are both available; both auto-switch to `/torrents/start` (v5) or `/torrents/resume` (v4).

## Related

This package is used to power [AnimeSpace](https://github.com/yjl9903/AnimeGarden), offering a comprehensive solution for automatically following bangumis. It can fetch anime resources, download desired video content, and upload them to the local file system or remote WebDAV server. The downloading process is facilitated by this package.

## Credits

- [qBittorrent](https://www.qbittorrent.org/)
- [@ctrl/qbittorrent](https://github.com/scttcper/qbittorrent)

## License

MIT License © 2025 [XLor](https://github.com/yjl9903)
