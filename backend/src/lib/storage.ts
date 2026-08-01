import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Local-disk storage driver behind a small interface so a real object-storage backend
// (S3/R2/GCS) can be swapped in later without touching callers — they only ever deal in
// storageKey strings, never filesystem paths.
//
// The uploads root lives outside anything Express serves statically (this app serves no
// static directory at all), so a file is only ever reachable through the authenticated,
// ownership-checked download route — never by guessing a URL.
const UPLOADS_ROOT = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '../../uploads');

async function ensureRoot(): Promise<void> {
  await fs.mkdir(UPLOADS_ROOT, { recursive: true });
}

export async function saveFile(buffer: Buffer, extension: string): Promise<string> {
  await ensureRoot();
  const safeExt = extension.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10);
  const storageKey = `${crypto.randomUUID()}${safeExt}`;
  await fs.writeFile(path.join(UPLOADS_ROOT, storageKey), buffer);
  return storageKey;
}

export function resolveStoragePath(storageKey: string): string {
  // storageKey is always a server-generated crypto.randomUUID() + short extension, but guard
  // against path traversal defensively in case that assumption is ever violated upstream.
  const base = path.basename(storageKey);
  return path.join(UPLOADS_ROOT, base);
}

export async function deleteFile(storageKey: string): Promise<void> {
  try {
    await fs.unlink(resolveStoragePath(storageKey));
  } catch {
    // Best-effort: a missing file on disk shouldn't block deleting the DB row.
  }
}
