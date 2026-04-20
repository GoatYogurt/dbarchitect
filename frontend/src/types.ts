
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

export type ClarificationQuestionType = 'multi_choice' | 'single_choice' | 'text';

export interface ClarificationQuestion {
  question_text: string;
  type: ClarificationQuestionType;
  options: string[] | null;
}

export interface ClarificationAnswer {
  question_text: string;
  answer: string | string[];
}

export interface GenerateDbmlResponse {
  isClear: boolean;
  questions: ClarificationQuestion[];
  cleanDbmlCode: string;
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

export interface CodeChange {
  element: string;  // Name of the element (field, method, etc.)
  type: string;     // Type (FIELD, METHOD, ANNOTATION)
  action: string;   // ADDED, REMOVED, MODIFIED
  detail: string;   // Description of the change
  filePath?: string;
  lineNumber?: number;
}
