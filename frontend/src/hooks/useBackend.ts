
import { useState, useCallback } from 'react';
import { GeneratedFile, GenerateDbmlResponse, Project, FileNode, CodeChange } from '../types';
import { GEMINI_MODEL } from '../constants';

const BASE_URL = 'http://localhost:8080';
// const BASE_URL = "https://x7nbr74s-8080.asse.devtunnels.ms"
export function useBackend() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDbmlUpdating, setIsDbmlUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProjectId, setLastProjectId] = useState<number | null>(() => {
    const stored = localStorage.getItem('projectId');
    return stored ? Number(stored) : null;
  });

  const generateDbml = useCallback(async (requirements: string, projectName: string): Promise<GenerateDbmlResponse | null> => {
    if (!requirements.trim()) {
      setError('Requirements cannot be empty.');
      return null;
    }
    if (!projectName.trim()) {
      setError('Project name cannot be empty.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/generate-dbml`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          systemDescription: requirements,
          modelName: GEMINI_MODEL,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Backend error: ${response.status}`);
      }

      const json: GenerateDbmlResponse = await response.json();
      const dbml = (json.cleanDbmlCode || '').trim();

      if (!dbml) {
        throw new Error('Empty DBML returned from backend.');
      }

      if (typeof json.projectId === 'number') {
        try {
          localStorage.setItem('projectId', String(json.projectId));
          setLastProjectId(json.projectId);
        } catch (_) {
          // ignore localStorage errors
        }
      }

      return json;
    } catch (e: any) {
      console.error('Backend DBML Generation Error:', e);
      setError(e.message || 'An unknown error occurred while communicating with the backend.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateSpringBootCode = useCallback(async (dbmlCode: string): Promise<GeneratedFile[] | null> => {
    if (!dbmlCode.trim()) {
      setError('DBML code cannot be empty.');
      return null;
    }

    setIsCodeLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/generate-java-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawDbmlCode: dbmlCode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Backend error: ${response.status}`);
      }

      const files: Array<{ path: string; content: string }> = await response.json();
      
      if (!Array.isArray(files) || files.length === 0) {
        setError('No files generated from DBML.');
        return null;
      }

      // Convert backend format to GeneratedFile[]
      const generatedFiles: GeneratedFile[] = files.map(f => ({
        fileName: f.path,
        content: f.content,
      }));

      return generatedFiles;
    } catch (e: any) {
      console.error('Java Code Generation Error:', e);
      setError(e.message || 'An unknown error occurred during code generation.');
      return null;
    } finally {
      setIsCodeLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async (): Promise<Project[] | null> => {
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/projects`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Backend error: ${response.status}`);
      }

      const projects: Project[] = await response.json();
      return projects;
    } catch (e: any) {
      console.error('Fetch Projects Error:', e);
      setError(e.message || 'Failed to fetch projects.');
      return null;
    }
  }, []);

  const fetchProjectById = useCallback(async (projectId: number): Promise<Project | null> => {
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/projects/${projectId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Backend error: ${response.status}`);
      }

      const project: Project = await response.json();
      return project;
    } catch (e: any) {
      console.error('Fetch Project Error:', e);
      setError(e.message || 'Failed to fetch project.');
      return null;
    }
  }, []);

  const downloadGeneratedCode = useCallback(async (projectId: number): Promise<boolean> => {
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/generate-code?id=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Backend error: ${response.status}`);
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-code-${projectId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      window.URL.revokeObjectURL(url);

      return true;
    } catch (e: any) {
      console.error('Download Generated Code Error:', e);
      setError(e.message || 'Failed to download generated code.');
      return false;
    }
  }, []);

  const generatePreview = useCallback(async (projectId: number): Promise<FileNode | null> => {
    setIsPreviewLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/generate-preview?id=${projectId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Backend error: ${response.status}`);
      }

      const fileNode: FileNode = await response.json();
      return fileNode;
    } catch (e: any) {
      console.error('Generate Preview Error:', e);
      setError(e.message || 'Failed to generate preview.');
      return null;
    } finally {
      setIsPreviewLoading(false);
    }
  }, []);

  const updateDbml = useCallback(async (projectId: number, dbmlCode: string): Promise<boolean> => {
    setIsDbmlUpdating(true);
    setError(null);
    try {
      const wrappedDbmlCode = `\`\`\`dbml\n${dbmlCode}\n\`\`\``;
      const response = await fetch(`${BASE_URL}/projects/${projectId}/dbml`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawDbmlCode: wrappedDbmlCode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Backend error: ${response.status}`);
      }

      return true;
    } catch (e: any) {
      console.error('Update DBML Error:', e);
      setError(e.message || 'Failed to update DBML code.');
      return false;
    } finally {
      setIsDbmlUpdating(false);
    }
  }, []);

  const compareCode = useCallback(async (oldCode: string, newCode: string): Promise<CodeChange[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Strip backticks from DBML code before sending to backend
      const cleanOldCode = oldCode.replace(/```dbml\n?/g, '').replace(/\n?```/g, '').trim();
      const cleanNewCode = newCode.replace(/```dbml\n?/g, '').replace(/\n?```/g, '').trim();

      const response = await fetch(`${BASE_URL}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldCode: cleanOldCode, newCode: cleanNewCode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Backend error: ${response.status}`);
      }

      const changes: CodeChange[] = await response.json();
      return changes;
    } catch (e: any) {
      console.error('Compare Code Error:', e);
      setError(e.message || 'Failed to compare code.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generateDbml, isLoading, generateSpringBootCode, isCodeLoading, isPreviewLoading, isDbmlUpdating, error, lastProjectId, fetchProjects, fetchProjectById, downloadGeneratedCode, generatePreview, updateDbml, compareCode };
}
