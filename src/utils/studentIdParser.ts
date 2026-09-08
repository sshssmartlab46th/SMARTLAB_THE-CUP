import { UserRole } from '../types';

export interface ParsedStudentId {
  isValid: boolean;
  errorMessage?: string;
  studentId: string;
  grade: string;
  classNum: string;
  studentNum: string;
  gender: 'male' | 'female' | 'other';
  isTeacher: boolean;
  defaultRole: UserRole;
  displayClass: string;
}

/**
 * Sangsan High School 5-Digit Student ID Rule Engine
 * Format: [Grade(1)][Class(2)][Number(2)] e.g., 20305 -> 2nd Grade, 3rd Class, No. 5
 * Male Classes: 1~4, 9~12
 * Female Classes: 5~8
 * Teacher: Last 2 digits = '00' (e.g. 10100 -> 1st Grade, 1st Class 담임 선생님)
 */
export function parseStudentId(idInput: string): ParsedStudentId {
  const trimmed = idInput.trim();

  // Admin special bootstrap check
  if (trimmed.toLowerCase() === 'sshsgym') {
    return {
      isValid: true,
      studentId: 'sshsgym',
      grade: '본부',
      classNum: '00',
      studentNum: '00',
      gender: 'other',
      isTeacher: false,
      defaultRole: 'admin',
      displayClass: '총괄본부'
    };
  }

  // Must be a 5-digit integer
  if (!/^\d{5}$/.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: '학번은 5자리 숫자여야 합니다. (예: 20305, 교사: 10100)',
      studentId: trimmed,
      grade: '',
      classNum: '',
      studentNum: '',
      gender: 'other',
      isTeacher: false,
      defaultRole: 'student',
      displayClass: ''
    };
  }

  const grade = trimmed[0];
  const classNumInt = parseInt(trimmed.substring(1, 3), 10);
  const classNumStr = trimmed.substring(1, 3);
  const studentNumStr = trimmed.substring(3, 5);
  const studentNumInt = parseInt(studentNumStr, 10);

  // Grade validity check: 1 ~ 3
  if (!['1', '2', '3'].includes(grade)) {
    return {
      isValid: false,
      errorMessage: '학년은 1학년부터 3학년까지 가능합니다.',
      studentId: trimmed,
      grade,
      classNum: classNumStr,
      studentNum: studentNumStr,
      gender: 'other',
      isTeacher: false,
      defaultRole: 'student',
      displayClass: ''
    };
  }

  // Class validity check: 1 ~ 12
  if (classNumInt < 1 || classNumInt > 12) {
    return {
      isValid: false,
      errorMessage: '학급(반)은 01반부터 12반까지 가능합니다.',
      studentId: trimmed,
      grade,
      classNum: classNumStr,
      studentNum: studentNumStr,
      gender: 'other',
      isTeacher: false,
      defaultRole: 'student',
      displayClass: ''
    };
  }

  // Teacher check: last two digits === '00'
  const isTeacher = studentNumStr === '00';

  // Gender classification by class:
  // Male Classes: 1~4, 9~12
  // Female Classes: 5~8
  const isMaleClass = (classNumInt >= 1 && classNumInt <= 4) || (classNumInt >= 9 && classNumInt <= 12);
  const gender: 'male' | 'female' = isMaleClass ? 'male' : 'female';

  if (!isTeacher && (studentNumInt < 1 || studentNumInt > 45)) {
    return {
      isValid: false,
      errorMessage: '학생 번호는 01번부터 45번까지 가능합니다.',
      studentId: trimmed,
      grade,
      classNum: classNumStr,
      studentNum: studentNumStr,
      gender,
      isTeacher: false,
      defaultRole: 'student',
      displayClass: ''
    };
  }

  const defaultRole: UserRole = isTeacher ? 'teacher' : 'student';
  const displayClass = `${grade}학년 ${classNumInt}반`;

  return {
    isValid: true,
    studentId: trimmed,
    grade,
    classNum: String(classNumInt),
    studentNum: studentNumStr,
    gender,
    isTeacher,
    defaultRole,
    displayClass
  };
}

/**
 * Returns Korean label for user roles
 */
export function getRoleBadgeInfo(role: UserRole): { label: string; color: string; bgColor: string } {
  switch (role) {
    case 'admin':
      return { label: '총괄 관리자', color: 'text-amber-400 border-amber-500/50', bgColor: 'bg-amber-950/60' };
    case 'student_council':
      return { label: '학생회', color: 'text-red-400 border-red-500/50', bgColor: 'bg-red-950/60' };
    case 'class_president':
      return { label: '반장', color: 'text-blue-400 border-blue-500/50', bgColor: 'bg-blue-950/60' };
    case 'teacher':
      return { label: '선생님', color: 'text-emerald-400 border-emerald-500/50', bgColor: 'bg-emerald-950/60' };
    case 'health_officer':
      return { label: '보건 담당', color: 'text-purple-400 border-purple-500/50', bgColor: 'bg-purple-950/60' };
    case 'student':
    default:
      return { label: '학생', color: 'text-slate-400 border-slate-700', bgColor: 'bg-slate-800/60' };
  }
}
