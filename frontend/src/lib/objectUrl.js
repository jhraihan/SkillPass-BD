import { useEffect, useMemo } from 'react';

const pendingRevokes = new Map();
const REVOKE_DELAY_MS = 1000;

export function useObjectUrl(blob) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);

  useEffect(() => {
    if (!url) return undefined;
    clearTimeout(pendingRevokes.get(url));
    pendingRevokes.delete(url);
    return () => {
      pendingRevokes.set(
        url,
        setTimeout(() => {
          pendingRevokes.delete(url);
          URL.revokeObjectURL(url);
        }, REVOKE_DELAY_MS),
      );
    };
  }, [url]);

  return url;
}
