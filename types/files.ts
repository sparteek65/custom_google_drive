export interface FileItem {
  name: string;
  size: number;
  type: string;
  updated: string;
  id: string;
  isFolder: boolean;
  path: string;
}

export interface FolderStructure {
  name: string;
  path: string;
  children: FolderStructure[];
  isFolder: boolean;
} 