import React from 'react';
import { Project } from '../types';
import { FolderIcon } from './icons';

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: number | null;
  onSelectProject: (projectId: number) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function ProjectSelector({ projects, selectedProjectId, onSelectProject, onRefresh, isLoading }: ProjectSelectorProps) {
  return (
    <div className="bg-slate-800 rounded-lg shadow-inner border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold text-slate-200">Load Existing Project</h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded-md text-purple-400 hover:bg-slate-700 hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Refresh projects"
          title="Refresh projects"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        </button>
      </div>
      <select
        value={selectedProjectId ?? ''}
        onChange={(e) => {
          const value = e.target.value;
          if (value) {
            onSelectProject(Number(value));
          } else {
            onSelectProject(0); // Signal deselection with 0
          }
        }}
        disabled={isLoading}
        className="w-full px-3 py-2 rounded-md bg-slate-900/60 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Select existing project"
      >
        <option value="">-- Select a project (Or create new) --</option>
        {projects.map((project) => (
          <option key={project.projectId} value={project.projectId}>
            #{project.projectId} - {project.projectName}
          </option>
        ))}
      </select>
    </div>
  );
}
