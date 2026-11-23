import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export const IDB_ATT_PREFIX = 'idb-att://';

interface AttachmentBlobRecord {
  id: string;
  blob: Blob;
  name: string;
  mime: string;
  size: number;
  createdAt: number;
}

interface AttachmentDBSchema extends DBSchema {
  blobs: {
    key: string;
    value: AttachmentBlobRecord;
  };
}

const ATT_DB_NAME = 'instant-notes-attachments-db';
const ATT_DB_VERSION = 1;

let attDbPromise: Promise<IDBPDatabase<AttachmentDBSchema>> | null = null;
const objectUrlCache = new Map<string, string>();

function getAttachmentDB(): Promise<IDBPDatabase<AttachmentDBSchema>> {
  if (!attDbPromise) {
    attDbPromise = openDB<AttachmentDBSchema>(ATT_DB_NAME, ATT_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('blobs')) {
          db.createObjectStore('blobs', { keyPath: 'id' });
        }
      },
    });
  }
  return attDbPromise;
}

export function isIdbAttachmentUrl(url: string | undefined | null): boolean {
  return typeof url === 'string' && url.startsWith(IDB_ATT_PREFIX);
}

export function extractIdbAttachmentId(url: string): string {
  return url.slice(IDB_ATT_PREFIX.length);
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Synchronous lookup for already-resolved ObjectURLs so UI renders with 0ms flicker.
 */
export function getCachedAttachmentUrl(url: string): string | null {
  if (!isIdbAttachmentUrl(url)) return url;
  const id = extractIdbAttachmentId(url);
  return objectUrlCache.get(id) || null;
}

/**
 * Save a binary Blob into IndexedDB and cache its ObjectURL immediately.
 * Returns the compact reference string `idb-att://<id>` to embed in `note.content`.
 */
export async function saveAttachmentBlob(
  id: string,
  blob: Blob,
  name: string,
  mime: string
): Promise<string> {
  const db = await getAttachmentDB();
  await db.put('blobs', {
    id,
    blob,
    name,
    mime: mime || blob.type || 'application/octet-stream',
    size: blob.size,
    createdAt: Date.now(),
  });

  // Pre-warm ObjectURL cache for instant rendering without flicker
  const existing = objectUrlCache.get(id);
  if (existing) {
    URL.revokeObjectURL(existing);
  }
  const objUrl = URL.createObjectURL(blob);
  objectUrlCache.set(id, objUrl);

  return `${IDB_ATT_PREFIX}${id}`;
}

/**
 * Resolve an `idb-att://<id>` reference into a browser-usable `blob:` ObjectURL.
 * Legacy `data:`, `http:`, `https:`, and `blob:` URLs are returned unchanged.
 */
export async function resolveAttachmentUrl(url: string): Promise<string> {
  if (!isIdbAttachmentUrl(url)) return url;
  const id = extractIdbAttachmentId(url);
  const cached = objectUrlCache.get(id);
  if (cached) return cached;

  try {
    const db = await getAttachmentDB();
    const record = await db.get('blobs', id);
    if (!record?.blob) return '';
    const objUrl = URL.createObjectURL(record.blob);
    objectUrlCache.set(id, objUrl);
    return objUrl;
  } catch (err) {
    console.error('Failed to resolve attachment blob:', err);
    return '';
  }
}

/**
 * Delete a binary Blob from IndexedDB and revoke its ObjectURL to free memory.
 */
export async function deleteAttachmentBlob(idOrUrl: string): Promise<void> {
  const id = isIdbAttachmentUrl(idOrUrl) ? extractIdbAttachmentId(idOrUrl) : idOrUrl;
  const cached = objectUrlCache.get(id);
  if (cached) {
    URL.revokeObjectURL(cached);
    objectUrlCache.delete(id);
  }
  try {
    const db = await getAttachmentDB();
    await db.delete('blobs', id);
  } catch (err) {
    console.error('Failed to delete attachment blob:', err);
  }
}

/**
 * Compress raster images (PNG/JPEG/BMP/WebP) to WebP in-browser before storing.
 * Preserves SVG and animated GIF untouched so vector sharpness & animations stay intact.
 */
export async function compressImageToWebP(
  file: File | Blob,
  maxDimension = 1600,
  quality = 0.82
): Promise<{ blob: Blob; width: number; height: number; mime: string }> {
  const mime = file.type || 'image/png';
  // Keep SVG & GIF untouched
  if (mime === 'image/svg+xml' || mime === 'image/gif') {
    return { blob: file, width: 0, height: 0, mime };
  }

  return new Promise((resolve) => {
    const tempUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(tempUrl);
      const natW = img.naturalWidth || 1;
      const natH = img.naturalHeight || 1;

      let targetW = natW;
      let targetH = natH;
      if (natW > maxDimension || natH > maxDimension) {
        if (natW >= natH) {
          targetW = maxDimension;
          targetH = Math.round((natH / natW) * maxDimension);
        } else {
          targetH = maxDimension;
          targetW = Math.round((natW / natH) * maxDimension);
        }
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ blob: file, width: natW, height: natH, mime });
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        canvas.toBlob(
          (webpBlob) => {
            // Only use compressed WebP if it succeeded and is actually smaller (or resized)
            if (webpBlob && (webpBlob.size < file.size || targetW !== natW)) {
              resolve({ blob: webpBlob, width: targetW, height: targetH, mime: 'image/webp' });
            } else {
              resolve({ blob: file, width: natW, height: natH, mime });
            }
          },
          'image/webp',
          quality
        );
      } catch {
        resolve({ blob: file, width: natW, height: natH, mime });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      resolve({ blob: file, width: 0, height: 0, mime });
    };
    img.src = tempUrl;
  });
}
