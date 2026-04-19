import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';

import { authenticate } from '../middleware/auth.js';
import { saveImage } from '../services/upload-service.js';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_FILE_SIZE ?? '5242880', 10);

const uploadResponseSchema = z.object({
  url: z.string(),
  filename: z.string(),
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
    }
  },
});

const uploadRouter = Router();

uploadRouter.post('/upload/image', authenticate, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const limitMb = Math.round(MAX_FILE_SIZE / (1024 * 1024));
        res.status(422).json({
          error: { message: `File size exceeds ${limitMb} MB limit`, code: 'FILE_TOO_LARGE' },
        });
        return;
      }
      res.status(400).json({
        error: { message: err.message, code: 'UPLOAD_ERROR' },
      });
      return;
    }
    if (err) {
      res.status(422).json({
        error: { message: err.message, code: 'INVALID_FILE' },
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        error: { message: 'No image file provided', code: 'MISSING_FILE' },
      });
      return;
    }

    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const result = saveImage(req.file, baseUrl);
      const validated = uploadResponseSchema.parse(result);
      res.status(201).json({ data: validated });
    } catch {
      res.status(500).json({
        error: { message: 'Upload processing failed', code: 'UPLOAD_ERROR' },
      });
    }
  });
});

export { uploadRouter };
