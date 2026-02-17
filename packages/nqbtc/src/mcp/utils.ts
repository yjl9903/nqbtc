import type { LogEntry, QBittorrentLogPersister } from 'nqbt';

export const JSON_MIME_TYPE = 'application/json';

export function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function formatResultText(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'string') {
    return value;
  }

  return safeJsonStringify(value);
}

export function toJsonResource(uri: string, data: unknown) {
  return {
    contents: [
      {
        uri,
        mimeType: JSON_MIME_TYPE,
        text: safeJsonStringify(data)
      }
    ]
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export interface McpErrorPayload extends Record<string, unknown> {
  error: string;
  logs: LogEntry[];
  logsError?: string;
}

export async function buildMcpErrorPayload(
  logger: QBittorrentLogPersister,
  start: Date,
  error: unknown
): Promise<McpErrorPayload> {
  const payload: McpErrorPayload = {
    error: getErrorMessage(error),
    logs: []
  };

  try {
    const logs = await logger.getMainLogs();
    const latestLogs = logs.filter((log) => log.timestamp * 1000 >= start.getTime() - 30 * 1000);
    payload.logs = latestLogs.length > 0 ? latestLogs.slice(-10) : logs.slice(-10);
  } catch (logsError) {
    payload.logsError = getErrorMessage(logsError);
  }

  return payload;
}

export type McpExecutionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: McpErrorPayload;
    };

export async function runWithMcpErrorPayload<T>(
  logger: QBittorrentLogPersister,
  handler: () => Promise<T>
): Promise<McpExecutionResult<T>> {
  const start = new Date();
  try {
    const data = await handler();
    return {
      ok: true,
      data
    };
  } catch (error) {
    return {
      ok: false,
      error: await buildMcpErrorPayload(logger, start, error)
    };
  }
}
