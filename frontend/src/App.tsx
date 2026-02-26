
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { RequirementsEditor } from './components/RequirementsEditor';
import { DbmlEditor } from './components/DbmlEditor';
import { SchemaVisualizer } from './components/SchemaVisualizer';
import { useBackend } from './hooks/useBackend';
import { parseDBML } from './services/dbmlParser';
import { ParsedSchema, GeneratedFile, Project, FileNode, CodeChange } from './types';
// import { SAMPLE_REQUIREMENTS } from './constants';
import Loader from './components/Loader';
import { CodeGenerationModal } from './components/CodeGenerationModal';
import { CodeDownloadPopup } from './components/CodeDownloadPopup';
import { ProjectSelector } from './components/ProjectSelector';
import { FilePreviewModal } from './components/FilePreviewModal';
import { CodeDiffModal } from './components/CodeDiffModal';

export default function App() {
  // const [requirements, setRequirements] = useState<string>(SAMPLE_REQUIREMENTS);
  const [requirements, setRequirements] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [dbmlCode, setDbmlCode] = useState<string>('');
  const [parsedSchema, setParsedSchema] = useState<ParsedSchema>({ tables: [], refs: [] });
  const [generatedCode, setGeneratedCode] = useState<GeneratedFile[]>([]);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isDownloadPopupOpen, setIsDownloadPopupOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<FileNode | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [diffChanges, setDiffChanges] = useState<CodeChange[] | null>(null);
  const [savedDbmlCode, setSavedDbmlCode] = useState<string>('');
  const [isComparingCode, setIsComparingCode] = useState(false);
  const [savedJavaCode, setSavedJavaCode] = useState<string>('');
  
  const { generateDbml, isLoading, generateSpringBootCode, isCodeLoading, isPreviewLoading, isDbmlUpdating, error, fetchProjects, fetchProjectById, downloadGeneratedCode, generatePreview, updateDbml, compareCode } = useBackend();

  const handleGenerate = useCallback(async () => {
    const response = await generateDbml(requirements, projectName);
    if (response) {
      setDbmlCode(response.cleanDbmlCode);
      setSelectedProjectId(response.projectId);
      // Refresh projects list to include newly created project
      const fetchedProjects = await fetchProjects();
      if (fetchedProjects) {
        setProjects(fetchedProjects);
      }
    }
  }, [requirements, projectName, generateDbml, fetchProjects]);

  const handleGenerateCode = useCallback(async () => {
    if (!dbmlCode) return;
    const files = await generateSpringBootCode(dbmlCode);
    if (files) {
      setGeneratedCode(files);
      // Save the generated Java code for comparison
      const concatenatedCode = files.map(f => `// File: ${f.fileName}\n${f.content}`).join('\n\n');
      setSavedJavaCode(concatenatedCode);
      setIsCodeModalOpen(true);
    }
  }, [dbmlCode, generateSpringBootCode]);

  const handleDownloadCode = useCallback(async () => {
    if (!selectedProjectId || !dbmlCode) return;
    
    // Show popup and start download process
    setIsDownloadPopupOpen(true);
    setIsDownloading(true);
    setDownloadSuccess(false);
    
    const success = await downloadGeneratedCode(selectedProjectId);
    
    // Update states after download
    setIsDownloading(false);
    if (success) {
      setDownloadSuccess(true);
    } else {
      // On failure, close the popup
      setIsDownloadPopupOpen(false);
    }
  }, [selectedProjectId, dbmlCode, downloadGeneratedCode]);

  const handlePreview = useCallback(async () => {
    if (!selectedProjectId) return;
    
    const data = await generatePreview(selectedProjectId);
    if (data) {
      setPreviewData(data);
      setIsPreviewModalOpen(true);
    }
  }, [selectedProjectId, generatePreview]);

  const handleSaveDbml = useCallback(async () => {
    if (!selectedProjectId || !dbmlCode) return;
    
    const success = await updateDbml(selectedProjectId, dbmlCode);
    if (success) {
      // Optionally show a success message
      console.log('DBML updated successfully');
    }
  }, [selectedProjectId, dbmlCode, updateDbml]);

  const handleCompareCode = useCallback(async () => {
    if (!savedJavaCode || !requirements.trim()) {
      return;
    }
    
    setIsComparingCode(true);
    setIsDiffModalOpen(true);
    
    // Regenerate DBML from requirements
    const response = await generateDbml(requirements, projectName || 'Comparison');
    if (response) {
      const newDbmlCode = response.cleanDbmlCode;
      
      // Generate new Java code from new DBML
      const newFiles = await generateSpringBootCode(newDbmlCode);
      if (newFiles) {
        const newJavaCode = newFiles.map(f => `// File: ${f.fileName}\n${f.content}`).join('\n\n');
        
        // Compare old vs new Java code
        const changes = await compareCode(savedJavaCode, newJavaCode);
        if (changes) {
          setDiffChanges(changes);
        }
      }
    }
    
    setIsComparingCode(false);
  }, [savedJavaCode, requirements, projectName, generateDbml, generateSpringBootCode, compareCode]);

  useEffect(() => {
    try {
      const schema = parseDBML(dbmlCode);
      setParsedSchema(schema);
    } catch (e) {
      console.error("DBML Parsing Error:", e);
      // Optionally, set an error state to show in the UI
    }
  }, [dbmlCode]);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      const fetchedProjects = await fetchProjects();
      if (fetchedProjects) {
        setProjects(fetchedProjects);
      }
    };
    loadProjects();
  }, [fetchProjects]);

  // Handle project selection
  const handleSelectProject = useCallback(async (projectId: number) => {
    if (projectId === 0) {
      // Deselect project
      setSelectedProjectId(null);
      setProjectName('');
      setDbmlCode('');
      setRequirements('');
      return;
    }
    
    const project = await fetchProjectById(projectId);
    if (project) {
      setSelectedProjectId(project.projectId);
      setProjectName(project.projectName);
      setDbmlCode(project.cleanDbmlCode);
      setRequirements(''); // Clear requirements when loading existing project
    }
  }, [fetchProjectById]);

  // Handle project deselection
  const handleDeselectProject = useCallback(() => {
    setSelectedProjectId(null);
    setProjectName('');
    setDbmlCode('');
    setRequirements('');
  }, []);

  // Handle refresh projects
  const handleRefreshProjects = useCallback(async () => {
    const fetchedProjects = await fetchProjects();
    if (fetchedProjects) {
      setProjects(fetchedProjects);
    }
  }, [fetchProjects]);

  // Automatically generate on initial load for demonstration
  // useEffect(() => {
  //   if (requirements && !dbmlCode) {
  //     handleGenerate();
  //   }
  // }, [handleGenerate, requirements, dbmlCode]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 font-sans">
      {(isLoading || isCodeLoading) && <Loader />}
      <CodeGenerationModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        files={generatedCode}
      />
      <CodeDownloadPopup
        isOpen={isDownloadPopupOpen}
        onClose={() => {
          setIsDownloadPopupOpen(false);
          setDownloadSuccess(false);
        }}
        isGenerating={isDownloading}
        isSuccess={downloadSuccess}
      />
      <FilePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        fileNode={previewData}
      />
      <CodeDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        changes={diffChanges}
        isLoading={isComparingCode}
      />
      <Header 
        onGenerate={handleGenerate} 
        onGenerateCode={handleGenerateCode}
        onDownloadCode={handleDownloadCode}
        onPreview={handlePreview}
        isLoading={isLoading}
        isCodeLoading={isCodeLoading}
        isPreviewLoading={isPreviewLoading}
        dbmlCode={dbmlCode}
        hasProjectId={!!selectedProjectId}
      />
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-[300px,420px,1fr] gap-4 p-4 overflow-auto">
        <div className="flex flex-col gap-4 h-full">
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={handleSelectProject}
            onRefresh={handleRefreshProjects}
            isLoading={isLoading}
          />
          <RequirementsEditor
            value={requirements}
            onChange={setRequirements}
            projectName={projectName}
            onProjectNameChange={setProjectName}
            error={error}
          />
        </div>
        <DbmlEditor 
          value={dbmlCode} 
          onChange={setDbmlCode}
          onSave={handleSaveDbml}
          onCompare={handleCompareCode}
          isSaving={isDbmlUpdating}
          isComparing={isComparingCode}
          canSave={!!selectedProjectId && !!dbmlCode}
          canCompare={!!savedJavaCode && !!requirements}
        />
        <SchemaVisualizer schema={parsedSchema} />
      </main>
    </div>
  );
}
