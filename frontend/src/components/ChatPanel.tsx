import React, { useEffect, useRef } from 'react';
import { ClarificationQuestion, ChatMessage } from '../types';

interface ChatPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  messages: ChatMessage[];
  prompt: string;
  onPromptChange: (value: string) => void;
  onSendPrompt: () => void;
  canSendPrompt: boolean;
  isSending: boolean;
  clarificationQuestions: ClarificationQuestion[];
  clarificationAnswers: Record<number, string | string[]>;
  onUpdateSingleChoiceAnswer: (index: number, value: string) => void;
  onUpdateTextAnswer: (index: number, value: string) => void;
  onUpdateMultiChoiceAnswer: (index: number, option: string, checked: boolean) => void;
  onSubmitClarifications: () => void;
  clarificationError: string | null;
  error: string | null;
  isThinking: boolean;
}

export function ChatPanel({
  isCollapsed,
  onToggleCollapse,
  projectName,
  onProjectNameChange,
  messages,
  prompt,
  onPromptChange,
  onSendPrompt,
  canSendPrompt,
  isSending,
  clarificationQuestions,
  clarificationAnswers,
  onUpdateSingleChoiceAnswer,
  onUpdateTextAnswer,
  onUpdateMultiChoiceAnswer,
  onSubmitClarifications,
  clarificationError,
  error,
  isThinking,
}: ChatPanelProps) {
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [clarificationQuestions.length, messages.length]);

  if (isCollapsed) {
    return (
      <aside className="flex h-full w-14 flex-col border-r border-slate-800 bg-slate-950/90">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-full items-center justify-center border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300 transition hover:bg-slate-800"
          aria-label="Expand chat panel"
        >
          <span className="-rotate-90 whitespace-nowrap">Chat</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[22rem] max-w-[30vw] min-w-[20rem] flex-col border-r border-slate-800 bg-slate-950/95 shadow-[0_0_50px_rgba(8,15,31,0.45)]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Agent Chat</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-100">Talk to the DBML agent</h2>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-md border border-slate-700 px-2 py-1 text-xs font-medium text-slate-300 transition hover:border-cyan-500 hover:text-cyan-200"
          aria-label="Minimize chat panel"
        >
          Minimize
        </button>
      </div>

      <div className="border-b border-slate-800 px-4 py-3">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="project-name-input">
          Project Name
        </label>
        <input
          id="project-name-input"
          type="text"
          value={projectName}
          onChange={(event) => onProjectNameChange(event.target.value)}
          placeholder="Course Management System"
          className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
        />
      </div>

      <div ref={transcriptRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm whitespace-pre-wrap ${
                message.role === 'user'
                  ? 'bg-cyan-500 text-slate-950'
                  : message.role === 'system'
                    ? 'border border-slate-700 bg-slate-900/80 text-slate-300'
                    : 'border border-slate-700 bg-slate-900/70 text-slate-200'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="flex max-w-[90%] items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-300 shadow-sm">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
              AI is thinking...
            </div>
          </div>
        )}

        {clarificationQuestions.length > 0 && (
          <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Clarifications needed</p>
            <p className="mt-2 text-sm text-slate-300">Answer these questions and send them back to continue the chat.</p>

            <div className="mt-4 space-y-4">
              {clarificationQuestions.map((question, index) => (
                <div key={`${question.question_text}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
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
                              onChange={(event) => onUpdateMultiChoiceAnswer(index, option, event.target.checked)}
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
                            onChange={() => onUpdateSingleChoiceAnswer(index, option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'text' && (
                    <textarea
                      value={typeof clarificationAnswers[index] === 'string' ? clarificationAnswers[index] as string : ''}
                      onChange={(event) => onUpdateTextAnswer(index, event.target.value)}
                      placeholder="Type your answer"
                      className="mt-3 h-24 w-full rounded-lg border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
                    />
                  )}
                </div>
              ))}
            </div>

            {clarificationError && (
              <p className="mt-4 rounded-md border border-amber-700 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">
                {clarificationError}
              </p>
            )}

            <button
              type="button"
              onClick={onSubmitClarifications}
              disabled={isSending}
              className="mt-4 w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {isSending ? 'Submitting...' : 'Send Answers'}
            </button>
          </div>
        )}

        {error && (
          <p className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>

      <div className="border-t border-slate-800 px-4 py-4">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="chat-prompt">
          Prompt
        </label>
        <textarea
          id="chat-prompt"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (canSendPrompt) {
                onSendPrompt();
              }
            }
          }}
          placeholder="Describe the app you want to model..."
          rows={4}
          disabled={clarificationQuestions.length > 0}
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {clarificationQuestions.length > 0 ? 'Answer the questions above before sending a new prompt.' : 'Press Enter to send, Shift+Enter for a new line.'}
          </p>
          <button
            type="button"
            onClick={onSendPrompt}
            disabled={isSending || !canSendPrompt || clarificationQuestions.length > 0}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </aside>
  );
}