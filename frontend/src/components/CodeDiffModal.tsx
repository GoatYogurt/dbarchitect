import React, { useState } from 'react';
import { CodeChange } from '../types';

interface CodeDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  changes: CodeChange[] | null;
  isLoading?: boolean;
  oldCode?: string;
  newCode?: string;
}

const DiffLine: React.FC<{ change: CodeChange; index: number }> = ({ change, index }) => {
  const getActionClassName = (action: string) => {
    switch (action) {
      case 'ADDED':
        return 'bg-green-900/20 border-l-4 border-green-500';
      case 'REMOVED':
        return 'bg-red-900/20 border-l-4 border-red-500';
      case 'MODIFIED':
        return 'bg-yellow-900/20 border-l-4 border-yellow-500';
      default:
        return 'border-l-4 border-slate-600';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ADDED':
        return 'text-green-400';
      case 'REMOVED':
        return 'text-red-400';
      case 'MODIFIED':
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'ADDED':
        return '+';
      case 'REMOVED':
        return '−';
      case 'MODIFIED':
        return '~';
      default:
        return ' ';
    }
  };

  return (
    <div key={index} className={`flex gap-3 p-4 ${getActionClassName(change.action)}`}>
      <div className={`w-8 text-center font-bold flex-shrink-0 text-lg ${getActionColor(change.action)}`}>
        {getActionLabel(change.action)}
      </div>
      <div className="flex-grow min-w-0">
        {/* Element name - most prominent */}
        <div className="font-semibold text-slate-100 text-base mb-2">
          {change.element}
        </div>
        
        {/* Type and Action badges */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-2 py-1 bg-slate-700 text-slate-300 text-xs font-mono rounded">
            {change.type}
          </span>
          <span className={`inline-block px-2 py-1 font-semibold text-xs rounded ${
            change.action === 'ADDED' ? 'bg-green-900/40 text-green-300' :
            change.action === 'REMOVED' ? 'bg-red-900/40 text-red-300' :
            change.action === 'MODIFIED' ? 'bg-yellow-900/40 text-yellow-300' :
            'bg-slate-900/40 text-slate-300'
          }`}>
            {change.action}
          </span>
        </div>
        
        {/* Detail description */}
        <div className="text-sm text-slate-300 leading-relaxed">
          {change.detail}
        </div>
      </div>
    </div>
  );
};

export function CodeDiffModal({ isOpen, onClose, changes, isLoading = false, oldCode = '', newCode = '' }: CodeDiffModalProps) {
  const [viewMode, setViewMode] = useState<'diff' | 'code'>('diff');
  
  if (!isOpen) return null;

  const hasChanges = changes && changes.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col border border-slate-700">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-100">Code Comparison</h2>
            {hasChanges && (
              <span className="ml-auto text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">
                {changes.length} change{changes.length !== 1 ? 's' : ''}
              </span>
            )}
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

        {/* View Mode Tabs */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-slate-700 flex gap-2">
          <button
            onClick={() => setViewMode('diff')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              viewMode === 'diff'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Changes
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              viewMode === 'code'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Side-by-Side
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto">
          {viewMode === 'diff' ? (
            // Changes View
            <>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-slate-400">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Comparing code...</p>
                  </div>
                </div>
              ) : hasChanges ? (
                <div className="divide-y divide-slate-700">
                  {changes.map((change, index) => (
                    <DiffLine key={index} change={change} index={index} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p>No changes detected</p>
                    <p className="text-sm mt-1">The code is identical</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Side-by-Side Code View
            <div className="grid grid-cols-2 gap-1 h-full">
              {/* Old Code */}
              <div className="flex flex-col overflow-hidden border-r border-slate-700">
                <div className="flex-shrink-0 px-4 py-2 bg-slate-900/50 border-b border-slate-700">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Old Code</h3>
                </div>
                <pre className="flex-grow overflow-auto p-4 text-xs font-mono text-slate-300 bg-slate-900/30 leading-relaxed">
                  <code>{oldCode || 'No code available'}</code>
                </pre>
              </div>

              {/* New Code */}
              <div className="flex flex-col overflow-hidden">
                <div className="flex-shrink-0 px-4 py-2 bg-slate-900/50 border-b border-slate-700">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">New Code</h3>
                </div>
                <pre className="flex-grow overflow-auto p-4 text-xs font-mono text-slate-300 bg-slate-900/30 leading-relaxed">
                  <code>{newCode || 'No code available'}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Legend - Only show in Changes view */}
        {viewMode === 'diff' && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-slate-700 bg-slate-900/50 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Changes Legend</div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold text-base leading-none">+</span>
                <div>
                  <div className="text-xs text-slate-300">Added</div>
                  <div className="text-xs text-slate-500">New code</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-bold text-base leading-none">−</span>
                <div>
                  <div className="text-xs text-slate-300">Removed</div>
                  <div className="text-xs text-slate-500">Deleted code</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold text-base leading-none">~</span>
                <div>
                  <div className="text-xs text-slate-300">Modified</div>
                  <div className="text-xs text-slate-500">Changed code</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1"><span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">FIELD</span></div>
                <div className="text-xs text-slate-500">Element type</div>
              </div>
            </div>
          </div>
        )}

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
