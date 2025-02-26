import { Storage } from '@google-cloud/storage';
import ClientSidebar from './Sidebar';

async function listFiles(bucketName: string) {
  const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });

  const [files] = await storage.bucket(bucketName).getFiles();
  
  // Convert the flat file list to a nested structure
  const fileStructure: any = {};
  
  files.forEach((file) => {
    const path = file.name.split('/');
    let current = fileStructure;
    
    path.forEach((part, index) => {
      if (index === path.length - 1) {
        // It's a file
        current[part] = {
          name: part,
          type: 'file',
          fullPath: file.name,
          metadata: file.metadata,
        };
      } else {
        // It's a folder
        if (!current[part]) {
          current[part] = {
            name: part,
            type: 'folder',
            children: {},
          };
        }
        current = current[part].children;
      }
    });
  });

  return fileStructure;
}

export async function FileStructureLoader() {
  const fileStructure = await listFiles(process.env.GOOGLE_CLOUD_BUCKET_NAME || '');
  
  // Pass the file structure as a stringified prop
  return (
    <ClientSidebar initialFileStructure={JSON.stringify(fileStructure)} />
  );
} 