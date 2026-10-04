import { doc, setDoc } from 'firebase/firestore';
import { MatchItem, MVPVote, UserProfile } from '../src/types';

export interface MvpVoteRequest {
  match?: Partial<MatchItem>;
  vote?: MVPVote;
  currentUser?: UserProfile;
}

export interface MvpVoteResult {
  status: number;
  body: {
    success: boolean;
    message: string;
    vote?: MVPVote;
  };
}

/**
 * Pure validation logic for MVP vote submission on the server.
 * Enforces:
 * 1. Match status is 'FINISHED'
 * 2. voterStudentId matches authenticated currentUser.studentId (prevents student ID spoofing)
 * 3. 5-digit student ID format validation
 * 4. Candidate selection is not empty
 * 5. Strict 1-minute time window check relative to match finish/closed time using server-authoritative clock
 */
export function validateServerMvpVote(
  match: MatchItem | undefined,
  vote: MVPVote | undefined,
  currentUser: UserProfile | undefined,
  serverNowMs: number = Date.now()
): { valid: boolean; status: number; message: string; verifiedVote?: MVPVote } {
  if (!match || !match.id) {
    return { valid: false, status: 400, message: '경기 정보가 유효하지 않습니다.' };
  }

  if (match.status !== 'FINISHED') {
    return { valid: false, status: 400, message: '경기 종료 후에만 MVP 투표에 참여할 수 있습니다.' };
  }

  if (!currentUser || !currentUser.studentId) {
    return { valid: false, status: 401, message: '인증 정보가 없습니다. 다시 로그인해 주세요.' };
  }

  if (!vote) {
    return { valid: false, status: 400, message: '투표 데이터가 누락되었습니다.' };
  }

  const cleanVoterId = (vote.voterStudentId || '').trim();
  const cleanUserId = (currentUser.studentId || '').trim();

  // 1. Verify student ID match (prevents spoofing)
  if (cleanVoterId !== cleanUserId) {
    return { valid: false, status: 403, message: '로그인된 계정 정보와 투표자 학번이 일치하지 않습니다.' };
  }

  // 2. Format check for 5-digit student ID (allows teacher/admin accounts with specific roles)
  const is5DigitStudent = /^\d{5}$/.test(cleanVoterId);
  const isAuthorizedRole = currentUser.isTeacher || currentUser.role === 'admin' || currentUser.studentId === 'sshsgym';

  if (!is5DigitStudent && !isAuthorizedRole) {
    return { valid: false, status: 400, message: '유효한 5자리 학번이 아닙니다.' };
  }

  // 3. Candidate selection check
  if (!vote.candidateName || !vote.candidateName.trim()) {
    return { valid: false, status: 400, message: '투표할 선수를 선택해 주세요.' };
  }

  // 4. Calculate 1-minute deadline using server clock
  let deadline = serverNowMs + 60 * 1000;
  if (match.mvpVotingClosedAt) {
    const t = new Date(match.mvpVotingClosedAt).getTime();
    if (!isNaN(t)) deadline = t;
  } else if (match.updatedAt) {
    const t = new Date(match.updatedAt).getTime();
    if (!isNaN(t)) deadline = t + 60 * 1000;
  }

  if (serverNowMs > deadline) {
    return { valid: false, status: 408, message: 'MVP 투표 시간이 마감되었습니다. (경기 종료 후 1분 초과)' };
  }

  const verifiedVote: MVPVote = {
    id: `mvp_${match.id}_${cleanVoterId}`,
    matchId: match.id,
    voterStudentId: cleanVoterId,
    candidateName: vote.candidateName.trim(),
    createdAt: new Date(serverNowMs).toISOString()
  };

  return {
    valid: true,
    status: 200,
    message: 'MVP 투표가 성공적으로 등록되었습니다.',
    verifiedVote
  };
}

/**
 * Handles incoming MVP vote HTTP requests on the server,
 * validating input, matching with server state, and persisting to Firestore.
 */
export async function handleMvpVote(
  input: MvpVoteRequest,
  dbInstance?: any,
  currentMatchesMap?: Map<string, MatchItem>,
  serverNowMs: number = Date.now()
): Promise<MvpVoteResult> {
  const matchId = input.vote?.matchId || input.match?.id;

  // Resolve target match from request or server in-memory match cache
  let match: MatchItem | undefined = input.match as MatchItem | undefined;
  if (matchId && currentMatchesMap && currentMatchesMap.has(matchId)) {
    const cachedMatch = currentMatchesMap.get(matchId);
    if (cachedMatch) {
      match = cachedMatch;
    }
  }

  const validation = validateServerMvpVote(match, input.vote, input.currentUser, serverNowMs);

  if (!validation.valid || !validation.verifiedVote) {
    return {
      status: validation.status,
      body: {
        success: false,
        message: validation.message
      }
    };
  }

  const verifiedVote = validation.verifiedVote;

  // Write verified vote to Firestore if DB instance is available
  if (dbInstance) {
    try {
      const voteDocRef = doc(dbInstance, 'mvp_votes', `${verifiedVote.matchId}_${verifiedVote.voterStudentId}`);
      await setDoc(voteDocRef, verifiedVote);
    } catch (err: any) {
      console.error('[MVP Handler] Error saving vote to Firestore:', err);
      return {
        status: 500,
        body: {
          success: false,
          message: '서버 데이터베이스 저장 중 오류가 발생했습니다.'
        }
      };
    }
  }

  return {
    status: 200,
    body: {
      success: true,
      message: validation.message,
      vote: verifiedVote
    }
  };
}
