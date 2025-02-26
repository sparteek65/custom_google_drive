import { NextResponse } from 'next/server';
import { getFolderStructure, getUploadPresignedUrl } from '@/lib/googleCloud';

export async function GET() {
  try {
    const structure = await getFolderStructure();
    return NextResponse.json(structure);
  } catch (error) {
    console.error('Error fetching folder structure:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder structure' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received upload request for:', body);
    
    if (!body.fileName || !body.folderName || !body.contentType) {
      return NextResponse.json(
        { error: 'fileName, folderName, and contentType are required' },
        { status: 400 }
      );
    }

    const { fileName, folderName, contentType } = body;
    const uploadUrl = await getUploadPresignedUrl(fileName, folderName, contentType);
    console.log('Generated presigned URL:', uploadUrl);
    
    return NextResponse.json({ uploadUrl });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}