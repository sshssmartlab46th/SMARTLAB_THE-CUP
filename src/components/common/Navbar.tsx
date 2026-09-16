import React from 'react';
import { UserProfile, UserRole, WeatherInfo } from '../../types';
import { SangsanLogo } from './SangsanLogo';
import { SmartlabLogo } from './SmartlabLogo';
import { 
  Sun, 
  Moon,
  Bell,
  MessageSquare,
  HelpCircle,
  Activity,
  LogOut,
  Settings,
  LogIn,
  Shield
} from 'lucide-react';

export type MainNavTab = 
  | 'home' 
  | 'notices'
  | 'bracket' 
  | 'live' 
  | 'standings' 
  | 'schedule' 
  | 'login' 
  | 'privacy' 
  | 'rules' 
  | 'smartlab' 
  | 'contact' 
  | 'injury' 
  | 'suggestions' 
  | 'messages'
  | 'settings' 
  | 'formation' 
  | 'admin'
  | 'roledashboard'
  | 'weather';

export interface NavbarProps {
  currentRole: UserRole;
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  onRoleChange: (role: UserRole) => void;
  userProfile?: UserProfile | null;
  weather?: WeatherInfo | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMessages?: () => void;
  onOpenSuggestions?: () => void;
  onOpenInjuries?: () => void;
  onOpenAdminConsole?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  onRoleChange,
  userProfile,
  weather: propWeather,
  isDarkMode,
  onToggleDarkMode,
  onOpenMessages,
  onOpenSuggestions,
  onOpenInjuries,
  onOpenAdminConsole,
  onLogout
}) => {
  const isDashboardRole = currentRole !== 'student';

  const getRoleHeaderInfo = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          title: 'SYSTEM ADMINISTRATOR',
          scope: '전교 시스템 제어 & 전교 데이터',
          badgeColor: 'bg-red-600 text-white font-bold',
          lastActive: '방금 전'
        };
      case 'class_president':
        return {
          title: 'CLASS LEADER (반대표)',
          scope: '소속 학급 전용 라인업 및 선수 소집',
          badgeColor: 'bg-amber-400 text-slate-950 font-bold',
          lastActive: '3분 전'
        };
      case 'student_council':
        return {
          title: 'STUDENT COUNCIL & SPORTS COMMITTEE',
          scope: '경기 진행 지원 및 점수 확정',
          badgeColor: 'bg-blue-600 text-white font-bold',
          lastActive: '방금 전'
        };
      case 'teacher':
        return {
          title: 'FACULTY & ADVISOR (지도교사 · 교원)',
          scope: '학급 경기 지도 및 학생 격려, 전교 일정 참관',
          badgeColor: 'bg-purple-600 text-white font-bold',
          lastActive: '방금 전'
        };
      case 'referee':
        return {
          title: 'MATCH OPERATOR (공식 심판 · 기록원)',
          scope: '현장 실시간 스코어 기록(+1/-1), 판정 및 경기 운영',
          badgeColor: 'bg-amber-600 text-white font-bold',
          lastActive: '1분 전'
        };
      case 'health_officer':
        return {
          title: 'SAFETY & MEDICAL OFFICER (보건 안전 의무 본부)',
          scope: '실시간 트리아지 및 응급조치',
          badgeColor: 'bg-sky-500 text-white font-bold',
          lastActive: '방금 전'
        };
      default:
        return null;
    }
  };

  const roleInfo = isDashboardRole ? getRoleHeaderInfo(currentRole) : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Sangsan Crest & App Title */}
        <div 
          onClick={() => onTabChange('home')}
          className="flex items-center gap-3 shrink-0 cursor-pointer select-none"
        >
          <SangsanLogo size={36} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-black text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
                상산 체육대회
              </span>
              {isDashboardRole && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  대시보드
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
              {isDashboardRole ? '상산고등학교 스마트 운영 시스템' : '상산고등학교 스마트 보드'}
            </p>
          </div>
        </div>

        {/* Center: Main Nav Tabs */}
        <div className="hidden md:flex items-center justify-center flex-1">
          {roleInfo ? (
            <div className="flex items-center gap-3 text-xs">
              <span className={`px-3 py-1 rounded-full text-[11px] tracking-wide uppercase ${roleInfo.badgeColor}`}>
                {roleInfo.title}
              </span>
              <span className="text-slate-600 dark:text-slate-400 font-medium hidden lg:inline">
                {roleInfo.scope}
              </span>
            </div>
          ) : (
            <nav className="flex items-center gap-1 overflow-x-auto py-1">
              {[
                { tab: 'home', label: '종합 홈' },
                { tab: 'notices', label: '공지사항' },
                { tab: 'bracket', label: '대진표' },
                { tab: 'schedule', label: '전체 일정' },
                { tab: 'live', label: '실시간 현황' },
                { tab: 'standings', label: '학급 순위' }
              ].map(t => (
                <button
                  key={t.tab}
                  type="button"
                  onClick={() => onTabChange(t.tab as MainNavTab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition cursor-pointer whitespace-nowrap ${
                    activeTab === t.tab
                      ? 'bg-red-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-emerald-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Right Tools & Shortcuts */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Simple Live Temperature Badge */}
          {propWeather && (
            <button
              type="button"
              onClick={() => onTabChange('weather')}
              title="상산고 실시간 날씨 및 기상 센터 열기"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{propWeather.temp}°C</span>
            </button>
          )}

          {/* Quick Shortcuts */}
          <button
            type="button"
            onClick={() => onTabChange('notices')}
            title="공지사항 전체 목록"
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              activeTab === 'notices'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-600 dark:text-red-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-600'
            }`}
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onTabChange('injury')}
            title="부상백과"
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              activeTab === 'injury'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-600'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-600'
            }`}
          >
            <Activity className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onTabChange('suggestions')}
            title="건의함"
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              activeTab === 'suggestions'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-500'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {['class_president', 'student_council', 'admin', 'teacher', 'referee', 'student'].includes(currentRole) && (
            <button
              type="button"
              onClick={() => onTabChange('messages')}
              title="실시간 쪽지함"
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                activeTab === 'messages'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-600 dark:text-red-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-600'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}

          {/* User Role Badge (Assigned strictly by Admin) */}
          {userProfile ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  currentRole === 'admin' ? 'bg-red-600 text-white' :
                  currentRole === 'student_council' ? 'bg-blue-600 text-white' :
                  currentRole === 'class_president' ? 'bg-emerald-600 text-white' :
                  currentRole === 'teacher' ? 'bg-purple-600 text-white' :
                  currentRole === 'referee' ? 'bg-amber-600 text-white' :
                  currentRole === 'health_officer' ? 'bg-rose-600 text-white' :
                  'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {currentRole === 'admin' ? '총괄관리자' :
                   currentRole === 'student_council' ? '학생회' :
                   currentRole === 'class_president' ? '반장' :
                   currentRole === 'teacher' ? '교사' :
                   currentRole === 'referee' ? '심판/기록원' :
                   currentRole === 'health_officer' ? '보건담당' : '학생'}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {userProfile.studentId}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 hidden sm:inline">
                  {userProfile.name}
                </span>
              </div>

              {/* Admin Console Shortcut if Admin */}
              {currentRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => onTabChange('admin')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100'
                  }`}
                  title="관리자 콘솔 열기"
                >
                  어드민
                </button>
              )}

              {/* Class President Formation Shortcut */}
              {currentRole === 'class_president' && (
                <button
                  type="button"
                  onClick={() => onTabChange('formation')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === 'formation'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                  }`}
                  title="학급 라인업 제출"
                >
                  라인업
                </button>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                title="로그아웃"
                className="p-1.5 text-slate-400 hover:text-red-500 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onTabChange('login')}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              로그인 / 인증
            </button>
          )}

          {/* Smartlab official logo */}
          <div onClick={() => onTabChange('smartlab')} className="cursor-pointer">
            <SmartlabLogo size={28} showText={true} />
          </div>
        </div>
      </div>
    </header>
  );
};
