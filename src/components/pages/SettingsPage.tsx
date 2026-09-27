import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types';
import { Settings, Moon, Sun, Bell, Volume2, Shield, RefreshCw, CheckCircle2, VolumeX, BellRing } from 'lucide-react';

interface SettingsPageProps {
  currentUser?: UserProfile | null;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onClearCache?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  currentRole,
  onRoleChange,
  isDarkMode,
  onToggleDarkMode,
  onClearCache
}) => {
  const [allowPush, setAllowPush] = useState<boolean>(() => {
    return localStorage.getItem('sangsan_pref_push') !== 'false';
  });
  const [allowSound, setAllowSound] = useState<boolean>(() => {
    return localStorage.getItem('sangsan_pref_sound') !== 'false';
  });
  const [testNotice, setTestNotice] = useState<string | null>(null);

  // Play synthesized web audio chime
  const playTestChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      setTestNotice('🔔 점수 득점 효과음이 재생되었습니다.');
      setTimeout(() => setTestNotice(null), 2500);
    } catch (e) {
      console.warn('Audio effect error:', e);
    }
  };

  const handleTogglePush = async (val: boolean) => {
    setAllowPush(val);
    localStorage.setItem('sangsan_pref_push', String(val));
    if (val && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const res = await Notification.requestPermission();
          if (res === 'granted') {
            setTestNotice('브라우저 푸시 알림 권한이 허용되었습니다.');
          } else {
            setTestNotice('브라우저에서 알림이 차단되어 있습니다.');
          }
          setTimeout(() => setTestNotice(null), 3000);
        } catch (e) {
          console.warn('Notification permission error:', e);
        }
      }
    }
  };

  const handleToggleSound = (val: boolean) => {
    setAllowSound(val);
    localStorage.setItem('sangsan_pref_sound', String(val));
    if (val) {
      playTestChime();
    }
  };

  const handleTriggerTestPush = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('상산고 체육대회 경기 알림', {
        body: '[축구 8강 1경기] 3학년 2반 vs 3학년 4반 경기가 15분 후 시작됩니다.',
        icon: '/favicon.ico'
      });
      setTestNotice('브라우저 푸시 알림이 발송되었습니다.');
    } else {
      setTestNotice('[앱 내 시뮬레이션 알림] 축구 8강 1경기가 15분 후 시작됩니다.');
    }
    if (allowSound) {
      playTestChime();
    }
    setTimeout(() => setTestNotice(null), 3500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          환경설정 및 사용자 제어
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          화면 테마, 알림 수신 설정 및 사용자 권한 전환을 관리합니다.
        </p>
      </div>

      {testNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{testNotice}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Profile Card */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-600 dark:text-emerald-400" />
            현재 접속 계정 정보
          </h3>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">사용자명</span>
              <span className="font-bold text-slate-900 dark:text-white">{currentUser?.name || '게스트 학우'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">학번</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{currentUser?.studentId || '미인증'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">소속 및 직책</span>
              <span className="font-bold text-red-600 dark:text-emerald-400">
                {currentUser?.role === 'admin' ? '대회 총괄본부 (운영관리)' : currentUser?.isTeacher ? '교직원' : currentUser ? `${currentUser.grade}학년 ${currentUser.classNum}반` : '일반 학생'}
              </span>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            디스플레이 및 테마
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">화면 다크 모드</p>
              <p className="text-[11px] text-slate-400">야외 시인성 및 배터리 절약을 위한 다크 테마 전환</p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isDarkMode ? '다크 모드 ON' : '라이트 모드 ON'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isDarkMode}
                onClick={onToggleDarkMode}
                aria-label="화면 다크 모드 전환"
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isDarkMode ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isDarkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications & Sound */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-red-600 dark:text-emerald-400" />
              경기 알림 및 사운드
            </h3>
            <button
              type="button"
              onClick={handleTriggerTestPush}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1"
            >
              <BellRing className="w-3 h-3 text-red-600" />
              알림 테스트
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">경기 시작 15분 전 푸시 알림</p>
              <p className="text-[11px] text-slate-400">알림 설정한 경기의 소집 시간 및 코트 안내</p>
            </div>
            <input
              type="checkbox"
              checked={allowPush}
              onChange={(e) => handleTogglePush(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">점수 득점 효과음</p>
              <p className="text-[11px] text-slate-400">실시간 스코어 변동 시 오디오 피드백 차임 재생</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={playTestChime}
                className="px-2 py-1 text-[10px] font-bold rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3" />
                소리 듣기
              </button>
              <input
                type="checkbox"
                checked={allowSound}
                onChange={(e) => handleToggleSound(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Role Switcher (Simulator / Tester) */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            역할 뷰 신속 전환 (시뮬레이션)
          </h3>
          <p className="text-[11px] text-slate-400">
            실시간 관제 및 대시보드 기능을 다양한 권한 관점에서 테스트할 수 있습니다.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {[
              { role: 'student', label: '일반 학생 (홈 피드)' },
              { role: 'class_president', label: '학급 반장 (라인업/포메이션)' },
              { role: 'student_council', label: '학생회 / 체육부 (경기지원)' },
              { role: 'teacher', label: '선생님 (지도교사 · 교원)' },
              { role: 'referee', label: '공식 심판/기록원 (스코어보드 +1/-1)' },
              { role: 'health_officer', label: '보건의무본부 (트리아지)' },
              { role: 'admin', label: '총괄 관리자 (어드민 콘솔)' }
            ].map(r => (
              <button
                key={r.role}
                type="button"
                onClick={() => onRoleChange(r.role as UserRole)}
                className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                  currentRole === r.role
                    ? 'bg-red-600 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
