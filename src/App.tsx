import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-semibold text-slate-300 mb-2 font-mono tracking-tight">
          THE SANGSAN
        </h1>
        <p className="text-sm text-slate-500">
          대기 중입니다. 지시에 따라 작업을 시작합니다.
        </p>
      </div>
      <footer className="fixed bottom-4 text-[11px] text-slate-600 font-sans tracking-wide">
        made by SMARTLAB
      </footer>
    </div>
  );
}
