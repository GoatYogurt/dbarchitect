
import React, { useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { CopyIcon } from './icons';

interface CodeViewerProps {
  fileName: string;
  code: string;
}

export function CodeViewer({ fileName, code }: CodeViewerProps) {
  const [copyText, setCopyText] = useState('Copy');
  const language = useMemo(() => getMonacoLanguage(fileName), [fileName]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy'), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-800">
      <div className="flex justify-between items-center p-3 bg-slate-900/30 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-mono text-slate-400 truncate">{fileName}</p>
          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wide rounded bg-slate-700 text-slate-300 border border-slate-600">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
        >
          <CopyIcon className="w-4 h-4" />
          {copyText}
        </button>
      </div>
      <div className="relative flex-grow min-h-0">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: true },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            renderWhitespace: 'selection',
          }}
        />
      </div>
    </div>
  );
}

const getMonacoLanguage = (fileName: string): string => {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith('.java')) return 'java';
  if (normalized.endsWith('.xml')) return 'xml';
  if (normalized.endsWith('.json')) return 'json';
  if (normalized.endsWith('.yml') || normalized.endsWith('.yaml')) return 'yaml';
  if (normalized.endsWith('.properties')) return 'ini';
  if (normalized.endsWith('.md')) return 'markdown';
  if (normalized.endsWith('.sql')) return 'sql';
  if (normalized.endsWith('.ts') || normalized.endsWith('.tsx')) return 'typescript';
  if (normalized.endsWith('.js') || normalized.endsWith('.jsx')) return 'javascript';
  if (normalized.endsWith('.html')) return 'html';
  if (normalized.endsWith('.css')) return 'css';
  if (normalized.endsWith('.sh')) return 'shell';
  if (normalized.endsWith('.gradle') || normalized.endsWith('.kts')) return 'kotlin';

  return 'plaintext';
};
