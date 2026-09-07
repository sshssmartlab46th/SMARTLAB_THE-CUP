import React from 'react';
import { Shield, Sparkles, Award, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top brand & credit banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-900 pb-8">
          <div className="flex items-center gap-4">
            <img
              src="https://cdn.kyobit.com/news/photo/202511/2241_2193_3618.png"
              alt="상산고등학교 로고"
              className="w-12 h-12 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-lg text-white tracking-wider">
                  THE SANGSAN
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-900 font-mono">
                  v2.4.0 RELEASE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                상산고등학교 체육대회 및 축제 실시간 통합 운영 플랫폼
              </p>
            </div>
          </div>

          {/* SMARTLAB Logo representation */}
          <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <img
              src="https://jetiytrryejszscyfquv.supabase.co/storage/v1/object/sign/drive/public/caea8060-a1e8-408b-971f-b77d7b2a940b.png?token=eyJraWQiOiIzY2RhODRkZC00NzFlLTRiNzQtYjJhZC05NTAxNGZjZTI5MmMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkcml2ZS9wdWJsaWMvY2FlYTgwNjAtYTFlOC00MDhiLTk3MWYtYjc3ZDdiMmE5NDBiLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODg3ODYyMzcsImV4cCI6MTc4ODc4OTgzN30._OThqkErl3VmWyJSXtOj0wqgKbuWytlLcgCiqUOwdFI"
              alt="SMARTLAB"
              className="h-7 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col text-[11px] leading-tight">
              <span className="font-bold text-slate-200">SMARTLAB ENGINEERING</span>
              <span className="text-slate-500">Autonomous School Operations Lab</span>
            </div>
          </div>
        </div>

        {/* Detailed Official Credits Card (Strict Requirement from Prompt 4) */}
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800/80 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Award className="w-4 h-4" />
            Project Development & Architecture Credits
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Idea & Leadership */}
            <div className="space-y-1.5 border-l-2 border-amber-500/70 pl-3">
              <span className="text-slate-400 font-medium">IDEA & DOMAIN SPECIFICATION</span>
              <div className="font-bold text-white text-sm">장은우 (Jang Eun-woo)</div>
              <p className="text-[11px] text-slate-400">
                Head of SSAURABI, Deputy Chair of the Athletic Department
              </p>
            </div>

            {/* Lead Developer */}
            <div className="space-y-1.5 border-l-2 border-red-600 pl-3">
              <span className="text-slate-400 font-medium">LEAD DEVELOPER & ARCHITECT</span>
              <div className="font-bold text-white text-sm">김태호 (Kim Tae-ho)</div>
              <p className="text-[11px] text-slate-400">
                SMARTLAB Lead Architect · Full-Stack & Systems Engineering
              </p>
            </div>

            {/* All Developers */}
            <div className="space-y-1.5 border-l-2 border-blue-500 pl-3">
              <span className="text-slate-400 font-medium">ALL CORE DEVELOPERS</span>
              <div className="font-semibold text-slate-200 leading-relaxed">
                김태호, 김이현, 박민수, 임규리, 주이환, 차민혁, 최지우
              </div>
              <p className="text-[11px] text-slate-400">
                SMARTLAB High-Concurrency Engineering Group
              </p>
            </div>
          </div>
        </div>

        {/* Mandatory Footer note and Copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 pt-2 gap-2">
          <div>
            © 2026 Sangsan High School Athletic Festival & SMARTLAB. All rights reserved.
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            LEAD DEVELOPER: 김태호 · SMARTLAB
          </div>
        </div>
      </div>
    </footer>
  );
};
