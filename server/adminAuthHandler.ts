import { UserProfile } from '../src/types';

interface AdminLoginRequest {
  adminId?: string;
  adminPw?: string;
}

interface AdminLoginResult {
  status: number;
  body: {
    success: boolean;
    profile?: UserProfile;
    message?: string;
  };
}

export function handleAdminLogin(input: AdminLoginRequest): AdminLoginResult {
  const adminId = (input.adminId || '').trim().toLowerCase();
  const adminPw = (input.adminPw || '').trim();

  if (!adminId || !adminPw) {
    return {
      status: 400,
      body: {
        success: false,
        message: '관리자 아이디와 비밀번호를 모두 입력해주세요.'
      }
    };
  }

  const expectedPw = process.env.ADMIN_SECRET_KEY || 'sshsgymgo';
  const isValidAdminId = adminId === 'sshsgym' || adminId === 'admin';
  const isValidAdminPw = adminPw === expectedPw;

  if (isValidAdminId && isValidAdminPw) {
    const adminProfile: UserProfile = {
      uid: 'admin_sshsgym',
      studentId: 'sshsgym',
      name: '총괄 관리자',
      role: 'admin',
      roles: ['admin', 'student'],
      grade: '본부',
      classNum: '00',
      studentNum: '00',
      gender: 'other',
      isTeacher: false,
      canAnswerSuggestion: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    return {
      status: 200,
      body: {
        success: true,
        profile: adminProfile
      }
    };
  }

  return {
    status: 401,
    body: {
      success: false,
      message: '관리자 아이디 또는 비밀번호가 일치하지 않습니다.'
    }
  };
}
