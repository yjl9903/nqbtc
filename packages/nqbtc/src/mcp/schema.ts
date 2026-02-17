import { z } from 'zod';

export const stringOrStringArraySchema = z
  .union([z.string(), z.array(z.string())])
  .describe(
    'Single string or string array. Arrays are accepted for convenience and converted by the server to the endpoint-specific separator.'
  );

export const hashesOrAllSchema = z
  .union([z.literal('all'), z.string(), z.array(z.string())])
  .describe(
    'Torrent target selector: "all", one hash, or multiple hashes. Multiple hashes are joined by "|" when sent to qBittorrent.'
  );

const torrentFilterSchema = z.enum([
  'all',
  'downloading',
  'seeding',
  'completed',
  'paused',
  'stopped',
  'active',
  'inactive',
  'resumed',
  'running',
  'stalled',
  'stalled_uploading',
  'stalled_downloading',
  'checking',
  'moving',
  'errored'
]);

const getTorrentListOptionsSchema = z
  .object({
    hashes: stringOrStringArraySchema
      .optional()
      .describe('Filter by torrent hash(es). Uses "|" as separator when array is provided.'),
    filter: torrentFilterSchema.optional().describe('Torrent state filter.'),
    sort: z.string().optional().describe('Sort field name (for example dlspeed, added_on, name).'),
    tag: z.string().optional().describe('Filter by exact tag name.'),
    category: z
      .string()
      .optional()
      .describe('Filter by category name. Use empty string to match torrents without category.'),
    offset: z.number().int().nonnegative().optional().describe('Pagination offset (0-based).'),
    limit: z.number().int().nonnegative().optional().describe('Pagination size limit.'),
    reverse: z.boolean().optional().describe('Reverse sorting order when true.'),
    isPrivate: z
      .boolean()
      .optional()
      .describe('Filter private/public torrents. Maps to WebUI query parameter "private".'),
    includeTrackers: z
      .boolean()
      .optional()
      .describe('Include trackers in torrent list items (supported by newer WebUI versions).')
  })
  .describe('Options for listing torrents from /torrents/info.');

const addNewTorrentOptionsSchema = z
  .object({
    filename: z
      .string()
      .optional()
      .describe('Optional file name hint. Not sent to qBittorrent API directly.'),
    savepath: z.string().optional().describe('Download path.'),
    category: z
      .string()
      .optional()
      .describe(
        'Category name. Prefer existing category; if unknown, add call may still succeed but category assignment may fail. Use add_new_category first when needed.'
      ),
    tags: stringOrStringArraySchema
      .optional()
      .describe(
        'Tag or tags. Arrays are joined with comma. Prefer existing tags for deterministic behavior; use create_tags first when needed.'
      ),
    skip_checking: z
      .boolean()
      .optional()
      .describe('Skip hash check on add (faster but less safe).'),
    paused: z
      .boolean()
      .optional()
      .describe('Legacy flag for paused add (mapped to stopped on qBittorrent v5).'),
    stopped: z.boolean().optional().describe('Add in stopped state (qBittorrent v5).'),
    contentLayout: z
      .enum(['Original', 'Subfolder', 'NoSubfolder'])
      .optional()
      .describe('Content layout mode.'),
    rename: z.string().optional().describe('Rename torrent display name on add.'),
    upLimit: z.number().int().optional().describe('Per-torrent upload limit in bytes/second.'),
    dlLimit: z.number().int().optional().describe('Per-torrent download limit in bytes/second.'),
    ratioLimit: z
      .number()
      .optional()
      .describe('Share ratio limit (-2 global, -1 unlimited, >=0 explicit).'),
    seedingTimeLimit: z
      .number()
      .int()
      .optional()
      .describe('Seeding time limit in minutes (-2 global, -1 unlimited).'),
    useAutoTMM: z.boolean().optional().describe('Enable automatic torrent management.'),
    sequentialDownload: z.boolean().optional().describe('Enable sequential download.'),
    firstLastPiecePrio: z.boolean().optional().describe('Prioritize first and last pieces.')
  })
  .describe('Additional options for adding a .torrent file.');

const addNewMagnetOptionsSchema = z
  .object({
    savepath: z.string().optional().describe('Download path.'),
    cookie: z.string().optional().describe('HTTP cookie string for tracker/webseed requests.'),
    category: z
      .string()
      .optional()
      .describe(
        'Category name. Prefer existing category; if unknown, add call may still succeed but category assignment may fail. Use add_new_category first when needed.'
      ),
    tags: stringOrStringArraySchema
      .optional()
      .describe(
        'Tag or tags. Arrays are joined with comma. Prefer existing tags for deterministic behavior; use create_tags first when needed.'
      ),
    skip_checking: z.boolean().optional().describe('Skip hash check.'),
    paused: z
      .boolean()
      .optional()
      .describe('Legacy flag for paused add (mapped to stopped on qBittorrent v5).'),
    stopped: z.boolean().optional().describe('Add in stopped state (qBittorrent v5).'),
    root_folder: z
      .boolean()
      .optional()
      .describe('Create root folder for magnet content if supported by WebUI version.'),
    rename: z.string().optional().describe('Rename torrent display name on add.'),
    upLimit: z.number().int().optional().describe('Per-torrent upload limit in bytes/second.'),
    dlLimit: z.number().int().optional().describe('Per-torrent download limit in bytes/second.'),
    useAutoTMM: z.boolean().optional().describe('Enable automatic torrent management.'),
    sequentialDownload: z.boolean().optional().describe('Enable sequential download.'),
    firstLastPiecePrio: z.boolean().optional().describe('Prioritize first and last pieces.')
  })
  .describe('Additional options for adding magnet URL(s).');

