import { UserProfile } from '../types';

export interface AdminLoginResponse {
  success: boolean;
  profile?: UserProfile;
  message?: string;
}

export async function verifyAdminCredentials(
  adminId: string,
  adminPw: string
): Promise<AdminLoginResponse> {
  const trimmedId = adminId.trim();
  const trimmedPw = adminPw.trim();

  if (!trimmedId || !trimmedPw) {
    return {
      success: false,
      message: '관리자 아이디와 비밀번호를 모두 입력해주세요.'
    };
  }

  try {
    const response = await fetch('/api/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminId: trimmedId,
        adminPw: trimmedPw
      })
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      return {
        success: true,
        profile: data.profile
      };
    }

    return {
      success: false,
      message: data?.message || '관리자 인증에 실패했습니다.'
    };
  } catch (error) {
    console.error('Admin authentication API call error:', error);
    return {
      success: false,
      message: '서버 인증 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    };
  }
}
