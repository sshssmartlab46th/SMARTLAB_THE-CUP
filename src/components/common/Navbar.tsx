import React from 'react';
import { UserProfile, UserRole, WeatherInfo, getUserRoles, hasUserRole } from '../../types';
import { SangsanLogo } from './SangsanLogo';
import { SmartlabLogo } from './SmartlabLogo';
import { 
  Sun, 
  Moon, 
  Bell, 
  MessageSquare, 
  Activity, 
  LogOut, 
  LogIn, 
  Eye, 
  Sliders 
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
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenMobileMenu?: () => void;
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
  onOpenMobileMenu,
  onOpenMessages,
  onOpenInjuries,
  onOpenAdminConsole,
  onLogout
}) => {
  const isAdmin = hasUserRole(userProfile, 'admin');
  const isClassPresident = hasUserRole(userProfile, 'class_president');
  const isStudentCouncil = hasUserRole(userProfile, 'student_council');
  const isReferee = hasUserRole(userProfile, 'referee');
  const isHealthOfficer = hasUserRole(userProfile, 'health_officer');
  const isTeacher = userProfile?.isTeacher || currentRole === 'teacher';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Sangsan Crest & App Title */}
        <div 
          onClick={() => onTabChange('home')}
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer select-none"
        >
          <SangsanLogo size={34} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-black text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
                상산 체육대회
              </span>
              {isAdmin && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white shadow-2xs">
                  총괄본부
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
              {isAdmin ? '스마트 운영 플랫폼 (어드민 겸용)' : '상산고등학교 스마트 대회 플랫폼'}
            </p>
          </div>
        </div>

        {/* Center: Main Student Navigation Tabs - Visible on Desktop */}
        <div className="hidden md:flex items-center justify-center flex-1">
          <nav className="flex items-center gap-1 py-1">
            {[
              { tab: 'home', label: '종합 홈' },
              { tab: 'notices', label: '공지사항' },
              { tab: 'schedule', label: '경기 일정' },
              { tab: 'live', label: '실시간 현황' },
              { tab: 'standings', label: '학급 순위' }
            ].map(t => {
              const isTabActive = activeTab === t.tab || (t.tab === 'schedule' && activeTab === 'bracket');
              return (
                <button
                  key={t.tab}
                  type="button"
                  onClick={() => onTabChange(t.tab as MainNavTab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition cursor-pointer whitespace-nowrap ${
                    isTabActive
                      ? 'bg-red-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-emerald-400'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}

            {/* Special Role Tabs attached seamlessly */}
            {isClassPresident && (
              <button
                type="button"
                onClick={() => onTabChange('formation')}
                className={`ml-1 px-3 py-1.5 text-xs font-bold rounded-full transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'formation'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <span>라인업 제출</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => onTabChange('admin')}
                className={`ml-1 px-3 py-1.5 text-xs font-bold rounded-full transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'admin'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>어드민 콘솔</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right Tools & Shortcuts */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

          {/* Quick Dark Mode Toggle (Header) */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Desktop-only Secondary Buttons */}
          <div className="hidden md:flex items-center gap-1.5">
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
          </div>

          {/* User Role & Profile Badge (Desktop) */}
          {userProfile ? (
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1">
                  {isTeacher ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">
                      교사
                    </span>
                  ) : (
                    <>
                      {isAdmin && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                          총괄관리자
                        </span>
                      )}
                      {isStudentCouncil && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                          학생회
                        </span>
                      )}
                      {isClassPresident && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                          반장
                        </span>
                      )}
                      {isReferee && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                          심판
                        </span>
                      )}
                      {isHealthOfficer && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                          보건
                        </span>
                      )}
                      {!isAdmin && !isStudentCouncil && !isClassPresident && !isReferee && !isHealthOfficer && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          학생
                        </span>
                      )}
                    </>
                  )}
                </div>

                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {userProfile.studentId}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {userProfile.name}
                </span>
              </div>

              {/* Admin Quick Switcher Button */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onTabChange(activeTab === 'admin' ? 'home' : 'admin')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    activeTab === 'admin'
                      ? 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                  }`}
                  title={activeTab === 'admin' ? '학생 화면(종합 홈)으로 전환' : '관리자 콘솔 열기'}
                >
                  {activeTab === 'admin' ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>학생 화면</span>
                    </>
                  ) : (
                    <>
                      <Sliders className="w-3.5 h-3.5" />
                      <span>어드민 콘솔</span>
                    </>
                  )}
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
              className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">로그인 / 인증</span>
              <span className="sm:hidden">로그인</span>
            </button>
          )}

          {/* Mobile-only Hamburger Menu Button (≡) */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            title="전체 메뉴 (≡)"
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center"
          >
            <span className="font-mono text-lg font-black leading-none">≡</span>
          </button>

          {/* Smartlab official logo */}
          <div onClick={() => onTabChange('smartlab')} className="hidden sm:block cursor-pointer">
            <SmartlabLogo size={28} showText={true} />
          </div>
        </div>
      </div>
    </header>
  );
};
