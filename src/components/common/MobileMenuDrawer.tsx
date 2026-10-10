import React, { useState } from 'react';
import { UserProfile, UserRole, MatchItem, SuggestionItem, getUserRoles, hasUserRole } from '../../types';
import { MainNavTab } from './Navbar';
import { 
  X, 
  Moon, 
  Sun, 
  Sliders, 
  LayoutDashboard, 
  Bell, 
  BellOff, 
  MessageSquare, 
  HelpCircle, 
  Activity, 
  FileText, 
  Shield, 
  LogOut, 
  LogIn, 
  CloudSun, 
  CheckCircle, 
  ChevronRight, 
  PlusCircle, 
  Clock, 
  Lock, 
  AlertTriangle,
  Send,
  User,
  ExternalLink,
  Award
} from 'lucide-react';
import { SangsanLogo } from './SangsanLogo';
import { SmartlabLogo } from './SmartlabLogo';

export interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  matches: MatchItem[];
  userReminders: string[];
  onToggleReminder: (match: MatchItem) => void;
  suggestions: SuggestionItem[];
  onNavigateToTab: (tab: MainNavTab) => void;
  onOpenSuggestionModal?: () => void;
  onLogout: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentRole,
  onRoleChange,
  isDarkMode,
  onToggleDarkMode,
  matches,
  userReminders,
  onToggleReminder,
  suggestions,
  onNavigateToTab,
  onOpenSuggestionModal,
  onLogout
}) => {
  const [activeSubSection, setActiveSubSection] = useState<'all' | 'admin' | 'alarm' | 'suggestions' | 'settings'>('all');

  if (!isOpen) return null;

  const isAdmin = hasUserRole(currentUser, 'admin');
  const isClassPresident = hasUserRole(currentUser, 'class_president');
  const isStudentCouncil = hasUserRole(currentUser, 'student_council');
  const isReferee = hasUserRole(currentUser, 'referee');
  const isHealthOfficer = hasUserRole(currentUser, 'health_officer');
  const isTeacher = currentUser?.isTeacher || currentRole === 'teacher';

  const userRoles = getUserRoles(currentUser);

  // Filter matches that have reminders set
  const remindedMatches = matches.filter((m) => userReminders.includes(m.id));

  // Upcoming matches for reminder shortcut
  const upcomingMatches = matches
    .filter((m) => m.status === 'SCHEDULED')
    .slice(0, 5);

  const handleTabClick = (tab: MainNavTab) => {
    onNavigateToTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-sm h-full bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col shadow-2xl z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xl font-black text-red-600 dark:text-red-400">≡</span>
            <div>
              <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                전체 메뉴 & 빠른 제어
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                어드민 기능 · 경기 알람 · 건의함 · 환경설정
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
          {currentUser ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-red-600/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm">
                    {currentUser.name?.[0] || '상'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {currentUser.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        ({currentUser.studentId})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isTeacher 
                        ? '상산고등학교 지도교사' 
                        : `${currentUser.grade}학년 ${currentUser.classNum}반 ${currentUser.gender === 'female' ? '여학생' : currentUser.gender === 'male' ? '남학생' : ''}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>로그아웃</span>
                </button>
              </div>

              {/* Roles Badge List */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                {isTeacher && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">
                    선생님 (교사)
                  </span>
                )}
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                    총괄본부 관리자
                  </span>
                )}
                {isStudentCouncil && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                    학생회 체육부
                  </span>
                )}
                {isClassPresident && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                    학급 반장
                  </span>
                )}
                {isReferee && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                    공식 심판진
                  </span>
                )}
                {isHealthOfficer && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                    보건 담당
                  </span>
                )}
                {!isAdmin && !isStudentCouncil && !isClassPresident && !isReferee && !isHealthOfficer && !isTeacher && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    일반 학생
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  로그인이 필요합니다
                </p>
                <p className="text-[11px] text-slate-500">
                  학번을 인증하고 모든 기능을 이용하세요
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTabClick('login')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>로그인</span>
              </button>
            </div>
          )}
        </div>

        {/* Main Content Sections */}
        <div className="flex-1 p-4 space-y-6">
          {/* 1. 어드민 추가 기능 (Admin & Staff Capabilities) */}
          {(isAdmin || isClassPresident || isStudentCouncil || isReferee || isHealthOfficer || isTeacher) && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>어드민 & 권한자 추가 기능</span>
                </div>
                {isAdmin && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold">
                    총괄본부
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTabClick('admin')}
                      className="w-full p-3 rounded-2xl bg-linear-to-r from-red-600 to-red-700 text-white text-left font-bold text-xs flex items-center justify-between shadow-xs transition hover:brightness-105 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sliders className="w-4 h-4 text-white" />
                        <div>
                          <div>어드민 콘솔 열기</div>
                          <div className="text-[10px] font-normal text-red-100">
                            경기 생성 · 스코어 제어 · 대진표 편집
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-red-200" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabClick('roledashboard')}
                      className="w-full p-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-left font-bold text-xs flex items-center justify-between shadow-xs transition hover:bg-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div>직무별 대시보드 전체 점검</div>
                          <div className="text-[10px] font-normal text-slate-400">
                            반장 · 심판 · 보건 · 학생회 통합 현황
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </>
                )}

                {isClassPresident && (
                  <button
                    type="button"
                    onClick={() => handleTabClick('formation')}
                    className="w-full p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-left font-bold text-xs flex items-center justify-between hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>학급 라인업 명단 제출</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                  </button>
                )}

                {(isStudentCouncil || isReferee || isHealthOfficer || isTeacher) && !isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleTabClick('roledashboard')}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-left font-bold text-xs flex items-center justify-between hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-red-500" />
                      <span>
                        {isStudentCouncil ? '학생회 진행 대시보드' :
                         isReferee ? '심판 판정 및 스코어 제어' :
                         isHealthOfficer ? '의무실 환자 접수 현황' : '교사용 대시보드'}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. 알람 기능 (Match Notifications & Alarms) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                <Bell className="w-3.5 h-3.5" />
                <span>경기 알람 기능 (10분 전 알림)</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold font-mono">
                {userReminders.length}개 설정됨
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2.5">
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                경기 시작 10분 전에 알람을 받아 놓치지 않고 응원과 경기에 참여할 수 있습니다.
              </p>

              {/* Reminded Matches List */}
              {remindedMatches.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                    현재 알림 설정된 경기:
                  </div>
                  {remindedMatches.map((m) => (
                    <div 
                      key={m.id}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs"
                    >
                      <div className="truncate mr-2">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate text-[11px]">
                          {m.title}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {m.court} · {m.homeTeam} vs {m.awayTeam}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleReminder(m)}
                        className="px-2 py-1 rounded-lg bg-amber-500 text-white font-bold text-[10px] shrink-0 hover:bg-amber-600 transition cursor-pointer flex items-center gap-1"
                        title="알림 해제"
                      >
                        <BellOff className="w-3 h-3" />
                        <span>해제</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  아직 설정된 경기 알람이 없습니다. 경기 일정에서 종 모양 아이콘을 눌러 알람을 켜보세요!
                </div>
              )}

              {/* Upcoming Matches Quick Setup */}
              {upcomingMatches.length > 0 && (
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/30 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    다가오는 경기 바로 알람 켜기:
                  </div>
                  <div className="space-y-1">
                    {upcomingMatches.slice(0, 3).map((m) => {
                      const isSet = userReminders.includes(m.id);
                      return (
                        <div 
                          key={m.id}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-white/70 dark:bg-slate-900/50 text-[11px]"
                        >
                          <span className="truncate mr-2 text-slate-700 dark:text-slate-300 font-medium">
                            {m.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleReminder(m)}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              isSet 
                                ? 'bg-amber-500 text-white' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-500'
                            }`}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleTabClick('schedule')}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>경기 일정표에서 알람 전체 관리</span>
              </button>
            </div>
          </div>

          {/* 3. 학생 의견란 (건의함 / Suggestions) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>학생 의견란 (건의함)</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold font-mono">
                {suggestions.length}건 접수
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2.5">
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                체육대회 시설, 규칙, 운영 등에 대한 건의 및 문의사항을 총괄본부와 학생회에 전달합니다.
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenSuggestionModal) {
                      onOpenSuggestionModal();
                      onClose();
                    } else {
                      handleTabClick('suggestions');
                    }
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>새 건의 작성</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick('suggestions')}
                  className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>건의함 전체보기</span>
                </button>
              </div>

              {/* Recent Inquiries Preview */}
              {suggestions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    최근 등록된 의견:
                  </div>
                  {suggestions.slice(0, 3).map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handleTabClick('suggestions')}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs cursor-pointer hover:border-emerald-400 transition"
                    >
                      <div className="truncate mr-2">
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate block text-[11px]">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.authorName || item.authorStudentId || '익명'}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        item.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {item.status === 'RESOLVED' ? '답변 완료' : '검토중'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. 시스템 설정 (Settings & Preferences) */}
          <div className="space-y-2.5">
            <div className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              환경 및 시스템 설정
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              {/* Dark Mode Switcher Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isDarkMode ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isDarkMode ? '다크 모드 활성화됨' : '라이트 모드 활성화됨'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      배경 및 컴포넌트 테마 실시간 전환
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isDarkMode ? 'bg-red-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    isDarkMode ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Settings Page Navigation */}
              <button
                type="button"
                onClick={() => handleTabClick('settings')}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
              >
                <span>상세 설정 (역할 전환, 정보 확인)</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* 5. 기타 바로가기 (Other Quick Links) */}
          <div className="space-y-2">
            <div className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              대회 안내 및 바로가기
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleTabClick('notices')}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-red-500" />
                <span>공지사항</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('messages')}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                <span>실시간 쪽지함</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('injury')}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                <span>부상백과</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('weather')}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                <span>기상 센터</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('board')}
                className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 hover:bg-red-100 text-red-600 dark:text-red-400 font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-red-500" />
                <span>전광판 화면 (/board)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('rules')}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>대회 규정집</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('privacy')}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>개인정보방침</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('smartlab')}
                className="col-span-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <SmartlabLogo size={18} showText={false} />
                  <span>스마트랩 (SMARTLAB) 소개</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-center">
          <p className="text-[11px] font-mono text-slate-400">
            made by SMARTLAB
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">
            상산고등학교 스마트 대회 플랫폼
          </p>
        </div>
      </div>
    </div>
  );
};
