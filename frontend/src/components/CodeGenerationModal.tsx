
import React, { useMemo, useState, useEffect } from 'react';
import { GeneratedFile } from '../types';
import { XIcon, ServerIcon } from './icons';
import { CodeViewer } from './CodeViewer';
import { FileTree, buildDirectoryTree, File as TreeFile } from './FileTree';

interface CodeGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: GeneratedFile[];
}

export function CodeGenerationModal({ isOpen, onClose, files }: CodeGenerationModalProps) {
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  useEffect(() => {
    if (files.length > 0) {
      setSelectedFilePath(files[0].fileName.replace(/\\/g, '/').replace(/^\/+/, ''));
    }
  }, [files]);

  const sortedFiles = useMemo(
    () =>
      [...files].sort((a, b) => {
        const aPath = a.fileName.toLowerCase();
        const bPath = b.fileName.toLowerCase();
        if (aPath < bPath) return -1;
        if (aPath > bPath) return 1;
        return 0;
      }),
    [files]
  );

  const rootDir = useMemo(() => buildDirectoryTree(sortedFiles), [sortedFiles]);

  const selectedTreeFile = useMemo<TreeFile | undefined>(() => {
    if (!selectedFilePath) {
      return undefined;
    }

    const normalized = selectedFilePath.replace(/\\/g, '/').replace(/^\/+/, '');
    const selected = sortedFiles.find((file) => file.fileName.replace(/\\/g, '/').replace(/^\/+/, '') === normalized);
    if (!selected) {
      return undefined;
    }

    const segments = normalized.split('/');
    const fileName = segments[segments.length - 1];
    const parentPath = segments.slice(0, -1).join('/');

    return {
      id: `file:${normalized}`,
      name: fileName,
      path: normalized,
      parentId: parentPath ? `dir:${parentPath}` : '0',
      depth: segments.length,
      content: selected.content,
    };
  }, [selectedFilePath, sortedFiles]);

  const activeFile = useMemo(() => {
    if (!selectedTreeFile) {
      return null;
    }

    return sortedFiles.find(
      (file) => file.fileName.replace(/\\/g, '/').replace(/^\/+/, '') === selectedTreeFile.path
    ) || null;
  }, [selectedTreeFile, sortedFiles]);

  if (!isOpen) return null;

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
          <aside className="w-2/5 max-w-sm bg-slate-900/60 p-2 overflow-y-auto border-r border-slate-700">
            <FileTree
              rootDir={rootDir}
              selectedFile={selectedTreeFile}
              onSelect={(file) => setSelectedFilePath(file.path)}
            />
          </aside>

          <main className="flex-grow flex flex-col overflow-hidden">
            {activeFile ? (
              <CodeViewer
                key={activeFile.fileName}
                fileName={activeFile.fileName}
                code={activeFile.content}
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
