import { Storage } from '@google-cloud/storage';
import { NextResponse } from 'next/server';

async function listFiles(bucketName: string) {
  const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });

  try {
    const [files] = await storage.bucket(bucketName).getFiles();
    
    // Convert the flat file list to a nested structure
    const fileStructure: any = {};
    
    files.forEach((file) => {
      const path = file.name.split('/');
      let current = fileStructure;
      
      path.forEach((part, index) => {
        if (index === path.length - 1) {
          // It's a file
          const fileSize = file.metadata.size 
            ? `${(parseInt(String(file.metadata.size)) / 1024).toFixed(2)}KB`
            : '-';

          current[part] = {
            name: part,
            type: 'file',
            size: fileSize,
            updated: file.metadata.updated || '-',
            fullPath: file.name,
            metadata: file.metadata,
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

    return fileStructure;
  } catch (error) {
    console.error('Error fetching files from Google Cloud Storage:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('Bucket name not configured');
    }

    const fileStructure = await listFiles(bucketName);
    return NextResponse.json(fileStructure);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file structure' },
      { status: 500 }
    );
  }
} 