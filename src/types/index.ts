export type UserRole = 
  | 'student' 
  | 'teacher' 
  | 'class_president' 
  | 'student_council' 
  | 'health_officer' 
  | 'referee'
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
  canAnswerSuggestion?: boolean;
  assignedMatchId?: string;
  createdAt: string;
  lastLogin: string;
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

export type SportType = 'soccer' | 'basketball' | 'dodgeball' | 'relay_male' | 'relay_female' | 'tug_of_war' | 'group_rope';

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
  originalCourt?: string; // 백업된 원래 경기장 정보 (우천/실내 전환 시 복귀용)
  assignedRefereeId?: string;
  assignedRefereeName?: string;
  mvpCandidateIds?: string[];
  mvpWinner?: string;
  mvpVotingClosedAt?: string;
  tournamentSlot?: 'QF1' | 'QF2' | 'QF3' | 'QF4' | 'SF1' | 'SF2' | 'FINAL' | 'BRONZE';
  events: TimelineEvent[];
  updatedAt: string;
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
}

// -------------------------------------------------------------
// Generalized interfaces for festival board & role dashboards
// -------------------------------------------------------------

export interface HourlyForecastItem {
  time: string;
  hourLabel: string;
  temp: number;
  apparentTemp: number;
  rainProb: number;
  precipMm: number;
  weatherCode: number;
  condition: string;
  isDay: boolean;
  windSpeed: number;
  uvIndex?: number;
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
  timeLabel: string; // '후반 12분 적용'
  classLabel: string; // '3-2반'
  playerOut: { name: string; position: string };
  playerIn: { name: string; position: string };
  reason?: string;
}

export interface AssignedRefereeMatch {
  id: string;
  timeLabel: string;
  sport: SportType;
  title: string;
  teams: string;
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED';
  isCurrentAssigned: boolean;
}
