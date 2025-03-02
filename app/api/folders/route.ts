import { NextResponse } from 'next/server';
import { storageService } from '@/lib/services/storageService';

// Utility function to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';
    
    const files = await storageService.listFiles(prefix);
    
    // Transform files to the expected format
    const transformedFiles = files.map(file => {
      const name = file.path.replace(prefix, '').replace(/^\//, ''); // Remove prefix and leading slash
      const isFolder = name.includes('/') && !name.endsWith('/');
      
      return {
        name: isFolder ? name.split('/')[0] + '/' : name,
        size: formatFileSize(file.size),
        updated: file.updatedAt.toLocaleDateString(),
        type: isFolder || file.path.endsWith('/') ? 'folder' : 'file'
      };
    });

    // Filter out empty entries and duplicates (for folders)
    const uniqueNames = new Set();
    const sortedFiles = transformedFiles
      .filter(file => file.name) // Remove empty names
      .filter(file => {
        // Remove duplicates by name
        if (uniqueNames.has(file.name)) return false;
        uniqueNames.add(file.name);
        return true;
      })
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