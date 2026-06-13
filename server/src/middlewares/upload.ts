import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

/* ========================================
   文件上传中间件 — multer
   ======================================== */

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomUUID();
    cb(null, `${name}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 JPG / PNG / WEBP 格式'));
    }
  },
});

export const uploadSingle = uploadMiddleware.single('file');
export const uploadMultiple = uploadMiddleware.array('files', 10);