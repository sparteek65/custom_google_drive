import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/services/storageService';

// Initialize upload session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType, size, folderName } = body;
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }
    
    // Sanitize filename
    const sanitizedFilename = filename.replace(/[^\w\s.-]/g, '');
    
    // Create full path including folder if provided
    const fullPath = folderName 
      ? `${folderName}/${sanitizedFilename}` 
      : sanitizedFilename;
    
    // Create a resumable upload session
    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || '';
    const sessionUrl = await storageService.createResumableUploadSession(
      bucketName, 
      fullPath, 
      contentType || 'application/octet-stream'
    );
    
    return NextResponse.json({ 
      sessionUrl,
      filename: fullPath,
      success: true
    });
  } catch (error) {
    console.error('Error creating upload session:', error);
    return NextResponse.json(
      { error: 'Failed to initialize upload', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Upload chunk
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionUrl = searchParams.get('sessionUrl');
    const start = parseInt(searchParams.get('start') || '0', 10);
    const end = parseInt(searchParams.get('end') || '0', 10);
    const totalSize = parseInt(searchParams.get('totalSize') || '0', 10);
    
    if (!sessionUrl) {
      return NextResponse.json({ error: 'Session URL is required' }, { status: 400 });
    }
    
    if (isNaN(start) || isNaN(end) || isNaN(totalSize)) {
      return NextResponse.json({ error: 'Invalid chunk parameters' }, { status: 400 });
    }
    
    // Get chunk data from request
    const chunk = Buffer.from(await request.arrayBuffer());
    
    // Upload the chunk
    const result = await storageService.uploadChunk(
      sessionUrl,
      chunk,
      start,
      end,
      totalSize
    );
    
    return NextResponse.json({
      ...result,
      success: true
    });
  } catch (error) {
    console.error('Error uploading chunk:', error);
    return NextResponse.json(
      { error: 'Failed to upload chunk', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Allow large requests
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}; 