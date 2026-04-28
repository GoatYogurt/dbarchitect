import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DbmlEditor } from './components/DbmlEditor';
import { SchemaVisualizer } from './components/SchemaVisualizer';
import { ChatPanel } from './components/ChatPanel';
import { useBackend } from './hooks/useBackend';
import { parseDBML } from './services/dbmlParser';
import { ParsedSchema, GeneratedFile, Project, ClarificationAnswer, ClarificationQuestion, ChatMessage } from './types';
import Loader from './components/Loader';
import { CodeGenerationModal } from './components/CodeGenerationModal';
import { CodeDownloadPopup } from './components/CodeDownloadPopup';
import { ProjectSelectModal } from './components/ProjectSelectModal';
import { CodeDiffModal } from './components/CodeDiffModal';

const WELCOME_MESSAGE = 'Describe the system you want to model. I will ask for missing details and keep the DBML canvas in sync.';

const createChatMessage = (role: ChatMessage['role'], content: string): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
});

export default function App() {
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    createChatMessage('assistant', WELCOME_MESSAGE),
  ]);
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
  const [conversationSeed, setConversationSeed] = useState<string>('');

  const {
    chatWithAgent,
    isLoading,
    generateSpringBootCode,
    isCodeLoading,
    isDbmlUpdating,
    error,
    updateDbml,
    downloadGeneratedCode,
    fetchProjects,
  } = useBackend();

  const isWorkspaceBusy = isCodeLoading || isDbmlUpdating || isLoadingProjects;
  const hasDbmlChanged = useMemo(
    () => dbmlCode.trim() !== originalDbmlCode.trim(),
    [dbmlCode, originalDbmlCode]
  );

  const canSendPrompt = useMemo(
    () => Boolean(chatPrompt.trim()) && Boolean(projectName.trim()) && clarificationQuestions.length === 0,
    [chatPrompt, clarificationQuestions.length, projectName]
  );

  const resetClarificationFlow = useCallback(() => {
    setClarificationQuestions([]);
    setClarificationAnswers({});
    setClarificationError(null);
    setConversationSeed('');
  }, []);

  const resetWorkspace = useCallback(() => {
    resetClarificationFlow();
    setChatPrompt('');
    setChatMessages([createChatMessage('assistant', WELCOME_MESSAGE)]);
    setProjectName('');
    setDbmlCode('');
    setOriginalDbmlCode('');
    setGeneratedCode([]);
    setSelectedProjectId(null);
    setIsEditorCollapsed(false);
  }, [resetClarificationFlow]);

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

  const applyGeneratedDbml = useCallback((nextDbmlCode: string, assistantMessage: string) => {
    resetClarificationFlow();
    setDbmlCode(nextDbmlCode);
    setOriginalDbmlCode(nextDbmlCode);
    setSelectedProjectId(null);
    setGeneratedCode([]);
    setChatMessages((prev) => [...prev, createChatMessage('assistant', assistantMessage)]);
  }, [resetClarificationFlow]);

  const handleSendPrompt = useCallback(async () => {
    const prompt = chatPrompt.trim();
    if (!prompt || !projectName.trim() || clarificationQuestions.length > 0) {
      return;
    }

    setClarificationError(null);
    setChatMessages((prev) => [...prev, createChatMessage('user', prompt)]);
    setConversationSeed(prompt);

    const response = await chatWithAgent(prompt, projectName, []);
    if (!response) {
      return;
    }

    setChatPrompt('');

    if (!response.isClear) {
      setClarificationQuestions(response.questions);
      setClarificationAnswers({});
      setChatMessages((prev) => [...prev, createChatMessage('assistant', 'I need a few clarifications before I can generate the DBML. Answer the questions below to continue.')]);
      return;
    }

    applyGeneratedDbml(response.cleanDbmlCode, 'DBML generated and rendered in the canvas.');
  }, [applyGeneratedDbml, chatPrompt, chatWithAgent, clarificationQuestions.length, projectName]);

  const handleSubmitClarifications = useCallback(async () => {
    if (!conversationSeed || clarificationQuestions.length === 0 || !projectName.trim()) {
      return;
    }

    const payload = buildClarificationPayload();
    if (!payload) {
      return;
    }

    const response = await chatWithAgent(conversationSeed, projectName, payload);
    if (!response) {
      return;
    }

    if (!response.isClear) {
      setClarificationQuestions(response.questions);
      setClarificationAnswers({});
      setChatMessages((prev) => [...prev, createChatMessage('assistant', 'I still need a little more detail before I can finalize the DBML.')]);
      return;
    }

    applyGeneratedDbml(response.cleanDbmlCode, 'DBML generated from your answers and rendered in the canvas.');
  }, [applyGeneratedDbml, buildClarificationPayload, chatWithAgent, clarificationQuestions.length, conversationSeed, projectName]);

  const handleScaffoldCode = useCallback(async () => {
    if (!dbmlCode.trim()) {
      return;
    }

    const files = await generateSpringBootCode(dbmlCode);
    if (!files) {
      return;
    }

    setGeneratedCode(files);
    setChatMessages((prev) => [
      ...prev,
      createChatMessage('system', `Generated ${files.length} Spring Boot file${files.length === 1 ? '' : 's'}. Open the code viewer to inspect the scaffold.`),
    ]);
  }, [dbmlCode, generateSpringBootCode]);

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
    setChatPrompt('');
    setConversationSeed('');
    setGeneratedCode([]);
    setIsEditorCollapsed(false);
    setChatMessages([
      createChatMessage('assistant', `Loaded ${project.projectName}. The DBML is now available for editing, saving, or comparison.`),
    ]);
  }, [resetClarificationFlow]);

  const handleCreateNewProject = useCallback(() => {
    resetWorkspace();
  }, [resetWorkspace]);

  const handleSaveDbml = useCallback(async () => {
    if (!selectedProjectId || !dbmlCode.trim()) {
      return;
    }

    const success = await updateDbml(selectedProjectId, dbmlCode);
    if (!success) {
      return;
    }

    setOriginalDbmlCode(dbmlCode);
    setChatMessages((prev) => [...prev, createChatMessage('system', 'DBML changes were saved to the selected project.')]);
  }, [dbmlCode, selectedProjectId, updateDbml]);

  useEffect(() => {
    if (!dbmlCode.trim()) {
      setParsedSchema({ tables: [], refs: [] });
      return;
    }

    try {
      const schema = parseDBML(dbmlCode);
      setParsedSchema(schema);
    } catch (e) {
      console.error('DBML Parsing Error:', e);
    }
  }, [dbmlCode]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-900 text-slate-100">
      {isWorkspaceBusy && <Loader />}

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

      <header className="flex-shrink-0 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">DBArchitect</h1>
            <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Workspace
            </span>
            <button
              onClick={() => setIsProjectSelectorOpen(true)}
              disabled={isWorkspaceBusy}
              className="ml-2 flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-cyan-500 hover:bg-slate-700/70 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Load project"
              title="Load a project"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-300">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
              {projectName ? projectName : 'Load Project'}
            </button>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Current Project</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">{projectName || 'Untitled workspace'}</p>
          </div>
        </div>
      </header>

      <div className="flex-shrink-0 border-b border-slate-800 bg-slate-900/75 px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-300">
            <span className="uppercase tracking-[0.25em] text-slate-500">Schema</span>
            <span className="ml-2 text-cyan-300">{dbmlCode.trim() ? 'Rendered' : 'Waiting for chat'}</span>
          </div>
          {selectedProjectId && (
            <div className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-300">
              Linked to project #{selectedProjectId}
            </div>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={handleScaffoldCode}
              disabled={isWorkspaceBusy || !dbmlCode.trim()}
              className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
            >
              Scaffold Code
            </button>
            <button
              onClick={() => setIsCodeModalOpen(true)}
              disabled={generatedCode.length === 0}
              className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
            >
              View Generated Code
            </button>
            <button
              onClick={handleDownloadCode}
              disabled={isWorkspaceBusy || !selectedProjectId || isDownloading}
              className="rounded-md border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
            >
              Download Code
            </button>
            <button
              onClick={() => setIsDiffModalOpen(true)}
              disabled={isWorkspaceBusy || !selectedProjectId || !dbmlCode.trim() || !hasDbmlChanged}
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
              title={hasDbmlChanged ? 'Compare changes' : 'Edit DBML to enable comparison'}
            >
              Compare Changes
            </button>
          </div>
        </div>
      </div>

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <ChatPanel
          isCollapsed={isChatCollapsed}
          onToggleCollapse={() => setIsChatCollapsed((prev) => !prev)}
          projectName={projectName}
          onProjectNameChange={setProjectName}
          messages={chatMessages}
          prompt={chatPrompt}
          onPromptChange={setChatPrompt}
          onSendPrompt={handleSendPrompt}
          canSendPrompt={canSendPrompt}
          isSending={isLoading}
          clarificationQuestions={clarificationQuestions}
          clarificationAnswers={clarificationAnswers}
          onUpdateSingleChoiceAnswer={updateSingleChoiceAnswer}
          onUpdateTextAnswer={updateTextAnswer}
          onUpdateMultiChoiceAnswer={updateMultiChoiceAnswer}
          onSubmitClarifications={handleSubmitClarifications}
          clarificationError={clarificationError}
          error={error}
          isThinking={isLoading}
        />

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-900/70">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-violet-300">Canvas</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-100">DBML visualizer</h2>
            </div>
            <div className="text-xs text-slate-500">Rendered from the center pane and updated by the chat flow</div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden p-4">
            <SchemaVisualizer schema={parsedSchema} />
          </div>
        </section>

        {isEditorCollapsed ? (
          <aside className="flex h-full w-14 flex-col border-l border-slate-800 bg-slate-950/90">
            <button
              type="button"
              onClick={() => setIsEditorCollapsed(false)}
              className="flex h-full items-center justify-center border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300 transition hover:bg-slate-800"
              aria-label="Expand DBML editor panel"
            >
              <span className="-rotate-90 whitespace-nowrap">DBML</span>
            </button>
          </aside>
        ) : (
          <aside className="flex h-full w-[24rem] max-w-[32vw] min-w-[20rem] flex-col border-l border-slate-800 bg-slate-950/95 shadow-[0_0_50px_rgba(8,15,31,0.45)]">
            <DbmlEditor
              value={dbmlCode}
              onChange={setDbmlCode}
              onSave={handleSaveDbml}
              onCompare={() => setIsDiffModalOpen(true)}
              onToggleCollapse={() => setIsEditorCollapsed(true)}
              isSaving={isDbmlUpdating}
              isComparing={false}
              canSave={Boolean(selectedProjectId) && hasDbmlChanged}
              canCompare={Boolean(selectedProjectId) && hasDbmlChanged}
            />
          </aside>
        )}
      </main>
    </div>
  );
}
