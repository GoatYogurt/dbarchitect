
import React from 'react';
import { BrainCircuitIcon } from './icons';

const Loader: React.FC = () => {
  const messages = [
    "Analyzing requirements...",
    "Architecting database schema...",
    "Defining tables and columns...",
    "Establishing relationships...",
    "Optimizing for performance...",
    "Finalizing DBML...",
  ];
  const [message, setMessage] = React.useState(messages[0]);

  React.useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setMessage(messages[index]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
      aria-live="assertive"
      role="alert"
    >
      <BrainCircuitIcon className="w-16 h-16 text-cyan-400 animate-pulse" />
      <h2 className="text-2xl font-bold text-slate-100 mt-6">Generating Schema</h2>
      <p className="text-slate-400 mt-2 transition-opacity duration-500">{message}</p>
    </div>
  );
};

export default Loader;
