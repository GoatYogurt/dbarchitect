import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { FolderIcon, XIcon } from './icons';

interface ProjectSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: Project) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
  projects: Project[];
  onRefresh: () => void;
}

export function ProjectSelectModal({
  isOpen,
  onClose,
  onSelectProject,
  onCreateNew,
  isLoading = false,
  projects,
  onRefresh,
}: ProjectSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = projects.filter(
    (project) =>
      project.projectId.toString().includes(searchTerm) ||
      project.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      onRefresh();
    }
  }, [isOpen, onRefresh]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-slate-800 border border-slate-700 shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderIcon className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-slate-100">Load Project</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              onCreateNew();
              onClose();
            }}
            className="w-full px-4 py-3 rounded-md bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-semibold hover:from-cyan-700 hover:to-cyan-600 transition-all duration-200 shadow-lg"
          >
            + Create New Project
          </button>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md bg-slate-900/60 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-md text-purple-400 hover:bg-slate-700 hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh projects"
              title="Refresh projects"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                {projects.length === 0 ? 'No projects found' : 'No projects match your search'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map((project) => (
                  <button
                    key={project.projectId}
                    onClick={() => {
                      onSelectProject(project);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-md border border-slate-700 bg-slate-900/60 hover:bg-slate-800 hover:border-purple-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-100">#{project.projectId} - {project.projectName}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {project.cleanDbmlCode?.split('\n').length || 0} lines of DBML
                        </p>
                      </div>
                      <div className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-4 h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-600 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
