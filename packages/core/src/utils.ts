/**
 * Normalizes hashes
 * @returns hashes as string seperated by `|`
 */
export function normalizeHashes(hashes: string | string[]): string {
  if (Array.isArray(hashes)) {
    return hashes.join('|');
  }

  return hashes;
}

export function objToUrlSearchParams(obj: Record<string, string | boolean>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    params.append(key, value.toString());
  }
  return params;
}

export function isGreater(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true }) === 1;
}

export function joinURL(...parts: Array<string | undefined>): string {
  const normalized = parts.filter((part): part is string => Boolean(part && part.length));
  if (normalized.length === 0) {
    return '';
  }

  const first = normalized[0] ?? '';
  const rest = normalized.slice(1);
  let url = first.replace(/\/+$/, '');
  for (const part of rest) {
    const cleanPart = part.replace(/^\/+|\/+$/g, '');
    if (cleanPart.length > 0) {
      url += `/${cleanPart}`;
    }
  }

  return url;
}
