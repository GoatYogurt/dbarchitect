import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DbmlEditor } from './components/DbmlEditor';
import { SchemaVisualizer } from './components/SchemaVisualizer';
import { useBackend } from './hooks/useBackend';
import { parseDBML } from './services/dbmlParser';
import { ParsedSchema, GeneratedFile, Project, ClarificationAnswer, ClarificationQuestion } from './types';
import Loader from './components/Loader';
import { CodeGenerationModal } from './components/CodeGenerationModal';
import { CodeDownloadPopup } from './components/CodeDownloadPopup';
import { ProjectSelectModal } from './components/ProjectSelectModal';
import { CodeDiffModal } from './components/CodeDiffModal';

type WizardStep = 1 | 2 | 3 | 4;

export default function App() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [requirements, setRequirements] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [dbmlCode, setDbmlCode] = useState<string>('');
  const [originalDbmlCode, setOriginalDbmlCode] = useState<string>('');
  const [parsedSchema, setParsedSchema] = useState<ParsedSchema>({ tables: [], refs: [] });
  const [generatedCode, setGeneratedCode] = useState<GeneratedFile[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isDownloadPopupOpen, setIsDownloadPopupOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<number, string | string[]>>({});
  const [clarificationError, setClarificationError] = useState<string | null>(null);

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
    fetchProjects,
  } = useBackend();

  const isBusy = isLoading || isCodeLoading || isDbmlUpdating;
  const hasDbmlChanged = useMemo(
    () => dbmlCode.trim() !== originalDbmlCode.trim(),
    [dbmlCode, originalDbmlCode]
  );

  const steps = useMemo(
    () => [
      { id: 1 as WizardStep, title: 'Input Requirements' },
      { id: 2 as WizardStep, title: 'Schema Diagram' },
      { id: 3 as WizardStep, title: 'Scaffold Code' },
      { id: 4 as WizardStep, title: 'Generated Code' },
    ],
    []
  );

  const areClarificationAnswersComplete = useMemo(() => {
    if (clarificationQuestions.length === 0) {
      return true;
    }

    return clarificationQuestions.every((question, index) => {
      const answer = clarificationAnswers[index];
      if (question.type === 'text') {
        return typeof answer === 'string' && answer.trim().length > 0;
      }
      if (question.type === 'single_choice') {
        return typeof answer === 'string' && answer.trim().length > 0;
      }

      return Array.isArray(answer) && answer.length > 0;
    });
  }, [clarificationAnswers, clarificationQuestions]);

  const resetClarificationFlow = useCallback(() => {
    setClarificationQuestions([]);
    setClarificationAnswers({});
    setClarificationError(null);
  }, []);

  const updateSingleChoiceAnswer = useCallback((index: number, value: string) => {
    setClarificationAnswers((prev) => ({ ...prev, [index]: value }));
    setClarificationError(null);
  }, []);

  const updateTextAnswer = useCallback((index: number, value: string) => {
    setClarificationAnswers((prev) => ({ ...prev, [index]: value }));
    setClarificationError(null);
  }, []);

  const updateMultiChoiceAnswer = useCallback((index: number, option: string, checked: boolean) => {
    setClarificationAnswers((prev) => {
      const current = Array.isArray(prev[index]) ? (prev[index] as string[]) : [];
      const updated = checked
        ? Array.from(new Set([...current, option]))
        : current.filter((item) => item !== option);

      return { ...prev, [index]: updated };
    });
    setClarificationError(null);
  }, []);

  const buildClarificationPayload = useCallback((): ClarificationAnswer[] | null => {
    const payload: ClarificationAnswer[] = [];

    for (let index = 0; index < clarificationQuestions.length; index += 1) {
      const question = clarificationQuestions[index];
      const answer = clarificationAnswers[index];

      if (question.type === 'text') {
        if (typeof answer !== 'string' || !answer.trim()) {
          setClarificationError(`Please answer question ${index + 1}.`);
          return null;
        }
        payload.push({ question_text: question.question_text, answer: answer.trim() });
        continue;
      }

      if (question.type === 'single_choice') {
        if (typeof answer !== 'string' || !answer.trim()) {
          setClarificationError(`Please choose one option for question ${index + 1}.`);
          return null;
        }
        payload.push({ question_text: question.question_text, answer });
        continue;
      }

      if (!Array.isArray(answer) || answer.length === 0) {
        setClarificationError(`Please choose at least one option for question ${index + 1}.`);
        return null;
      }
      payload.push({ question_text: question.question_text, answer });
    }

    return payload;
  }, [clarificationAnswers, clarificationQuestions]);

  const handleGenerateSchema = useCallback(async () => {
    if (!requirements.trim() || !projectName.trim()) {
      return;
    }

    setClarificationError(null);

    let answers: ClarificationAnswer[] = [];
    if (clarificationQuestions.length > 0) {
      const payload = buildClarificationPayload();
      if (!payload) {
        return;
      }
      answers = payload;
    }

    const response = await generateDbml(requirements, projectName, answers);
    if (!response) {
      return;
    }

    if (!response.isClear) {
      setClarificationQuestions(response.questions);
      setClarificationAnswers({});
      setDbmlCode('');
      setOriginalDbmlCode('');
      setGeneratedCode([]);
      setSelectedProjectId(null);
      return;
    }

    resetClarificationFlow();
    setDbmlCode(response.cleanDbmlCode);
    setOriginalDbmlCode(response.cleanDbmlCode);
    setSelectedProjectId(null);
    setGeneratedCode([]);
    setCurrentStep(2);
  }, [requirements, projectName, clarificationQuestions.length, buildClarificationPayload, generateDbml, resetClarificationFlow]);

  const handleContinueFromSchema = useCallback(async () => {
    if (!dbmlCode.trim()) {
      return;
    }

    if (selectedProjectId) {
      const success = await updateDbml(selectedProjectId, dbmlCode);
      if (!success) {
        return;
      }

      setOriginalDbmlCode(dbmlCode);
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

  const handleLoadProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    const loadedProjects = await fetchProjects();
    if (loadedProjects) {
      setProjects(loadedProjects);
    }
    setIsLoadingProjects(false);
  }, [fetchProjects]);

  const handleSelectProject = useCallback((project: Project) => {
    resetClarificationFlow();
    setProjectName(project.projectName);
    setDbmlCode(project.cleanDbmlCode);
    setOriginalDbmlCode(project.cleanDbmlCode);
    setSelectedProjectId(project.projectId);
    setRequirements('');
    setGeneratedCode([]);
    setCurrentStep(2);
  }, [resetClarificationFlow]);

  const handleCreateNewProject = useCallback(() => {
    resetClarificationFlow();
    setProjectName('');
    setRequirements('');
    setDbmlCode('');
    setOriginalDbmlCode('');
    setSelectedProjectId(null);
    setGeneratedCode([]);
    setCurrentStep(1);
  }, [resetClarificationFlow]);

  const handleTabFillExamples = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      resetClarificationFlow();
      setProjectName('Course Management System');
      setRequirements('Build a course management system with users, courses, enrollments, and payments.');
    }
  }, [resetClarificationFlow]);

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

      <CodeDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        projectId={selectedProjectId}
        newDbmlCode={dbmlCode}
      />

      <ProjectSelectModal
        isOpen={isProjectSelectorOpen}
        onClose={() => setIsProjectSelectorOpen(false)}
        projects={projects}
        onSelectProject={handleSelectProject}
        onCreateNew={handleCreateNewProject}
        isLoading={isLoadingProjects}
        onRefresh={handleLoadProjects}
      />

      <header className="flex-shrink-0 border-b border-slate-700 bg-slate-800/60 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">DBArchitect</h1>
            <button
              onClick={() => setIsProjectSelectorOpen(true)}
              disabled={isBusy}
              className="ml-2 flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-slate-700/50 text-slate-200 hover:bg-slate-600/50 border border-slate-600 hover:border-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Load project"
              title="Load a project"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
              {projectName ? projectName : 'Load Project'}
            </button>
          </div>
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
              Enter a project name and describe your system requirements. If the request is unclear, answer the follow-up questions and submit again.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="projectName" className="mb-2 block text-sm font-medium text-slate-300">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={handleTabFillExamples}
                  placeholder="Example: Course Management System"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="requirements" className="mb-2 block text-sm font-medium text-slate-300">
                  Requirements Description
                </label>
                <textarea
                  id="requirements"
                  value={requirements}
                  onChange={(e) => {
                    resetClarificationFlow();
                    setRequirements(e.target.value);
                  }}
                  onKeyDown={handleTabFillExamples}
                  placeholder="Example: Build a course management system with users, courses, enrollments, and payments."
                  className="h-48 w-full rounded-lg border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500"
                />
              </div>

              {clarificationQuestions.length > 0 && (
                <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Clarification Questions</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Please answer all questions below, then submit again.
                  </p>

                  <div className="mt-4 space-y-4">
                    {clarificationQuestions.map((question, index) => (
                      <div key={`${question.question_text}-${index}`} className="rounded-md border border-slate-700 bg-slate-900/50 p-3">
                        <p className="text-sm font-medium text-slate-100">{index + 1}. {question.question_text}</p>

                        {question.type === 'multi_choice' && (
                          <div className="mt-3 space-y-2">
                            {(question.options || []).map((option) => {
                              const current = Array.isArray(clarificationAnswers[index]) ? (clarificationAnswers[index] as string[]) : [];
                              const checked = current.includes(option);

                              return (
                                <label key={option} className="flex items-center gap-2 text-sm text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => updateMultiChoiceAnswer(index, option, e.target.checked)}
                                  />
                                  {option}
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {question.type === 'single_choice' && (
                          <div className="mt-3 space-y-2">
                            {(question.options || []).map((option) => (
                              <label key={option} className="flex items-center gap-2 text-sm text-slate-300">
                                <input
                                  type="radio"
                                  name={`single-choice-question-${index}`}
                                  checked={clarificationAnswers[index] === option}
                                  onChange={() => updateSingleChoiceAnswer(index, option)}
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        )}

                        {question.type === 'text' && (
                          <textarea
                            value={typeof clarificationAnswers[index] === 'string' ? clarificationAnswers[index] as string : ''}
                            onChange={(e) => updateTextAnswer(index, e.target.value)}
                            placeholder="Type your answer"
                            className="mt-3 h-24 w-full rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && <p className="mt-3 rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300">{error}</p>}
            {clarificationError && <p className="mt-3 rounded-md border border-amber-800 bg-amber-900/30 px-3 py-2 text-sm text-amber-200">{clarificationError}</p>}

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleGenerateSchema}
                disabled={isBusy || !requirements.trim() || !projectName.trim() || (clarificationQuestions.length > 0 && !areClarificationAnswersComplete)}
                className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-slate-600"
              >
                {isLoading
                  ? clarificationQuestions.length > 0
                    ? 'Submitting Answers...'
                    : 'Generating Schema...'
                  : clarificationQuestions.length > 0
                    ? 'Submit Answers'
                    : 'Continue to Schema Diagram'}
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDiffModalOpen(true)}
                    disabled={isBusy || !selectedProjectId || !dbmlCode.trim() || !hasDbmlChanged}
                    className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-600"
                    title={hasDbmlChanged ? 'Compare changes' : 'Edit DBML to enable comparison'}
                  >
                    Compare Changes
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
          <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
            <div className="overflow-auto px-6 pt-2 pb-4">
              <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
                <h2 className="text-xl font-semibold">Generated Code</h2>
                <p className="mt-1 text-sm text-slate-400">Visualize generated files or download your code package.</p>
                {projectName && <p className="mt-2 text-xs text-slate-500">Project: {projectName}</p>}

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    disabled={!selectedProjectId || isDownloading}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-left transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <p className="font-semibold text-emerald-300">Download Code</p>
                    <p className="mt-1 text-xs text-slate-300">Download ZIP package of generated backend.</p>
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

            <div className="border-t border-slate-700 bg-slate-800">
              <div className="flex items-center justify-between px-6 py-3">
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={isBusy}
                  className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