export const setApplicationPreferencesInputSchema = z
  .object({
    preferences: z
      .record(z.string(), z.unknown())
      .describe('Partial preferences object. Only provided keys are updated.')
  })
  .describe('Set qBittorrent application preferences.');

const cookieInputSchema = z
  .object({
    name: z.string().optional().describe('Cookie name.'),
    domain: z.string().optional().describe('Cookie domain.'),
    path: z.string().optional().describe('Cookie path.'),
    value: z.string().optional().describe('Cookie value.'),
    expirationDate: z.number().optional().describe('Expiration timestamp (seconds since epoch).')
  })
  .describe('Single cookie object used by /app/setCookies.');

export const setCookiesInputSchema = z
  .object({
    cookies: z.array(cookieInputSchema).describe('Cookie objects to upsert.')
  })
  .describe('Set cookies used by qBittorrent for HTTP-related requests.');

export const getLogInputSchema = z
  .object({
    normal: z.boolean().optional().describe('Include normal log messages.'),
    info: z.boolean().optional().describe('Include info log messages.'),
    warning: z.boolean().optional().describe('Include warning log messages.'),
    critical: z.boolean().optional().describe('Include critical log messages.'),
    lastKnownId: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Incremental cursor. Return entries with id greater than this value.')
  })
  .optional()
  .default({})
  .describe('Get main log entries from /log/main.');

export const getPeerLogInputSchema = z
  .object({
    lastKnownId: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Incremental cursor. Return entries with id greater than this value.')
  })
  .optional()
  .default({})
  .describe('Get peer log entries from /log/peers.');

export const getMainDataInputSchema = z
  .object({
    rid: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Incremental sync cursor. Omit or 0 for full snapshot.')
  })
  .optional()
  .default({})
  .describe('Get global incremental state from /sync/maindata.');

export const globalLimitInputSchema = z
  .object({
    limitBytesPerSecond: z
      .number()
      .int()
      .nonnegative()
      .describe('Limit in bytes/second. Use 0 for unlimited.')
  })
  .describe('Set global transfer speed limit.');

export const banPeersInputSchema = z
  .object({
    peers: stringOrStringArraySchema.describe(
      'Peer IPs to ban. Arrays are joined with "|" for WebUI API.'
    )
  })
  .describe('Ban peers globally by IP.');

export const getTorrentPeersDataInputSchema = z
  .object({
    hash: z.string().describe('Torrent hash.'),
    rid: z.number().int().nonnegative().optional().describe('Incremental cursor for peers data.')
  })
  .describe('Get peers and incremental peer changes for a torrent.');

export const getTorrentListInputSchema = getTorrentListOptionsSchema
  .optional()
  .default({})
  .describe('Optional filters for torrent list query.');

export const hashInputSchema = z
  .object({
    hash: z.string().describe('Torrent hash.')
  })
  .describe('Single torrent hash input.');

export const hashesInputSchema = z
  .object({
    hashes: hashesOrAllSchema
  })
  .describe('Target torrents by hash(es) or "all".');

export const deleteTorrentsInputSchema = z
  .object({
    hashes: hashesOrAllSchema,
    deleteFiles: z
      .boolean()
      .optional()
      .describe('Also delete downloaded files from disk when true.')
  })
  .describe('Delete torrents and optionally their data files.');

export const editTrackersInputSchema = z
  .object({
    hash: z.string().describe('Torrent hash.'),
    origUrl: z.string().describe('Existing tracker URL to replace.'),
    newUrl: z.string().describe('New tracker URL.')
  })
  .describe('Replace a tracker URL on a torrent.');

export const removeTrackersInputSchema = z
  .object({
    hash: z.string().describe('Torrent hash.'),
    urls: stringOrStringArraySchema.describe('Tracker URL(s) to remove.')
  })
  .describe('Remove tracker URL(s) from a torrent.');

export const addNewTorrentInputSchema = z
  .object({
    torrent: z
      .union([z.string().min(1), z.array(z.number().int().min(0).max(255)).min(1)])
      .describe('Torrent bytes as base64 string or byte array (0-255).'),
    options: addNewTorrentOptionsSchema.optional()
  })
  .describe('Add torrent from raw .torrent bytes.');

export const addNewMagnetInputSchema = z
  .object({
    urls: stringOrStringArraySchema.describe(
      'Magnet URL string or array. Arrays are joined with newline characters.'
    ),
    options: addNewMagnetOptionsSchema.optional()
  })
  .describe('Add one or more magnet URLs.');

