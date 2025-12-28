
import React from 'react';
import { CodeIcon } from './icons';

interface DbmlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function DbmlEditor({ value, onChange }: DbmlEditorProps) {
  return (
    <div className="bg-slate-800 rounded-lg shadow-inner flex flex-col overflow-hidden border border-slate-700">
      <div className="flex items-center gap-2 p-3 bg-slate-900/50 border-b border-slate-700">
        <CodeIcon className="w-5 h-5 text-emerald-400" />
        <h2 className="font-semibold text-slate-200">2. Review DBML</h2>
      </div>
      <div className="relative flex-grow">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="AI-generated DBML will appear here..."
            className="w-full h-full p-4 bg-transparent resize-none focus:outline-none font-mono text-xs text-slate-300 leading-relaxed placeholder-slate-500"
          spellCheck="false"
          aria-label="DBML code editor"
        />
      </div>
    </div>
  );
}
