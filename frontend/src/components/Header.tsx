
import React from 'react';
import { BrainCircuitIcon, ZapIcon, ServerIcon } from './icons';

interface HeaderProps {
  onGenerate: () => void;
  onGenerateCode: () => void;
  onDownloadCode: () => void;
  isLoading: boolean;
  isCodeLoading: boolean;
  dbmlCode: string;
  hasProjectId: boolean;
}

export function Header({ onGenerate, onGenerateCode, onDownloadCode, isLoading, isCodeLoading, dbmlCode, hasProjectId }: HeaderProps) {
  const isAnythingLoading = isLoading || isCodeLoading;

  return (
    <header className="flex-shrink-0 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BrainCircuitIcon className="w-8 h-8 text-cyan-400" />
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            DBML Architect <span className="text-cyan-400">AI</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onGenerate}
            disabled={isAnythingLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-cyan-500 text-white rounded-md shadow-lg hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
            aria-label="Generate DBML schema"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <ZapIcon className="w-5 h-5" />
                Generate Schema
              </>
            )}
          </button>
          <button
            onClick={onDownloadCode}
            disabled={isAnythingLoading || !dbmlCode || !hasProjectId}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-500 text-white rounded-md shadow-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
            aria-label="Download Generated Backend Code"
          >
            {isCodeLoading ? (
               <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <ServerIcon className="w-5 h-5" />
                Download Code
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
