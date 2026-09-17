import React, { useState } from 'react';
import { UserProfile, UserRole, getUserRoles } from '../../types';
import { 
  Users, 
  Search, 
  Download, 
  Trash2, 
  Filter, 
  FileSpreadsheet,
  Check,
  GraduationCap,
  ShieldCheck,
  Edit3,
  X,
  Info
} from 'lucide-react';
import { updateUserRole, updateUserRoles, deleteUser } from '../../services/firebaseService';
import { formatKSTDateTime } from '../../utils/kstTime';

interface AdminStudentRosterTabProps {
  allUsers: UserProfile[];
  onNotice: (msg: string) => void;
}

export const AdminStudentRosterTab: React.FC<AdminStudentRosterTabProps> = ({
  allUsers,
  onNotice
}) => {
  const [selectedGrade, setSelectedGrade] = useState<string>('all'); // 'all', '1', '2', '3'
  const [selectedClass, setSelectedClass] = useState<string>('all'); // 'all', '1' ~ '12', 'teacher'
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Multi-role edit modal state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [modalRoles, setModalRoles] = useState<UserRole[]>([]);
  const [isSavingRoles, setIsSavingRoles] = useState<boolean>(false);

  // Open modal
  const handleOpenRoleModal = (user: UserProfile) => {
    setEditingUser(user);
    setModalRoles(getUserRoles(user));
  };

  const handleToggleModalRole = (role: UserRole) => {
    if (role === 'student' || role === 'teacher') return; // 학생은 기본 베이스, 교사는 단독
    setModalRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const handleSaveModalRoles = async () => {
    if (!editingUser) return;
    setIsSavingRoles(true);
    try {
      await updateUserRoles(editingUser.studentId, modalRoles);
      onNotice(`[${editingUser.studentId} ${editingUser.name}]의 겸직 권한이 성공적으로 저장되었습니다.`);
      setEditingUser(null);
    } catch (e) {
      console.error(e);
      alert('겸직 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingRoles(false);
    }
  };

  // Gender classification check:
  // Male: 1~4, 9~12
  // Female: 5~8
  const getGenderLabel = (grade: string, classNum: string, isTeacher?: boolean, role?: UserRole) => {
    if (role === 'admin') return '총괄본부';
    if (isTeacher) return '교사';
    const c = parseInt(classNum, 10);
    if ((c >= 1 && c <= 4) || (c >= 9 && c <= 12)) return '남 (남학급)';
    if (c >= 5 && c <= 8) return '여 (여학급)';
    return '-';
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return '총괄 관리자';
      case 'student_council': return '학생회';
      case 'class_president': return '반장';
      case 'teacher': return '선생님 (지도교사)';
      case 'referee': return '공식 심판 / 기록원';
      case 'health_officer': return '보건담당';
      case 'student': return '일반 학생';
      default: return role;
    }
  };

  // Filter students & deduplicate by studentId
  const seenStudentIds = new Set<string>();
  const filteredUsers = allUsers.filter((u) => {
    const sId = (u.studentId || u.uid || '').trim();
    if (!sId || seenStudentIds.has(sId)) return false;
    seenStudentIds.add(sId);

    if (selectedGrade !== 'all') {
      if (u.grade !== selectedGrade) return false;
    }
    if (selectedClass !== 'all') {
      if (selectedClass === 'teacher') {
        if (!u.isTeacher) return false;
      } else {
        if (u.classNum !== selectedClass) return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = u.studentId?.toLowerCase().includes(q);
      const matchName = u.name?.toLowerCase().includes(q);
      if (!matchId && !matchName) return false;
    }
    return true;
  });

  // Sort by Student ID
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    return (a.studentId || '').localeCompare(b.studentId || '');
  });

  // Role change handler
  const handleRoleChange = async (studentId: string, newRole: UserRole) => {
    try {
      await updateUserRole(studentId, newRole);
      onNotice(`[${studentId}]의 역할이 '${getRoleLabel(newRole)}'(으)로 변경되었습니다.`);
    } catch (e) {
      console.error(e);
      alert('역할 변경 중 오류가 발생했습니다.');
    }
  };

  // Delete/reset user handler
  const handleDeleteUser = async (studentId: string, name: string) => {
    if (window.confirm(`[${studentId} ${name}] 학생의 계정을 삭제하시겠습니까? (삭제 시 재가입 가능)`)) {
      try {
        await deleteUser(studentId);
        onNotice(`[${studentId} ${name}] 계정이 삭제되었습니다.`);
      } catch (e) {
        console.error(e);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // Excel (CSV with UTF-8 BOM) export handler
  const handleExportExcel = () => {
    if (sortedUsers.length === 0) {
      alert('내보낼 학생 데이터가 없습니다.');
      return;
    }

    const headers = ['학년', '학급(반)', '번호', '학번', '성명', '소속구분', '부여역할', '등록일시'];
    const rows = sortedUsers.map((u) => {
      const gLabel = u.role === 'admin' ? '총괄본부' : u.isTeacher ? '교사' : `${u.grade}학년`;
      const cLabel = u.role === 'admin' ? '운영본부' : u.isTeacher ? '교무실' : `${u.classNum}반`;
      const numLabel = u.role === 'admin' || u.isTeacher ? '-' : `${u.studentNum}번`;
      const gender = getGenderLabel(u.grade, u.classNum, u.isTeacher, u.role);
      const role = getRoleLabel(u.role);
      const date = u.createdAt ? formatKSTDateTime(u.createdAt) : '-';

      return [
        `"${gLabel}"`,
        `"${cLabel}"`,
        `"${numLabel}"`,
        `"${u.studentId}"`,
        `"${u.name}"`,
        `"${gender}"`,
        `"${role}"`,
        `"${date}"`
      ].join(',');
    });

    // Add UTF-8 BOM (\uFEFF) so Excel opens Korean text cleanly without encoding issues
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const gradeStr = selectedGrade === 'all' ? '전학년' : `${selectedGrade}학년`;
    const classStr = selectedClass === 'all' ? '전체반' : selectedClass === 'teacher' ? '교사' : `${selectedClass}반`;
    link.setAttribute('href', url);
    link.setAttribute('download', `상산고_체육대회_명단_${gradeStr}_${classStr}_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onNotice(`엑셀(CSV) 파일이 정상적으로 다운로드되었습니다. (${sortedUsers.length}명)`);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              반별 학생 명단 & 엑셀 다운로드
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              상산고 1~12반 (1~4반, 9~12반 남학급 / 5~8반 여학급) 학생 목록 조회 및 엑셀 출력
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (CSV) 다운로드</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Grade filter */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              학년 선택
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-hidden focus:border-red-500 text-slate-800 dark:text-slate-200"
            >
              <option value="all">전체 학년 (1~3학년)</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>
          </div>

          {/* Class filter (1~12반 + 교사) */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              학급(반) 선택
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-hidden focus:border-red-500 text-slate-800 dark:text-slate-200"
            >
              <option value="all">전체 학급 (1반 ~ 12반)</option>
              <optgroup label="남자 학급 (1~4, 9~12반)">
                <option value="1">1반 (남)</option>
                <option value="2">2반 (남)</option>
                <option value="3">3반 (남)</option>
                <option value="4">4반 (남)</option>
                <option value="9">9반 (남)</option>
                <option value="10">10반 (남)</option>
                <option value="11">11반 (남)</option>
                <option value="12">12반 (남)</option>
              </optgroup>
              <optgroup label="여자 학급 (5~8반)">
                <option value="5">5반 (여)</option>
                <option value="6">6반 (여)</option>
                <option value="7">7반 (여)</option>
                <option value="8">8반 (여)</option>
              </optgroup>
              <optgroup label="교직원">
                <option value="teacher">선생님 / 교직원</option>
              </optgroup>
            </select>
          </div>

          {/* Search query */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              학번 / 이름 검색
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="예: 20305 또는 김민준"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-hidden focus:border-red-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Quick summary chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            총 조회된 인원: <strong className="text-slate-900 dark:text-white">{sortedUsers.length}명</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
            남자반 인원: {sortedUsers.filter(u => !u.isTeacher && getGenderLabel(u.grade, u.classNum).includes('남')).length}명
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
            여자반 인원: {sortedUsers.filter(u => !u.isTeacher && getGenderLabel(u.grade, u.classNum).includes('여')).length}명
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
            교사: {sortedUsers.filter(u => u.role === 'teacher').length}명
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
            심판/기록원: {sortedUsers.filter(u => u.role === 'referee').length}명
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300">
            총괄본부: {sortedUsers.filter(u => u.role === 'admin').length}명
          </span>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                <th className="py-3 px-3.5 whitespace-nowrap">학번</th>
                <th className="py-3 px-3.5 whitespace-nowrap">성명</th>
                <th className="py-3 px-3.5 whitespace-nowrap">학급 구분</th>
                <th className="py-3 px-3.5 whitespace-nowrap">성별</th>
                <th className="py-3 px-3.5 whitespace-nowrap">현재 역할</th>
                <th className="py-3 px-3.5 whitespace-nowrap">역할 변경</th>
                <th className="py-3 px-3.5 whitespace-nowrap text-right">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    선택한 조건에 해당하는 학생 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                sortedUsers.map((u, idx) => {
                  const genderText = getGenderLabel(u.grade, u.classNum, u.isTeacher, u.role);
                  const isMale = genderText.includes('남');
                  const isFemale = genderText.includes('여');

                  return (
                    <tr 
                      key={`${u.studentId || 'u'}-${u.uid || idx}`}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {u.studentId}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {u.name}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {u.role === 'admin' ? (
                          <span className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold text-[11px]">
                            총괄본부 (운영관리)
                          </span>
                        ) : u.isTeacher ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                            교사 (담임)
                          </span>
                        ) : (
                          `${u.grade}학년 ${u.classNum}반 ${u.studentNum}번`
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.role === 'admin' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' :
                          isMale ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' :
                          isFemale ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {genderText}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1 items-center max-w-xs">
                          {getUserRoles(u).map((r) => {
                            const isBaseStudent = r === 'student' && !u.isTeacher;
                            return (
                              <span
                                key={r}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  r === 'admin' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' :
                                  r === 'student_council' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                                  r === 'class_president' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                                  r === 'teacher' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
                                  r === 'referee' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                                  r === 'health_officer' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' :
                                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {getRoleLabel(r)}
                                {isBaseStudent && getUserRoles(u).length > 1 && ' (기본)'}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {u.isTeacher ? (
                          <span className="text-[11px] text-slate-400 font-medium">교원 (겸직 제외)</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenRoleModal(u)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                              title="복수 역할 겸직 설정 (학생회+반장, 학생회+관리자 등)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>역할 겸직 설정</span>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.studentId, u.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          title="계정 삭제 / 초기화"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    역할 겸직 권한 설정
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {editingUser.studentId} {editingUser.name} ({editingUser.grade}학년 {editingUser.classNum}반)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sangsan Base Rule Banner */}
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>상산고 역할 겸직 시스템 원칙</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                교사를 제외한 모든 사용자의 <strong>기본 베이스는 '학생'</strong>입니다. 학생이면서 반장, 학생회이면서 반장, 학생회이면서 관리자 등 필요에 따라 자유롭게 겸직이 가능합니다.
              </p>
            </div>

            {/* Role Checklist */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                부여할 역할 선택 (복수 선택 가능)
              </label>

              {/* Base Student (Fixed) */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">일반 학생 (기본 베이스)</span>
                    <p className="text-[10px] text-slate-500">모든 학생 스크린 열람 권한 상시 보유</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">필수 기본</span>
              </div>

              {/* Optional Additive Roles */}
              {[
                { role: 'class_president' as UserRole, label: '학급 반장 (반대표)', desc: '소속 학급 라인업 제출, 출석/참여 확인, 학급 쪽지', color: 'text-emerald-600' },
                { role: 'student_council' as UserRole, label: '학생회 / 체육부', desc: '실시간 경기 스코어 기록, 전교 공지 작성, 건의함 답변', color: 'text-blue-600' },
                { role: 'admin' as UserRole, label: '총괄 관리자 (운영본부)', desc: '전교 시스템 제어, 대진표 생성, 학생 명부 및 감사 로그', color: 'text-red-600' },
                { role: 'referee' as UserRole, label: '공식 심판 / 기록원', desc: '경기 현장 배정 및 실시간 점수 판정/기록', color: 'text-amber-600' },
                { role: 'health_officer' as UserRole, label: '보건담당 (응급/의무)', desc: '부상 지식백과 관리 및 응급 가이드 작성', color: 'text-rose-600' }
              ].map(({ role, label, desc }) => {
                const isChecked = modalRoles.includes(role);
                return (
                  <label
                    key={role}
                    onClick={() => handleToggleModalRole(role)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                      isChecked
                        ? 'border-red-500/80 bg-red-50/40 dark:bg-red-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {label}
                        </span>
                        {isChecked && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold">
                            부여됨
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isSavingRoles}
                onClick={handleSaveModalRoles}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {isSavingRoles ? '저장 중...' : '겸직 설정 저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
