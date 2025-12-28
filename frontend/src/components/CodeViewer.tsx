
import React, { useState } from 'react';
import { CopyIcon } from './icons';

interface CodeViewerProps {
  fileName: string;
  code: string;
}

export function CodeViewer({ fileName, code }: CodeViewerProps) {
  const [copyText, setCopyText] = useState('Copy');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy'), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-800">
      <div className="flex justify-between items-center p-3 bg-slate-900/30 border-b border-slate-700 flex-shrink-0">
        <p className="text-sm font-mono text-slate-400">{fileName}</p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
        >
          <CopyIcon className="w-4 h-4" />
          {copyText}
        </button>
      </div>
      <div className="relative flex-grow overflow-auto">
        <pre className="p-4 text-sm text-slate-300 font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
