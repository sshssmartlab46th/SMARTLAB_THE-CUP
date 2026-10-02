export type UserRole = 
  | 'student' 
  | 'teacher' 
  | 'class_president' 
  | 'student_council' 
  | 'health_officer' 
  | 'referee'
  | 'commentator'
  | 'admin';

export interface LiveCommentaryItem {
  id: string;
  matchId: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  commentatorName: string;
  text: string;
  isSttGenerated?: boolean;
  timestamp: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  studentId: string; // 5-digit integer (e.g. '20305') or 'sshsgym'
  name: string;
  role: UserRole;    // 대표 역할 (하위 호환성 유지)
  roles?: UserRole[]; // 겸직 가능한 복수 역할 (단, 선생님 제외. 베이스는 학생)
  grade: string;     // '1', '2', '3' or '교사', '관리자'
  classNum: string;  // '1' ~ '12'
  studentNum: string;// '01' ~ '35' (or '00' for teacher)
  gender: 'male' | 'female' | 'other';
  isTeacher: boolean;
  canAnswerSuggestion?: boolean;
  assignedMatchId?: string;
  createdAt: string;
  lastLogin: string;
}

// -------------------------------------------------------------
// 역할 겸직 및 권한 판별 헬퍼 (베이스는 학생, 선생님 제외)
// -------------------------------------------------------------

/**
 * 사용자의 전체 역할 목록 반환 (베이스는 학생, 단 선생님은 교원 단독)
 */
export function getUserRoles(user: UserProfile | null | undefined): UserRole[] {
  if (!user) return [];
  // 선생님은 학생으로 분류되지 않으며 겸직 불가
  if (user.isTeacher || user.role === 'teacher') {
    return ['teacher'];
  }
  // 학생 베이스: 선생님을 제외한 모든 계정(학생회, 반장, 관리자 등)은 학생을 베이스로 겸직
  const set = new Set<UserRole>();
  if (user.roles && Array.isArray(user.roles)) {
    user.roles.forEach((r) => set.add(r));
  }
  if (user.role) {
    set.add(user.role);
  }
  // 선생님이 아니면 기본 베이스는 항상 'student'
  set.add('student');
  return Array.from(set);
}

/**
 * 사용자가 특정 역할을 보유하고 있는지 검사 (겸직 포함)
 */
export function hasUserRole(user: UserProfile | null | undefined, targetRole: UserRole): boolean {
  if (!user) return false;
  const roles = getUserRoles(user);
  return roles.includes(targetRole);
}

/**
 * 기본적으로 학생은 쪽지를 쓸 수 없음.
 * 반장, 선생님, 학생회, 관리자만 쪽지 작성(발송) 가능.
 */
export function canWriteDirectMessage(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return (
    hasUserRole(user, 'class_president') ||
    hasUserRole(user, 'teacher') ||
    hasUserRole(user, 'student_council') ||
    hasUserRole(user, 'admin')
  );
}

export interface FestivalConfig {
  isOpen: boolean;
  name: string;
  description?: string;
  updatedAt?: string;
  updatedBy?: string;
  isEmergencyActive?: boolean;
  emergencyReason?: string;
  emergencyTriggeredAt?: string;
  isIndoorMode?: boolean;
}

export interface FormationSlot {
  slotId: string;
  roleName: string; // 'GK', 'DF', 'MF', 'FW'
  x: number; // % coordinates
  y: number; // % coordinates
  player?: string; // e.g. '20305 김민준'
}

export type SportType = 'soccer' | 'basketball' | 'dodgeball' | 'relay_male' | 'relay_female' | 'tug_of_war';

export interface SportPointsConfig {
  sport: SportType;
  label: string;
  gender: 'male' | 'female' | 'mixed';
  champion: number; // 우승 점수
  runnerUp: number; // 준우승 점수
  thirdPlace: number; // 3위 점수
  winPerMatch: number; // 단일 매치 승리 점수
  drawPerMatch: number; // 무승부 점수
  participation: number; // 참가 기본 점수
}

export type MatchType = 'tournament' | 'relay_group' | 'relay_final';

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'FINISHED';

export interface TimelineEvent {
  id: string;
  minute: number;
  type: 'GOAL' | 'POINT_2' | 'POINT_3' | 'FREE_THROW' | 'OUT' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'NOTICE';
  team: 'home' | 'away' | 'neutral';
  player?: string;
  description: string;
  detail?: string;
  points?: number;
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
  scheduledTime?: string;
  court: string; // '대운동장 A', '체육관 1층'
  location?: string;
  originalCourt?: string; // 백업된 원래 경기장 정보 (우천/실내 전환 시 복귀용)
  assignedRefereeId?: string;
  assignedRefereeName?: string;
  mvpCandidateIds?: string[];
  mvpWinner?: string;
  mvpVotingClosedAt?: string;
  tournamentSlot?: 'QF1' | 'QF2' | 'QF3' | 'QF4' | 'SF1' | 'SF2' | 'FINAL' | 'BRONZE';
  events: TimelineEvent[];
  updatedAt: string;
  // Penalty Shootout (승부차기 - 축구 무승부 시 자동 적용)
  isPenaltyShootout?: boolean;
  penaltyShootout?: PenaltyShootoutData;
}

