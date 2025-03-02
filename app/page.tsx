"use client";
import { useState, useEffect } from 'react';
import { 
  FaFolder, 
  FaFileImage, 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFilePowerpoint, 
  FaFileAudio, 
  FaFileVideo, 
  FaFileArchive, 
  FaFile,
  FaDownload,
  FaCopy,
  FaTrash,
  FaUpload,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPlay
} from 'react-icons/fa';
import Link from 'next/link';
import FilePreviewSidebar from '../components/FilePreviewSidebar';
import { getFileType } from '../app/utils/fileHandler';
import FolderSelector from '@/components/FolderSelector';
import BulkUploader from '@/components/BulkUploader';
import FloatingUploadPanel from '@/components/FloatingUploadPanel';

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

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: '', direction: null });
  const [currentPath, setCurrentPath] = useState<string>('');
  const [folders, setFolders] = useState<Array<{
    name: string;
    size: string;
    updated: string;
  }>>([]);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [fileContent, setFileContent] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileStructure, setFileStructure] = useState<{ [key: string]: FileSystemItem }>({});
  const [currentItems, setCurrentItems] = useState<FileSystemItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    url: string;
    type: string;
    fileName: string;
  }>({
    isOpen: false,
    url: '',
    type: '',
    fileName: ''
  });
  const [selectedUploadFolder, setSelectedUploadFolder] = useState('');
  const [isBulkUploadVisible, setIsBulkUploadVisible] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(false);

  // Update useEffect to fetch data when path changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathFromUrl = params.get('path') || '';
    setCurrentPath(pathFromUrl);

    const fetchData = async () => {
      try {
        // Determine if the path points to a file
        const isFile = pathFromUrl.includes('.');
        const endpoint = '/api/folders';
        
        const response = await fetch(`${endpoint}?prefix=${encodeURIComponent(pathFromUrl)}`);
        const data = await response.json();

        if (isFile) {
          setFileContent(data);
          setIsFileModalOpen(true);
        } else {
          setFolders(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // You might want to add error state handling here
      }
    };

    fetchData();
  }, [currentPath]);

  // Close preview when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById('file-preview-sidebar');
      if (sidebar && !sidebar.contains(e.target as Node)) {
        setSelectedFile(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sorting function
  const sortItems = (items: typeof folders) => {
    if (!sortConfig.key || !sortConfig.direction) return items;

    return [...items].sort((a, b) => {
      if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
        
      }
      if (a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Request sort function
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <FaSort className="ml-2 inline-block opacity-30" />;
    }
    if (sortConfig.direction === 'asc') {
      return <FaSortUp className="ml-2 inline-block" />;
    }
    if (sortConfig.direction === 'desc') {
      return <FaSortDown className="ml-2 inline-block" />;
    }
    return <FaSort className="ml-2 inline-block opacity-30" />;
  };

  // Filter and sort folders
  const filteredAndSortedFolders = sortItems(
    folders.filter(folder =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Update pagination to use sorted items
  const totalPages = Math.ceil(filteredAndSortedFolders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFolders = filteredAndSortedFolders.slice(startIndex, startIndex + itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Update URL with page number
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    window.history.pushState({}, '', url);
  };

  const getFileIcon = (fileName: string, isFolder: boolean) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // If no extension, assume it's a folder
    if (!extension || fileName.indexOf('.') === -1) {
      return <FaFolder className="text-yellow-500 text-xl" />;
    }

    // Map extensions to icons
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <FaFileImage className="text-blue-500 text-xl" />;
      case 'pdf':
        return <FaFilePdf className="text-red-500 text-xl" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-600 text-xl" />;
      case 'xls':
      case 'xlsx':
        return <FaFileExcel className="text-green-600 text-xl" />;
      case 'ppt':
      case 'pptx':
        return <FaFilePowerpoint className="text-orange-600 text-xl" />;
      case 'mp3':
      case 'wav':
        return <FaFileAudio className="text-purple-500 text-xl" />;
      case 'mp4':
      case 'mov':
      case 'avi':
        return <FaFileVideo className="text-indigo-500 text-xl" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <FaFileArchive className="text-gray-500 text-xl" />;
      default:
        return <FaFile className="text-gray-400 text-xl" />;
    }
  };

  // Generate breadcrumbs from currentPath
  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    return [
      { name: 'Home', path: '' },
      ...parts.map((part, index) => ({
        name: part,
        path: parts.slice(0, index + 1).join('/')
      }))
    ];
  };

  // Add File Modal component
  const FileModal = () => (
    <dialog id="file_modal" className={`modal ${isFileModalOpen ? 'modal-open' : ''}`}>
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">File Preview</h3>
        <div className="max-h-96 overflow-auto">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(fileContent, null, 2)}
          </pre>
        </div>
        <div className="modal-action">
          <button 
            className="btn"
            onClick={() => setIsFileModalOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => setIsFileModalOpen(false)}>close</button>
      </form>
    </dialog>
  );

  // Fetch file structure data
  useEffect(() => {
    const fetchFileStructure = async () => {
      try {
        const response = await fetch('/api/file-structure');
        const data = await response.json();
        setFileStructure(data);
        
        // Set initial items based on current path
        updateCurrentItems(data, currentPath);
      } catch (error) {
        console.error('Error fetching file structure:', error);
      }
    };

    fetchFileStructure();
  }, []);

  // Update displayed items when path changes
  useEffect(() => {
    updateCurrentItems(fileStructure, currentPath);
  }, [currentPath, fileStructure]);

  const updateCurrentItems = (structure: typeof fileStructure, path: string) => {
    let current = structure;
    const pathParts = path.split('/').filter(Boolean);
    
    // Navigate to current folder
    for (const part of pathParts) {
      if (current[part]?.children) {
        current = current[part].children!;
      } else {
        break;
      }
    }

    // Convert current level object to array
    const items = Object.entries(current).map(([key, value]) => ({
      ...value,
      name: key
    }));

    setCurrentItems(items);
  };

  const handleItemClick = (item: FileSystemItem) => {
    if (item.type === 'folder') {
      const newPath = currentPath 
        ? `${currentPath}/${item.name}`
        : item.name;
      
      setCurrentPath(newPath);
      const url = new URL(window.location.href);
      url.searchParams.set('path', newPath);
      window.history.pushState({}, '', url);
    } else {
      setSelectedFile(item as FileSystemItem);
    }
  };

  const handleDownload = async (folder: typeof folders[0]) => {
    try {
      const filePath = currentPath 
        ? `${currentPath}/${folder.name}`
        : folder.name;
        
      const response = await fetch(`/api/download?path=${encodeURIComponent(filePath)}`);
      const data = await response.json();
      
      if (data.url) {
        // Open the signed URL in a new tab or trigger download
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const urlInput = form.querySelector('input[name="httpUrl"]') as HTMLInputElement;
    
    let targetFolder = selectedUploadFolder || '';
    
    // Check if we're uploading via URL or file
    if (urlInput.value) {
      try {
        setIsUploading(true);
        const response = await fetch('/api/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceUrl: urlInput.value,
            folderName: targetFolder,
          }),
        });

        if (!response.ok) {
          throw new Error('Transfer request failed');
        }

        const data = await response.json();
        console.log('Transfer initiated:', data);
        setIsUploadModalOpen(false);
      } catch (error) {
        console.error('Transfer failed:', error);
        alert(`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // File upload logic
    if (!fileInput.files?.length) {
      alert('Please select a file or provide an HTTP URL');
      return;
    }

    const file = fileInput.files[0];
    
    try {
      setIsUploading(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderName', targetFolder);
      
      // Track upload progress with XHR
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload-proxy');
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(progress));
        }
      };
      
      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('Upload completed successfully');
          // Refresh file structure
          const response = await fetch('/api/file-structure');
          const data = await response.json();
          setFileStructure(data);
          updateCurrentItems(data, currentPath);
          setIsUploadModalOpen(false);
        } else {
          console.error('Upload failed:', xhr.responseText);
          alert(`Upload failed: ${xhr.statusText}`);
        }
        setIsUploading(false);
      };
      
      xhr.onerror = () => {
        console.error('Upload request failed');
        alert('Upload failed due to a network error');
        setIsUploading(false);
      };
      
      xhr.send(formData);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsUploading(false);
    }
  };

  const handleFilePreview = async (
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

  const handleDelete = async (item: FileSystemItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const filePath = currentPath 
        ? `${currentPath}/${item.name}`
        : item.name;
      console.log('Deleting file:', filePath);
      const response = await fetch(`/api/${filePath}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Refresh the current items list
      const fetchFileStructure = async () => {
        const response = await fetch('/api/file-structure');
        const data = await response.json();
        setFileStructure(data);
        updateCurrentItems(data, currentPath);
      };

      await fetchFileStructure();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  // Inside your component, add this log
  useEffect(() => {
    console.log('Selected upload folder:', selectedUploadFolder);
  }, [selectedUploadFolder]);

  const refreshFileStructure = async () => {
    try {
      console.log('Refreshing file structure...');
      const response = await fetch('/api/file-structure');
      const data = await response.json();
      setFileStructure(data);
      updateCurrentItems(data, currentPath);
      console.log('File structure refreshed successfully');
    } catch (error) {
      console.error('Error refreshing file structure:', error);
    }
  };

  // Set up polling when uploads are in progress
  useEffect(() => {
    if (!isPollingActive) return;
    
    const pollInterval = setInterval(() => {
      refreshFileStructure();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(pollInterval);
  }, [isPollingActive]);

  return (
    <div className="flex h-screen bg-base-100">
      <div className="flex-1 p-2 sm:p-6 flex flex-col">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="breadcrumbs text-base-content text-sm sm:text-base">
              <ul>
                {getBreadcrumbs().map((crumb, index) => (
                  <li key={index}>
                    <Link 
                      href={`/?path=${crumb.path}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPath(crumb.path);
                        const url = new URL(window.location.href);
                        url.searchParams.set('path', crumb.path);
                        window.history.pushState({}, '', url);
                      }}
                    >
                      {crumb.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="search"
                placeholder="Search Your Files"
                className="input input-bordered w-full sm:w-64 bg-base-200 text-base-content"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <button 
                className="btn btn-primary btn-outline"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <FaUpload className="mr-2" /> Upload
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setIsBulkUploadVisible(true)}
              >
                <FaUpload className="mr-2" /> Bulk Upload
              </button>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        <dialog id="upload_modal" className={`modal ${isUploadModalOpen ? 'modal-open' : ''}`}>
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Upload File</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Destination Folder</span>
                </label>
                <FolderSelector 
                  selectedFolder={selectedUploadFolder} 
                  onFolderSelect={setSelectedUploadFolder} 
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">HTTP URL</span>
                </label>
                <input 
                  type="url"
                  name="httpUrl"
                  placeholder="Enter HTTP URL to transfer" 
                  className="input input-bordered w-full" 
                />
                <label className="label">
                  <span className="label-text-alt">OR</span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Upload File</span>
                </label>
                <input 
                  type="file" 
                  className="file-input file-input-bordered w-full" 
                />
              </div>

              <div className="modal-action">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isUploading}
                >
                  {isUploading ? 'Processing...' : 'Upload'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setIsUploadModalOpen(false)}>close</button>
          </form>
        </dialog>

        {/* Floating Upload Panel */}
        <FloatingUploadPanel
          isOpen={isBulkUploadVisible}
          onClose={() => {
            setIsBulkUploadVisible(false);
            setIsPollingActive(false);
          }}
          onComplete={() => {
            refreshFileStructure();
            setIsBulkUploadVisible(false);
            setIsPollingActive(false);
          }}
          onUploadStart={() => {
            setIsPollingActive(true);
          }}
        />

        {/* Table with vertical scroll */}
        <div className="flex-1 overflow-hidden flex flex-col bg-base-200 rounded-lg">
          <div className="overflow-y-auto flex-1">
            <table className="table w-full">
              {/* Sticky Header */}
              <thead className="sticky top-0 z-10">
                <tr className="text-base-content">
                  <th 
                    className="bg-base-300 cursor-pointer hover:bg-base-200"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center">
                      NAME
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="bg-base-300 hidden sm:table-cell cursor-pointer hover:bg-base-200"
                    onClick={() => requestSort('size')}
                  >
                    <div className="flex items-center">
                      SIZE
                      {getSortIcon('size')}
                    </div>
                  </th>
                  <th 
                    className="bg-base-300 hidden md:table-cell cursor-pointer hover:bg-base-200"
                    onClick={() => requestSort('updated')}
                  >
                    <div className="flex items-center">
                      LAST CHANGED
                      {getSortIcon('updated')}
                    </div>
                  </th>
                  <th className="bg-base-300">ACTIONS</th>
                </tr>
              </thead>
              {/* Table body */}
              <tbody>
                {currentItems.map((item, index) => (
                  <tr key={index} className="hover:bg-base-300">
                    <td className="flex items-center">
                      <div 
                        onClick={() => handleItemClick(item)}
                        className="flex items-center hover:cursor-pointer"
                      >
                        {getFileIcon(item.name, item.type === 'folder')}
                        <span className="ml-2 text-base-content truncate max-w-[150px] sm:max-w-[300px]">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-base-content hidden sm:table-cell">
                      {item.size || '-'}
                    </td>
                    <td className="text-base-content hidden md:table-cell">
                      {item.updated || '-'}
                    </td>
                    <td className="w-[120px] sm:w-[200px]">
                      <div className="flex gap-1 sm:gap-2">
                        {['video', 'image', 'pdf', 'audio'].includes(getFileType(item.name)) && (
                          <button 
                            className="btn btn-ghost btn-sm text-base-content"
                            onClick={() => handleFilePreview(
                              item,
                              currentPath,
                              (url, type) => setPreviewModal({
                                isOpen: true,
                                url,
                                type,
                                fileName: item.name
                              })
                            )}
                          >
                            <FaPlay className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        )}
                        <button 
                          className="btn btn-ghost btn-sm text-base-content"
                          onClick={() => handleDownload(item as typeof folders[0])}
                        >
                          <FaDownload className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button className="btn btn-ghost btn-sm text-base-content">
                          <FaCopy className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => handleDelete(item)}
                        >
                          <FaTrash className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sticky Pagination */}
          <div className="sticky bottom-0 bg-base-200 p-4 border-t border-base-300">
            <div className="flex justify-center flex-wrap gap-2">
              <button
                className="btn btn-sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`btn btn-sm ${currentPage === page ? 'btn-primary' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="btn btn-sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <FilePreviewSidebar
        file={selectedFile?.metadata || null}
        onClose={() => setSelectedFile(null)}
      />
      
      <FileModal />

      {/* Upload Progress Toast */}
      {isUploading && (
        <div className="toast toast-end">
          <div className="alert alert-info">
            <div>
              <span>Uploading...</span>
              <progress 
                className="progress progress-info w-56" 
                value={uploadProgress} 
                max="100"
              ></progress>
              <span>{uploadProgress}%</span>
            </div>
          </div>
        </div>
      )}

      <PreviewModal 
        previewModal={previewModal} 
        setPreviewModal={setPreviewModal} 
      />

      {/* Debug output */}
      <div className="text-xs text-gray-500 mt-2">
        Selected folder: {selectedUploadFolder || '(root)'}
      </div>
    </div>
  );
}

// Update the PreviewModal component definition
const PreviewModal = ({ 
  previewModal, 
  setPreviewModal 
}: { 
  previewModal: { isOpen: boolean; url: string; type: string; fileName: string; }; 
  setPreviewModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; url: string; type: string; fileName: string; }>>;
}) => (
  <dialog id="preview_modal" className={`modal ${previewModal.isOpen ? 'modal-open' : ''}`}>
    <div className="modal-box max-w-4xl h-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg truncate">{previewModal.fileName}</h3>
        <button 
          className="btn btn-sm btn-circle btn-ghost"
          onClick={() => setPreviewModal({
            isOpen: false,
            url: '',
            type: '',
            fileName: ''
          })}
        >✕</button>
      </div>
      <div className="mt-4">
        {previewModal.type === 'video' && (
          <video controls className="w-full">
            <source src={previewModal.url} />
            Your browser does not support the video tag.
          </video>
        )}
        {previewModal.type === 'image' && (
          <img src={previewModal.url} alt={previewModal.fileName} className="w-full" />
        )}
        {previewModal.type === 'pdf' && (
          <iframe
            src={previewModal.url}
            className="w-full h-[70vh]"
            title={previewModal.fileName}
          />
        )}
        {previewModal.type === 'audio' && (
          <audio controls className="w-full">
            <source src={previewModal.url} />
            Your browser does not support the audio tag.
          </audio>
        )}
      </div>
    </div>
    <form method="dialog" className="modal-backdrop">
      <button onClick={() => setPreviewModal({
        isOpen: false,
        url: '',
        type: '',
        fileName: ''
      })}>close</button>
    </form>
  </dialog>
);