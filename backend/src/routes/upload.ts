import { Router, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { db } from "../db";
import { requireAdmin, AuthRequest } from "../middleware/requireAdmin";
import { logger } from "../utils/logger";

const router = Router();

// Configure Multer (10MB max size)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  
  return (
    name && name !== "your_cloud_name" && name !== "demo_cloud" &&
    key && key !== "your_api_key" &&
    secret && secret !== "your_api_secret"
  );
};

const uploadFromBuffer = (fileBuffer: Buffer, fileName: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        folder: "gallery_site",
        public_id: fileName.split(".")[0] + "_" + Date.now(),
        resource_type: "image"
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    stream.end(fileBuffer);
  });
};

// POST /api/admin/upload (Protected)
router.post("/upload", requireAdmin, upload.single("file"), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { message: "No file uploaded", code: "NO_FILE" }
      });
    }

    const file = req.file;
    let uploadResult: {
      secure_url: string;
      public_id: string;
      format: string;
      width: number;
      height: number;
      bytes: number;
    };

    if (isCloudinaryConfigured()) {
      logger.info(`Uploading file ${file.originalname} to Cloudinary...`);
      const cloudinaryRes = await uploadFromBuffer(file.buffer, file.originalname);
      uploadResult = {
        secure_url: cloudinaryRes.secure_url,
        public_id: cloudinaryRes.public_id,
        format: cloudinaryRes.format,
        width: cloudinaryRes.width,
        height: cloudinaryRes.height,
        bytes: cloudinaryRes.bytes,
      };
    } else {
      logger.warn("Cloudinary is not configured. Falling back to local mock response.");
      // Fallback/Mock implementation for development
      const mockRandomId = Math.floor(Math.random() * 1000);
      uploadResult = {
        secure_url: `https://picsum.photos/id/${mockRandomId % 100}/800/800`,
        public_id: `mock_asset_${Date.now()}`,
        format: "jpg",
        width: 800,
        height: 800,
        bytes: file.size,
      };
    }

    // Save to media_assets table
    await db.query(
      `INSERT INTO media_assets (cloudinary_public_id, secure_url, format, width, height, bytes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (cloudinary_public_id) DO NOTHING`,
      [
        uploadResult.public_id,
        uploadResult.secure_url,
        uploadResult.format,
        uploadResult.width,
        uploadResult.height,
        uploadResult.bytes
      ]
    );

    // Return format compatible with both project specification and frontend client structure
    res.status(201).json({
      data: {
        url: uploadResult.secure_url,
        key: uploadResult.public_id, // fits API frontend expectation
        size: uploadResult.bytes,
        contentType: file.mimetype,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes
      }
    });

  } catch (err: any) {
    logger.error(`Upload error: ${err.message}`);
    res.status(500).json({
      error: { message: `Image upload failed: ${err.message}`, code: "UPLOAD_FAILED" }
    });
  }
});

export default router;
