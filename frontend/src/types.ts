
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
