import React, { useState, useEffect } from 'react';
import { 
  MatchItem, 
  AuditLogEntry, 
  SuggestionItem, 
  FestivalConfig,
  UserProfile
} from '../../types';
import { 
  AdminEmergencyControlCard, 
  AdminSystemStatusCard, 
  AdminScoreApprovalCard, 
  AdminAuditLogCard, 
  AdminInquiryListCard 
} from '../index';
import { 
  ShieldAlert, 
  Users, 
  Trophy, 
  CheckCircle2, 
  History,
  LayoutDashboard
} from 'lucide-react';
import { listenAllUsers } from '../../services/firebaseService';
import { AdminStudentRosterTab } from '../admin/AdminStudentRosterTab';
import { AdminBracketManagerTab } from '../admin/AdminBracketManagerTab';
import { AdminPointsConfigTab } from '../admin/AdminPointsConfigTab';

interface AdminConsolePageProps {
  matches: MatchItem[];
  auditLogs: AuditLogEntry[];
  inquiries: SuggestionItem[];
  festivalConfig: FestivalConfig | null;
  onRefresh?: () => void;
}

export const AdminConsolePage: React.FC<AdminConsolePageProps> = ({
  matches,
  auditLogs,
  inquiries,
  festivalConfig
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'roster' | 'brackets' | 'points' | 'audit'>('roster');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenAllUsers((list) => {
      setAllUsers(list);
    });
    return () => unsub();
  }, []);

  const handleNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white">
              SYSTEM ADMINISTRATOR
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              전교 데이터 & 대진 제어
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
            상산고 체육대회 통합 어드민 콘솔
          </h2>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto">
          {[
            { key: 'roster', label: '반별 학생 명단 & 엑셀', icon: Users },
            { key: 'brackets', label: '대진표 관리 (남녀 구분)', icon: Trophy },
            { key: 'points', label: '종목별 배점 설정', icon: Trophy },
            { key: 'overview', label: '종합 관제', icon: LayoutDashboard },
            { key: 'audit', label: '감사 로그', icon: History }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveSubTab(t.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  activeSubTab === t.key
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time notification banner */}
      {noticeMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* 1. Roster Subtab: Class-by-class Student Roster & Excel Download */}
      {activeSubTab === 'roster' && (
        <AdminStudentRosterTab
          allUsers={allUsers}
          onNotice={handleNotice}
        />
      )}

      {/* 2. Brackets Subtab: Sangsan High School 12 Classes Match Creation */}
      {activeSubTab === 'brackets' && (
        <AdminBracketManagerTab
          matches={matches}
          onNotice={handleNotice}
        />
      )}

      {/* 3. Points Subtab: Sport-specific Scoring Criteria */}
      {activeSubTab === 'points' && (
        <AdminPointsConfigTab
          onNotice={handleNotice}
        />
      )}

      {/* 4. Overview Subtab */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <AdminSystemStatusCard
            userCount={allUsers.length}
            matchCount={matches.length}
            inquiryCount={inquiries.length}
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <AdminScoreApprovalCard />
              <AdminInquiryListCard />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <AdminEmergencyControlCard />
            </div>
          </div>
        </div>
      )}

      {/* 5. Audit Logs Subtab */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <AdminAuditLogCard auditLogs={auditLogs} />
        </div>
      )}
    </div>
  );
};
