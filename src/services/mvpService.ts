import { MatchItem, MVPVote, UserProfile } from '../types';
import { submitMVPVote } from './firebaseService';

/**
 * Returns the voting deadline (epoch ms) for a given match.
 * The voting window is 1 minute (60,000ms) from when the match finished or when voting opened.
 */
export function getMvpVotingDeadline(match: MatchItem): number {
  if (match.mvpVotingClosedAt) {
    const t = new Date(match.mvpVotingClosedAt).getTime();
    if (!isNaN(t)) return t;
  }
  if (match.updatedAt) {
    const t = new Date(match.updatedAt).getTime();
    if (!isNaN(t)) return t + 60 * 1000;
  }
  return Date.now() + 60 * 1000;
}

/**
 * Calculates remaining seconds for MVP voting.
 */
export function getMvpVotingTimeLeftSeconds(match: MatchItem, nowMs: number = Date.now()): number {
  if (match.status !== 'FINISHED' && !match.mvpWinner) {
    return 60;
  }
  const deadline = getMvpVotingDeadline(match);
  const diffMs = deadline - nowMs;
  return Math.max(0, Math.floor(diffMs / 1000));
}

/**
 * Server-authoritative MVP vote submitter that calls /api/mvp-vote HTTP endpoint,
 * falling back to direct Firestore write if offline or on static host.
 */
export async function submitMVPVoteWithServerApi(
  match: MatchItem,
  vote: MVPVote,
  currentUser: UserProfile
): Promise<void> {
  try {
    if (typeof fetch !== 'undefined') {
      const response = await fetch('/api/mvp-vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          match,
          vote,
          currentUser
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return;
        } else {
          throw new Error(data.message || 'MVP 투표 제출에 실패했습니다.');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '서버 검증 실패로 투표를 제출하지 못했습니다.');
      }
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('Load failed')) {
      throw err;
    }
  }

  // Fallback to direct Firestore submission
  await submitMVPVote(vote);
}

/**
 * Server/Backend validation for MVP vote submission:
 * 1. Validates user authentication context and 5-digit student ID format.
 * 2. Prevents student ID spoofing (vote.voterStudentId must match currentUser.studentId).
 * 3. Enforces strict 1-minute timer limit relative to match finish time.
 */
export async function validateAndSubmitMVPVote(
  match: MatchItem,
  vote: MVPVote,
  currentUser: UserProfile,
  nowMs: number = Date.now(),
  submitFn?: (vote: MVPVote) => Promise<void>
): Promise<void> {
  // 1. Verify match state
  if (match.status !== 'FINISHED') {
    throw new Error('경기 종료 후에만 MVP 투표에 참여할 수 있습니다.');
  }

  // 2. Verify student ID & current user profile
  if (!currentUser || !currentUser.studentId) {
    throw new Error('인증 정보가 없습니다. 다시 로그인해 주세요.');
  }

  const cleanVoterId = (vote.voterStudentId || '').trim();
  const cleanUserId = (currentUser.studentId || '').trim();

  if (cleanVoterId !== cleanUserId) {
    throw new Error('로그인된 계정 정보와 투표자 학번이 일치하지 않습니다.');
  }

  // 5-digit student ID format check (allows teacher/admin special accounts)
  const is5DigitStudent = /^\d{5}$/.test(cleanVoterId);
  const isAuthorizedRole = currentUser.isTeacher || currentUser.role === 'admin' || currentUser.studentId === 'sshsgym';

  if (!is5DigitStudent && !isAuthorizedRole) {
    throw new Error('유효한 5자리 학번이 아닙니다.');
  }

  // 3. Verify candidate selection
  if (!vote.candidateName || !vote.candidateName.trim()) {
    throw new Error('투표할 선수를 선택해 주세요.');
  }

  // 4. Verify 1-minute time window server limit
  const deadline = getMvpVotingDeadline(match);
  if (nowMs > deadline) {
    throw new Error('MVP 투표 시간이 마감되었습니다. (경기 종료 후 1분 초과)');
  }

  // 5. Submit vote with verified ID payload
  const verifiedVote: MVPVote = {
    ...vote,
    matchId: match.id,
    voterStudentId: cleanVoterId,
    candidateName: vote.candidateName.trim(),
    createdAt: new Date(nowMs).toISOString()
  };

  const activeSubmitFn = submitFn || ((v) => submitMVPVoteWithServerApi(match, v, currentUser));
  await activeSubmitFn(verifiedVote);
}
