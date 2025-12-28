
import React from 'react';
import { Table } from '../types';
import { KeyIcon, ColumnsIcon } from './icons';

interface TableCardProps {
  table: Table;
}

export function TableCard({ table }: TableCardProps) {
  return (
    <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden transition-shadow hover:shadow-lg hover:shadow-cyan-500/10">
      <div className="p-3 bg-slate-700/30 border-b border-slate-700">
        <h4 className="font-bold text-slate-200">{table.name}</h4>
      </div>
      <ul className="divide-y divide-slate-800">
        {table.columns.map((column) => {
          const isPk = column.attributes.includes('pk');
          return (
            <li key={column.name} className="p-3 flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                {isPk ? (
                  <KeyIcon className="w-4 h-4 text-yellow-400" />
                ) : (
                  <ColumnsIcon className="w-4 h-4 text-slate-500" />
                )}
                <span className={`font-mono ${isPk ? 'text-yellow-300' : 'text-slate-300'}`}>
                  {column.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-400">{column.type}</span>
                {column.attributes.length > 0 && (
                  <div className="flex gap-1">
                    {column.attributes.map(attr => (
                      <span key={attr} className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                        {attr}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
