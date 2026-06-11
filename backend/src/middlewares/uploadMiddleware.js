import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { hasCloudinaryConfig } from '../config/cloudinary.js';

const uploadDir = path.resolve('uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage is used for parsing so we can validate file headers/magic numbers before writing to disk
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  } else {
    cb(new Error('Images only. Allowed formats: jpg, jpeg, png, webp, avif'));
  }
}

const multerInstance = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Helper to validate magic numbers/signatures in the file buffer
function isValidImageSignature(buffer) {
  if (!buffer || buffer.length < 12) {
    return false;
  }

  // 1. JPEG (starts with FF D8 FF)
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  // 2. PNG (starts with 89 50 4E 47 0D 0A 1A 0A)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return true;
  }

  // 3. WebP (starts with RIFF in first 4 bytes and WEBP in bytes 8-11)
  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;
  if (isRiff && isWebp) {
    return true;
  }

  // 4. AVIF (ftypavif at bytes 4-11)
  const isFtyp =
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70;
  const isAvif =
    (buffer[8] === 0x61 &&
      buffer[9] === 0x76 &&
      buffer[10] === 0x69 &&
      buffer[11] === 0x66) ||
    (buffer[8] === 0x61 &&
      buffer[9] === 0x76 &&
      buffer[10] === 0x69 &&
      buffer[11] === 0x73);
  if (isFtyp && isAvif) {
    return true;
  }

  return false;
}

// Helper to generate a clean, safe filename matching original diskStorage config
const getSafeFilename = (originalname) => {
  const ext = path.extname(originalname);
  const safeName = path
    .basename(originalname, ext)
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${safeName || 'product-image'}-${Date.now()}${ext}`;
};

// Middleware: Validate single file signature and write to disk if not using Cloudinary
const validateAndStoreSingle = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  if (!isValidImageSignature(req.file.buffer)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file format. File signature mismatch (magic numbers check failed).',
    });
  }

  if (!hasCloudinaryConfig()) {
    try {
      const filename = getSafeFilename(req.file.originalname);
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      req.file.path = filePath;
      req.file.filename = filename;
    } catch (err) {
      return next(err);
    }
  }

  next();
};

// Middleware: Validate array of file signatures and write to disk if not using Cloudinary
const validateAndStoreArray = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  for (const file of req.files) {
    if (!isValidImageSignature(file.buffer)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file format for "${file.originalname}". File signature mismatch.`,
      });
    }
  }

  if (!hasCloudinaryConfig()) {
    try {
      for (const file of req.files) {
        const filename = getSafeFilename(file.originalname);
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, file.buffer);
        file.path = filePath;
        file.filename = filename;
      }
    } catch (err) {
      return next(err);
    }
  }

  next();
};

// Wrapped upload object interface mimicking Multer's API
const upload = {
  single(fieldname) {
    return [multerInstance.single(fieldname), validateAndStoreSingle];
  },
  array(fieldname, maxCount) {
    return [multerInstance.array(fieldname, maxCount), validateAndStoreArray];
  },
};

export default upload;
