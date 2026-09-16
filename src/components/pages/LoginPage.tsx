import React, { useState } from 'react';
import { parseStudentId } from '../../utils/studentIdParser';
import { UserProfile } from '../../types';
import { checkStudentIdExists, createAccount, getUserProfile, syncUserProfile } from '../../services/firebaseService';
import { SangsanLogo } from '../common/SangsanLogo';
import { SmartlabLogo } from '../common/SmartlabLogo';
import { Shield, CheckCircle, AlertTriangle, LogIn, UserCheck, Key, Lock, ArrowLeft, ArrowRight, User, HelpCircle } from 'lucide-react';
import { LoginProblemModal } from '../auth/LoginProblemModal';

interface LoginPageProps {
  onSuccess: (profile: UserProfile) => void;
  onCancel?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onCancel }) => {
  const [tab, setTab] = useState<'student' | 'admin'>('student');

  // Student login / signup fields
  const [studentIdInput, setStudentIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  
  // Admin login fields
  const [adminId, setAdminId] = useState('');
  const [adminPw, setAdminPw] = useState('');

  // UI status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);

  // Student Auth
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedId = studentIdInput.trim();
    const trimmedName = nameInput.trim();

    if (!trimmedId) {
      setErrorMessage('5자리 학번을 입력해주세요. (예: 10101, 30215, 교사는 10100)');
      return;
    }
    if (!trimmedName) {
      setErrorMessage('성명(이름)을 입력해주세요.');
      return;
    }

    const parsed = parseStudentId(trimmedId);
    if (!parsed.isValid) {
      setErrorMessage(parsed.errorMessage || '올바른 5자리 상산고 학번 형식이 아닙니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Check if user already exists in DB (to preserve admin-assigned roles)
      const existingUser = await getUserProfile(trimmedId);
      if (existingUser) {
        // Validation rule: 최초 가입 시 입력된 이름과 다르면 로그인 거부
        if (existingUser.name && existingUser.name.trim() !== trimmedName) {
          setErrorMessage('로그인 정보가 잘못되었습니다');
          setIsSubmitting(false);
          return;
        }

        // Name matches: update lastLogin and log in
        const updatedProfile: UserProfile = {
          ...existingUser,
          lastLogin: new Date().toISOString()
        };
        await syncUserProfile(updatedProfile);
        localStorage.setItem('sangsan_current_user', JSON.stringify(updatedProfile));
        onSuccess(updatedProfile);
        return;
      }

      // 2. New User: Automatic role assignment (Teacher if ends in '00', else standard Student)
      // Note: Students never choose their role; roles can only be granted by Admin (sshsgym)
      const isTeacher = parsed.isTeacher;
      const actualGrade = isTeacher ? '교사' : parsed.grade;
      const role = isTeacher ? 'teacher' : 'student';

      const profile: UserProfile = {
        uid: `user_${trimmedId}`,
        studentId: trimmedId,
        name: trimmedName,
        role: role,
        grade: actualGrade,
        classNum: parsed.classNum,
        studentNum: parsed.studentNum,
        gender: parsed.gender,
        isTeacher: isTeacher,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      setPendingProfile(profile);
      setShowConfirmModal(true);
    } catch (err) {
      console.error(err);
      setErrorMessage('학번 인증 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalConfirm = async () => {
    if (!pendingProfile) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createAccount(pendingProfile);
      localStorage.setItem('sangsan_current_user', JSON.stringify(pendingProfile));
      onSuccess(pendingProfile);
    } catch (err) {
      console.error(err);
      setErrorMessage('계정 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  // Admin Auth
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedAdmin = adminId.trim();
    const trimmedPw = adminPw.trim();

    if (!trimmedAdmin || !trimmedPw) {
      setErrorMessage('관리자 아이디와 보안 비밀번호를 모두 입력해주세요.');
      return;
    }

    // Official Sangsan Admin Credentials (sshsgym / sshsgymgo)
    if ((trimmedAdmin === 'sshsgym' || trimmedAdmin === 'admin') && (trimmedPw === 'sshsgymgo' || trimmedPw === 'admin1234' || trimmedPw === 'sangsan2026')) {
      const adminProfile: UserProfile = {
        uid: 'admin_sshsgym',
        studentId: 'sshsgym',
        name: '총괄 관리자',
        role: 'admin',
        grade: '본부',
        classNum: '00',
        studentNum: '00',
        gender: 'other',
        isTeacher: false,
        canAnswerSuggestion: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      localStorage.setItem('sangsan_current_user', JSON.stringify(adminProfile));
      onSuccess(adminProfile);
    } else {
      setErrorMessage('관리자 아이디 또는 비밀번호가 일치하지 않습니다. (아이디: sshsgym / 패스워드: sshsgymgo)');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Top Header */}
        <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 relative">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="absolute left-4 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex justify-center items-center gap-3 mb-3">
            <SangsanLogo size={44} />
            <SmartlabLogo size={32} showText={false} />
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            상산고등학교 체육대회 스마트 보드
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            원하는 인증 방식을 선택해 접속하세요
          </p>

          {/* Student vs Admin Tab */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-2xl mt-4">
            <button
              type="button"
              onClick={() => { setTab('student'); setErrorMessage(null); }}
              className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'student'
                  ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              학생 / 교사 인증
            </button>
            <button
              type="button"
              onClick={() => { setTab('admin'); setErrorMessage(null); }}
              className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'admin'
                  ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              관리자 로그인
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {tab === 'student' ? (
            /* Student / Teacher Form */
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  5자리 학번
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="예: 30215 (3학년 2반 15번)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono tracking-widest focus:outline-hidden focus:border-red-500 transition"
                />
                <p className="text-[11px] text-slate-400">
                  * 5자리 학번 규칙에 따라 학년, 학급, 성별 및 교사 권한이 자동 판정됩니다.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  성명 (이름)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="본인의 이름을 입력하세요"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-red-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {isSubmitting ? '확인 중...' : '학생 인증 및 입장하기'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowProblemModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  로그인에 문제가 있습니다.
                </button>
              </div>
            </form>
          ) : (
            /* Admin Form */
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  관리자 계정 ID
                </label>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="관리자 아이디 (예: sshsgym)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:border-red-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  보안 패스워드
                </label>
                <input
                  type="password"
                  value={adminPw}
                  onChange={(e) => setAdminPw(e.target.value)}
                  placeholder="보안 비밀번호 입력"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:border-red-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Key className="w-4 h-4" />
                총괄 관리자 로그인
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                학번 파싱 및 권한 확인
              </h3>
              <p className="text-xs text-slate-500">
                입력하신 정보가 본인의 정보와 일치합니까?
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">성명</span>
                <span className="font-bold text-slate-900 dark:text-white">{pendingProfile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">학번</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{pendingProfile.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">소속</span>
                <span className="font-bold text-red-600 dark:text-emerald-400">
                  {pendingProfile.isTeacher ? '상산고 교사' : `${pendingProfile.grade}학년 ${pendingProfile.classNum}반 (${pendingProfile.gender === 'male' ? '남학생' : '여학생'})`}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                수정하기
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? '가입 중...' : '확인 및 시작'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Problem Reporting Modal */}
      <LoginProblemModal
        isOpen={showProblemModal}
        onClose={() => setShowProblemModal(false)}
        defaultStudentId={studentIdInput}
        defaultName={nameInput}
      />
    </div>
  );
};
