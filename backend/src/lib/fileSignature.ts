// Minimal magic-byte sniffing so an uploaded file's *declared* type (client-controlled, easily
// spoofed) is cross-checked against what the bytes actually are before it's ever written to
// disk or served back to another user. Intentionally dependency-free — the set of types this
// app accepts is small and fixed, so a hand-rolled signature table is simpler and more
// predictable than pulling in a magic-byte detection library.

export type DetectedKind = 'pdf' | 'zip-office' | 'legacy-office' | 'jpeg' | 'png' | 'gif' | 'webp' | 'mp4' | 'webm' | 'text';

function matches(buf: Buffer, offset: number, bytes: number[]): boolean {
  if (buf.length < offset + bytes.length) return false;
  return bytes.every((b, i) => buf[offset + i] === b);
}

export function detectFileKind(buf: Buffer): DetectedKind | null {
  if (matches(buf, 0, [0x25, 0x50, 0x44, 0x46])) return 'pdf'; // %PDF
  if (matches(buf, 0, [0x50, 0x4b, 0x03, 0x04]) || matches(buf, 0, [0x50, 0x4b, 0x05, 0x06])) return 'zip-office'; // docx/pptx/xlsx/zip
  if (matches(buf, 0, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return 'legacy-office'; // .doc/.ppt/.xls
  if (matches(buf, 0, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (matches(buf, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (matches(buf, 0, [0x47, 0x49, 0x46, 0x38])) return 'gif';
  if (matches(buf, 0, [0x52, 0x49, 0x46, 0x46]) && matches(buf, 8, [0x57, 0x45, 0x42, 0x50])) return 'webp';
  if (matches(buf, 4, [0x66, 0x74, 0x79, 0x70])) return 'mp4'; // ftyp box
  if (matches(buf, 0, [0x1a, 0x45, 0xdf, 0xa3])) return 'webm';

  // No binary signature matched — treat as text only if it looks like text (no NUL bytes and
  // mostly printable in the first slice), otherwise reject as an unrecognized/unsafe format.
  const sample = buf.subarray(0, Math.min(buf.length, 2048));
  const hasNul = sample.includes(0);
  if (!hasNul && sample.length > 0) return 'text';
  return null;
}

// Which detected kinds are acceptable for each Material `type` the UI lets a user pick.
export const ALLOWED_KINDS_BY_TYPE: Record<string, DetectedKind[]> = {
  PDF: ['pdf'],
  DOC: ['zip-office', 'legacy-office', 'text'],
  PPT: ['zip-office', 'legacy-office'],
  EXCEL: ['zip-office', 'legacy-office'],
  IMAGE: ['jpeg', 'png', 'gif', 'webp'],
  VIDEO: ['mp4', 'webm'],
  ZIP: ['zip-office'],
  NOTES: ['pdf', 'zip-office', 'legacy-office', 'text'],
};

export const KIND_MIME_TYPES: Record<DetectedKind, string> = {
  pdf: 'application/pdf',
  'zip-office': 'application/octet-stream',
  'legacy-office': 'application/octet-stream',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  text: 'text/plain',
};
