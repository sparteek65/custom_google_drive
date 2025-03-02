import { Storage, File } from '@google-cloud/storage';

export interface FileMetadata {
  name: string;
  path: string;
  size: number;
  contentType: string;
  createdAt: Date;
  updatedAt: Date;
  bucket: string;
  generation?: string;
  metageneration?: string;
  md5Hash?: string;
  crc32c?: string;
  etag?: string;
}

export class StorageService {
  private storage: Storage;
  private bucketName: string;
  private defaultBucket: string;

  constructor() {
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });
    this.bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME!;
    this.defaultBucket = process.env.GOOGLE_CLOUD_BUCKET_NAME!;
  }

  async uploadFile(buffer: Buffer, filePath: string, contentType: string): Promise<FileMetadata> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);
    
    // Upload with content type
    await file.save(buffer, {
      metadata: { 
        contentType,
        // Add custom metadata as needed
        customTime: new Date().toISOString(),
      },
    });
    
    // Get the file metadata after upload
    const [metadata] = await file.getMetadata();
    
    return {
      name: file.name.split('/').pop() || file.name,
      path: file.name,
      size: parseInt(metadata.size),
      contentType: metadata.contentType,
      createdAt: new Date(metadata.timeCreated),
      updatedAt: new Date(metadata.updated),
      bucket: this.bucketName,
      generation: metadata.generation,
      metageneration: metadata.metageneration,
      md5Hash: metadata.md5Hash,
      crc32c: metadata.crc32c,
      etag: metadata.etag,
    };
  }

  async getFile(filePath: string): Promise<File> {
    const bucket = this.storage.bucket(this.bucketName);
    return bucket.file(filePath);
  }

  async deleteFile(filePath: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    await bucket.file(filePath).delete();
  }

  async generateDownloadUrl(filePath: string, expirationMinutes = 15): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);
    
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + (expirationMinutes * 60 * 1000),
    });
    
    return url;
  }

  async generateUploadUrl(filePath: string, contentType: string, expirationMinutes = 15): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);
    
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + (expirationMinutes * 60 * 1000),
      contentType,
    });
    
    return url;
  }

  async listFiles(prefix = ''): Promise<FileMetadata[]> {
    const bucket = this.storage.bucket(this.bucketName);
    const [files] = await bucket.getFiles({ prefix });
    
    const fileMetadata: FileMetadata[] = await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata();
        return {
          name: file.name.split('/').pop() || file.name,
          path: file.name,
          size: parseInt(metadata.size || '0'),
          contentType: metadata.contentType || 'application/octet-stream',
          createdAt: new Date(metadata.timeCreated),
          updatedAt: new Date(metadata.updated),
          bucket: this.bucketName,
          generation: metadata.generation,
          metageneration: metadata.metageneration,
          md5Hash: metadata.md5Hash,
          crc32c: metadata.crc32c,
          etag: metadata.etag,
        };
      })
    );
    
    return fileMetadata;
  }

  async createResumableUploadSession(bucketName: string, filename: string, contentType: string): Promise<string> {
    try {
      // Use default bucket if not specified
      const actualBucketName = bucketName || this.defaultBucket;
      if (!actualBucketName) {
        throw new Error('No bucket specified and no default bucket configured');
      }

      // Log for debugging
      console.log(`Creating resumable upload session for ${filename} in bucket ${actualBucketName}`);
      
      // Get the bucket
      const bucket = this.storage.bucket(actualBucketName);
      const file = bucket.file(filename);
      
      // Create a resumable upload session
      const [sessionUrl] = await file.createResumableUpload({
        metadata: {
          contentType: contentType || 'application/octet-stream',
        },
      });
      
      console.log('Created session URL:', sessionUrl ? 'Success' : 'Failed');
      
      return sessionUrl;
    } catch (error) {
      console.error('Error creating resumable upload session:', error);
      throw error;
    }
  }

  async uploadChunk(
    sessionUrl: string, 
    chunk: Buffer, 
    start: number, 
    end: number, 
    totalSize: number
  ): Promise<{ done: boolean; progress: number }> {
    try {
      // Use fetch directly for lower-level control
      const response = await fetch(sessionUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': String(chunk.length),
          'Content-Range': `bytes ${start}-${end-1}/${totalSize}`
        },
        body: chunk
      });
      
      const progress = Math.min(100, Math.round((end / totalSize) * 100));
      
      // If we get a 200 or 201, the upload is complete
      if (response.status === 200 || response.status === 201) {
        return { done: true, progress: 100 };
      }
      
      // If we get a 308, the chunk was accepted and we should continue
      if (response.status === 308) {
        return { done: false, progress };
      }
      
      // Otherwise, there was an error
      throw new Error(`Unexpected response status: ${response.status}`);
    } catch (error) {
      console.error('Error uploading chunk:', error);
      throw error;
    }
  }
}

// Create singleton instance for use across the application
export const storageService = new StorageService(); 