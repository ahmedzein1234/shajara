/**
 * Upload API Route
 * POST /api/upload - Upload photo to Cloudflare R2
 */

import { NextRequest } from 'next/server';
import type { D1Database } from '@cloudflare/workers-types';
import { validateUploadFile } from '@/lib/api/validation';
import {
  handleError,
  createdResponse,
  UnauthorizedError,
  BadRequestError,
} from '@/lib/api/errors';
import { getCurrentUserId } from '@/lib/auth/session';

// R2Bucket interface for type safety
interface R2Bucket {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<void>;
}

// Get R2 bucket from request context
function getR2Bucket(request: NextRequest): R2Bucket {
  const env = (request as any).env;
  if (!env?.STORAGE) {
    throw new Error('R2 storage not configured');
  }
  return env.STORAGE;
}

// Generate a unique file key
function generateFileKey(userId: string, filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const ext = filename.split('.').pop();
  return `uploads/${userId}/${timestamp}-${random}.${ext}`;
}

/**
 * POST /api/upload
 * Upload a file to Cloudflare R2 storage
 *
 * Content-Type: multipart/form-data
 * Form fields:
 * - file: The image file to upload (required)
 * - tree_id: The tree this file belongs to (optional, for organization)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "url": "https://your-r2-domain.com/uploads/user-id/timestamp-random.jpg",
 *     "key": "uploads/user-id/timestamp-random.jpg",
 *     "size": 12345,
 *     "type": "image/jpeg"
 *   }
 * }
 */
// Get D1 database from request context
function getDatabase(request: NextRequest): D1Database {
  const env = (request as any).env;
  if (!env?.DB) {
    throw new Error('D1 database not configured');
  }
  return env.DB;
}

export async function POST(request: NextRequest) {
  try {
    const db = getDatabase(request);
    const userId = await getCurrentUserId(db);
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new BadRequestError('File is required');
    }

    // Validate file
    validateUploadFile(file);

    // Generate unique key for the file
    const key = generateFileKey(userId, file.name);

    // Get R2 bucket
    const bucket = getR2Bucket(request);

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Generate public URL
    // In production, you should configure R2 custom domain
    // For now, we'll return the key and let the frontend handle URL generation
    const publicUrl = `https://shajara-media.r2.dev/${key}`;

    return createdResponse({
      url: publicUrl,
      key,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    return handleError(error);
  }
}
