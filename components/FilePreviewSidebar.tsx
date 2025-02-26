interface FileMetadata {
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

interface FilePreviewSidebarProps {
  file: FileMetadata | null;
  onClose: () => void;
}

export default function FilePreviewSidebar({ file, onClose }: FilePreviewSidebarProps) {
  if (!file) return null;

  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format size function
  const formatSize = (bytes: string) => {
    const size = parseInt(bytes);
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let formattedSize = size;
    while (formattedSize >= 1024 && i < units.length - 1) {
      formattedSize /= 1024;
      i++;
    }
    return `${formattedSize.toFixed(2)} ${units[i]}`;
  };

  // Metadata fields to display
  const metadataFields = [
    { key: 'name', label: 'Name', format: (value: string) => value.split('/').pop() },
    { key: 'contentType', label: 'Type' },
    { key: 'size', label: 'Size', format: formatSize },
    { key: 'bucket', label: 'Bucket' },
    { key: 'storageClass', label: 'Storage Class' },
    { key: 'timeCreated', label: 'Created', format: formatDate },
    { key: 'updated', label: 'Last Modified', format: formatDate },
    { key: 'generation', label: 'Generation' },
    { key: 'metageneration', label: 'Meta Generation' },
    { key: 'md5Hash', label: 'MD5 Hash' },
    { key: 'crc32c', label: 'CRC32C' },
    { key: 'etag', label: 'ETag' },
    { key: 'timeStorageClassUpdated', label: 'Storage Class Updated', format: formatDate },
    { key: 'timeFinalized', label: 'Finalized', format: formatDate },
  ];

  return (
    <div id="file-preview-sidebar" className="w-96 bg-base-200 p-4 border-l border-base-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">File Details</h2>
        <button onClick={onClose} className="btn btn-sm btn-ghost">×</button>
      </div>

      {/* File Preview Section */}
      <div className="mb-6">
        {/* Add preview content here if needed */}
      </div>

      {/* Metadata Table */}
      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        <table className="table table-zebra w-full">
          <tbody>
            {metadataFields.map(({ key, label, format }) => (
              <tr key={key}>
                <td className="font-semibold whitespace-nowrap">{label}</td>
                <td className="break-all">
                  {format 
                    ? format(file[key as keyof FileMetadata])
                    : file[key as keyof FileMetadata]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-2">
        <button className="btn btn-primary btn-sm flex-1">Download</button>
        <button className="btn btn-outline btn-sm flex-1">Share</button>
      </div>
    </div>
  );
}