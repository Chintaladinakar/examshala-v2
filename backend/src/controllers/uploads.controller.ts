import { Response } from 'express';
import multer from 'multer';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { saveFile } from '../lib/storage';
import { detectFileKind, ALLOWED_KINDS_BY_TYPE, KIND_MIME_TYPES } from '../lib/fileSignature';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

// Buffered in memory (capped at MAX_FILE_BYTES) rather than streamed straight to disk so the
// magic-byte check below runs before anything is written — a rejected upload never touches disk.
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
}).single('file');

/**
 * Replaces the old "paste any http(s) URL and we trust it" material flow: the client uploads
 * real bytes, we verify what they actually are (not just the filename/declared type) via magic
 * bytes, store them under a server-generated key on a private disk root, and only ever hand
 * back an opaque UploadedFile id. No client-supplied URL is ever persisted as a material's file.
 *
 * There is no virus-scanning hook wired up here — that requires a real AV service (ClamAV
 * daemon, a Lambda, etc.) which isn't provisioned in this environment. If one is added later,
 * it plugs in right after the magic-byte check and before `saveFile`.
 */
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const role = user.role.toLowerCase();
    if (['student', 'parent'].includes(role)) {
      res.status(403).json({ success: false, message: 'Access denied. You do not have permission to upload files.' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'A file is required.' });
      return;
    }

    const declaredType = String(req.body?.materialType || '').toUpperCase();
    const allowedKinds = ALLOWED_KINDS_BY_TYPE[declaredType];
    if (!allowedKinds) {
      res.status(400).json({
        success: false,
        message: `materialType must be one of: ${Object.keys(ALLOWED_KINDS_BY_TYPE).join(', ')}`,
      });
      return;
    }

    const detectedKind = detectFileKind(file.buffer);
    if (!detectedKind || !allowedKinds.includes(detectedKind)) {
      res.status(400).json({
        success: false,
        message: 'The file content does not match the selected type, or is not a supported format.',
      });
      return;
    }

    const ext = (file.originalname.match(/\.[a-zA-Z0-9]+$/)?.[0] || '').toLowerCase();
    const storageKey = await saveFile(file.buffer, ext);

    const uploaded = await prisma.uploadedFile.create({
      data: {
        workspaceId: user.workspaceId,
        uploadedByUserId: user.id,
        originalName: file.originalname.slice(0, 255),
        mimeType: KIND_MIME_TYPES[detectedKind],
        sizeBytes: file.size,
        storageKey,
      },
    });

    res.status(201).json({
      success: true,
      data: { id: uploaded.id, originalName: uploaded.originalName, mimeType: uploaded.mimeType, sizeBytes: uploaded.sizeBytes },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
