import React from 'react';

export default function TopNav() {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">🔥</div>
        <div>
          <h1 className="text-lg font-bold tracking-wide">IGNITE</h1>
          <p className="text-[10px] text-gray-500 -mt-1 tracking-widest">SIH 2026 • SIH26142</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Prototype Demonstration</span>
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="System Online"></span>
      </div>
    </header>
  );
}