export type PenaltyKickResult = 'scored' | 'missed' | 'pending';

export interface PenaltyShootoutKick {
  order: number; // 1, 2, 3, 4, 5 ...
  result: PenaltyKickResult; // 'scored' (초록 다이아몬드), 'missed' (빨간 다이아몬드), 'pending' (대기)
  kickerName?: string;
  scoredAt?: string;
}

export interface PenaltyShootoutData {
  isActive: boolean;
  homeScore: number; // 승부차기 득점수
  awayScore: number; // 승부차기 득점수
  homeKicks: PenaltyShootoutKick[]; // 홈팀 키커들 (기본 1~5)
  awayKicks: PenaltyShootoutKick[]; // 원정팀 키커들 (기본 1~5)
  currentTurn?: 'home' | 'away';
  currentOrder?: number;
  winner?: 'home' | 'away'; // 승부차기 최종 승자
  completedAt?: string;
}

export interface ClassLineup {
  id: string;
  matchId: string;
  classId: string; // e.g. '203'
  sport: SportType;
  formation?: '4-4-2' | '4-3-3' | '3-5-2';
  formationSlots?: FormationSlot[];
  starterPlayers: string[]; // e.g. ['20305 김민준', '20311 박서준']
  substitutePlayers: string[];
  runningOrder?: string[]; // For Relay (1번주자 ~ 4번주자)
  submittedBy: string;
  submittedAt: string;
}

export interface MVPVote {
  id: string;
  matchId: string;
  voterStudentId: string;
  candidateName: string;
  createdAt: string;
}

export interface MatchReminderItem {
  id: string;
  matchId: string;
  studentId: string;
  leadMinutes: 5 | 10;
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
  linkUrl?: string;
  linkLabel?: string;
  category?: 'tournament' | 'festival' | 'urgent' | 'general';
  tag?: string; // 'emergency_stop' | 'indoor_switch' 등 식별 태그
}

export interface DirectMessage {
  id: string;
  fromId: string;
  fromName: string;
  fromRole: UserRole;
  toClass: string;
  toRole: string;
  content: string;
  imageUrl?: string;
  images?: string[];
  createdAt: string;
  deletedFor?: string[]; // studentIds who have deleted/hidden this message from their inbox
}

export type LiveReactionType = 'fire' | 'clap' | 'heart' | 'cheer' | 'trophy' | 'sparkles' | 'star';

export interface CheerCount {
  matchId: string;
  homeCheers: number;
  awayCheers: number;
  lastEmoji?: string;
}

export interface InjuryAttachment {
  id: string;
  name: string;
  type: 'image' | 'link';
  url: string;
  size?: number;
}

