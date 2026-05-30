/**
 * ImageKit CDN URL builder
 *
 * Generates optimized image URLs via ImageKit transformation API.
 * Falls back to the original /public/ path if the endpoint is not configured.
 *
 * Usage:
 *   imagekit('Forge.png', { w: 800, q: 80 })
 *   → https://ik.imagekit.io/dinosportfolio/Forge.png?tr=w-800,q-80,f-auto
 */

const ENDPOINT = (import.meta as any).env.VITE_IMAGEKIT_ENDPOINT as string | undefined;

interface ImageKitOptions {
  /** Width in pixels */
  w?: number;
  /** Height in pixels */
  h?: number;
  /** Quality (1–100) */
  q?: number;
  /** Crop mode */
  c?: 'force' | 'at_least' | 'at_max' | 'maintain_ratio';
  /** Focus for cropping */
  fo?: 'auto' | 'face' | 'center' | 'top' | 'left' | 'bottom' | 'right';
}

export function imagekit(path: string, opts: ImageKitOptions = {}): string {
  // Ensure path starts without leading slash for CDN
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  if (!ENDPOINT || ENDPOINT.includes('yourID') || ENDPOINT.includes('dinosportfolio')) {
    // In dev or if endpoint is placeholder, serve from /public/ directly
    return `/${cleanPath}`;
  }

  const transforms: string[] = ['f-auto'];
  if (opts.w) transforms.push(`w-${opts.w}`);
  if (opts.h) transforms.push(`h-${opts.h}`);
  if (opts.q) transforms.push(`q-${opts.q}`);
  if (opts.c) transforms.push(`c-${opts.c}`);
  if (opts.fo) transforms.push(`fo-${opts.fo}`);

  const trString = transforms.join(',');
  return `${ENDPOINT.replace(/\/$/, '')}/${cleanPath}?tr=${trString}`;
}

/** Preset for project card images */
export const projectImage = (path: string) =>
  imagekit(path, { w: 900, q: 82, c: 'at_least' });

/** Preset for project thumbnails */
export const projectThumb = (path: string) =>
  imagekit(path, { w: 400, q: 75, c: 'at_least' });
