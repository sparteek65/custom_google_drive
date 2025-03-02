import { useEffect, useState, useRef } from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';

interface FolderSelectorProps {
  selectedFolder: string;
  onFolderSelect: (folder: string) => void;
  disabled?: boolean;
}

export default function FolderSelector({ selectedFolder, onFolderSelect, disabled }: FolderSelectorProps) {
  const [folders, setFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch available folders
  useEffect(() => {
    async function fetchFolders() {
      try {
        setIsLoading(true);
        console.log('Fetching folders...');
        const response = await fetch('/api/folders/list');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch folders: ${response.status}`);
        }
        
        const folderPaths = await response.json();
        console.log('Received folders:', folderPaths);
        
        // Make sure we have an array of paths
        const folders = Array.isArray(folderPaths) ? folderPaths : [];
        setFolders(['', ...folders]); // Add root folder as empty string
      } catch (error) {
        console.error('Error fetching folders:', error);
        setFolders(['']); // At least show root folder
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFolders();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter folders based on search term
  const filteredFolders = folders.filter(folder => 
    folder.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className={`border rounded p-2 flex items-center justify-between ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="flex items-center gap-2">
          <FolderIcon className="h-5 w-5 text-gray-500" />
          <span>
            {isLoading 
              ? 'Loading folders...' 
              : selectedFolder 
                ? selectedFolder 
                : 'Root folder'}
          </span>
        </div>
        <div className="text-gray-500">▼</div>
      </div>
      
      {isDropdownOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border overflow-hidden">
          <input
            type="text"
            className="w-full p-2 border-b"
            placeholder="Search folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="max-h-60 overflow-y-auto">
            {filteredFolders.length === 0 ? (
              <div className="p-2 text-gray-500">No folders found</div>
            ) : (
              filteredFolders.map((folder, index) => (
                <div
                  key={index}
                  className={`p-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2 ${
                    selectedFolder === folder ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    onFolderSelect(folder);
                    setIsDropdownOpen(false);
                  }}
                >
                  <FolderIcon className="h-5 w-5 text-gray-500" />
                  <span>{folder || 'Root folder'}</span>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t">
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Create new folder..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  onFolderSelect(e.currentTarget.value);
                  setIsDropdownOpen(false);
                  e.currentTarget.value = '';
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
} 