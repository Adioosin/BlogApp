import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const id = crypto.randomUUID();
  return `${id}${ext}`;
}

type UploadResult = {
  url: string;
  filename: string;
};

function saveImage(file: Express.Multer.File): UploadResult {
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }

  ensureUploadDir();

  const filename = generateFilename(file.originalname);
  const destPath = path.join(UPLOADS_DIR, filename);

  fs.writeFileSync(destPath, file.buffer);

  const url = `/uploads/${filename}`;
  return { url, filename };
}

export { saveImage };
