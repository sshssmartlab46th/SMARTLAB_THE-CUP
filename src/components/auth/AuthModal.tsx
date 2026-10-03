import React, { useState } from 'react';
import { parseStudentId } from '../../utils/studentIdParser';
import { UserProfile } from '../../types';
import { checkStudentIdExists, createAccount, getUserProfile, syncUserProfile } from '../../services/firebaseService';
import { verifyAdminCredentials } from '../../services/adminAuthService';
import { SangsanLogo } from '../common/SangsanLogo';
import { Shield, CheckCircle, AlertTriangle, LogIn, UserCheck, Key, HelpCircle } from 'lucide-react';
import { LoginProblemModal } from './LoginProblemModal';

interface AuthModalProps {
  onSuccess: (profile: UserProfile) => void;
  isOpen?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, isOpen = true }) => {
  const [mode, setMode] = useState<'student_signup' | 'admin_login'>('student_signup');
  
  // Student signup fields
  const [studentIdInput, setStudentIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [gradeInput, setGradeInput] = useState('1');
  
  // Admin login fields
  const [adminId, setAdminId] = useState('');
  const [adminPw, setAdminPw] = useState('');

  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);

  if (!isOpen) return null;

  // Validate student input
  const handlePreSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedId = studentIdInput.trim();
    const trimmedName = nameInput.trim();

    if (!trimmedId) {
      setErrorMessage('학번을 입력해주세요.');
      return;
    }
    if (!trimmedName) {
      setErrorMessage('이름을 입력해주세요.');
      return;
    }

    const parsed = parseStudentId(trimmedId);
    if (!parsed.isValid) {
      setErrorMessage(parsed.errorMessage || '유효하지 않은 학번입니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Check if user already exists in DB (for 2nd, 3rd login verification)
      const existingUser = await getUserProfile(trimmedId);
      if (existingUser) {
        // Validation rule: 최초 가입 시 입력된 이름과 다르면 로그인 거부
        if (existingUser.name && existingUser.name.trim() !== trimmedName) {
          setErrorMessage(`학번 '${trimmedId}'은(는) 이미 '${existingUser.name}' 학생으로 가입되어 있습니다. 등록된 본인의 이름으로 로그인해주세요.`);
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

      // 2. Prepare Profile according to Sangsan rules:
      // If teacher (number === '00'), grade is ignored and role is teacher.
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
      setErrorMessage('가입 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Final confirm in popup
  const handleFinalConfirm = async () => {
    if (!pendingProfile) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const success = await createAccount(pendingProfile);
      if (!success) {
        setErrorMessage('이미 가입된 학번입니다.');
        setShowConfirmModal(false);
        return;
      }

      // Store in session/localStorage for passwordless continuous session
      localStorage.setItem('sangsan_user_session', JSON.stringify(pendingProfile));
      setShowConfirmModal(false);
      onSuccess(pendingProfile);
    } catch (err) {
      console.error(err);
      setErrorMessage('계정 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    setIsSubmitting(true);
    try {
      const res = await verifyAdminCredentials(adminId, adminPw);
      if (res.success && res.profile) {
        localStorage.setItem('sangsan_user_session', JSON.stringify(res.profile));
        onSuccess(res.profile);
      } else {
        setErrorMessage(res.message || '관리자 아이디 또는 비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('관리자 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header with official emblem */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 flex flex-col items-center text-center">
          <SangsanLogo size="md" />
          <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            THE SANGSAN
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            상산고등학교 체육대회 및 축제 공식 시스템
          </p>

          {/* Mode Switcher Tabs */}
          <div className="mt-4 inline-flex p-1 bg-slate-200 dark:bg-slate-950 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('student_signup'); setErrorMessage(null); }}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                mode === 'student_signup'
                  ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              학생 / 선생님 시작
            </button>
            <button
              type="button"
              onClick={() => { setMode('admin_login'); setErrorMessage(null); }}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                mode === 'admin_login'
                  ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              총괄 관리자 로그인
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'student_signup' ? (
            <form onSubmit={handlePreSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  학번 (5자리)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="예: 20305 (교사는 10100)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  * 5자리 (1자리: 학년, 2~3자리: 반 01~12, 4~5자리: 번호. 교사는 끝자리 00)
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  이름 (실명)
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  학년
                </label>
                <select
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                >
                  <option value="1">1학년</option>
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  (선생님 학번(끝자리 00) 입력 시 학년 선택은 자동으로 무시됩니다)
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isSubmitting ? '확인 중...' : '가입 확인 및 시작'}</span>
                </button>

                <div className="pt-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => setShowProblemModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                    로그인에 문제가 있습니다.
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  관리자 아이디
                </label>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="sshsgym"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={adminPw}
                  onChange={(e) => setAdminPw(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>{isSubmitting ? '인증 중...' : '총괄 관리자 로그인'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            비밀번호가 필요 없는 세션 인증 방식을 지원합니다.
          </p>
        </div>
      </div>

      {/* Mandatory Final Confirmation Modal required by Planning Doc Section 1.1 */}
      {showConfirmModal && pendingProfile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                입력 정보 최종 확인
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              가입 후에는 <strong>학번, 이름, 학년</strong> 정보를 스스로 수정할 수 없습니다. 입력하신 정보가 본인의 정보와 일치하는지 반드시 확인해주세요.
            </p>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">학번:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{pendingProfile.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">이름:</span>
                <span className="font-bold text-slate-900 dark:text-white">{pendingProfile.name}</span>
              </div>
              {!pendingProfile.isTeacher && (
                <div className="flex justify-between">
                  <span className="text-slate-500">학년:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{pendingProfile.grade}학년</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">구분:</span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {pendingProfile.isTeacher ? '선생님' : `${pendingProfile.classNum}반 (${pendingProfile.gender === 'male' ? '남학생' : '여학생'})`}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                다시 입력하기
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalConfirm}
                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
              >
                {isSubmitting ? '생성 중...' : '정보가 맞습니다 (가입)'}
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
