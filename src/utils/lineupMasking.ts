import { ClassLineup, MatchItem, UserProfile, getUserRoles } from '../types';
import { parseMatchStartTimeKST } from './kstTime';

const AUTHORIZED_ROLES = ['admin', 'teacher', 'referee', 'student_council'];

/**
 * Checks whether a specific match lineup is revealed for a given user profile.
 * Lineups are revealed if:
 * 1. Match status is 'LIVE' or 'FINISHED'
 * 2. User has an authorized role (admin, teacher, referee, student_council)
 * 3. We are within 5 minutes (300,000 ms) of match start time
 */
export function isLineupRevealedForMatch(
  match: MatchItem | undefined,
  user: UserProfile | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!match) return false;

  if (match.status === 'LIVE' || match.status === 'FINISHED') {
    return true;
  }

  const userRoles = getUserRoles(user);
  const isAuthorized = userRoles.some((role) => AUTHORIZED_ROLES.includes(role));
  if (isAuthorized) {
    return true;
  }

  const startEpoch = parseMatchStartTimeKST(match.startTime);
  if (startEpoch !== null && startEpoch - nowMs <= 5 * 60 * 1000) {
    return true;
  }

  return false;
}

/**
 * Masks tactical fields of lineups for opposing classes if the lineup is not revealed.
 * Users always see full lineup details for their own class.
 */
export function maskLineupsForUser(
  lineups: ClassLineup[],
  matches: MatchItem[],
  user: UserProfile | null | undefined,
  nowMs: number = Date.now()
): ClassLineup[] {
  if (!lineups || lineups.length === 0) return [];

  const matchMap = new Map<string, MatchItem>();
  for (const m of matches) {
    matchMap.set(m.id, m);
  }

  const userClassCode = user?.grade && user?.classNum
    ? `${user.grade}${user.classNum.padStart(2, '0')}`
    : null;
  const userClassNumTrimmed = user?.classNum ? parseInt(user.classNum, 10).toString() : null;

  return lineups.map((lineup) => {
    const match = matchMap.get(lineup.matchId);
    const isRevealed = isLineupRevealedForMatch(match, user, nowMs);

    if (isRevealed) {
      return lineup;
    }

    const lClassNumTrimmed = lineup.classId ? parseInt(lineup.classId.replace(/\D/g, ''), 10).toString() : '';
    const isOwnClass = Boolean(
      (userClassCode && lineup.classId === userClassCode) ||
      (userClassNumTrimmed && lClassNumTrimmed === userClassNumTrimmed)
    );

    if (isOwnClass) {
      return lineup;
    }

    // Mask tactical fields
    return {
      ...lineup,
      formation: undefined,
      formationSlots: [],
      starterPlayers: [],
      substitutePlayers: [],
      runningOrder: []
    };
  });
}
