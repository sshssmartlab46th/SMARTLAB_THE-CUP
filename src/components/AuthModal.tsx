import React, { useState } from 'react';
import { SangsanUser, UserRole } from '../types';
import { Shield, User, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: SangsanUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{
    grade: number;
    classNum: number;
    studentNum: number;
    gender: 'male' | 'female';
    isTeacher: boolean;
  } | null>(null);

  if (!isOpen) return null;

  // Sangsan Student ID Rule Engine
  const parseStudentId = (idStr: string) => {
    if (!/^\d{5}$/.test(idStr)) {
      return null;
    }
    const grade = parseInt(idStr.charAt(0), 10);
    const classNum = parseInt(idStr.substring(1, 3), 10);
    const studentNum = parseInt(idStr.substring(3, 5), 10);

    if (grade < 1 || grade > 3) return null;
    if (classNum < 1 || classNum > 12) return null;

    const isTeacher = studentNum === 0;

    // Male classes: 1~4, 9~12 | Female classes: 5~8
    const isMaleClass = (classNum >= 1 && classNum <= 4) || (classNum >= 9 && classNum <= 12);
    const gender: 'male' | 'female' = isMaleClass ? 'male' : 'female';

    return {
      grade,
      classNum,
      studentNum,
      gender,
      isTeacher,
    };
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
    setStudentId(val);
    setError(null);

    if (val.length === 5) {
      const parsed = parseStudentId(val);
      if (parsed) {
        setParsedPreview(parsed);
        if (parsed.isTeacher) {
          setSelectedRole('teacher');
        }
      } else {
        setParsedPreview(null);
        setError('유효하지 않은 학번입니다. 5자리 (학년1+반2+번호2) 형식을 확인하세요.');
      }
    } else {
      setParsedPreview(null);
    }
  };

  const handleFirstSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }
    const parsed = parseStudentId(studentId);
    if (!parsed) {
      setError('5자리 정규 학번을 정확히 입력해주세요 (예: 20305, 교직원: 10100)');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = () => {
    const parsed = parseStudentId(studentId)!;
    const finalUser: SangsanUser = {
      uid: `sshs-${studentId}-${Date.now()}`,
      studentId,
      name: name.trim(),
      grade: parsed.grade,
      classNum: parsed.classNum,
      studentNum: parsed.studentNum,
      gender: parsed.gender,
      isTeacher: parsed.isTeacher,
      role: selectedRole,
      createdAt: new Date().toISOString(),
    };

    onLogin(finalUser);
    setShowConfirmModal(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-white font-serif">
              상산고등학교 사용자 인증
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-mono leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        {!showConfirmModal ? (
          <form onSubmit={handleFirstSubmit} className="p-6 space-y-4">
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-amber-400">규칙 안내 (Student ID Rule Engine)</p>
              <p>• 5자리 정수: [학년(1)][반(2)][번호(2)] (예: 20305 → 2학년 3반 5번)</p>
              <p>• 남학생 반(1~4, 9~12반), 여학생 반(5~8반) 자동 분류</p>
              <p>• 교직원은 끝자리 00 입력 시 자동 교사 권한 부여 (예: 10100)</p>
            </div>

            {/* Student ID Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                학번 (5자리)
              </label>
              <input
                type="text"
                value={studentId}
                onChange={handleIdChange}
                placeholder="예: 20305, 10100"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono tracking-wider"
                maxLength={5}
                required
              />
            </div>

            {/* Auto Detection Preview */}
            {parsedPreview && (
              <div className="bg-slate-950 p-3 rounded-lg border border-red-900/40 text-xs space-y-1">
                <div className="flex justify-between items-center text-slate-300">
                  <span>자동 분류:</span>
                  <span className="font-semibold text-amber-400">
                    {parsedPreview.isTeacher
                      ? `교직원 (${parsedPreview.grade}학년 ${parsedPreview.classNum}반 배정)`
                      : `${parsedPreview.grade}학년 ${parsedPreview.classNum}반 ${parsedPreview.studentNum}번 (${
                          parsedPreview.gender === 'male' ? '남학생' : '여학생'
                        })`}
                  </span>
                </div>
              </div>
            )}

            {/* Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                이름 (실명)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름 입력 (예: 김민준)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                required
              />
            </div>

            {/* Role Switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                테스트 역할 선택 (RBAC Matrix)
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="student">일반 학생 (기본 관람 및 응원)</option>
                <option value="class_president">반장 (출전 라인업 등록 및 쪽지)</option>
                <option value="teacher">선생님 (학급 공지 및 쪽지)</option>
                <option value="student_council">학생회 (실시간 점수 입력 및 공지)</option>
                <option value="health_officer">보건담당 (부상 지식백과 관리)</option>
                <option value="admin">총괄관리자 (시스템 설정)</option>
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded border border-rose-900/60">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                취소
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 rounded-lg text-xs font-semibold bg-red-800 hover:bg-red-700 text-white shadow-lg transition"
              >
                학번 확인 및 진행
              </button>
            </div>
          </form>
        ) : (
          /* Double Confirmation Dialog (Prompt requirement) */
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
              <AlertCircle className="w-5 h-5" />
              학번 및 본인 확인 (2단계 최종 확인)
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              상산고등학교 이벤트 운영 정책상 첫 등록된 학번과 실명은 변경이 제한됩니다.
              입력하신 정보가 본인과 정확히 일치하는지 다시 한 번 확인해 주십시오.
            </p>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">학번:</span>
                <span className="font-mono font-bold text-white">{studentId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">성명:</span>
                <span className="font-bold text-white">{name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">표시 명칭:</span>
                <span className="font-semibold text-red-400 font-mono">
                  {studentId} {name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">역할 구분:</span>
                <span className="font-semibold text-amber-400">{selectedRole}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                수정하기
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                className="w-1/2 py-2.5 rounded-lg text-xs font-semibold bg-red-800 hover:bg-red-700 text-white shadow-lg"
              >
                확인 및 로그인 완료
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
