
export const getFileType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) return 'image';
  if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) return 'video';
  if (extension === 'pdf') return 'pdf';
  if (['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
  return 'other';
};

export interface FileSystemItem {
  name: string;
  type: 'folder' | 'file';
  size: string;
  updated: string;
  children?: { [key: string]: FileSystemItem };
  metadata?: FileMetadata;
}

export interface FileMetadata {
  name: string;
  bucket: string;
  generation: string;
  metageneration: string;
  contentType: string;
  storageClass: string;
  size: string;
  md5Hash: string;
  crc32c: string;
  etag: string;
  timeCreated: string;
  updated: string;
  timeStorageClassUpdated: string;
  timeFinalized: string;
}


export const handleFilePreview = async (
  item: FileSystemItem, 
  currentPath: string, 
  onPreviewOpen: (url: string, type: string) => void
) => {
  try {
    const filePath = currentPath 
      ? `${currentPath}/${item.name}`
      : item.name;
      
    const response = await fetch(`/api/download?path=${encodeURIComponent(filePath)}`);
    const data = await response.json();
    
    if (data.url) {
      const fileType = getFileType(item.name);
      onPreviewOpen(data.url, fileType);
    }
  } catch (error) {
    console.error('Error getting file preview:', error);
  }
}; 