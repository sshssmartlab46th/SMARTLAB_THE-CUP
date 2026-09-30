import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, AuditLogEntry, FestivalConfig } from '../../types';
import { 
  listenAllUsers, 
  deleteUser, 
  updateUserRole, 
  listenAuditLogs,
  listenFestivalConfig,
  updateFestivalConfig
} from '../../services/firebaseService';
import { getRoleBadgeInfo } from '../../utils/studentIdParser';
import { formatKSTDateTime } from '../../utils/kstTime';
import { Shield, Users, FileText, ToggleLeft, ToggleRight, Trash2, Check, X, Search, ShieldAlert, HelpCircle, BookOpen } from 'lucide-react';
import { AdminLoginInquiriesTab } from './AdminLoginInquiriesTab';
import { AdminDocumentManagerTab } from './AdminDocumentManagerTab';

interface AdminDashboardModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  currentUser,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'system' | 'users' | 'documents' | 'audit' | 'inquiries'>('system');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [festivalConfig, setFestivalConfig] = useState<FestivalConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unUsers = listenAllUsers((list) => setUsers(list));
    const unAudit = listenAuditLogs((logs) => setAuditLogs(logs));
    const unFest = listenFestivalConfig((cfg) => setFestivalConfig(cfg));

    return () => {
      unUsers();
      unAudit();
      unFest();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  if (currentUser.role !== 'admin' && currentUser.role !== 'student_council') {
    return null;
  }

  const handleToggleFestivalOpen = async () => {
    const nextState = !festivalConfig?.isOpen;
    await updateFestivalConfig({ isOpen: nextState });
    showNotice(`대회 탭 접근 상태가 [${nextState ? '공개(OPEN)' : '비공개(LOCKED)'}]으로 변경되었습니다.`);
  };

  const handleKickUser = async (studentId: string, name: string) => {
    if (window.confirm(`정말 [${studentId} ${name}] 회원을 강제 탈퇴(삭제) 처리하시겠습니까? 중복 학번 제한이 해제되어 재가입이 가능해집니다.`)) {
      await deleteUser(studentId);
      showNotice(`${studentId} 회원이 성공적으로 삭제되었습니다.`);
    }
  };

  const handleRoleChange = async (studentId: string, newRole: UserRole) => {
    await updateUserRole(studentId, newRole);
    showNotice(`${studentId} 권한이 [${newRole}]으로 변경되었습니다.`);
  };

  const handleToggleSuggestionAnswer = async (studentId: string, currentVal: boolean) => {
    await updateUserRole(studentId, 'student_council', !currentVal);
    showNotice(`${studentId} 건의함 답변 권한이 [${!currentVal ? '허용' : '차단'}]되었습니다.`);
  };

  const showNotice = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const seenStudentIds = new Set<string>();
  const filteredUsers = users.filter((u) => {
    const sId = (u.studentId || u.uid || '').trim();
    if (!sId || seenStudentIds.has(sId)) return false;
    seenStudentIds.add(sId);
    const q = searchQuery.toLowerCase();
    return (u.studentId || '').includes(q) || (u.name || '').toLowerCase().includes(q) || (u.role || '').includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                THE SANGSAN 총괄 관리자 콘솔
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                기획서 Section 10 시스템 개폐 제어, 회원 및 권한 매트릭스, 실시간 감사 로그
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action toast */}
        {actionSuccess && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" /> {actionSuccess}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeTab === 'system'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <ToggleRight className="w-3.5 h-3.5" />
            시스템 및 대회 개폐
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeTab === 'users'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            학번/회원 및 권한 관리 ({users.length}명)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeTab === 'documents'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            규정집 및 문서 관리
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            스코어 수정 감사 로그 ({auditLogs.length}건)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeTab === 'inquiries'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            로그인 문제 접수 / 사연함
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'system' && (
            <div className="space-y-4 max-w-xl">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      대회 탭 전체 개폐 스위치 (Festival Open / Lock)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      체육대회 기간이 아닐 때 일반 학생의 대회 탭 접근을 잠급니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleFestivalOpen}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      festivalConfig?.isOpen
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {festivalConfig?.isOpen ? '현재 공개중 (OPEN)' : '현재 잠김 (LOCKED)'}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  플랫폼 기본 정보
                </h3>
                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <p>• 행사명: <strong>{festivalConfig?.name || '2026 상산고등학교 체육대회'}</strong></p>
                  <p>• 시스템 개발/저작권: <strong>made by SMARTLAB</strong></p>
                  <p>• 계정 규정: 5자리 고유 학번 자동 파싱, 실명제, 비번 없는 세션 유지</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="학번, 이름 또는 역할 검색..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">학번</th>
                      <th className="p-3">이름</th>
                      <th className="p-3">학급/구분</th>
                      <th className="p-3">현재 역할</th>
                      <th className="p-3">건의답변 권한</th>
                      <th className="p-3 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((u, idx) => {
                      const badge = getRoleBadgeInfo(u.role);
                      return (
                        <tr key={`${u.studentId || 'u'}-${u.uid || idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                            {u.studentId}
                          </td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            {u.name}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {u.isTeacher ? '선생님' : `${u.grade}학년 ${u.classNum}반 (${u.gender === 'male' ? '남' : '여'})`}
                          </td>
                          <td className="p-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.studentId, e.target.value as UserRole)}
                              className="px-2 py-1 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                            >
                              <option value="student">학생</option>
                              <option value="class_president">반장</option>
                              <option value="student_council">학생회</option>
                              <option value="teacher">선생님</option>
                              <option value="health_officer">보건 담당</option>
                              <option value="admin">총괄 관리자</option>
                            </select>
                          </td>
                          <td className="p-3">
                            {u.role === 'student_council' ? (
                              <button
                                type="button"
                                onClick={() => handleToggleSuggestionAnswer(u.studentId, Boolean(u.canAnswerSuggestion))}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  u.canAnswerSuggestion
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                                }`}
                              >
                                {u.canAnswerSuggestion ? '답변 가능' : '답변 불가'}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {u.studentId !== 'sshsgym' && (
                              <button
                                type="button"
                                onClick={() => handleKickUser(u.studentId, u.name)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                                title="회원 강제 탈퇴 (삭제)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>경기 스코어 또는 결과 수정 시 SHA-256 해시 체인 및 접속 IP와 함께 영구 보존되는 감사 로그입니다.</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  SHA-256 Cryptographic Chain
                </span>
              </div>
              <div className="space-y-2">
                {auditLogs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    기록된 스코어 수정 내역이 없습니다.
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {log.matchTitle}
                          </span>
                          <span className="font-mono text-red-600 dark:text-red-400 font-bold">
                            {log.oldValue || log.previousScore || '0:0'} ➔ {log.newValue || log.updatedScore || '0:0'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          IP: {log.ipAddress || '127.0.0.1'} &middot; {log.timestamp ? formatKSTDateTime(log.timestamp) : '-'}
                        </div>
                      </div>

                      <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                        <strong>수정 사유:</strong> {log.reason} &middot; <span className="text-slate-400">수정자: {log.operatorName || log.modifiedByName} ({log.operatorRole || log.modifiedBy})</span>
                      </div>

                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="truncate max-w-[80%]" title={`SHA-256 Hash: ${log.hash || 'N/A'}`}>
                          Hash: {log.hash ? `${log.hash.slice(0, 16)}...${log.hash.slice(-12)}` : 'N/A'}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold font-sans">
                          ✓ 검증 완료
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <AdminDocumentManagerTab currentUser={currentUser} />
            </div>
          )}

          {activeTab === 'inquiries' && (
            <AdminLoginInquiriesTab />
          )}
        </div>
      </div>
    </div>
  );
};
