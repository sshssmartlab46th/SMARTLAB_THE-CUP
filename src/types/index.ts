export type UserRole = 
  | 'student' 
  | 'teacher' 
  | 'class_president' 
  | 'student_council' 
  | 'health_officer' 
  | 'admin';

export interface UserProfile {
  uid: string;
  studentId: string; // 5-digit integer (e.g. '20305') or 'sshsgym'
  name: string;
  role: UserRole;
  grade: string;     // '1', '2', '3' or '교사', '관리자'
  classNum: string;  // '1' ~ '12'
  studentNum: string;// '01' ~ '35' (or '00' for teacher)
  gender: 'male' | 'female' | 'other';
  isTeacher: boolean;
  createdAt: string;
  lastLogin: string;
}

export type SportType = 'soccer' | 'basketball' | 'dodgeball' | 'relay_male' | 'relay_female';

export type MatchType = 'tournament' | 'relay_group' | 'relay_final';

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'FINISHED';

export interface TimelineEvent {
  id: string;
  minute: number;
  type: 'GOAL' | 'POINT_2' | 'POINT_3' | 'FREE_THROW' | 'OUT' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'NOTICE';
  team: 'home' | 'away' | 'neutral';
  player?: string;
  description: string;
  timestamp: string;
}

export interface MatchItem {
  id: string;
  sport: SportType;
  matchType: MatchType;
  title: string;
  round: string; // '8강 1경기', '4강 1경기', '결승전', '예선 A조'
  homeTeam: string; // e.g. '2-3 (백호)'
  awayTeam: string; // e.g. '2-4 (청룡)'
  homeClass: string;
  awayClass: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  period: string; // '전반전', '후반전', '연장전', '종료'
  elapsedSeconds: number;
  timerRunning: boolean;
  lastTimerStartedAt?: number;
  startTime: string; // ISO String (e.g. '2026-09-08T10:00:00Z')
  court: string; // '대운동장 A', '체육관 1층'
  events: TimelineEvent[];
  updatedAt: string;
}

export interface ClassLineup {
  id: string;
  matchId: string;
  classId: string; // e.g. '203'
  sport: SportType;
  starterPlayers: string[]; // e.g. ['20305 김민준 (FW)', '20311 박서준 (MF)']
  substitutePlayers: string[];
  runningOrder?: string[]; // For Relay (1번주자 ~ 4번주자)
  submittedBy: string;
  submittedAt: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  type: 'global' | 'class';
  targetClass?: string; // If class notice, e.g. '203'
  authorName: string;
  authorRole: string;
  authorId: string;
  important: boolean;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  fromId: string;
  fromName: string;
  fromRole: UserRole;
  toClass: string;
  toRole: string;
  content: string;
  createdAt: string;
}

export interface CheerCount {
  matchId: string;
  homeCheers: number;
  awayCheers: number;
  lastEmoji?: string;
}

export interface InjuryEntry {
  id: string;
  sport: SportType | 'common';
  title: string;
  symptoms: string;
  firstAid: string;
  severity: 'mild' | 'moderate' | 'emergency';
  prevention: string;
}

export interface SuggestionItem {
  id: string;
  authorId: string;
  authorName: string;
  authorStudentId: string;
  title: string;
  content: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  matchId: string;
  matchTitle: string;
  action: 'SCORE_UPDATE' | 'SCORE_ROLLBACK' | 'STATUS_CHANGE' | 'TIMER_RESET';
  reason: string; // '오프사이드', '파울', '오심 수정', '입력 오류' 등
  oldValue: string;
  newValue: string;
  timestamp: string;
}
