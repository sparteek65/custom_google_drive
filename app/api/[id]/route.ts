import { NextResponse } from 'next/server';
import { deleteFile } from '@/lib/googleCloud';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Received DELETE request for:', params.id);
    const filePath = Buffer.from(params.id, 'base64')
      .toString()
      .trim();
    
    console.log('Deleting file:', filePath);
    await deleteFile(filePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
} 