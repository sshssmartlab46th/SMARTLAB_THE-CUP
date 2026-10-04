import React, { useState } from 'react';
import { parseStudentId } from '../../utils/studentIdParser';
import { UserProfile, getUserRoles } from '../../types';
import { checkStudentIdExists, createAccount, getUserProfile, syncUserProfile } from '../../services/firebaseService';
import { verifyAdminCredentials } from '../../services/adminAuthService';
import { createSignedSession } from '../../utils/sessionToken';
import { SangsanLogo } from '../common/SangsanLogo';
import { SmartlabLogo } from '../common/SmartlabLogo';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  LogIn, 
  Key, 
  Lock, 
  ArrowLeft, 
  User, 
  HelpCircle,
  Sparkles,
  Users
} from 'lucide-react';
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

  // Fast demo role logins for instant testing
  const fastLoginProfiles: { label: string; desc: string; profile: UserProfile }[] = [
    {
      label: '👑 총괄 관리자',
      desc: '총괄본부 · 시스템 전권 및 어드민 콘솔',
      profile: {
        uid: 'admin_sshsgym',
        studentId: 'sshsgym',
        name: '총괄 관리자',
        role: 'admin',
        roles: ['admin', 'student'],
        grade: '본부',
        classNum: '00',
        studentNum: '00',
        gender: 'other',
        isTeacher: false,
        canAnswerSuggestion: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    },
    {
      label: '🔵 학생회 체육부',
      desc: '2학년 1반 · 스코어보드 조작 및 진행',
      profile: {
        uid: 'user_20101',
        studentId: '20101',
        name: '김체육',
        role: 'student_council',
        roles: ['student', 'student_council'],
        grade: '2',
        classNum: '01',
        studentNum: '01',
        gender: 'male',
        isTeacher: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    },
    {
      label: '🟢 학급 반장',
      desc: '3학년 2반 · 축구/농구 라인업 명단 제출',
      profile: {
        uid: 'user_30201',
        studentId: '30201',
        name: '이반장',
        role: 'class_president',
        roles: ['student', 'class_president'],
        grade: '3',
        classNum: '02',
        studentNum: '01',
        gender: 'male',
        isTeacher: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    },
    {
      label: '🟡 공식 심판진',
      desc: '2학년 4반 · 실시간 경기 판정 및 기록',
      profile: {
        uid: 'user_20401',
        studentId: '20401',
        name: '박심판',
        role: 'referee',
        roles: ['student', 'referee'],
        grade: '2',
        classNum: '04',
        studentNum: '01',
        gender: 'male',
        isTeacher: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    },
    {
      label: '🔴 보건 담당',
      desc: '1학년 6반 · 의무실 환자 접수 및 부상 관리',
      profile: {
        uid: 'user_10601',
        studentId: '10601',
        name: '최보건',
        role: 'health_officer',
        roles: ['student', 'health_officer'],
        grade: '1',
        classNum: '06',
        studentNum: '01',
        gender: 'female',
        isTeacher: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    },
    {
      label: '🟣 지도교사 (선생님)',
      desc: '1학년 1반 담임 선생님 · 학급 참관',
      profile: {
        uid: 'user_10100',
        studentId: '10100',
        name: '정선생',
        role: 'teacher',
        roles: ['teacher'],
        grade: '교사',
        classNum: '01',
        studentNum: '00',
        gender: 'other',
        isTeacher: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    },
    {
      label: '⚪ 일반 학생',
      desc: '3학년 2반 · 경기 관람 및 실시간 응원',
      profile: {
        uid: 'user_30215',
        studentId: '30215',
        name: '강상산',
        role: 'student',
        roles: ['student'],
        grade: '3',
        classNum: '02',
        studentNum: '15',
        gender: 'male',
        isTeacher: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    }
  ];

  const handleFastLogin = async (profile: UserProfile) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await syncUserProfile(profile);
    } catch (e) {
      console.warn('Sync profile fallback:', e);
    }
    const signedSession = await createSignedSession(profile);
    localStorage.setItem('sangsan_current_user', JSON.stringify(signedSession));
    setIsSubmitting(false);
    onSuccess(profile);
  };

  // Student Auth
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedId = studentIdInput.trim();
    const trimmedName = nameInput.trim();

    if (!trimmedId) {
      setErrorMessage('학번 5자리를 입력해주세요. (예: 30215, 교사는 10100)');
      return;
    }

    // Direct admin login via student input if someone typed sshsgym
    if (trimmedId.toLowerCase() === 'sshsgym') {
      setTab('admin');
      setAdminId('sshsgym');
      setErrorMessage('총괄 관리자 계정입니다. 비밀번호를 입력해주세요.');
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
      // 1. Check if user already exists in DB (to verify registered name & preserve roles)
      const existingUser = await getUserProfile(trimmedId);
      if (existingUser) {
        const registeredName = (existingUser.name || '').trim();

        // [핵심 보안 규칙]: 이미 등록된 학번인 경우, 최초 등록된 이름과 반드시 일치해야 함!
        // 다른 이름으로 로그인 시도 시 즉시 로그인 거부 및 에러 표시
        if (registeredName && registeredName !== trimmedName) {
          setIsSubmitting(false);
          setErrorMessage(
            `학번 '${trimmedId}'은(는) 이미 '${registeredName}' 학생으로 가입되어 있습니다. 입력하신 이름('${trimmedName}')과 일치하지 않아 로그인이 차단되었습니다.`
          );
          return;
        }

        // 이름 일치 -> 로그인 성공 및 최종 접속시간 갱신
        const existingRoles = getUserRoles(existingUser);
        const updatedProfile: UserProfile = {
          ...existingUser,
          name: registeredName || trimmedName,
          roles: existingUser.isTeacher ? ['teacher'] : existingRoles,
          role: existingUser.role || (existingUser.isTeacher ? 'teacher' : 'student'),
          lastLogin: new Date().toISOString()
        };
        try {
          await syncUserProfile(updatedProfile);
        } catch (e) {
          console.warn('Sync profile fallback:', e);
        }
        const signedSession = await createSignedSession(updatedProfile);
        localStorage.setItem('sangsan_current_user', JSON.stringify(signedSession));
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
        roles: isTeacher ? ['teacher'] : ['student'],
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
      // Fallback: If network failed, check local registry first!
      const cached = await getUserProfile(trimmedId);
      if (cached && cached.name && cached.name.trim() !== trimmedName) {
        setIsSubmitting(false);
        setErrorMessage(
          `학번 '${trimmedId}'은(는) 이미 '${cached.name}' 학생으로 등록되어 있습니다. 입력하신 이름('${trimmedName}')과 일치하지 않습니다.`
        );
        return;
      }
      const isTeacher = parsed.isTeacher;
      const fallbackProfile: UserProfile = {
        uid: `user_${trimmedId}`,
        studentId: trimmedId,
        name: trimmedName,
        role: isTeacher ? 'teacher' : 'student',
        roles: isTeacher ? ['teacher'] : ['student'],
        grade: isTeacher ? '교사' : parsed.grade,
        classNum: parsed.classNum,
        studentNum: parsed.studentNum,
        gender: parsed.gender,
        isTeacher: isTeacher,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      setPendingProfile(fallbackProfile);
      setShowConfirmModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalConfirm = async () => {
    if (!pendingProfile) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Re-verify immediately before registration
      const existingUser = await getUserProfile(pendingProfile.studentId);
      if (existingUser && existingUser.name) {
        if (existingUser.name.trim() !== pendingProfile.name.trim()) {
          setErrorMessage(
            `학번 '${pendingProfile.studentId}'은(는) 이미 '${existingUser.name}' 학생으로 가입되어 있습니다. 다른 이름으로 가입할 수 없습니다.`
          );
          setIsSubmitting(false);
          setShowConfirmModal(false);
          return;
        }
      }

      const created = await createAccount(pendingProfile);
      if (!created) {
        // 이미 등록된 학번인 경우
        const existing = await getUserProfile(pendingProfile.studentId);
        if (existing && existing.name && existing.name.trim() !== pendingProfile.name.trim()) {
          setErrorMessage(
            `학번 '${pendingProfile.studentId}'은(는) 이미 '${existing.name}' 학생으로 가입되어 있습니다. 다른 이름으로 로그인할 수 없습니다.`
          );
          setIsSubmitting(false);
          setShowConfirmModal(false);
          return;
        }
      }

      const signedSession = await createSignedSession(pendingProfile);
      localStorage.setItem('sangsan_current_user', JSON.stringify(signedSession));
      setIsSubmitting(false);
      setShowConfirmModal(false);
      onSuccess(pendingProfile);
    } catch (err) {
      console.warn('createAccount error, syncing instead:', err);
      // Even in catch, verify if cached profile matches
      const cached = await getUserProfile(pendingProfile.studentId);
      if (cached && cached.name && cached.name.trim() !== pendingProfile.name.trim()) {
        setErrorMessage(
          `학번 '${pendingProfile.studentId}'은(는) 이미 '${cached.name}' 학생으로 등록되어 있습니다.`
        );
        setIsSubmitting(false);
        setShowConfirmModal(false);
        return;
      }
      try {
        await syncUserProfile(pendingProfile);
      } catch (e2) {
        console.warn('syncUserProfile fallback:', e2);
      }
      const signedSession = await createSignedSession(pendingProfile);
      localStorage.setItem('sangsan_current_user', JSON.stringify(signedSession));
      setIsSubmitting(false);
      setShowConfirmModal(false);
      onSuccess(pendingProfile);
    }
  };

  // Admin Auth
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedAdmin = adminId.trim().toLowerCase();
    const trimmedPw = adminPw.trim();

    if (!trimmedAdmin || !trimmedPw) {
      setErrorMessage('관리자 아이디와 보안 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyAdminCredentials(trimmedAdmin, trimmedPw);
      if (res.success && res.profile) {
        try {
          await syncUserProfile(res.profile);
        } catch (e) {
          console.warn('Admin profile sync fallback:', e);
        }
        const signedSession = await createSignedSession(res.profile, res.token);
        localStorage.setItem('sangsan_current_user', JSON.stringify(signedSession));
        onSuccess(res.profile);
      } else {
        setErrorMessage(res.message || '관리자 아이디 또는 비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('관리자 로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all">
        {/* Top Header */}
        <div className="p-5 sm:p-6 text-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 relative">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="absolute left-4 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex justify-center items-center gap-3 mb-2.5">
            <SangsanLogo size={42} />
            <SmartlabLogo size={30} showText={false} />
          </div>

          <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            상산고 체육대회 스마트 플랫폼
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            학번 5자리로 로그인하거나 관리자 계정으로 접속하세요
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
              관리자 (총괄본부)
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
              {(errorMessage.includes('일치하지 않아') || errorMessage.includes('등록되어 있습니다')) && (
                <div className="pt-2 border-t border-red-200/60 dark:border-red-900/40 flex items-center justify-between">
                  <span className="text-[11px] text-red-500 dark:text-red-400">
                    오타 또는 타인의 학번 선점인 경우:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowProblemModal(true)}
                    className="text-[11px] font-bold underline hover:text-red-800 dark:hover:text-red-200 cursor-pointer"
                  >
                    관리자에게 사연 접수하기 &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'student' ? (
            /* Student / Teacher Form */
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    5자리 학번
                  </label>
                  <span className="text-[10px] text-slate-400">교사는 뒷자리 00</span>
                </div>
                <input
                  type="text"
                  maxLength={5}
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value.trim())}
                  placeholder="예: 30215 (3학년 2반 15번)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono tracking-widest focus:outline-hidden focus:border-red-500 transition"
                />
                <p className="text-[11px] text-slate-400">
                  * 5자리 규칙에 따라 학년, 학급, 성별 및 교사 권한이 자동 판정됩니다.
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
                  placeholder="본인의 이름을 입력하세요 (예: 강상산)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-red-500 transition"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 leading-relaxed">
                <div className="font-bold text-slate-700 dark:text-slate-300">
                  💡 역할 자동 배정 안내:
                </div>
                <div>• 일반 학생 및 담임 교사는 학번에 따라 기본 자동 배정됩니다.</div>
                <div>• <span className="font-bold text-red-600 dark:text-red-400">학생회, 반장, 심판, 보건</span> 권한은 총괄 관리자가 어드민 콘솔에서 직접 부여합니다.</div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {isSubmitting ? '확인 중...' : '학생 인증 및 로그인'}
              </button>

              <div className="pt-1 text-center">
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
                  placeholder="sshsgym"
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
                  placeholder="비밀번호 입력"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:border-red-500 transition"
                />
              </div>

              <div className="p-3 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-[11px] text-red-700 dark:text-red-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>상산고등학교 총괄본부 전용</span>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-400">
                  총괄 관리자는 교사가 아닌 총괄본부 소속이며, 경기 제어 및 학생 권한 부여 권한을 가집니다.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                {isSubmitting ? '인증 중...' : '총괄 관리자 로그인'}
              </button>
            </form>
          )}

          {/* Fast Demo Accounts Picker (Quick Testing) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>직무별 1초 빠른 로그인 (체험 및 테스트용)</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {fastLoginProfiles.map((p) => (
                <button
                  key={p.profile.studentId}
                  type="button"
                  onClick={() => handleFastLogin(p.profile)}
                  className="p-2 rounded-xl text-left border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-red-400 dark:hover:border-red-500 transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    {p.label}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {p.profile.name} ({p.profile.studentId})
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for New Signup */}
      {showConfirmModal && pendingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                학번 인증 정보 확인
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
              <div className="flex justify-between">
                <span className="text-slate-500">기본 배정 역할</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {pendingProfile.isTeacher ? '선생님 (교사)' : '일반 학생'}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              * 학생회, 반장, 심판, 보건 등 특수 권한은 관리자 승인 후 즉시 반영됩니다.
            </p>

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
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
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
