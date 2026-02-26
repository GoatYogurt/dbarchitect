
import { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { GEMINI_MODEL } from '../constants';
import { GeneratedFile, GenerateDbmlResponse, Project, FileNode } from '../types';

const API_KEY = process.env.API_KEY;
const BASE_URL = 'http://localhost:8080';
// const BASE_URL = "https://x7nbr74s-8080.asse.devtunnels.ms"
export function useBackend() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
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
    if (!API_KEY) {
      setError('API key is not configured.');
      return null;
    }
    if (!dbmlCode.trim()) {
      setError('DBML code cannot be empty.');
      return null;
    }

    setIsCodeLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY, vertexai: true });
      const prompt = `
        You are an expert Java Spring Boot developer. Given the following DBML schema, generate a complete set of backend files for a Spring Boot application using Java 17+.

        **DBML Schema:**
        \`\`\`dbml
        ${dbmlCode}
        \`\`\`

        **Instructions:**
        1.  For each table in the DBML, generate four corresponding Java files:
            a.  **JPA Entity:** A \`.java\` file in \`com.example.app.model\`. Use \`jakarta.persistence.*\` annotations. Include standard annotations like \`@Entity\`, \`@Table\`, \`@Id\`, \`@GeneratedValue\`, \`@Column\`, and relationship annotations (\`@ManyToOne\`, \`@OneToMany\`, \`@ManyToMany\`). Implement relationships correctly based on the 'Ref' definitions.
            b.  **JPA Repository:** A \`.java\` interface in \`com.example.app.repository\` that extends \`JpaRepository\`.
            c.  **DTO (Data Transfer Object):** A simple \`.java\` record or class in \`com.example.app.dto\` to represent the entity for API communication.
            d.  **REST Controller:** A \`.java\` class in \`com.example.app.controller\` with the \`@RestController\` annotation. Provide skeleton CRUD endpoints (\`@GetMapping\`, \`@PostMapping\`, \`@PutMapping\`, \`@DeleteMapping\`) using the repository and DTOs.
        2.  Follow Java naming conventions (PascalCase for classes, camelCase for fields).
        3.  Ensure all generated code is complete, syntactically correct, and includes necessary imports.
        4.  The output must be a JSON object containing an array of file objects.
      `;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: { role: 'user', parts: [{ text: prompt }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              files: {
                type: Type.ARRAY,
                description: "An array of generated Java files.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    fileName: {
                      type: Type.STRING,
                      description: "The full path of the file, e.g., src/main/java/com/example/app/model/User.java"
                    },
                    content: {
                      type: Type.STRING,
                      description: "The complete Java code for the file."
                    }
                  },
                  required: ['fileName', 'content']
                }
              }
            },
            required: ['files']
          },
          temperature: 0.3,
        }
      });
      
      if (!response.text) {
        throw new Error('Empty response from AI.');
      }
      
      const jsonString = response.text.trim();
      const result = JSON.parse(jsonString);

      if (result && Array.isArray(result.files)) {
        return result.files;
      } else {
        throw new Error('Invalid code generation response from AI.');
      }

    } catch (e: any) {
      console.error('Gemini Code Generation Error:', e);
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

  return { generateDbml, isLoading, generateSpringBootCode, isCodeLoading, isPreviewLoading, error, lastProjectId, fetchProjects, fetchProjectById, downloadGeneratedCode, generatePreview };
}
