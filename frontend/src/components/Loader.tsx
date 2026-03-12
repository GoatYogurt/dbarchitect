
import React from 'react';
import { BrainCircuitIcon } from './icons';

const Loader: React.FC = () => {
  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
      aria-live="assertive"
      role="alert"
    >
      <BrainCircuitIcon className="w-16 h-16 text-cyan-400 animate-pulse" />
      <p className="text-slate-400 mt-6">Loading...</p>
    </div>
  );
};

export default Loader;
