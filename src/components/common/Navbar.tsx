import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, UserRole, WeatherInfo } from '../../types';
import { SangsanLogo } from './SangsanLogo';
import { SmartlabLogo } from './SmartlabLogo';
import { useOpenMeteoWeather } from '../../hooks/useOpenMeteoWeather';
import { 
  Sun, 
  Moon,
  MessageSquare,
  HelpCircle,
  Activity,
  LogOut,
  Settings,
  Calendar,
  LogIn,
  Shield,
  BookOpen,
  CloudRain,
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  RefreshCw,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export type MainNavTab = 
  | 'home' 
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
  | 'settings' 
  | 'formation' 
  | 'admin';

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
  const { weather: liveWeather, refreshing: weatherRefreshing, refetch: refetchWeather } = useOpenMeteoWeather({
    refreshIntervalMs: 60000 // Direct client-side refresh from Open-Meteo every 60s
  });

  const weather = liveWeather || propWeather || {
    temp: 22,
    temperature: 22,
    condition: '맑음',
    rainProb: 10,
    precipitation: '10%',
    apparentTemp: 22,
    humidity: 55,
    windSpeed: 8,
    statusText: '야외 체육활동 및 경기 진행 최적'
  };

  const [showWeatherPopup, setShowWeatherPopup] = useState(false);
  const weatherPopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (weatherPopupRef.current && !weatherPopupRef.current.contains(event.target as Node)) {
        setShowWeatherPopup(false);
      }
    };
    if (showWeatherPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWeatherPopup]);

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
          title: 'MATCH OPERATOR (심판 · 기록원)',
          scope: '오프라인 캐싱 지원 배정 경기 기록',
          badgeColor: 'bg-red-600 text-white font-bold',
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
                { tab: 'bracket', label: '대진표' },
                { tab: 'schedule', label: '전체 일정' },
                { tab: 'live', label: '실시간 현황' },
                { tab: 'standings', label: '학급 순위' },
                { tab: 'rules', label: '규정집' }
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
          {/* Real-time Weather Badge & Popover */}
          <div className="relative" ref={weatherPopupRef}>
            <button
              type="button"
              onClick={() => setShowWeatherPopup(!showWeatherPopup)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title="상산고 실시간 기상 정보"
            >
              <span className={`w-2 h-2 rounded-full inline-block ${weatherRefreshing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="hidden sm:inline font-semibold font-mono">{weather?.temp ?? 22}°C</span>
              <span className="hidden md:inline text-slate-500 dark:text-slate-400">{weather?.condition ?? '맑음'}</span>
              <span className="hidden lg:inline text-slate-400">(강수 {weather?.rainProb ?? 10}%)</span>
              <RefreshCw className={`w-3 h-3 text-slate-400 ml-0.5 ${weatherRefreshing ? 'animate-spin text-red-600 dark:text-emerald-400' : ''}`} />
            </button>

            {/* Weather Popover */}
            {showWeatherPopup && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">상산고 실시간 기상</div>
                      <div className="text-[10px] text-slate-400">전주시 완산구 효자동 상산고 운동장</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => refetchWeather()}
                    disabled={weatherRefreshing}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer flex items-center gap-1 text-[11px]"
                    title="기상 실시간 새로고침"
                  >
                    <RefreshCw className={`w-3 h-3 ${weatherRefreshing ? 'animate-spin text-red-600' : ''}`} />
                    <span>{weather.lastUpdated ? `${weather.lastUpdated} 갱신` : '새로고침'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                      {weather?.temp ?? 22}°C
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {weather?.condition ?? '맑음'} · 체감 {weather?.apparentTemp ?? 22}°C
                    </div>
                  </div>
                  <div className="text-right space-y-1 text-[11px] font-mono">
                    <div className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold">
                      강수확률 {weather?.rainProb ?? 10}%
                    </div>
                    <div className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      습도 {weather?.humidity ?? 55}% · 풍속 {weather?.windSpeed ?? 8}km/h
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="leading-snug text-[11px]">{weather?.statusText || '야외 체육활동 및 경기 진행에 적합한 날씨입니다.'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
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

          {['class_president', 'student_council', 'admin', 'teacher'].includes(currentRole) && (
            <button
              type="button"
              onClick={onOpenMessages}
              title="비상 쪽지"
              className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
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
                  currentRole === 'health_officer' ? 'bg-rose-600 text-white' :
                  'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {currentRole === 'admin' ? '총괄관리자' :
                   currentRole === 'student_council' ? '학생회' :
                   currentRole === 'class_president' ? '반장' :
                   currentRole === 'teacher' ? '교사' :
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
