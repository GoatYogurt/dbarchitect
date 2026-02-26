
export interface Column {
  name: string;
  type: string;
  attributes: string[];
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface Ref {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  relation: string; // '-', '>', '<', '<>'
}

export interface ParsedSchema {
  tables: Table[];
  refs: Ref[];
}

export interface GeneratedFile {
  fileName: string;
  content: string;
}

export interface GenerateDbmlResponse {
  cleanDbmlCode: string;
  projectId: number;
}

export interface Project {
  projectId: number;
  projectName: string;
  cleanDbmlCode: string;
}

export interface FileNode {
  name: string;
  type: 'folder' | 'file';
  path: string;
  children: FileNode[];
  content?: string | null;
  language?: string | null;
}

export interface PreviewResponse {
  name: string;
  type: 'folder' | 'file';
  path: string;
  children: FileNode[];
  content?: string | null;
  language?: string | null;
}
