/**
 * imageCache.ts
 *
 * Lightweight image caching and compression layer.
 * Uses wsrv.nl (free, no-key image CDN proxy) to shrink external images
 * before they hit the user's network — 8K UHD → ~80-150KB JPEG.
 * Caches the original→proxy URL mapping in localStorage to avoid
 * recomputing on every render.
 */

const PROXY_CACHE_KEY = "ketika_img_proxy_v1";
const SELFIE_URLS_KEY = "ketika_selfie_urls_v1";

// ─── wsrv.nl URL builder ───────────────────────────────────────────────────

/**
 * Transforms any public image URL into a compressed, CDN-cached version
 * via wsrv.nl. The proxy:
 *   - resizes to maxWidth (default 720px) preserving aspect ratio
 *   - re-encodes as JPEG at `quality` (default 76)
 *   - serves from their global CDN with correct CORS headers
 *
 * Data URLs (already local) are returned unchanged.
 */
export function getCompressedImageUrl(
  url: string,
  maxWidth = 720,
  quality = 76
): string {
  if (!url) return url;
  if (url.startsWith("data:")) return url;
  if (url.includes("wsrv.nl")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${maxWidth}&output=jpg&q=${quality}&fit=inside`;
}

// ─── localStorage proxy-URL cache ─────────────────────────────────────────

function readProxyCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PROXY_CACHE_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function writeProxyCache(cache: Record<string, string>): void {
  try {
    localStorage.setItem(PROXY_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

/**
 * Returns the cached proxy URL for a given original URL, or null if not cached.
 */
export function getCachedProxyUrl(originalUrl: string): string | null {
  try {
    const cache = readProxyCache();
    return cache[originalUrl] ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns a compressed proxy URL — from localStorage cache if available,
 * otherwise generates and caches a new one.
 */
export function getOrCreateProxyUrl(
  url: string,
  maxWidth = 720,
  quality = 76
): string {
  if (!url || url.startsWith("data:")) return url;
  const cached = getCachedProxyUrl(url);
  if (cached) return cached;
  const proxy = getCompressedImageUrl(url, maxWidth, quality);
  try {
    const cache = readProxyCache();
    cache[url] = proxy;
    writeProxyCache(cache);
  } catch {}
  return proxy;
}

// ─── Selfie URL discovery cache ────────────────────────────────────────────

/**
 * Persists a selfie URL discovered in the conversation stream.
 * The backend can pull from this pool on future sendSelfie calls.
 */
export function cacheSelfieUrl(url: string): void {
  try {
    if (!url || url.startsWith("data:")) return;
    const urls = getSelfieUrls();
    if (!urls.includes(url)) {
      urls.push(url);
      localStorage.setItem(SELFIE_URLS_KEY, JSON.stringify(urls.slice(-50)));
    }
  } catch {}
}

/** Returns all locally-cached selfie URLs (max 50 most recent). */
export function getSelfieUrls(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SELFIE_URLS_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

// ─── Cache management ──────────────────────────────────────────────────────

/** Wipes both the proxy-URL mapping and the selfie URL list. */
export function clearImageCache(): void {
  try {
    localStorage.removeItem(PROXY_CACHE_KEY);
    localStorage.removeItem(SELFIE_URLS_KEY);
  } catch {}
}

/** Returns a human-readable summary of current cache stats. */
export function getImageCacheStats(): { proxyEntries: number; selfieUrls: number } {
  return {
    proxyEntries: Object.keys(readProxyCache()).length,
    selfieUrls: getSelfieUrls().length,
  };
}
