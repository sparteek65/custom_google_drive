import { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface BulkUploadProgressProps {
  files: UploadFile[];
  onCancel?: (fileId: string) => void;
  onComplete?: () => void;
}

export default function BulkUploadProgress({ files, onCancel, onComplete }: BulkUploadProgressProps) {
  const [overallProgress, setOverallProgress] = useState(0);

  // Calculate overall progress whenever files change
  useEffect(() => {
    if (files.length === 0) return;
    
    const totalProgress = files.reduce((acc, file) => acc + file.progress, 0);
    const calculatedProgress = Math.round(totalProgress / files.length);
    setOverallProgress(calculatedProgress);
    
    // Check if all files are completed
    const allCompleted = files.every(file => 
      file.status === 'success' || file.status === 'error'
    );
    
    if (allCompleted) {
      // Add a small delay to ensure server has processed all files
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [files, onComplete]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
      case 'uploading':
        return (
          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Format file size function
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <div className="divide-y divide-gray-200 w-full">
      {/* Overall progress */}
      <div className="p-3">
        <div className="flex justify-between mb-1 items-center">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-medium text-gray-700">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Individual file progress */}
      <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
        {files.map((file) => (
          <div key={file.id} className="p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center mb-1">
              <div className="mr-2">
                {getStatusIcon(file.status)}
              </div>
              <div className="flex-1 truncate pr-2 text-sm">{file.file.name}</div>
              <div className="text-xs text-gray-500 mr-2">
                {formatFileSize(file.file.size)}
              </div>
              {file.status !== 'success' && onCancel && (
                <button 
                  onClick={() => onCancel(file.id)}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                  title="Cancel upload"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  file.status === 'error' 
                    ? 'bg-red-500' 
                    : file.status === 'success' 
                      ? 'bg-green-500' 
                      : 'bg-blue-500'
                }`}
                style={{ width: `${file.progress}%` }}
              ></div>
            </div>
            
            {file.error && (
              <div className="text-xs text-red-500 mt-1">
                Error: {file.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 