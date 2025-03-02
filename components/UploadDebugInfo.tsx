import { useState } from 'react';

export default function UploadDebugInfo() {
  const [showDebug, setShowDebug] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  
  const checkStorageConfig = async () => {
    try {
      const response = await fetch('/api/debug/storage-config');
      const data = await response.json();
      setStorageInfo(data);
    } catch (error) {
      setStorageInfo({ error: String(error) });
    }
  };
  
  if (!showDebug) {
    return (
      <button 
        onClick={() => setShowDebug(true)} 
        className="text-xs text-gray-400 underline mt-2"
      >
        Show Debug Info
      </button>
    );
  }
  
  return (
    <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono">
      <div className="flex justify-between mb-2">
        <h4 className="font-bold">Upload Debug Info</h4>
        <button 
          onClick={() => setShowDebug(false)}
          className="text-gray-500"
        >
          Hide
        </button>
      </div>
      
      <div>
        <button 
          onClick={checkStorageConfig}
          className="bg-gray-200 px-2 py-1 rounded text-xs"
        >
          Check Storage Config
        </button>
        
        {storageInfo && (
          <pre className="mt-2 p-2 bg-gray-200 overflow-auto max-h-40">
            {JSON.stringify(storageInfo, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
} 