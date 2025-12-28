
import React, { useState, useEffect } from 'react';
import { GeneratedFile } from '../types';
import { XIcon, ServerIcon } from './icons';
import { CodeViewer } from './CodeViewer';

interface CodeGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: GeneratedFile[];
}

export function CodeGenerationModal({ isOpen, onClose, files }: CodeGenerationModalProps) {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (files.length > 0) {
      setActiveTab(0);
    }
  }, [files]);

  if (!isOpen) return null;

  const getFileType = (fileName: string) => {
    if (fileName.includes('model')) return 'Model';
    if (fileName.includes('repository')) return 'Repository';
    if (fileName.includes('controller')) return 'Controller';
    if (fileName.includes('dto')) return 'DTO';
    return 'File';
  };

  const sortedFiles = [...files].sort((a, b) => {
    const aPath = a.fileName.toLowerCase();
    const bPath = b.fileName.toLowerCase();
    if (aPath < bPath) return -1;
    if (aPath > bPath) return 1;
    return 0;
  });

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="code-gen-title"
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <ServerIcon className="w-6 h-6 text-emerald-400" />
            <h2 id="code-gen-title" className="text-lg font-bold text-slate-100">Generated Spring Boot Code</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            aria-label="Close code generation modal"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-grow flex overflow-hidden">
          <aside className="w-1/3 max-w-xs bg-slate-900/50 p-2 overflow-y-auto border-r border-slate-700">
            <nav className="flex flex-col gap-1">
              {sortedFiles.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === index
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                  }`}
                >
                  <span className={`text-xs font-bold mr-2 px-1.5 py-0.5 rounded ${
                      getFileType(file.fileName) === 'Model' ? 'bg-blue-500/50 text-blue-200' :
                      getFileType(file.fileName) === 'Repository' ? 'bg-green-500/50 text-green-200' :
                      getFileType(file.fileName) === 'Controller' ? 'bg-purple-500/50 text-purple-200' :
                      getFileType(file.fileName) === 'DTO' ? 'bg-yellow-500/50 text-yellow-200' : 'bg-slate-600'
                  }`}>{getFileType(file.fileName)}</span>
                  {file.fileName.split('/').pop()}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-grow flex flex-col overflow-hidden">
            {sortedFiles[activeTab] ? (
              <CodeViewer
                key={sortedFiles[activeTab].fileName}
                fileName={sortedFiles[activeTab].fileName}
                code={sortedFiles[activeTab].content}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <p>No file selected.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
