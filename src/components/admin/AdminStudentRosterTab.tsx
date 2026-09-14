import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import { 
  Users, 
  Search, 
  Download, 
  Trash2, 
  Filter, 
  FileSpreadsheet,
  Check,
  GraduationCap
} from 'lucide-react';
import { updateUserRole, deleteUser } from '../../services/firebaseService';

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

  // Gender classification check:
  // Male: 1~4, 9~12
  // Female: 5~8
  const getGenderLabel = (grade: string, classNum: string, isTeacher?: boolean) => {
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
      case 'teacher': return '교사 / 심판';
      case 'health_officer': return '보건담당';
      case 'student': return '일반 학생';
      default: return role;
    }
  };

  // Filter students
  const filteredUsers = allUsers.filter((u) => {
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

    const headers = ['학년', '학급(반)', '번호', '학번', '성명', '성별구분', '부여역할', '등록일시'];
    const rows = sortedUsers.map((u) => {
      const gLabel = u.isTeacher ? '교사' : `${u.grade}학년`;
      const cLabel = u.isTeacher ? '교무실' : `${u.classNum}반`;
      const numLabel = u.isTeacher ? '-' : `${u.studentNum}번`;
      const gender = getGenderLabel(u.grade, u.classNum, u.isTeacher);
      const role = getRoleLabel(u.role);
      const date = u.createdAt ? new Date(u.createdAt).toLocaleString('ko-KR') : '-';

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
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
            교사/심판: {sortedUsers.filter(u => u.isTeacher).length}명
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
                sortedUsers.map((u) => {
                  const genderText = getGenderLabel(u.grade, u.classNum, u.isTeacher);
                  const isMale = genderText.includes('남');
                  const isFemale = genderText.includes('여');

                  return (
                    <tr 
                      key={u.studentId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {u.studentId}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {u.name}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {u.isTeacher ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                            교사 (담임)
                          </span>
                        ) : (
                          `${u.grade}학년 ${u.classNum}반 ${u.studentNum}번`
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isMale ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' :
                          isFemale ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {genderText}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          u.role === 'admin' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' :
                          u.role === 'student_council' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                          u.role === 'class_president' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                          u.role === 'teacher' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.studentId, e.target.value as UserRole)}
                          className="py-1 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-hidden focus:border-red-500 cursor-pointer"
                        >
                          <option value="student">일반 학생</option>
                          <option value="class_president">학급 반장</option>
                          <option value="student_council">학생회</option>
                          <option value="teacher">교사 / 심판</option>
                          <option value="health_officer">보건담당</option>
                          <option value="admin">총괄 관리자</option>
                        </select>
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
    </div>
  );
};
