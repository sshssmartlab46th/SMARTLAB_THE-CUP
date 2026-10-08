import { describe, it, expect } from 'vitest';
import { parseStudentId, getRoleBadgeInfo } from './studentIdParser';
import { UserRole } from '../types';

describe('studentIdParser', () => {
  describe('parseStudentId', () => {
    it('handles special admin bootstrap ID "sshsgym" case-insensitively', () => {
      const lower = parseStudentId('sshsgym');
      expect(lower.isValid).toBe(true);
      expect(lower.studentId).toBe('sshsgym');
      expect(lower.defaultRole).toBe('admin');
      expect(lower.displayClass).toBe('총괄본부');
      expect(lower.isTeacher).toBe(false);

      const upper = parseStudentId('SSHSGYM');
      expect(upper.isValid).toBe(true);
      expect(upper.studentId).toBe('sshsgym');
      expect(upper.defaultRole).toBe('admin');
    });

    it('parses valid student IDs across different grades, classes, and student numbers', () => {
      const res = parseStudentId('20305');
      expect(res.isValid).toBe(true);
      expect(res.grade).toBe('2');
      expect(res.classNum).toBe('3');
      expect(res.studentNum).toBe('05');
      expect(res.gender).toBe('male');
      expect(res.isTeacher).toBe(false);
      expect(res.defaultRole).toBe('student');
      expect(res.displayClass).toBe('2학년 3반');
    });

    it('assigns male gender for classes 1-4 and 9-12', () => {
      const maleClasses = ['10101', '10201', '10301', '10401', '10901', '11001', '11101', '11201'];
      maleClasses.forEach((id) => {
        const parsed = parseStudentId(id);
        expect(parsed.isValid).toBe(true);
        expect(parsed.gender).toBe('male');
      });
    });

    it('assigns female gender for classes 5-8', () => {
      const femaleClasses = ['10501', '10601', '10701', '10801'];
      femaleClasses.forEach((id) => {
        const parsed = parseStudentId(id);
        expect(parsed.isValid).toBe(true);
        expect(parsed.gender).toBe('female');
      });
    });

    it('identifies teacher accounts when last two digits are "00"', () => {
      const teacherRes = parseStudentId('10100');
      expect(teacherRes.isValid).toBe(true);
      expect(teacherRes.isTeacher).toBe(true);
      expect(teacherRes.defaultRole).toBe('teacher');
      expect(teacherRes.displayClass).toBe('1학년 1반');
    });

    it('rejects non 5-digit inputs', () => {
      expect(parseStudentId('1234').isValid).toBe(false);
      expect(parseStudentId('123456').isValid).toBe(false);
      expect(parseStudentId('abcde').isValid).toBe(false);
      expect(parseStudentId('12a45').isValid).toBe(false);
      expect(parseStudentId('').isValid).toBe(false);
    });

    it('rejects invalid grades outside 1-3', () => {
      const res0 = parseStudentId('00101');
      expect(res0.isValid).toBe(false);
      expect(res0.errorMessage).toContain('학년은 1학년부터 3학년까지 가능합니다.');

      const res4 = parseStudentId('40101');
      expect(res4.isValid).toBe(false);
      expect(res4.errorMessage).toContain('학년은 1학년부터 3학년까지 가능합니다.');
    });

    it('rejects invalid classes outside 1-12', () => {
      const res00 = parseStudentId('10001');
      expect(res00.isValid).toBe(false);
      expect(res00.errorMessage).toContain('학급(반)은 01반부터 12반까지 가능합니다.');

      const res13 = parseStudentId('11301');
      expect(res13.isValid).toBe(false);
      expect(res13.errorMessage).toContain('학급(반)은 01반부터 12반까지 가능합니다.');
    });

    it('rejects student numbers exceeding 45 for non-teacher users', () => {
      const res46 = parseStudentId('10146');
      expect(res46.isValid).toBe(false);
      expect(res46.errorMessage).toContain('학생 번호는 01번부터 45번까지 가능합니다.');

      const res99 = parseStudentId('10199');
      expect(res99.isValid).toBe(false);
      expect(res99.errorMessage).toContain('학생 번호는 01번부터 45번까지 가능합니다.');
    });

    it('trims whitespace around input before validation', () => {
      const res = parseStudentId('  31120  ');
      expect(res.isValid).toBe(true);
      expect(res.studentId).toBe('31120');
      expect(res.grade).toBe('3');
      expect(res.classNum).toBe('11');
      expect(res.studentNum).toBe('20');
    });
  });

  describe('getRoleBadgeInfo', () => {
    it('returns expected badge info for all defined user roles', () => {
      expect(getRoleBadgeInfo('admin').label).toBe('총괄 관리자');
      expect(getRoleBadgeInfo('student_council').label).toBe('학생회');
      expect(getRoleBadgeInfo('class_president').label).toBe('반장');
      expect(getRoleBadgeInfo('teacher').label).toBe('선생님');
      expect(getRoleBadgeInfo('referee').label).toBe('심판/기록원');
      expect(getRoleBadgeInfo('health_officer').label).toBe('보건 담당');
      expect(getRoleBadgeInfo('student').label).toBe('학생');
    });

    it('returns default student badge for unhandled role strings', () => {
      const unknownRole = getRoleBadgeInfo('unknown' as UserRole);
      expect(unknownRole.label).toBe('학생');
    });
  });
});
