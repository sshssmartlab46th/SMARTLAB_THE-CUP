import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { parseStudentId, ParsedStudentId } from '../utils/studentIdParser';
import { syncUserProfile } from '../services/firebaseService';
import { SangsanEmblem } from './SangsanEmblem';
import { Shield, CheckCircle, AlertCircle, Key, UserCheck, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (profile: UserProfile) => void;
  onClose?: () => void;
}

export function AuthModal({ isOpen, onSuccess, onClose }: AuthModalProps) {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [parsed, setParsed] = useState<ParsedStudentId | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (studentIdInput.trim().toLowerCase() === 'sshsgym') {
      setIsAdminMode(true);
      setParsed(parseStudentId('sshsgym'));
    } else {
      setIsAdminMode(false);
      if (studentIdInput.length >= 2) {
        setParsed(parseStudentId(studentIdInput));
      } else {
        setParsed(null);
      }
    }
  }, [studentIdInput]);

  if (!isOpen) return null;

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isAdminMode) {
      if (adminPassword !== 'sshsgymgo') {
        setErrorMessage('총괄 관리자 비밀번호가 일치하지 않습니다. (초기: sshsgymgo)');
        return;
      }
      // Direct Admin Login
      const adminProfile: UserProfile = {
        uid: 'admin-sshsgym',
        studentId: 'sshsgym',
        name: '총괄관리자 (체육부)',
        role: 'admin',
        grade: '본부',
        classNum: '00',
        studentNum: '00',
        gender: 'other',
        isTeacher: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      saveAndComplete(adminProfile);
      return;
    }

    if (!parsed || !parsed.isValid) {
      setErrorMessage(parsed?.errorMessage || '올바른 5자리 학번을 입력해 주세요.');
      return;
    }

    if (!nameInput.trim()) {
      setErrorMessage('이름(성명)을 정확히 입력해 주세요.');
      return;
    }

    // Open Double Confirmation Modal
    setShowConfirmModal(true);
  };

  const handleDoubleConfirm = async () => {
    if (!parsed) return;
    setLoading(true);

    const profile: UserProfile = {
      uid: `user-${parsed.studentId}-${Date.now()}`,
      studentId: parsed.studentId,
      name: nameInput.trim(),
      role: parsed.defaultRole,
      grade: parsed.grade,
      classNum: parsed.classNum,
      studentNum: parsed.studentNum,
      gender: parsed.gender,
      isTeacher: parsed.isTeacher,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    await saveAndComplete(profile);
    setLoading(false);
    setShowConfirmModal(false);
  };

  const saveAndComplete = async (profile: UserProfile) => {
    localStorage.setItem('the_sangsan_session', JSON.stringify(profile));
    await syncUserProfile(profile);
    onSuccess(profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Double Confirmation Modal Dialog */}
      {showConfirmModal && parsed && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
          <div className="w-full max-w-md bg-slate-900 border-2 border-red-800/80 rounded-2xl p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-7 h-7 flex-shrink-0" />
              <h3 className="font-serif font-bold text-lg text-white">
                학번 정보 최종 재확인 (Double-Confirmation)
              </h3>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">학번:</span>
                <span className="font-mono font-bold text-red-400 text-base">{parsed.studentId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">성명:</span>
                <span className="font-bold text-white text-base">{nameInput}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">소속:</span>
                <span className="text-slate-200">{parsed.displayClass} {parsed.isTeacher ? '(담임교사)' : `${parsed.studentNum}번`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">구분:</span>
                <span className="font-semibold text-emerald-400">
                  {parsed.isTeacher ? '선생님 (담임)' : parsed.gender === 'male' ? '남학생' : '여학생'}
                </span>
              </div>
            </div>

            <div className="bg-red-950/40 border border-red-900/60 p-3 rounded-lg text-xs text-red-300 leading-relaxed">
              ⚠️ <b>경고</b>: 상산고등학교 공식 대회 운영 규정에 따라 학번은 최초 1회 등록 후 <b>수정할 수 없습니다</b>. 오타가 없는지 반드시 확인해 주십시오.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition"
              >
                다시 수정하기
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDoubleConfirm}
                className="flex-1 py-2.5 bg-red-800 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? '등록 중...' : '확인 및 접속 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header with Emblem */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <SangsanEmblem size={56} />
          </div>
          <h2 className="font-serif font-black text-2xl text-white tracking-wide">
            THE SANGSAN
          </h2>
          <p className="text-xs text-slate-400">
            상산고등학교 체육대회 &amp; 축제 통합 운영 시스템
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>학번 (5자리 정수) 또는 관리자 ID</span>
              <span className="text-[11px] text-slate-500 font-mono">예: 20305, 교사: 10100</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                placeholder="학번 입력 (예: 20305)"
                maxLength={10}
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-xl px-4 py-3 text-white font-mono text-base placeholder:text-slate-600 outline-none transition"
                autoFocus
              />
              {parsed?.isValid && (
                <CheckCircle className="w-5 h-5 text-emerald-400 absolute right-3 top-3.5" />
              )}
            </div>
          </div>

          {/* Admin Mode Password Field */}
          {isAdminMode ? (
            <div className="bg-amber-950/30 border border-amber-800/60 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <Key className="w-4 h-4" />
                <span>총괄 관리자(sshsgym) 모드 감지</span>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">관리자 비밀번호</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="sshsgymgo 입력"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          ) : (
            <>
              {/* Student Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  성명 (이름)
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="예: 김민준"
                  maxLength={15}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-xl px-4 py-3 text-white text-base placeholder:text-slate-600 outline-none transition"
                />
              </div>

              {/* Automatic Rule-Engine Classification Banner */}
              {parsed && parsed.isValid && (
                <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-300 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <UserCheck className="w-4 h-4" />
                    <span>상산 학번 자동 분류 엔진 판정 결과</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-500 block">소속 학급</span>
                      <span className="font-semibold text-white">{parsed.displayClass}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">선수 명단 자격</span>
                      <span className="font-semibold text-white">
                        {parsed.isTeacher ? '제외 (교사 전용 권한)' : '경기 출전 가능'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">성별 자동 분류</span>
                      <span className="font-semibold text-cyan-400">
                        {parsed.isTeacher ? '교사' : parsed.gender === 'male' ? '남학생 (축구/농구/계주)' : '여학생 (피구/계주)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">초기 부여 권한</span>
                      <span className="font-semibold text-amber-400">
                        {parsed.isTeacher ? '담임교사 권한' : '일반 학생'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white font-bold rounded-xl shadow-xl transition flex items-center justify-center gap-2 text-sm"
          >
            <Shield className="w-4 h-4 text-red-300" />
            <span>{isAdminMode ? '관리자 권한으로 로그인' : '학번 확인 및 대회 플랫폼 입장'}</span>
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 font-mono pt-1">
          made by SMARTLAB
        </div>
      </div>
    </div>
  );
}
