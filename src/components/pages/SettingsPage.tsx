import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import { Settings, Moon, Sun, Bell, Volume2, Shield, RefreshCw } from 'lucide-react';

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
  const [allowPush, setAllowPush] = useState(true);
  const [allowSound, setAllowSound] = useState(true);

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
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Notifications & Sound */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            경기 알림 및 사운드
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">경기 시작 15분 전 푸시 알림</p>
              <p className="text-[11px] text-slate-400">알림 설정한 경기의 소집 시간 안내</p>
            </div>
            <input
              type="checkbox"
              checked={allowPush}
              onChange={(e) => setAllowPush(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">점수 득점 효과음</p>
              <p className="text-[11px] text-slate-400">실시간 스코어 변동 시 경쾌한 오디오 피드백</p>
            </div>
            <input
              type="checkbox"
              checked={allowSound}
              onChange={(e) => setAllowSound(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
            />
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
              { role: 'student', label: '학생 (일반 홈)' },
              { role: 'class_president', label: '반대표 (포메이션)' },
              { role: 'student_council', label: '학생회 (점수확정)' },
              { role: 'teacher', label: '심판/기록원 (스코어보드)' },
              { role: 'health_officer', label: '보건의무본부 (트리아지)' },
              { role: 'admin', label: '총괄관리자 (어드민)' }
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
