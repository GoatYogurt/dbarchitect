import React, { useState, useEffect } from 'react';
import { FileNode } from '../types';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileNode: FileNode | null;
}

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  onSelectFile: (node: FileNode) => void;
  selectedFilePath: string | null;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, level, onSelectFile, selectedFilePath }) => {
  const [isExpanded, setIsExpanded] = useState(level < 3); // Auto-expand first 3 levels

  const isFolder = node.type === 'folder';
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = !isFolder && selectedFilePath === node.path;

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div key={node.path} className="select-none">
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors ${
          isSelected ? 'bg-purple-600' : 'hover:bg-slate-700'
        }`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={() => !isFolder && onSelectFile(node)}
      >
        {hasChildren && (
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform cursor-pointer ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            onClick={toggleExpand}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
        {!hasChildren && <span className="w-4"></span>}

        {isFolder ? (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
          </svg>
        )}

        <span className="text-sm font-medium text-slate-200">{node.name}</span>

        {!isFolder && node.language && (
          <span className="ml-auto text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
            {node.language}
          </span>
        )}

        {node.content && !isFolder && (
          <span className="ml-auto text-xs text-slate-400">
            {node.content.length < 1024 
              ? `${node.content.length} B` 
              : `${(node.content.length / 1024).toFixed(1)} KB`}
          </span>
        )}
      </div>

      {isFolder && isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onSelectFile={onSelectFile}
              selectedFilePath={selectedFilePath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CodeViewer: React.FC<{ file: FileNode | null }> = ({ file }) => {
  if (!file || file.type === 'folder') {
    return (
      <div className="flex-grow flex items-center justify-center text-slate-400">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>Select a file to view its content</p>
        </div>
      </div>
    );
  }

  const lines = file.content?.split('\n') || [];

  return (
    <div className="flex-grow flex flex-col overflow-hidden">
      {/* File header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
          </svg>
          <span className="text-sm font-semibold text-slate-100">{file.name}</span>
          {file.language && <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded ml-auto">{file.language}</span>}
        </div>
      </div>

      {/* Code content */}
      <div className="flex-grow overflow-auto bg-slate-950">
        <pre className="h-full p-4 font-mono text-sm text-slate-300 whitespace-pre-wrap break-words">
          {file.content && file.content.length > 0 ? (
            <code>{file.content}</code>
          ) : (
            <span className="text-slate-500">(empty file)</span>
          )}
        </pre>
      </div>

      {/* File stats */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-slate-700 bg-slate-900/50 text-xs text-slate-400">
        {lines.length} lines · {file.content?.length || 0} bytes
      </div>
    </div>
  );
};

export function FilePreviewModal({ isOpen, onClose, fileNode }: FilePreviewModalProps) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  // Reset selected file when modal closes or fileNode changes
  useEffect(() => {
    setSelectedFile(null);
  }, [isOpen, fileNode]);

  if (!isOpen || !fileNode) return null;

  const handleSelectFile = (node: FileNode) => {
    setSelectedFile(node);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[80vh] flex flex-col border border-slate-700">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-100">Generated Code Preview</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-hidden flex gap-4 p-4">
          {/* File Tree */}
          <div className="w-80 flex-shrink-0 overflow-auto bg-slate-900 rounded border border-slate-700 p-2">
            <div className="font-mono text-sm text-slate-300">
              <FileTreeNode
                node={fileNode}
                level={0}
                onSelectFile={handleSelectFile}
                selectedFilePath={selectedFile?.path || null}
              />
            </div>
          </div>

          {/* Code Viewer */}
          <CodeViewer file={selectedFile} />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold bg-slate-700 text-slate-100 rounded-md hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
