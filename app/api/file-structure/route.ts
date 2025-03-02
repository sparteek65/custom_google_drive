import { NextResponse } from 'next/server';
import { storageService } from '@/lib/services/storageService';

export async function GET() {
  try {
    const files = await storageService.listFiles();
    
    // Convert the flat file list to a nested structure
    const fileStructure: any = {};
    
    files.forEach((file) => {
      const path = file.path.split('/');
      let current = fileStructure;
      
      path.forEach((part, index) => {
        if (index === path.length - 1) {
          // It's a file
          const fileSize = file.size 
            ? `${(file.size / 1024).toFixed(2)}KB`
            : '-';

          current[part] = {
            name: part,
            type: 'file',
            size: fileSize,
            updated: file.updatedAt.toISOString(),
            fullPath: file.path,
            metadata: {
              name: file.path,
              bucket: file.bucket,
              contentType: file.contentType,
              size: file.size.toString(),
              timeCreated: file.createdAt.toISOString(),
              updated: file.updatedAt.toISOString(),
              generation: file.generation,
              metageneration: file.metageneration,
              md5Hash: file.md5Hash,
              crc32c: file.crc32c,
              etag: file.etag,
            },
          };
        } else {
          // It's a folder
          if (!current[part]) {
            current[part] = {
              name: part,
              type: 'folder',
              size: '-',
              updated: '-',
              children: {},
            };
          }
          current = current[part].children;
        }
      });
    });

    return NextResponse.json(fileStructure);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file structure' },
      { status: 500 }
    );
  }
}