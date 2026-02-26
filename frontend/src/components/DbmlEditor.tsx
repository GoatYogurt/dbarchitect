
import React from 'react';
import { CodeIcon } from './icons';

interface DbmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onCompare?: () => void;
  isSaving?: boolean;
  isComparing?: boolean;
  canSave?: boolean;
  canCompare?: boolean;
}

export function DbmlEditor({ value, onChange, onSave, onCompare, isSaving = false, isComparing = false, canSave = false, canCompare = false }: DbmlEditorProps) {
  return (
    <div className="bg-slate-800 rounded-lg shadow-inner flex flex-col overflow-hidden border border-slate-700">
      <div className="flex items-center gap-2 p-3 bg-slate-900/50 border-b border-slate-700">
        <CodeIcon className="w-5 h-5 text-emerald-400" />
        <h2 className="font-semibold text-slate-200">2. Review DBML</h2>
        {onSave && (
          <button
            onClick={onSave}
            disabled={!canSave || isSaving}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-md shadow hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
            aria-label="Save DBML changes"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save
              </>
            )}
          </button>
        )}
        {onCompare && (
          <button
            onClick={onCompare}
            disabled={!canCompare || isComparing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-purple-500 text-white rounded-md shadow hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
            aria-label="Compare code changes"
          >
            {isComparing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Comparing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Compare
              </>
            )}
          </button>
        )}
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
