import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DbmlEditor } from './components/DbmlEditor';
import { SchemaVisualizer } from './components/SchemaVisualizer';
import { useBackend } from './hooks/useBackend';
import { parseDBML } from './services/dbmlParser';
import { ParsedSchema, GeneratedFile } from './types';
import Loader from './components/Loader';
import { CodeGenerationModal } from './components/CodeGenerationModal';
import { CodeDownloadPopup } from './components/CodeDownloadPopup';

type WizardStep = 1 | 2 | 3 | 4;

function buildProjectName(requirements: string): string {
  const words = requirements
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('-')
    .toLowerCase();

  const suffix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return words ? `${words}-${suffix}` : `db-project-${suffix}`;
}

export default function App() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [requirements, setRequirements] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [dbmlCode, setDbmlCode] = useState<string>('');
  const [parsedSchema, setParsedSchema] = useState<ParsedSchema>({ tables: [], refs: [] });
  const [generatedCode, setGeneratedCode] = useState<GeneratedFile[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isDownloadPopupOpen, setIsDownloadPopupOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const [selectedBackendFramework, setSelectedBackendFramework] = useState<string>('spring-boot');
  const [selectedFrontendFramework, setSelectedFrontendFramework] = useState<string>('none');

  const {
    generateDbml,
    isLoading,
    generateSpringBootCode,
    isCodeLoading,
    isDbmlUpdating,
    error,
    updateDbml,
    downloadGeneratedCode,
  } = useBackend();

  const isBusy = isLoading || isCodeLoading || isDbmlUpdating;

  const steps = useMemo(
    () => [
      { id: 1 as WizardStep, title: 'Input Requirements' },
      { id: 2 as WizardStep, title: 'Schema Diagram' },
      { id: 3 as WizardStep, title: 'Scaffold Code' },
      { id: 4 as WizardStep, title: 'Generated Code' },
    ],
    []
  );

  const handleGenerateSchema = useCallback(async () => {
    if (!requirements.trim()) {
      return;
    }

    const generatedProjectName = buildProjectName(requirements);
    const response = await generateDbml(requirements, generatedProjectName);
    if (!response) {
      return;
    }

    setProjectName(generatedProjectName);
    setDbmlCode(response.cleanDbmlCode);
    setSelectedProjectId(response.projectId);
    setGeneratedCode([]);
    setCurrentStep(2);
  }, [requirements, generateDbml]);

  const handleContinueFromSchema = useCallback(async () => {
    if (!dbmlCode.trim()) {
      return;
    }

    if (selectedProjectId) {
      const success = await updateDbml(selectedProjectId, dbmlCode);
      if (!success) {
        return;
      }
    }

    setCurrentStep(3);
  }, [dbmlCode, selectedProjectId, updateDbml]);

  const handleScaffoldCode = useCallback(async () => {
    if (!dbmlCode.trim() || selectedBackendFramework !== 'spring-boot') {
      return;
    }

    const files = await generateSpringBootCode(dbmlCode);
    if (!files) {
      return;
    }

    setGeneratedCode(files);
    setCurrentStep(4);
  }, [dbmlCode, selectedBackendFramework, generateSpringBootCode]);

  const handleDownloadCode = useCallback(async () => {
    if (!selectedProjectId) {
      return;
    }

    setIsDownloadPopupOpen(true);
    setIsDownloading(true);
    setDownloadSuccess(false);

    const success = await downloadGeneratedCode(selectedProjectId);

    setIsDownloading(false);
    if (success) {
      setDownloadSuccess(true);
    } else {
      setIsDownloadPopupOpen(false);
    }
  }, [selectedProjectId, downloadGeneratedCode]);

  useEffect(() => {
    try {
      const schema = parseDBML(dbmlCode);
      setParsedSchema(schema);
    } catch (e) {
      console.error('DBML Parsing Error:', e);
    }
  }, [dbmlCode]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-900 text-slate-100">
      {isBusy && <Loader />}

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

      <header className="flex-shrink-0 border-b border-slate-700 bg-slate-800/60 backdrop-blur-sm">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold tracking-tight">DBArchitect Wizard</h1>
          <p className="mt-1 text-sm text-slate-400">Complete one page at a time and continue to the next step.</p>
        </div>
      </header>

      <div className="flex-shrink-0 px-6 py-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;

            return (
              <div
                key={step.id}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                    : isDone
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-700 bg-slate-800/70 text-slate-400'
                }`}
              >
                <p className="text-xs uppercase tracking-wide">Step {step.id}</p>
                <p className="font-semibold">{step.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      <main className="flex-grow overflow-hidden">
        {currentStep === 1 && (
          <div className="px-6 pb-6 overflow-auto h-full">
          <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
            <h2 className="text-xl font-semibold">Input Requirements</h2>
            <p className="mt-1 text-sm text-slate-400">
              Describe your system requirements. We will generate DBML and move you to the schema step.
            </p>

            <div className="mt-4">
              <label htmlFor="requirements" className="mb-2 block text-sm font-medium text-slate-300">
                Input Requirements
              </label>
              <textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Example: Build a course management system with users, courses, enrollments, and payments."
                className="h-64 w-full rounded-lg border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500"
              />
            </div>

            {error && <p className="mt-3 rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300">{error}</p>}

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleGenerateSchema}
                disabled={isBusy || !requirements.trim()}
                className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-slate-600"
              >
                {isLoading ? 'Generating Schema...' : 'Continue to Schema Diagram'}
              </button>
            </div>
          </section>
          </div>
        )}

        {currentStep === 2 && (
          <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
            <div className="min-h-0 grid grid-cols-1 gap-4 overflow-auto px-6 pt-2 pb-4 xl:grid-cols-[0.9fr,1.45fr] xl:overflow-hidden">
              <div className="min-h-[50vh] min-w-0 xl:min-h-0 xl:h-full xl:overflow-hidden">
                <DbmlEditor value={dbmlCode} onChange={setDbmlCode} />
              </div>
              <div className="min-h-[70vh] min-w-0 xl:min-h-0 xl:h-full xl:overflow-hidden">
                <SchemaVisualizer schema={parsedSchema} />
              </div>
            </div>

            <div className="border-t border-slate-700 bg-slate-800">
              {error && <p className="mx-6 mt-3 rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300">{error}</p>}

              <div className="flex items-center justify-between px-6 py-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  disabled={isBusy}
                  className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleContinueFromSchema}
                  disabled={isBusy || !dbmlCode.trim()}
                  className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-600"
                >
                  {isDbmlUpdating ? 'Saving Schema...' : 'Continue to Scaffold Code'}
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="px-6 pb-6 overflow-auto h-full">
          <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
            <h2 className="text-xl font-semibold">Scaffold Code</h2>
            <p className="mt-1 text-sm text-slate-400">Choose frameworks and scaffold project structure from the schema.</p>

            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Backend Framework</h3>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
                    <div>
                      <p className="font-semibold text-emerald-300">Java Spring Boot</p>
                      <p className="text-xs text-slate-300">Supported</p>
                    </div>
                    <input
                      type="radio"
                      name="backend-framework"
                      checked={selectedBackendFramework === 'spring-boot'}
                      onChange={() => setSelectedBackendFramework('spring-boot')}
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4 opacity-70">
                    <div>
                      <p className="font-semibold text-slate-300">Node.js + Express</p>
                      <p className="text-xs text-amber-300">In development</p>
                    </div>
                    <input type="radio" name="backend-framework" disabled />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4 opacity-70">
                    <div>
                      <p className="font-semibold text-slate-300">ASP.NET Core</p>
                      <p className="text-xs text-amber-300">In development</p>
                    </div>
                    <input type="radio" name="backend-framework" disabled />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Frontend Framework</h3>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
                    <div>
                      <p className="font-semibold text-cyan-300">No Frontend</p>
                      <p className="text-xs text-slate-300">Current default</p>
                    </div>
                    <input
                      type="radio"
                      name="frontend-framework"
                      checked={selectedFrontendFramework === 'none'}
                      onChange={() => setSelectedFrontendFramework('none')}
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4 opacity-70">
                    <div>
                      <p className="font-semibold text-slate-300">React</p>
                      <p className="text-xs text-amber-300">In development</p>
                    </div>
                    <input type="radio" name="frontend-framework" disabled />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4 opacity-70">
                    <div>
                      <p className="font-semibold text-slate-300">Vue</p>
                      <p className="text-xs text-amber-300">In development</p>
                    </div>
                    <input type="radio" name="frontend-framework" disabled />
                  </label>
                </div>
              </div>
            </div>

            {error && <p className="mt-4 rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300">{error}</p>}

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={isBusy}
                className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleScaffoldCode}
                disabled={isBusy || selectedBackendFramework !== 'spring-boot' || !dbmlCode.trim()}
                className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-600"
              >
                {isCodeLoading ? 'Scaffolding Code...' : 'Scaffold and Continue'}
              </button>
            </div>
          </section>
          </div>
        )}

        {currentStep === 4 && (
          <div className="px-6 pb-6 overflow-auto h-full">
          <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
            <h2 className="text-xl font-semibold">Generated Code</h2>
            <p className="mt-1 text-sm text-slate-400">Visualize generated files or download your code package.</p>
            {projectName && <p className="mt-2 text-xs text-slate-500">Project: {projectName}</p>}

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <button
                onClick={() => setIsCodeModalOpen(true)}
                disabled={generatedCode.length === 0}
                className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-4 text-left transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <p className="font-semibold text-cyan-300">Visualize Code</p>
                <p className="mt-1 text-xs text-slate-300">Open code viewer for generated files.</p>
              </button>

              <button
                onClick={handleDownloadCode}
                disabled={!selectedProjectId || generatedCode.length === 0 || isDownloading}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-left transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <p className="font-semibold text-emerald-300">Download Code</p>
                <p className="mt-1 text-xs text-slate-300">Download ZIP package of generated backend.</p>
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                className="rounded-lg border border-slate-600 bg-slate-900/40 p-4 text-left transition hover:bg-slate-700/50"
              >
                <p className="font-semibold text-slate-200">Back to Scaffold</p>
                <p className="mt-1 text-xs text-slate-400">Change framework selections and re-generate.</p>
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
              <p className="text-sm font-semibold text-slate-200">Generated Files ({generatedCode.length})</p>
              {generatedCode.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">No files generated yet.</p>
              ) : (
                <ul className="mt-2 max-h-64 list-disc space-y-1 overflow-auto pl-5 text-sm text-slate-300">
                  {generatedCode.map((file) => (
                    <li key={file.fileName}>{file.fileName}</li>
                  ))}
                </ul>
              )}
            </div>

            {error && <p className="mt-4 rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300">{error}</p>}
          </section>
          </div>
        )}
      </main>
    </div>
  );
}
