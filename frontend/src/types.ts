
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

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
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

// response from backend after generating DBML code, including any clarification questions and the cleaned DBML code
export interface GenerateDbmlResponse {
  projectId?: number; // optional project ID if the backend creates a new project
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
