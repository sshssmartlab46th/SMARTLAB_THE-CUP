import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleAdminLogin } from './adminAuthHandler';

describe('Admin Authentication Handler', () => {
  const originalEnv = process.env.ADMIN_SECRET_KEY;

  beforeEach(() => {
    delete process.env.ADMIN_SECRET_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ADMIN_SECRET_KEY = originalEnv;
    } else {
      delete process.env.ADMIN_SECRET_KEY;
    }
  });

  it('should return 400 when adminId or adminPw is missing', () => {
    const res1 = handleAdminLogin({});
    expect(res1.status).toBe(400);
    expect(res1.body.success).toBe(false);

    const res2 = handleAdminLogin({ adminId: 'sshsgym' });
    expect(res2.status).toBe(400);
    expect(res2.body.success).toBe(false);
  });

  it('should return 200 with admin profile for valid default credentials', () => {
    const res = handleAdminLogin({ adminId: 'sshsgym', adminPw: 'sshsgymgo' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile).toBeDefined();
    expect(res.body.profile?.role).toBe('admin');
    expect(res.body.profile?.studentId).toBe('sshsgym');
  });

  it('should return 401 for incorrect password', () => {
    const res = handleAdminLogin({ adminId: 'sshsgym', adminPw: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('관리자 아이디 또는 비밀번호가 일치하지 않습니다.');
  });

  it('should return 401 for non-admin student ID', () => {
    const res = handleAdminLogin({ adminId: '20305', adminPw: 'sshsgymgo' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should respect custom ADMIN_SECRET_KEY environment variable', () => {
    process.env.ADMIN_SECRET_KEY = 'supersecretpass123';

    const failRes = handleAdminLogin({ adminId: 'sshsgym', adminPw: 'sshsgymgo' });
    expect(failRes.status).toBe(401);

    const successRes = handleAdminLogin({ adminId: 'sshsgym', adminPw: 'supersecretpass123' });
    expect(successRes.status).toBe(200);
    expect(successRes.body.success).toBe(true);
  });
});