export const addTrackersToTorrentInputSchema = z
  .object({
    hash: z.string().describe('Torrent hash.'),
    urls: stringOrStringArraySchema.describe(
      'Tracker URL(s) to add. Arrays are joined with newline characters.'
    )
  })
  .describe('Add trackers to a torrent.');

export const addPeersInputSchema = z
  .object({
    hash: z.string().describe('Torrent hash.'),
    peers: stringOrStringArraySchema.describe(
      'Peer endpoint(s), usually "ip:port". Arrays are joined with "|".'
    )
  })
  .describe('Add peers to a torrent.');

export const setTorrentShareLimitsInputSchema = z
  .object({
    hashes: hashesOrAllSchema,
    ratioLimit: z.number().describe('Share ratio limit (-2 global, -1 unlimited, >=0 explicit).'),
    seedingTimeLimit: z
      .number()
      .int()
      .describe('Seeding time limit in minutes (-2 global, -1 unlimited).'),
    inactiveSeedingTimeLimit: z
      .number()
      .int()
      .optional()
      .describe('Inactive seeding time limit in minutes (-2 global, -1 unlimited).')
  })
  .describe('Set share limits for one or more torrents.');

export const setFilePriorityInputSchema = z
  .object({
    hash: z.string().describe('Torrent hash.'),
    fileIds: stringOrStringArraySchema.describe(
      'File index(es) within the torrent. Arrays are joined with "|".'
    ),
    priority: z
      .number()
      .int()
      .describe(
        'File priority. Common values: 0 (Do not download), 1 (Normal), 6 (High), 7 (Maximal).'
      )
  })
  .describe('Set priority for one or more files in a torrent.');

export const torrentLimitInputSchema = z
  .object({
    hashes: stringOrStringArraySchema.describe('Torrent hash(es). Arrays are joined with "|".')
  })
  .describe('Query per-torrent speed limits.');

export const setTorrentLimitInputSchema = z
  .object({
    hashes: stringOrStringArraySchema.describe('Torrent hash(es). Arrays are joined with "|".'),
    limitBytesPerSecond: z
      .number()
      .int()
      .nonnegative()
      .describe('Speed limit in bytes/second. Use 0 for unlimited.')
  })
  .describe('Set per-torrent speed limits.');

export const setTorrentLocationInputSchema = z
  .object({
    hashes: hashesOrAllSchema,
    location: z.string().describe('Absolute target save path.')
  })
  .describe('Move torrent data to a different save location.');

export const setTorrentNameInputSchema = z
  .object({
    hash: z.string().describe('Torrent hash.'),
    name: z.string().describe('New torrent name.')
  })
  .describe('Rename a torrent.');

export const setTorrentCategoryInputSchema = z
  .object({
    hashes: hashesOrAllSchema,
    category: z
      .string()
      .optional()
      .describe('Category name. Use empty string to clear category assignment.')
  })
  .describe('Assign or clear category on torrents.');

export const setAutomaticTorrentManagementInputSchema = z
  .object({
    hashes: hashesOrAllSchema,
    enable: z.boolean().describe('Whether automatic torrent management should be enabled.')
  })
  .describe('Enable or disable automatic torrent management.');

export const setTorrentBooleanStateInputSchema = z
  .object({
    hashes: hashesOrAllSchema,
    value: z.boolean().describe('Target boolean state.')
  })
  .describe('Shared boolean-state payload used by force-start and super-seeding tools.');

const categoryWithSavePathInputSchema = z
  .object({
    category: z.string().describe('Category name.'),
    savePath: z.string().optional().describe('Default save path for the category.')
  })
  .describe('Category payload with optional save path.');

export const addNewCategoryInputSchema = categoryWithSavePathInputSchema;
export const editCategoryInputSchema = categoryWithSavePathInputSchema;

export const removeCategoriesInputSchema = z
  .object({
    categories: stringOrStringArraySchema.describe(
      'Category name(s). Arrays are joined with newline characters.'
    )
  })
  .describe('Remove one or more categories.');

export const addTorrentTagsInputSchema = z
  .object({
    hashes: hashesOrAllSchema,
    tags: stringOrStringArraySchema.describe('Tag name(s). Arrays are joined with comma.')
  })
  .describe('Add tags to torrents.');

export const removeTorrentTagsInputSchema = z
  .object({
    hashes: hashesOrAllSchema,
    tags: stringOrStringArraySchema
      .optional()
      .describe('Tag name(s) to remove. Omit to remove all tags from selected torrents.')
  })
  .describe('Remove tags from torrents.');

export const tagsInputSchema = z
  .object({
    tags: stringOrStringArraySchema.describe('Tag name(s). Arrays are joined with comma.')
  })
  .describe('Create/delete tag names.');

export const renamePathInputSchema = z
  .object({
    hash: z.string().describe('Torrent hash.'),
    oldPath: z.string().describe('Old file/folder path inside torrent.'),
    newPath: z.string().describe('New file/folder path inside torrent.')
  })
  .describe('Rename a file or folder path inside torrent content.');
