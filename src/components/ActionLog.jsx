import React from 'react';
import { Terminal } from 'lucide-react';

export default function ActionLog({ logs }) {
  return (
    <div className="w-full flex-1 pixel-border bg-zinc-950 p-3.5 pixel-shadow flex flex-col gap-3 min-h-0">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <Terminal className="w-4 h-4 text-emerald-400" />
        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-pressstart">
          QUEST JOURNAL
        </span>
      </div>

      {/* Scrolling Logger Box */}
      <div className="flex-1 overflow-y-auto pr-1 text-[11px] font-mono text-emerald-500 leading-relaxed flex flex-col gap-1.5 min-h-0">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 items-start hover:bg-zinc-900 px-1 py-0.5 transition-colors">
            <span className="text-emerald-700 font-semibold select-none shrink-0 font-mono">[{log.timestamp}]</span>
            <span className="break-all">{log.text}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-zinc-600 text-center py-6 select-none font-mono">
            No adventure journal logs today.
          </div>
        )}
      </div>
    </div>
  );
}
