import { NextResponse } from 'next/server';
import { listFiles } from '@/lib/googleCloud';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';
    
    const files = await listFiles(prefix);
    
    // Transform the files data to match the expected format
    const transformedFiles = files.map((file: any) => ({
      name: file.name.replace(prefix, '').replace(/^\//, ''), // Remove prefix and leading slash
      size: formatFileSize(file.size || 0),
      updated: new Date(file.updated || file.timeCreated).toLocaleDateString(),
      type: file.name.endsWith('/') ? 'folder' : 'file'
    }));

    // Filter out empty entries and sort folders first
    const sortedFiles = transformedFiles
      .filter(file => file.name) // Remove empty names
      .sort((a, b) => {
        // Sort folders before files
        if ((a.type === 'folder') && (b.type !== 'folder')) return -1;
        if ((a.type !== 'folder') && (b.type === 'folder')) return 1;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json(sortedFiles);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}