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
