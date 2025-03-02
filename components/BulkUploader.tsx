import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast, Toaster } from 'react-hot-toast';
import { 
  XMarkIcon, 
  ArrowPathIcon, 
  DocumentIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import BulkUploadProgress, { UploadFile } from './BulkUploadProgress';
import FolderSelector from './FolderSelector';
import UploadDebugInfo from './UploadDebugInfo';

// Types for local storage
interface StoredUpload {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  timestamp: number;
  folder: string;
}

interface BulkUploaderProps {
  onComplete: () => void;
  onCancel: () => void;
  onProgressUpdate?: (totalFiles: number, overallProgress: number) => void;
}

export default function BulkUploader({ onComplete, onCancel, onProgressUpdate }: BulkUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadsRef = useRef<{ 
    [key: string]: XMLHttpRequest | { 
      sessionUrl: string, 
      aborted: boolean,
      xhr: XMLHttpRequest | null
    } 
  }>({});
  const [useChunkedUploads, setUseChunkedUploads] = useState(true);
  const [uploadHistory, setUploadHistory] = useState<StoredUpload[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB in bytes
  const STORAGE_KEY = 'upload_history';
  const MAX_HISTORY_ITEMS = 20;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Load upload history from localStorage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(STORAGE_KEY);
      if (storedHistory) {
        const history = JSON.parse(storedHistory) as StoredUpload[];
        setUploadHistory(history);
        
        // Check for pending uploads to show notification
        const pendingUploads = history.filter(
          item => item.status === 'pending' || item.status === 'uploading'
        );
        
        if (pendingUploads.length > 0) {
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white shadow-lg rounded-lg p-4 max-w-md`}>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                  <ArrowPathIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Resume unfinished uploads?
                  </p>
                  <p className="text-xs text-gray-500">
                    {pendingUploads.length} uploads from your previous session
                  </p>
                </div>
                <div className="ml-auto flex-shrink-0 flex">
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      // We would implement resume functionality here
                    }}
                    className="inline-flex text-xs bg-blue-50 rounded px-2 py-1 text-blue-700 hover:bg-blue-100"
                  >
                    Resume
                  </button>
                  <button 
                    onClick={() => {
                      toast.dismiss(t.id);
                      // Clear pending uploads
                      const newHistory = history.filter(
                        item => item.status !== 'pending' && item.status !== 'uploading'
                      );
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
                      setUploadHistory(newHistory);
                    }}
                    className="ml-2 inline-flex text-xs bg-red-50 rounded px-2 py-1 text-red-700 hover:bg-red-100"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          ), { duration: 10000 });
        }
      }
    } catch (error) {
      console.error('Error loading upload history:', error);
    }
  }, []);
  
  // Update localStorage when upload history changes
  useEffect(() => {
    try {
      // Limit history size to prevent localStorage overflow
      const limitedHistory = uploadHistory.slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error saving upload history:', error);
    }
  }, [uploadHistory]);
  
  // Save file upload status to history
  const updateUploadHistory = useCallback((
    fileId: string, 
    status: 'pending' | 'uploading' | 'success' | 'error', 
    progress: number,
    error?: string
  ) => {
    const fileObj = files.find(f => f.id === fileId);
    if (!fileObj) return;
    
    setUploadHistory(prev => {
      const existingIndex = prev.findIndex(item => item.id === fileId);
      const newItem: StoredUpload = {
        id: fileId,
        fileName: fileObj.file.name,
        fileSize: fileObj.file.size,
        status,
        progress,
        error,
        timestamp: Date.now(),
        folder: selectedFolder,
      };
      
      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = newItem;
        return updated;
      } else {
        // Add new item at the beginning
        return [newItem, ...prev];
      }
    });
    
    // Show notification for completed or failed uploads
    if (status === 'success') {
      toast.success(`Uploaded: ${fileObj.file.name}`);
    } else if (status === 'error') {
      toast.error(`Failed: ${fileObj.file.name}${error ? ` - ${error}` : ''}`);
    }
  }, [files, selectedFolder]);

  const handleFileSelect = useCallback((selectedFiles: File[]) => {
    if (!selectedFiles.length) return;
    
    const validFiles: File[] = [];
    const oversizedFiles: File[] = [];
    
    // Filter out files that exceed the size limit
    Array.from(selectedFiles).forEach(file => {
      if (file.size <= MAX_FILE_SIZE) {
        validFiles.push(file);
      } else {
        oversizedFiles.push(file);
      }
    });
    
    // Show error for oversized files
    if (oversizedFiles.length > 0) {
      const fileList = oversizedFiles.map(f => `${f.name} (${formatFileSize(f.size)})`).join(', ');
      const message = oversizedFiles.length === 1 
        ? `File exceeds the 200MB limit: ${fileList}`
        : `${oversizedFiles.length} files exceed the 200MB limit: ${fileList}`;
        
      toast.error(message);
    }
    
    // Only process valid files
    if (validFiles.length === 0) return;
    
    const newFiles = validFiles.map(file => {
      const id = uuidv4();
      // Add to upload history
      const historyItem: StoredUpload = {
        id,
        fileName: file.name,
        fileSize: file.size,
        status: 'pending',
        progress: 0,
        timestamp: Date.now(),
        folder: selectedFolder,
      };
      
      return {
        id,
        file,
        progress: 0,
        status: 'pending' as const
      };
    });
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Update history with all new files
    setUploadHistory(prev => [
      ...newFiles.map(f => ({
        id: f.id,
        fileName: f.file.name,
        fileSize: f.file.size,
        status: 'pending' as const,
        progress: 0,
        timestamp: Date.now(),
        folder: selectedFolder,
      })),
      ...prev
    ].slice(0, MAX_HISTORY_ITEMS));
  }, [selectedFolder]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(Array.from(e.target.files));
      e.target.value = ''; // Reset input to allow selecting the same files again
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(Array.from(e.dataTransfer.files));
    }
  };

  const uploadFile = useCallback((fileId: string) => {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;
    
    const fileObj = files[fileIndex];
    const formData = new FormData();
    formData.append('files', fileObj.file);
    formData.append('folderName', selectedFolder);
    
    const xhr = new XMLHttpRequest();
    
    // Store as compatible type
    activeUploadsRef.current[fileId] = { 
      xhr,
      aborted: false, 
      sessionUrl: ''
    };
    
    xhr.open('POST', '/api/bulk-upload');
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress, status: 'uploading' } 
            : f
        ));
        
        // Update history
        updateUploadHistory(fileId, 'uploading', progress);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: 100, status: 'success' } 
            : f
        ));
        
        // Update history
        updateUploadHistory(fileId, 'success', 100);
      } else {
        let errorMsg = 'Upload failed';
        try {
          const response = JSON.parse(xhr.responseText);
          errorMsg = response.error || errorMsg;
        } catch (e) {
          errorMsg = `Failed with status: ${xhr.status}`;
        }
        
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                progress: 0, 
                status: 'error',
                error: errorMsg
              } 
            : f
        ));
        
        // Update history
        updateUploadHistory(fileId, 'error', 0, errorMsg);
      }
      delete activeUploadsRef.current[fileId];
    };
    
    xhr.onerror = () => {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              progress: 0, 
              status: 'error', 
              error: 'Network error occurred'
            } 
          : f
      ));
      delete activeUploadsRef.current[fileId];
    };
    
    xhr.ontimeout = () => {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              progress: 0, 
              status: 'error', 
              error: 'Request timed out'
            } 
          : f
      ));
      delete activeUploadsRef.current[fileId];
    };
    
    xhr.send(formData);
  }, [files, selectedFolder, updateUploadHistory]);

  const uploadFileChunked = useCallback(async (fileId: string) => {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;
    
    const fileObj = files[fileIndex];
    const file = fileObj.file;
    
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'uploading', progress: 0 } 
          : f
      ));
      
      // Step 1: Create upload session
      const sessionResponse = await fetch('/api/chunked-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          folderName: selectedFolder
        })
      });
      
      if (!sessionResponse.ok) {
        throw new Error(`Failed to initialize upload: ${sessionResponse.statusText}`);
      }
      
      const { sessionUrl } = await sessionResponse.json();
      if (!sessionUrl) {
        throw new Error('No session URL returned');
      }
      
      // Store session in active uploads ref
      activeUploadsRef.current[fileId] = { 
        sessionUrl, 
        aborted: false,
        xhr: null
      };
      
      // Step 2: Upload file in chunks
      let start = 0;
      let progress = 0;
      
      // Keep track if the upload was aborted
      const isAborted = () => activeUploadsRef.current[fileId]?.aborted === true;
      
      while (start < file.size) {
        if (isAborted()) {
          console.log('Upload aborted');
          break; // Break the loop if upload was aborted
        }
        
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = await file.slice(start, end).arrayBuffer();
        
        const uploadResponse = await fetch(`/api/chunked-upload?sessionUrl=${encodeURIComponent(sessionUrl)}&start=${start}&end=${end}&totalSize=${file.size}`, {
          method: 'PUT',
          body: chunk,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload chunk: ${uploadResponse.statusText}`);
        }
        
        const result = await uploadResponse.json();
        
        // Update progress
        progress = result.progress || Math.min(100, Math.round((end / file.size) * 100));
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress } 
            : f
        ));
        
        // Check if upload is complete
        if (result.done) {
          break;
        }
        
        // Move to the next chunk
        start = end;
      }
      
      // If not aborted and reached end, mark as success
      if (!isAborted()) {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'success', progress: 100 } 
            : f
        ));
      }
      
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'error', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Upload failed'
            } 
          : f
      ));
    } finally {
      // Remove from active uploads if it exists
      if (activeUploadsRef.current[fileId]) {
        delete activeUploadsRef.current[fileId];
      }
    }
  }, [files, selectedFolder]);

  const startUpload = useCallback(() => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    // Start uploading pending files
    files.forEach(file => {
      if (file.status === 'pending') {
        // Use chunked upload for files larger than 50MB if enabled
        if (file.file.size > 50 * 1024 * 1024 && useChunkedUploads) {
          console.log(`Using chunked upload for ${file.file.name} (${file.file.size} bytes)`);
          uploadFileChunked(file.id);
        } else {
          console.log(`Using regular upload for ${file.file.name} (${file.file.size} bytes)`);
          uploadFile(file.id);
        }
      }
    });
  }, [files, uploadFile, uploadFileChunked, useChunkedUploads]);

  const cancelUpload = useCallback((fileId: string) => {
    const upload = activeUploadsRef.current[fileId];
    
    if (upload) {
      if (upload.xhr) {
        // For standard XHR uploads
        upload.xhr.abort();
      } else {
        // For chunked uploads, mark as aborted
        upload.aborted = true;
      }
      delete activeUploadsRef.current[fileId];
    }
    
    // Remove the file from the list
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const cancelAllUploads = useCallback(() => {
    // Cancel all active uploads
    Object.values(activeUploadsRef.current).forEach(upload => {
      if (upload.xhr) {
        upload.xhr.abort();
      }
    });
    activeUploadsRef.current = {};
    
    // Reset state
    setFiles([]);
    setIsUploading(false);
    onCancel();
  }, [onCancel]);

  const handleComplete = useCallback(() => {
    console.log('All uploads completed');
    
    // Add a small delay to ensure server has processed all files
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 500);
    
    setIsUploading(false);
  }, [onComplete]);

  useEffect(() => {
    if (files.length === 0) return;
    
    const totalProgress = files.reduce((acc, file) => acc + file.progress, 0);
    const calculatedProgress = Math.round(totalProgress / files.length);
    
    // Check if all files are completed
    const completedFiles = files.filter(file => 
      file.status === 'success' || file.status === 'error'
    );
    
    const allCompleted = completedFiles.length === files.length;
    
    // Call progress update callback if provided
    if (onProgressUpdate) {
      onProgressUpdate(files.length, calculatedProgress);
    }
    
    // Automatically call complete when all files are done
    if (allCompleted && isUploading) {
      setIsUploading(false);
      // Small delay to ensure UI updates before calling onComplete
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  }, [files, isUploading, onComplete, onProgressUpdate]);

  useEffect(() => {
    // If we detect any error with chunked uploads, fall back to regular uploads
    const hasChunkedError = files.some(file => 
      file.error?.includes('Failed to initialize upload') || 
      file.error?.includes('No bucket specified')
    );
    
    if (hasChunkedError && useChunkedUploads) {
      console.log('Chunked upload error detected, falling back to regular uploads');
      setUseChunkedUploads(false);
      
      // Reset failed files to pending
      setFiles(prev => prev.map(f => 
        f.status === 'error' ? { ...f, status: 'pending', progress: 0, error: undefined } : f
      ));
    }
  }, [files, useChunkedUploads]);

  // Create a notification history component
  const UploadHistoryPanel = () => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 flex justify-between items-center">
        <h3 className="text-white font-medium text-sm">Upload History</h3>
        <button 
          onClick={() => setShowHistory(false)}
          className="text-white hover:bg-white/20 rounded p-1"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      
      <div className="p-2 max-h-80 overflow-y-auto">
        {uploadHistory.length === 0 ? (
          <div className="py-6 text-center text-gray-500 text-sm">
            No upload history
          </div>
        ) : (
          <div className="space-y-2">
            {uploadHistory.map(item => (
              <div 
                key={item.id} 
                className="bg-gray-50 rounded-md p-2 text-xs border-l-4 relative hover:bg-gray-100 transition-colors"
                style={{ 
                  borderLeftColor: 
                    item.status === 'success' ? '#10B981' : 
                    item.status === 'error' ? '#EF4444' : 
                    item.status === 'uploading' ? '#3B82F6' : '#9CA3AF'
                }}
              >
                <div className="flex items-center">
                  <span className="w-6">
                    {item.status === 'success' ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : item.status === 'error' ? (
                      <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
                    ) : (
                      <DocumentIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </span>
                  <div className="ml-1 flex-1 truncate pr-6">{item.fileName}</div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(item.fileSize)}
                  </div>
                </div>
                
                {item.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full" 
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                )}
                
                {item.error && (
                  <div className="text-red-500 mt-1 text-xs">{item.error}</div>
                )}
                
                <div className="text-xs text-gray-400 mt-1 flex justify-between">
                  <span>
                    {item.folder ? `to: ${item.folder}` : 'to: root'}
                  </span>
                  <span>
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="border-t px-4 py-2 bg-gray-50 text-right">
        <button 
          onClick={() => {
            setUploadHistory([]);
            localStorage.removeItem(STORAGE_KEY);
          }}
          className="text-xs text-red-600 hover:text-red-800"
        >
          Clear History
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-4 relative">
      {/* Toast container for notifications */}
      <Toaster position="top-right" />
      
      {/* Upload history toggle button */}
      <div className="absolute top-0 right-0">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
          title="Upload History"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      
      {/* Upload history panel */}
      {showHistory && (
        <div className="absolute right-0 top-10 z-10 w-80 shadow-xl">
          <UploadHistoryPanel />
        </div>
      )}
      
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-medium">Destination Folder</span>
        </label>
        <FolderSelector 
          selectedFolder={selectedFolder} 
          onFolderSelect={setSelectedFolder}
          disabled={isUploading}
        />
      </div>
      
      {!isUploading && (
        <div 
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center justify-center py-4">
            <div className="mb-3 bg-gray-100 rounded-full p-3">
              <svg 
                className="w-6 h-6 text-gray-500" 
                aria-hidden="true" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 20 16"
              >
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
            </div>
            <p className="mb-2 text-sm text-gray-700">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              Any file types (Max size: 200MB per file)
            </p>
          </div>
          
          <button 
            type="button"
            className="btn btn-sm btn-outline mt-2"
            onClick={() => fileInputRef.current?.click()}
          >
            Select Files
          </button>
        </div>
      )}
      
      {files.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          <BulkUploadProgress 
            files={files} 
            onCancel={!isUploading ? cancelUpload : undefined}
            onComplete={handleComplete}
          />
        </div>
      )}
      
      <div className="flex justify-end space-x-2 mt-4">
        {!isUploading && files.length > 0 && (
          <button 
            type="button" 
            className="btn btn-sm btn-primary"
            onClick={startUpload}
          >
            Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
          </button>
        )}
        
        <button 
          type="button" 
          className="btn btn-sm btn-ghost"
          onClick={cancelAllUploads}
        >
          {isUploading ? 'Cancel Upload' : 'Cancel'}
        </button>
      </div>
      
      <div className="mt-4 text-center">
        <UploadDebugInfo />
      </div>
    </div>
  );
} 