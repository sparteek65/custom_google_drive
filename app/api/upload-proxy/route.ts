import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/services/storageService';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderName = formData.get('folderName') as string || '';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate a clean file path
    const fileName = file.name.replace(/[^\w\s.-]/g, ''); // Remove special chars for safety
    const filePath = folderName ? `${folderName}/${fileName}` : fileName;
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload using our service
    const metadata = await storageService.uploadFile(
      buffer,
      filePath,
      file.type || 'application/octet-stream'
    );

    return NextResponse.json({
      success: true,
      path: filePath,
      metadata
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Increase limits for file uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '20mb',
  },
}; 