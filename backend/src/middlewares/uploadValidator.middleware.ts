import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { inspectAudioMagicBytes } from '../utils/magicBytes';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB strict limit
  },
  fileFilter: (_req, file, cb) => {
    // Basic MIME / extension check before reading buffer
    const allowedMimes = ['audio/wav', 'audio/x-wav', 'audio/wave'];
    const hasWavExt = file.originalname.toLowerCase().endsWith('.wav');

    if (allowedMimes.includes(file.mimetype) || hasWavExt) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid MIME type: ${file.mimetype}. Only WAV acoustic audio files are allowed.`));
    }
  },
});

export const audioUploadMiddleware = upload.single('audio');

/**
 * Validates the uploaded audio file buffer using deep magic-byte inspection.
 */
export function validateAudioPayload(req: Request, res: Response, next: NextFunction): void {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: 'Missing Audio File',
      message: 'An audio file must be uploaded under the field name "audio".',
    });
    return;
  }

  const result = inspectAudioMagicBytes(req.file.buffer);

  if (!result.isValid) {
    res.status(400).json({
      success: false,
      error: 'Invalid Audio Payload',
      message: result.error,
      sizeBytes: result.sizeBytes,
    });
    return;
  }

  next();
}
