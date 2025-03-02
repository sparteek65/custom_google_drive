import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/services/storageService';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const folderName = formData.get('folderName') as string || '';
    const files = formData.getAll('files') as File[];
    
    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Process files one by one, but in a single response
    const results = [];
    
    for (const file of files) {
      try {
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
        
        results.push({
          name: file.name,
          path: filePath,
          size: file.size,
          contentType: file.type,
          metadata,
          status: 'success'
        });
      } catch (error) {
        results.push({
          name: file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalFiles: files.length,
      results
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
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
    responseLimit: '50mb',
  },
};