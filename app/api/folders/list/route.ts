import { NextResponse } from 'next/server';
import { storageService } from '@/lib/services/storageService';

export async function GET() {
  try {
    // Get all files from storage
    const files = await storageService.listFiles();
    
    // Extract unique folder paths
    const folderPaths = new Set<string>();
    
    files.forEach(file => {
      const path = file.path;
      const parts = path.split('/');
      
      // Add each folder level
      if (parts.length > 1) {
        let folderPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
          folderPath += (i > 0 ? '/' : '') + parts[i];
          folderPaths.add(folderPath);
        }
      }
    });
    
    // Convert to array and sort
    const sortedFolders = Array.from(folderPaths).sort();
    console.log('Found folders:', sortedFolders);
    
    return NextResponse.json(sortedFolders);
  } catch (error) {
    console.error('Error listing folders:', error);
    return NextResponse.json(
      { error: 'Failed to list folders' },
      { status: 500 }
    );
  }
} 