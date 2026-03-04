import type { VercelRequest, VercelResponse } from '@vercel/node';
import multer from 'multer';
import { uploadToCloudinary, isCloudinaryConfigured, deleteFromCloudinary } from '../../server/config/cloudinary.config.js';

// Initialize multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed'));
    }
  },
});

// Helper function to run middleware in Vercel Serverless Functions
function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false, // Disable built-in body parser for multipart/form-data
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        message: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment.",
      });
    }

    if (req.method === 'POST') {
      // Parse the multipart form data
      await runMiddleware(req, res, upload.single('image'));
      
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      console.log(`📸 [Vercel API] Uploading image: ${file.originalname}`);

      const result = await uploadToCloudinary(file.buffer, {
        folder: 'agritech-blog',
      });

      console.log(`✅ [Vercel API] Image uploaded: ${result.url}`);

      return res.status(200).json({
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
      });
    } 
    
    if (req.method === 'DELETE') {
      // For DELETE, we might get the publicId from query or body
      // Since it's a serverless function, we handle /api/admin/upload-image?publicId=xxx
      const publicId = req.query.publicId as string;
      
      if (!publicId) {
        return res.status(400).json({ message: "Public ID is required" });
      }

      await deleteFromCloudinary(publicId);
      console.log(`🗑️ [Vercel API] Image deleted: ${publicId}`);
      
      return res.status(200).json({ message: "Image deleted successfully" });
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error("❌ [Vercel API] Image operation error:", error);
    const message = error instanceof Error ? error.message : "Failed to process image";
    res.status(500).json({ message });
  }
}
