import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error('💥 Unhandled Error:', err);

  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: 'File Too Large',
        message: 'The uploaded file exceeds the maximum permitted limit of 10 MB.',
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: 'Upload Error',
      message: err.message,
    });
    return;
  }

  if (err.message && err.message.includes('Invalid MIME type')) {
    res.status(400).json({
      success: false,
      error: 'Unsupported Media Type',
      message: err.message,
    });
    return;
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred while processing the request.',
  });
}