export interface InjuryEntry {
  id: string;
  sport: SportType | 'common';
  title: string;
  symptoms: string;
  firstAid: string;
  severity: 'mild' | 'moderate' | 'emergency';
  prevention: string;
  summary?: string;
  commonCauses?: string;
  redFlags?: string[];
  whenToSeekCare?: string;
  tags?: string[];
  attachments?: InjuryAttachment[];
  sourceUrl?: string;
  published?: boolean;
  contentHtml?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SuggestionItem {
  id: string;
  authorId?: string;
  authorName: string;
  authorStudentId?: string;
  authorGrade?: string;
  authorClass?: string;
  title: string;
  content: string;
  category?: string;
  imageUrl?: string;
  images?: string[];
  status?: 'PENDING' | 'RESOLVED';
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
  venue?: string;
  previousScore?: string;
  updatedScore?: string;
  modifiedByName?: string;
  modifiedBy?: string;
  ipAddress?: string;
  hash?: string;
  previousHash?: string;
}

// -------------------------------------------------------------
// Generalized interfaces for festival board & role dashboards
// -------------------------------------------------------------

export interface HourlyForecastItem {
  time: string;
  hourLabel: string;
  hourNum?: number;
  temp: number;
  apparentTemp: number;
  rainProb: number;
  precipMm: number;
  weatherCode: number;
  condition: string;
  isDay: boolean;
  windSpeed: number;
  uvIndex?: number;
  isCurrentHour?: boolean;
  isPast?: boolean;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  rainProbMax: number;
  precipSum: number;
  weatherCode: number;
  condition: string;
  windSpeedMax: number;
  uvIndexMax?: number;
  sunrise?: string;
  sunset?: string;
}

export interface WeatherInfo {
  temperature: string | number;
  temp?: number;
  condition: string;
  precipitation: string | number;
  rainProb?: number;
  apparentTemp?: number;
  humidity?: number;
  windSpeed?: number;
  windDirection?: number;
  weatherCode?: number;
  isDay?: boolean;
  statusText?: string;
  lastUpdated?: string;
  uvIndex?: string;
  uvIndexValue?: number;
  sunrise?: string;
  sunset?: string;
  hourlyForecast?: HourlyForecastItem[];
  dailyForecast?: DailyForecastItem[];
}

export interface SafetyGuideItem {
  id: string;
  order: number;
  title: string;
  content: string;
  category?: 'hydration' | 'injury' | 'sportsmanship' | 'general';
}

export interface ClassStandingItem {
  id: string;
  rank: number;
  classLabel: string; // e.g., '3-2반' or '3학년 2반'
  points: number;
  grade: string;
  classNum: string;
  goldCount?: number;
  silverCount?: number;
  bronzeCount?: number;
}

export interface CheerMessageItem {
  id: string;
  authorMasked: string; // e.g., '김*서 (3-2)'
  classLabel: string;
  message: string;
  createdAt: string;
}

export interface TournamentMatchItem {
  id: string;
  roundName: string; // '준결승 1 (종료)', '결승전 진행중'
  stage: 'semifinal_1' | 'semifinal_2' | 'final';
  sport: SportType;
  gender: 'male' | 'female';
  grade: string;
  teamA: { name: string; score: number };
  teamB: { name: string; score: number };
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  venue: string;
}

export interface ScoreApprovalRequestItem {
  id: string;
  reqCode: string; // e.g., 'REQ-01'
  matchId: string;
  sport: SportType;
  title: string;
  homeTeam: string;
  homeScore: number;
  awayTeam: string;
  awayScore: number;
  reporterName: string;
  reporterRole: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  pointsToAward?: number;
  createdAt: string;
}

export interface SupplyItem {
  id: string;
  name: string;
  category: 'radios' | 'balls' | 'medical' | 'water' | 'general';
  currentQty: number;
  totalQty: number;
  unit: string;
  statusText?: string;
  needsAttention?: boolean;
}

export interface FieldIncidentItem {
  id: string;
  location: string;
  issueDescription: string;
  reportedAgo: string;
  status: 'REPORTED' | 'DISPATCHED' | 'RESOLVED';
  statusLabel: string;
}

export interface MedicalIncidentQueueItem {
  id: string;
  severity: 'CRITICAL' | 'MODERATE' | 'MILD';
  severityLabel: string; // 'CRITICAL (중상)', 'MODERATE (경상)'
  patientName: string;
  patientClass: string; // '3학년 5반'
  description: string;
  location: string;
  assignedStaff: string;
  reportedAgo: string;
  reportedTime: string;
  status: 'PENDING' | 'IN_TREATMENT' | 'TRANSFERRED' | 'RESOLVED';
}

export interface HospitalTransferItem {
  id: string;
  hospitalName: string;
  patientName: string;
  patientClass: string;
  reason: string;
  transferTime: string;
}

export interface MedicalTimelineItem {
  id: string;
  time: string;
  activity: string;
  status?: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
}

export interface SubstitutionRecord {
  id: string;
  timeLabel?: string; // '후반 12분 적용'
  minute?: number;
  classLabel?: string; // '3-2반'
  teamLabel?: string;
  playerOut?: { name: string; position: string } | string;
  playerIn?: { name: string; position: string } | string;
  outPlayer?: string;
  inPlayer?: string;
  reason?: string;
}

export interface AssignedRefereeMatch {
  id: string;
  timeLabel?: string;
  time?: string;
  sport: SportType;
  title: string;
  teams?: string;
  court?: string;
  status?: 'LIVE' | 'SCHEDULED' | 'FINISHED';
  statusLabel?: string;
  isCompleted?: boolean;
  isCurrentAssigned?: boolean;
}

export interface LoginInquiry {
  id: string;
  studentId: string; // 1번째 메타 정보: 학번
  claimedName: string; // 2번째 메타 정보: 학생이 입력/주장한 이름
  registeredName?: string | null; // 현재 DB에 등록된 원래 이름
  message: string; // 학생이 제출한 사연 내용
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type AppDocId = 'rules' | 'smartlab' | 'privacy' | 'terms' | string;

export interface AppDocumentSection {
  id: string;
  title: string;
  badge?: string;
  icon?: string;
  items?: string[];
  content?: string;
  imageUrl?: string;
  imageCaption?: string;
}

export interface AppDocumentGalleryImage {
  id: string;
  url: string;
  title?: string;
  caption?: string;
  uploadedAt?: string;
}

export interface AppDocument {
  id: AppDocId;
  title: string;
  subtitle: string;
  badge?: string;
  content?: string;
  coverImage?: string;
  images?: string[];
  gallery?: AppDocumentGalleryImage[];
  sections?: AppDocumentSection[];
  footerNote?: string;
  customCredits?: string;
  updatedAt: string;
  updatedBy: string;
  version?: number;
}

