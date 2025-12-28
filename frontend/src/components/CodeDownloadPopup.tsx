import React, { useEffect, useState } from 'react';
import { CheckIcon, ServerIcon, DownloadIcon } from './icons';

interface CodeDownloadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  isGenerating: boolean;
  isSuccess: boolean;
}

export function CodeDownloadPopup({ 
  isOpen, 
  onClose, 
  isGenerating, 
  isSuccess 
}: CodeDownloadPopupProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isGenerating && isOpen) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          return prev + Math.random() * 15;
        });
      }, 300);
      return () => clearInterval(interval);
    } else if (isSuccess) {
      setProgress(100);
    }
  }, [isGenerating, isSuccess, isOpen]);

  // Auto close after success
  useEffect(() => {
    if (isSuccess && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-emerald-500/30 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-8 flex flex-col items-center text-center">
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 animate-pulse"></div>

          {/* Icon Section */}
          <div className="relative mb-6">
            {isGenerating && (
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full p-5 animate-bounce-slow">
                  <ServerIcon className="w-12 h-12 text-white animate-spin-slow" />
                </div>
              </div>
            )}
            {isSuccess && (
              <div className="relative animate-successPop">
                <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl"></div>
                <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full p-5">
                  <CheckIcon className="w-12 h-12 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            {isGenerating && 'Generating Code'}
            {isSuccess && 'Success!'}
          </h2>

          {/* Description */}
          <p className="text-slate-400 mb-6 text-sm">
            {isGenerating && 'Creating your Spring Boot project...'}
            {isSuccess && 'Your code is being downloaded!'}
          </p>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="w-full mb-4">
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-300 ease-out animate-shimmer"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">{Math.round(progress)}% complete</p>
            </div>
          )}

          {/* Success Animation */}
          {isSuccess && (
            <div className="flex items-center gap-3 text-emerald-400 animate-fadeIn">
              <DownloadIcon className="w-5 h-5 animate-bounce" />
              <span className="text-sm font-medium">Downloading ZIP file...</span>
            </div>
          )}

          {/* Loading dots */}
          {isGenerating && (
            <div className="flex gap-2 mt-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
        </div>

        {/* Bottom decoration */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500"></div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes successPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-successPop {
          animation: successPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
