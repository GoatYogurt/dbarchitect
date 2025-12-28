
import React from 'react';
import { FileTextIcon, AlertTriangleIcon } from './icons';

interface RequirementsEditorProps {
  value: string;
  onChange: (value: string) => void;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  error: string | null;
}

export function RequirementsEditor({ value, onChange, projectName, onProjectNameChange, error }: RequirementsEditorProps) {
  return (
    <div className="bg-slate-800 rounded-lg shadow-inner flex flex-col overflow-hidden border border-slate-700">
      <div className="flex items-center gap-2 p-3 bg-slate-900/50 border-b border-slate-700">
        <FileTextIcon className="w-5 h-5 text-cyan-400" />
        <h2 className="font-semibold text-slate-200">1. Describe Your Application</h2>
      </div>
      <div className="flex flex-col p-3 gap-3 border-b border-slate-700 bg-slate-900/30">
        <label className="text-sm font-medium text-slate-300" htmlFor="project-name">Project Name</label>
        <input
          id="project-name"
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="e.g., Library System"
          className="w-full px-3 py-2 rounded-md bg-slate-900/60 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label="Project name"
        />
      </div>
      <div className="relative flex-grow">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., Design a database for a blog with users, posts, and comments..."
          className="w-full h-full p-4 bg-transparent resize-none focus:outline-none text-slate-300 leading-relaxed placeholder-slate-500"
          aria-label="Application requirements editor"
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/50 border-t border-red-700 text-red-300">
          <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
