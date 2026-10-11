import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types';
import { Settings, Moon, Sun, Bell, Volume2, Shield, RefreshCw, CheckCircle2, VolumeX, BellRing, Eye, Type, Palette, Sparkles } from 'lucide-react';
import { registerServiceWorker, requestNotificationPermission, sendSWNotification } from '../../services/notificationService';
import { UseAccessibilityReturn } from '../../hooks/useAccessibility';

interface SettingsPageProps {
  currentUser?: UserProfile | null;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onClearCache?: () => void;
  accessibility?: UseAccessibilityReturn;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  currentRole,
  onRoleChange,
  isDarkMode,
  onToggleDarkMode,
  onClearCache,
  accessibility
}) => {
  const [allowPush, setAllowPush] = useState<boolean>(() => {
    return localStorage.getItem('sangsan_pref_push') !== 'false';
  });
  const [allowSound, setAllowSound] = useState<boolean>(() => {
    return localStorage.getItem('sangsan_pref_sound') !== 'false';
  });
  const [testNotice, setTestNotice] = useState<string | null>(null);

  useEffect(() => {
    registerServiceWorker();
  }, []);

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
    if (val && typeof window !== 'undefined') {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        await registerServiceWorker();
        setTestNotice('서비스워커 푸시 알림 권한이 허용되었습니다.');
      } else if (permission === 'denied') {
        setTestNotice('브라우저에서 알림 권한이 차단되어 있습니다.');
      }
      setTimeout(() => setTestNotice(null), 3000);
    }
  };

  const handleToggleSound = (val: boolean) => {
    setAllowSound(val);
    localStorage.setItem('sangsan_pref_sound', String(val));
    if (val) {
      playTestChime();
    }
  };

  const handleTriggerTestPush = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const sent = await sendSWNotification('상산고 체육대회 경기 알림', {
        body: '[축구 8강 1경기] 3학년 2반 vs 3학년 4반 경기가 15분 후 시작됩니다. (대운동장 A)',
        tag: 'test-push-notification'
      });
      if (sent) {
        setTestNotice('서비스워커 백그라운드 푸시 알림이 발송되었습니다.');
      } else {
        setTestNotice('[앱 내 알림] 축구 8강 1경기가 15분 후 시작됩니다.');
      }
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

        {/* Display & Accessibility Settings */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            디스플레이 및 접근성 센터 (Accessibility)
          </h3>

          {/* Dark Mode */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                {isDarkMode ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                화면 다크 모드
              </p>
              <p className="text-[11px] text-slate-400">야외 직사광선 시인성 및 배터리 절약을 위한 다크 테마 전환</p>
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

          {/* Font Scaling Control */}
          <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-blue-500" />
                  전체 글자 크기 조절
                </p>
                <p className="text-[11px] text-slate-400">화면 상의 본문, 대진표 및 스코어 글자 배율 조정</p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {accessibility?.fontScale === 'large' ? '110% (크게)' : accessibility?.fontScale === 'xlarge' ? '120% (아주 크게)' : '100% (기본)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { scale: 'normal', label: '보통 (100%)' },
                { scale: 'large', label: '크게 (110%)' },
                { scale: 'xlarge', label: '아주 크게 (120%)' }
              ].map((f) => (
                <button
                  key={f.scale}
                  type="button"
                  onClick={() => accessibility?.setFontScale(f.scale as any)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                    accessibility?.fontScale === f.scale
                      ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-slate-950 border-blue-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colorblind Friendly & High Contrast Modes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-500" />
                  색약 대응 색상 및 고대비 모드
                </p>
                <p className="text-[11px] text-slate-400">적록·황청 색약 시인성 보정 및 고대비 시각 테마 설정</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { mode: 'off', label: '기본 색상' },
                { mode: 'protanopia', label: '적록색약 보정' },
                { mode: 'tritanopia', label: '황청색약 보정' },
                { mode: 'high-contrast', label: '고대비 모드' }
              ].map((m) => (
                <button
                  key={m.mode}
                  type="button"
                  onClick={() => accessibility?.setColorblindMode(m.mode as any)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                    accessibility?.colorblindMode === m.mode
                      ? 'bg-purple-600 text-white dark:bg-purple-500 dark:text-slate-950 border-purple-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Accessibility Live Preview Card */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                접근성 적용 미리보기
              </span>
              <span className="text-[10px] text-slate-400">
                실시간 설정 상태: Font ({accessibility?.fontScale || 'normal'}) / Mode ({accessibility?.colorblindMode || 'off'})
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-red-600 text-white">
                  LIVE [진행중]
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  대운동장 A코트
                </span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10px]">승</span>
                  <span>3학년 2반</span>
                </div>
                <span className="font-mono text-base text-red-600 dark:text-red-400">3 - 1</span>
                <span>3학년 4반</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                다크모드 및 색약 모드 적용 시 배지, 점수, 텍스트가 시인성 높은 색상과 고대비 선명도로 가공되어 표시됩니다.
              </p>
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
