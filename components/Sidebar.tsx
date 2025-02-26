'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  FaExpandAlt,
  FaCompressAlt
} from 'react-icons/fa';

interface ClientSidebarProps {
  initialFileStructure: string;
}

const getFileIcon = (fileName: string, isFolder: boolean) => {
  if (isFolder) {
    return <FaFolder className="text-yellow-500 text-xl" />;
  }

  const extension = fileName.split('.').pop()?.toLowerCase();

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

const ClientSidebar = ({ initialFileStructure }: ClientSidebarProps) => {
  const [fileStructure, setFileStructure] = useState<any>(JSON.parse(initialFileStructure));
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string>('');

  // Add router for navigation
  const router = useRouter();
  const searchParams = useSearchParams();

  // Helper function to check if any child matches the search query
  const hasMatchingChild = (item: any): boolean => {
    if (!item.children) return false;
    
    return Object.values(item.children).some((child: any) => {
      const nameMatches = child.name.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatches || hasMatchingChild(child);
    });
  };

  // Automatically expand parents of matching items during search
  const expandParentsOfMatches = (structure: any, path = '') => {
    Object.entries(structure).forEach(([key, item]: [string, any]) => {
      const currentPath = path ? `${path}/${key}` : key;
      
      if (item.type === 'folder') {
        const nameMatches = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const childrenMatch = hasMatchingChild(item);
        
        if ((nameMatches || childrenMatch) && searchQuery) {
          setExpandedFolders(prev => new Set([...prev, currentPath]));
        }
        
        expandParentsOfMatches(item.children || {}, currentPath);
      }
    });
  };

  // Effect to handle search and expansion
  useEffect(() => {
    if (searchQuery) {
      expandParentsOfMatches(fileStructure);
    }
  }, [searchQuery]);

  // Effect to handle query param changes
  useEffect(() => {
    const path = searchParams.get('open') || searchParams.get('path');
    if (path) {
      setSelectedPath(path);
      // Expand parent folders of selected file
      const parts = path.split('/');
      const parentPaths = parts.slice(0, -1).reduce((acc: string[], curr: string, idx: number) => {
        const parentPath = parts.slice(0, idx + 1).join('/');
        acc.push(parentPath);
        return acc;
      }, []);
      setExpandedFolders(new Set(parentPaths));
    }
  }, [searchParams]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleItemClick = (item: any, path: string) => {
    const isFolder = item.type === 'folder';
    if (isFolder) {
      toggleFolder(path);
    } else {
      // Get the directory path by removing the filename
      const directoryPath = path.split('/').slice(0, -1).join('/') ;
      router.push(`?path=${directoryPath}`);
      setSelectedPath(path);
    }
  };

  const renderFileTree = (structure: any, path = '', level = 0) => {
    return Object.entries(structure).map(([key, item]: [string, any]) => {
      const currentPath = path ? `${path}/${key}` : key;
      const isFolder = item.type === 'folder';
      const isExpanded = expandedFolders.has(currentPath);
      const isSelected = currentPath === selectedPath;
      
      // Check if current item or any of its children match the search
      const nameMatches = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const childrenMatch = isFolder ? hasMatchingChild(item) : false;
      const shouldShow = !searchQuery || nameMatches || childrenMatch;

      if (!shouldShow) return null;

      return (
        <div key={currentPath} className="ml-4">
          <div
            className={`flex items-center p-2 hover:bg-base-300 rounded cursor-pointer
              ${(searchQuery && (nameMatches || childrenMatch)) ? 'bg-primary/20' : ''}
              ${isSelected ? 'bg-primary/40' : ''}`}
            onClick={() => handleItemClick(item, currentPath)}
          >
            {isFolder && (
              <span className="mr-2 w-4 inline-block">
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            {!isFolder && <span className="mr-2 w-4"></span>}
            <span className="mr-2">
              {getFileIcon(item.name, isFolder)}
            </span>
            <span>{item.name}</span>
          </div>
          {isFolder && isExpanded && (
            <div className="ml-4">
              {renderFileTree(item.children, currentPath, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Add these new functions
  const expandAll = () => {
    const allPaths = new Set<string>();
    const collectPaths = (structure: any, path = '') => {
      Object.entries(structure).forEach(([key, item]: [string, any]) => {
        const currentPath = path ? `${path}/${key}` : key;
        if (item.type === 'folder') {
          allPaths.add(currentPath);
          collectPaths(item.children || {}, currentPath);
        }
      });
    };
    collectPaths(fileStructure);
    setExpandedFolders(allPaths);
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  return (
    <div className="w-64 bg-base-200 h-screen flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Dustabej</h1>
        <div className="form-control mb-2">
          <input
            type="text"
            placeholder="Search files..."
            className="input input-bordered w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 justify-start p-1">
          <div className="tooltip" data-tip="Expand All">
            <button 
              onClick={expandAll}
              className="btn btn-sm btn-outline rounded-full flex-1"
            >
              <FaExpandAlt />
            </button>
          </div>
          <div className="tooltip" data-tip="Collapse All">
            <button 
              onClick={collapseAll}
              className="btn btn-sm btn-outline rounded-full flex-1"
            >
              <FaCompressAlt />
            </button>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {renderFileTree(fileStructure)}
      </nav>

      <div className="bg-base-300 p-4">
        <div className="flex items-center gap-3">
          <div className="avatar placeholder">
            <div className="w-10 rounded-full bg-neutral-focus text-neutral-content">
              <span className="text-xl">PS</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Parteek Sharma</span>
            <span className="text-xs opacity-70">parteek@dustabej.com</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSidebar;