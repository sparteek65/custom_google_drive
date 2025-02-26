import { Storage } from '@google-cloud/storage';
import { FileItem, FolderStructure } from '@/types/files';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME!);
export async function listFiles(prefix: string = ''): Promise<FileItem[]> {
  const [files, apiResponse] = await bucket.getFiles();
  console.log('files', files);
  const items: FileItem[] = [];

  // Add folders (prefixes)
  const prefixes = (apiResponse as any).prefixes;
  if (prefixes) {
    items.push(...prefixes.map((folderPath: string) => ({
      id: Buffer.from(folderPath).toString('base64'),
      name: folderPath.split('/').filter(Boolean).pop() || '',
      size: 0,
      type: 'folder',
      updated: new Date().toISOString(),
      isFolder: true,
      path: folderPath,
    })));
  }

  // Add files
  items.push(...files
    .filter(file => !file.name.endsWith('/')) // Filter out folder markers
    .map((file) => ({
      id: Buffer.from(file.name).toString('base64'),
      name: file.name,
      size: parseInt(file.metadata.size as string),
      type: file.metadata.contentType || 'application/octet-stream',
      updated: file.metadata.updated || new Date().toISOString(),
      isFolder: false,
      path: file.name,
    })));

  return items;
}

export async function getFolderStructure(): Promise<FolderStructure> {
  const [files] = await bucket.getFiles();
  const root: FolderStructure = {
    name: 'Root',
    path: '/',
    children: [],
    isFolder: true,
  };

  files.forEach((file) => {
    const parts = file.name.split('/').filter(Boolean);
    let current = root;

    parts.forEach((part, index) => {
      if (index === parts.length - 1 && !file.name.endsWith('/')) {
        return; // Skip files
      }

      let child = current.children.find(c => c.name === part);
      if (!child) {
        child = {
          name: part,
          path: '/' + parts.slice(0, index + 1).join('/'),
          children: [],
          isFolder: true,
        };
        current.children.push(child);
      }
      current = child;
    });
  });

  return root;
}

export async function deleteFile(path: string): Promise<void> {
  const file = bucket.file(path);
  await file.delete();
}

export async function generateUploadUrl(fileName: string, contentType: string): Promise<{url: string, fields: Record<string, string>}> {
  const options = {
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    fields: {
      'content-type': contentType,
    },
  };

  const [response] = await bucket.file(fileName).generateSignedPostPolicyV4(options);
  return {
    url: response.url,
    fields: response.fields,
  };
}

export async function downloadFile(filePath: string) {
  try {
    const bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET!);
    const file = bucket.file(filePath);

    // Get the file contents
    const [fileContents] = await file.download();

    // Get the content type
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType;

    return {
      buffer: fileContents,
      contentType: contentType
    };
  } catch (error) {
    console.error('Error in downloadFile:', error);
    throw error;
  }
}

export async function generateDownloadUrl(filePath: string): Promise<string> {
  try {
    const file = bucket.file(filePath);
    
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
}

export async function getUploadPresignedUrl(fileName: string, folderName: string, contentType: string) {
  const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });

  const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME!);
  const file = bucket.file(`${folderName}/${fileName}`);

  // Generate signed URL with correct content type
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: contentType,
  });

  return url;
} 