import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { seedInitialDataIfEmpty } from '../services/firebaseService';
import { 
  Sliders, 
  X, 
  UserPlus, 
  Shield, 
  Database, 
  ExternalLink, 
  CheckCircle, 
  RefreshCw,
  Trophy
} from 'lucide-react';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export function AdminPortalModal({ isOpen, onClose, currentUser }: AdminPortalModalProps) {
  const [targetStudentId, setTargetStudentId] = useState('');
  const [delegatedRole, setDelegatedRole] = useState<UserRole>('student_council');
  const [roleMessage, setRoleMessage] = useState('');
  const [resettingData, setResettingData] = useState(false);

  if (!isOpen) return null;

  const handleDelegateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId.trim()) return;

    setRoleMessage(`[성공] 학번 ${targetStudentId.trim()} 학생에게 '${delegatedRole}' 권한이 부여되었습니다.`);
    setTargetStudentId('');
    setTimeout(() => setRoleMessage(''), 4000);
  };

  const handleResetSampleData = async () => {
    if (!confirm('대회 초기 매치 및 공지사항 데이터를 Firestore에 재동기화하시겠습니까?')) return;
    setResettingData(true);
    await seedInitialDataIfEmpty();
    setResettingData(false);
    alert('기본 데이터가 Firebase Firestore에 성공적으로 배포/동기화되었습니다.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-800/80 rounded-2xl shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Sliders className="w-5 h-5" />
            <h3 className="font-serif font-black text-lg text-white">
              총괄 관리자(sshsgym) 운영 콘솔
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Delegation Section */}
        <form onSubmit={handleDelegateRole} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>대회 운영 권한 위임 및 역할 임명 (Role Delegation)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">대상 학생 학번 (5자리)</label>
              <input
                type="text"
                value={targetStudentId}
                onChange={(e) => setTargetStudentId(e.target.value)}
                placeholder="예: 20315"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">부여할 직책</label>
              <select
                value={delegatedRole}
                onChange={(e) => setDelegatedRole(e.target.value as UserRole)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none"
              >
                <option value="student_council">학생회 (심판/공지)</option>
                <option value="class_president">반장 (라인업 제출)</option>
                <option value="health_officer">보건 담당 (백과 관리)</option>
                <option value="teacher">선생님</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-amber-900 hover:bg-amber-800 text-amber-100 rounded-lg text-xs font-bold transition shadow"
          >
            권한 부여 확정
          </button>

          {roleMessage && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{roleMessage}</span>
            </div>
          )}
        </form>

        {/* Firebase Console & Database Quick Links */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Firebase Firestore 데이터베이스 정보</span>
          </div>

          <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
            <div>프로젝트 ID: <b className="text-white">gen-lang-client-0045028804</b></div>
            <div>Firestore DB: <b className="text-white">ai-studio-thesangsan-5b08d4d8-f78c-40ce-9d31-cb5e25f8329e</b></div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled={resettingData}
              onClick={handleResetSampleData}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resettingData ? 'animate-spin' : ''}`} />
              <span>{resettingData ? '동기화 중...' : '기본 경기 데이터 재시딩'}</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
