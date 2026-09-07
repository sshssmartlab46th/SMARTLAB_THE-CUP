import React from 'react';
import { LiveMatchBoard } from '@/components/LiveMatchBoard';
import { Shield, Radio, Activity, Cpu, Database, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'THE SANGSAN | 실시간 스포츠 경기 중계 시스템',
  description: '1,000 CCU 고부하 대응 제로 비용(Zero-Cost) 실시간 경기 중계 플랫폼'
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-red-900 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-900 to-slate-900 border border-red-800/80 flex items-center justify-center text-red-400 font-bold shadow-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-black text-lg text-white tracking-wider">
                  THE SANGSAN
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800/50">
                  LIVE BROADCAST
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                상산고등학교 체육대회·축제 실시간 스포츠 공식 중계
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Zero-Cost Edge Shield</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Broadcast Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Core Live Scoreboard Component with Smart Polling */}
        <LiveMatchBoard matchId="final-soccer-2026" />

        {/* Global Architecture Telemetry Bar */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              시스템 실시간 방어 상태 (Edge Runtime &amp; Smart Polling)
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">100% Free-Tier Safe</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <span className="text-slate-500 block">SWR Smart Polling</span>
              <span className="text-slate-200 font-mono font-medium">5,000ms (Tab-Active Only)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Edge CDN Caching</span>
              <span className="text-cyan-400 font-mono font-medium">s-maxage=5, SWR=59</span>
            </div>
            <div>
              <span className="text-slate-500 block">Supabase Connection</span>
              <span className="text-emerald-400 font-mono font-medium">0.2 Query/sec (Pooler Safe)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Vercel Quota Usage</span>
              <span className="text-amber-400 font-mono font-medium">&lt; 1% of 1M Monthly</span>
            </div>
          </div>
        </section>
      </main>

      {/* Mandatory Official Footer */}
      <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500 space-y-1">
        <div>© 2026 Sangsan High School Athletic Festival. All rights reserved.</div>
        <div className="text-[11px] text-slate-500 font-mono">
          made by SMARTLAB 김태호
        </div>
      </footer>
    </div>
  );
}
