import { z } from 'zod';

export const stringOrStringArraySchema = z.union([z.string(), z.array(z.string())]);

export const hashesOrAllSchema = z.union([z.literal('all'), z.string(), z.array(z.string())]);

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

const getTorrentListOptionsSchema = z.object({
  hashes: stringOrStringArraySchema.optional(),
  filter: torrentFilterSchema.optional(),
  sort: z.string().optional(),
  tag: z.string().optional(),
  category: z.string().optional(),
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().nonnegative().optional(),
  reverse: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  includeTrackers: z.boolean().optional()
});

const addNewTorrentOptionsSchema = z.object({
  filename: z.string().optional(),
  savepath: z.string().optional(),
  category: z.string().optional(),
  tags: stringOrStringArraySchema.optional(),
  skip_checking: z.boolean().optional(),
  paused: z.boolean().optional(),
  stopped: z.boolean().optional(),
  contentLayout: z.enum(['Original', 'Subfolder', 'NoSubfolder']).optional(),
  rename: z.string().optional(),
  upLimit: z.number().int().optional(),
  dlLimit: z.number().int().optional(),
  ratioLimit: z.number().optional(),
  seedingTimeLimit: z.number().int().optional(),
  useAutoTMM: z.boolean().optional(),
  sequentialDownload: z.boolean().optional(),
  firstLastPiecePrio: z.boolean().optional()
});

const addNewMagnetOptionsSchema = z.object({
  savepath: z.string().optional(),
  cookie: z.string().optional(),
  category: z.string().optional(),
  tags: stringOrStringArraySchema.optional(),
  skip_checking: z.boolean().optional(),
  paused: z.boolean().optional(),
  stopped: z.boolean().optional(),
  root_folder: z.boolean().optional(),
  rename: z.string().optional(),
  upLimit: z.number().int().optional(),
  dlLimit: z.number().int().optional(),
  useAutoTMM: z.boolean().optional(),
  sequentialDownload: z.boolean().optional(),
  firstLastPiecePrio: z.boolean().optional()
});

export const setApplicationPreferencesInputSchema = z.object({
  preferences: z.record(z.string(), z.unknown())
});

export const getTorrentPeersDataInputSchema = z.object({
  hash: z.string(),
  rid: z.number().int().nonnegative().optional()
});

export const getTorrentListInputSchema = getTorrentListOptionsSchema.optional().default({});

export const hashInputSchema = z.object({
  hash: z.string()
});

export const hashesInputSchema = z.object({
  hashes: hashesOrAllSchema
});

export const deleteTorrentsInputSchema = z.object({
  hashes: hashesOrAllSchema,
  deleteFiles: z.boolean().optional()
});

export const editTrackersInputSchema = z.object({
  hash: z.string(),
  origUrl: z.string(),
  newUrl: z.string()
});

export const removeTrackersInputSchema = z.object({
  hash: z.string(),
  urls: stringOrStringArraySchema
});

export const addNewTorrentInputSchema = z.object({
  torrent: z.union([z.string().min(1), z.array(z.number().int().min(0).max(255)).min(1)]),
  options: addNewTorrentOptionsSchema.optional()
});

export const addNewMagnetInputSchema = z.object({
  urls: stringOrStringArraySchema,
  options: addNewMagnetOptionsSchema.optional()
});

export const addTrackersToTorrentInputSchema = z.object({
  hash: z.string(),
  urls: stringOrStringArraySchema
});

export const setFilePriorityInputSchema = z.object({
  hash: z.string(),
  fileIds: stringOrStringArraySchema,
  priority: z.number().int()
});

export const torrentLimitInputSchema = z.object({
  hashes: stringOrStringArraySchema
});

export const setTorrentLimitInputSchema = z.object({
  hashes: stringOrStringArraySchema,
  limitBytesPerSecond: z.number().int().nonnegative()
});

export const setTorrentLocationInputSchema = z.object({
  hashes: hashesOrAllSchema,
  location: z.string()
});

export const setTorrentNameInputSchema = z.object({
  hash: z.string(),
  name: z.string()
});

export const setTorrentCategoryInputSchema = z.object({
  hashes: hashesOrAllSchema,
  category: z.string().optional()
});

const categoryWithSavePathInputSchema = z.object({
  category: z.string(),
  savePath: z.string().optional()
});

export const addNewCategoryInputSchema = categoryWithSavePathInputSchema;
export const editCategoryInputSchema = categoryWithSavePathInputSchema;

export const removeCategoriesInputSchema = z.object({
  categories: stringOrStringArraySchema
});

export const addTorrentTagsInputSchema = z.object({
  hashes: hashesOrAllSchema,
  tags: stringOrStringArraySchema
});

export const removeTorrentTagsInputSchema = z.object({
  hashes: hashesOrAllSchema,
  tags: stringOrStringArraySchema.optional()
});

export const tagsInputSchema = z.object({
  tags: stringOrStringArraySchema
});

export const renamePathInputSchema = z.object({
  hash: z.string(),
  oldPath: z.string(),
  newPath: z.string()
});
