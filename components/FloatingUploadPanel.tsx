import { useState, useEffect } from 'react';
import BulkUploader from './BulkUploader';
import { ArrowsPointingInIcon, ArrowsPointingOutIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface FloatingUploadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function FloatingUploadPanel({ isOpen, onClose, onComplete }: FloatingUploadPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Reset minimized state when panel is opened
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);
  
  // Handle upload progress updates from BulkUploader
  const handleProgressUpdate = (count: number, progress: number) => {
    setUploadCount(count);
    setUploadProgress(progress);
  };
  
  if (!isOpen) return null;
  
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
        <div className="p-3 flex items-center justify-between bg-primary text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Uploading Files</span>
            <div className="badge badge-white">{uploadCount}</div>
          </div>
          <div className="flex items-center space-x-1">
            {uploadProgress === 100 && (
              <button 
                onClick={() => {
                  onComplete();
                  toast.success('Files refreshed!');
                }}
                className="p-1 hover:bg-primary-focus rounded"
                title="Refresh folder view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button 
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-primary-focus rounded"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-right mt-1 text-gray-500">
            {uploadProgress}% Complete
          </div>
          <div className="text-xs text-center mt-2">
            {uploadProgress === 100 ? (
              <span className="text-green-500">Upload complete!</span>
            ) : (
              <span>Uploading large files may take time...</span>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between bg-primary text-white rounded-t-lg">
          <h3 className="font-bold text-lg">Bulk Upload Files</h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-primary-focus rounded"
            >
              <ArrowsPointingInIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-primary-focus rounded"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto flex-grow">
          <BulkUploader 
            onComplete={onComplete}
            onCancel={onClose}
            onProgressUpdate={handleProgressUpdate}
          />
        </div>
      </div>
    </div>
  );
} 