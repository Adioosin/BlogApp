import { Router } from 'express';
import multer from 'multer';

import { authenticate } from '../middleware/auth.js';
import { saveImage } from '../services/upload-service.js';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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

uploadRouter.post('/upload/image', authenticate, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(422).json({
          error: { message: 'File size exceeds 5 MB limit', code: 'FILE_TOO_LARGE' },
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
      const result = saveImage(req.file);
      res.status(201).json({ data: result });
    } catch {
      next(new Error('Failed to save uploaded image'));
    }
  });
});

export { uploadRouter };
