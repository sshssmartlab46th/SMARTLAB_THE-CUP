export type UserRole =
  | 'student'
  | 'class_president'
  | 'teacher'
  | 'student_council'
  | 'health_officer'
  | 'admin';

export interface SangsanUser {
  uid: string;
  studentId: string; // 5-digit: e.g. 20305, 10100
  name: string;
  grade: number;
  classNum: number;
  studentNum: number;
  gender: 'male' | 'female';
  isTeacher: boolean;
  role: UserRole;
  email?: string;
  createdAt: string;
}

export type SportType = 'soccer' | 'basketball' | 'dodgeball' | 'relay_male' | 'relay_female';

export interface MatchScoreLog {
  id: string;
  timestamp: string;
  team: 'A' | 'B';
  delta: number;
  description: string;
  actor: string;
  actorRole: UserRole;
  isCancelled?: boolean;
  cancelReason?: string;
  cancelledBy?: string;
}

export interface AuditLog {
  id: string;
  matchId: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  reason?: string;
}

export interface Match {
  id: string;
  sport: SportType;
  title: string;
  round: string; // '8강 1경기', '4강', '결승', '예선 1조'
  teamA: string; // e.g. '2학년 3반'
  teamB: string; // e.g. '2학년 4반'
  scoreA: number;
  scoreB: number;
  status: 'scheduled' | 'live' | 'finished';
  scheduledTime: string; // '2026-05-15 10:30'
  location: string; // '대운동장 A코트', '상산체육관'
  elapsedSeconds: number;
  isTimerRunning: boolean;
  cheersA: number;
  cheersB: number;
  scoreLogs: MatchScoreLog[];
  lineupUnlocked: boolean; // Unlocked 5 minutes before scheduled start
}

export interface LineupPlayer {
  id: string;
  name: string;
  studentId: string;
  position?: string;
  order?: number;
}

export interface ClassLineup {
  id: string;
  classId: string; // e.g. '2-3'
  sport: SportType;
  players: LineupPlayer[];
  submittedBy: string;
  submittedAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: UserRole;
  targetClass?: string; // 'all' or '2-3'
  priority: 'normal' | 'urgent';
  createdAt: string;
}

export interface MemoMessage {
  id: string;
  senderName: string;
  senderStudentId: string;
  receiverClass: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface InjuryGuide {
  id: string;
  sport: SportType | 'general';
  title: string;
  symptoms: string[];
  firstAidSteps: string[];
  severity: 'mild' | 'moderate' | 'severe';
  riceProtocol: {
    rest: string;
    ice: string;
    compression: string;
    elevation: string;
  };
}

export interface Suggestion {
  id: string;
  authorStudentId: string;
  authorName: string;
  content: string;
  status: 'pending' | 'answered';
  answer?: string;
  createdAt: string;
}
