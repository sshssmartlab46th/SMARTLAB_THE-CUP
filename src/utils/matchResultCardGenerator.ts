import { MatchItem, TimelineEvent } from '../types';
import { getSportScoreMeta } from './sportScoreUtils';

export interface TeamScorerInfo {
  player: string;
  details: string[]; // e.g. ["12'", "34'"]
}

export interface MatchSummaryDetails {
  title: string;
  sportName: string;
  roundText: string;
  courtText: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  homeScorers: TeamScorerInfo[];
  awayScorers: TeamScorerInfo[];
  mvpWinner: string;
  statusText: string;
  dateText: string;
}

/**
 * Extracts and formats scorer information for home and away teams from match timeline events.
 */
export function extractMatchScorers(match: MatchItem): {
  homeScorers: TeamScorerInfo[];
  awayScorers: TeamScorerInfo[];
} {
  const isScoringEvent = (evt: TimelineEvent) => {
    return (
      ['GOAL', 'POINT_3', 'POINT_2', 'FREE_THROW', 'OUT'].includes(evt.type) ||
      (typeof evt.points === 'number' && evt.points > 0)
    );
  };

  const scoringEvents = (match.events || []).filter(isScoringEvent);

  const groupScorers = (teamFilter: 'home' | 'away'): TeamScorerInfo[] => {
    const teamEvents = scoringEvents.filter((evt) => evt.team === teamFilter);
    const map = new Map<string, string[]>();

    teamEvents.forEach((evt) => {
      const playerName = evt.player?.trim() || evt.description?.trim() || '득점자';
      const minuteLabel = `${evt.minute}'`;
      if (!map.has(playerName)) {
        map.set(playerName, []);
      }
      map.get(playerName)!.push(minuteLabel);
    });

    const result: TeamScorerInfo[] = [];
    map.forEach((details, player) => {
      result.push({ player, details });
    });
    return result;
  };

  return {
    homeScorers: groupScorers('home'),
    awayScorers: groupScorers('away')
  };
}

/**
 * Returns structured summary data for a given MatchItem.
 */
export function getMatchSummaryDetails(match: MatchItem): MatchSummaryDetails {
  const sportMeta = getSportScoreMeta(match.sport);
  const { homeScorers, awayScorers } = extractMatchScorers(match);

  const homePenaltyScore = match.penaltyShootout?.isActive || match.penaltyShootout?.completedAt
    ? match.penaltyShootout.homeScore
    : undefined;
  const awayPenaltyScore = match.penaltyShootout?.isActive || match.penaltyShootout?.completedAt
    ? match.penaltyShootout.awayScore
    : undefined;

  const mvpWinner = match.mvpWinner
    ? match.mvpWinner
    : match.mvpCandidateIds && match.mvpCandidateIds.length > 0
    ? '투표 진행 중'
    : '미정';

  let dateText = '상산제 체육대회';
  if (match.updatedAt || match.startTime) {
    try {
      const d = new Date(match.updatedAt || match.startTime);
      if (!isNaN(d.getTime())) {
        dateText = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      }
    } catch {
      // fallback
    }
  }

  return {
    title: match.title || `${sportMeta.sportName} 경기`,
    sportName: sportMeta.sportName,
    roundText: match.round || '본선',
    courtText: match.court || match.location || '상산고 대운동장',
    homeTeamName: match.homeTeam || match.homeClass || '홈팀',
    awayTeamName: match.awayTeam || match.awayClass || '원정팀',
    homeScore: match.homeScore ?? 0,
    awayScore: match.awayScore ?? 0,
    homePenaltyScore,
    awayPenaltyScore,
    homeScorers,
    awayScorers,
    mvpWinner,
    statusText: match.status === 'FINISHED' ? 'FINAL RESULT' : 'MATCH RESULT',
    dateText
  };
}

/**
 * Formats match summary into a plain-text format for clipboard or sharing.
 */
export function formatMatchSummaryText(match: MatchItem): string {
  const summary = getMatchSummaryDetails(match);

  let text = `🏆 [상산제 체육대회 경기 결과]\n`;
  text += `📌 ${summary.sportName} (${summary.roundText}) - ${summary.courtText}\n`;
  text += `⚽ ${summary.homeTeamName} ${summary.homeScore} : ${summary.awayScore} ${summary.awayTeamName}\n`;

  if (typeof summary.homePenaltyScore === 'number' && typeof summary.awayPenaltyScore === 'number') {
    text += `🎯 승부차기: ${summary.homePenaltyScore} : ${summary.awayPenaltyScore}\n`;
  }

  if (summary.homeScorers.length > 0 || summary.awayScorers.length > 0) {
    text += `\n[득점 기록]\n`;
    if (summary.homeScorers.length > 0) {
      const homeStr = summary.homeScorers
        .map((s) => `${s.player} (${s.details.join(', ')})`)
        .join(', ');
      text += `• ${summary.homeTeamName}: ${homeStr}\n`;
    }
    if (summary.awayScorers.length > 0) {
      const awayStr = summary.awayScorers
        .map((s) => `${s.player} (${s.details.join(', ')})`)
        .join(', ');
      text += `• ${summary.awayTeamName}: ${awayStr}\n`;
    }
  }

  if (summary.mvpWinner) {
    text += `\n🌟 MVP: ${summary.mvpWinner}\n`;
  }

  text += `\nmade by SMARTLAB`;
  return text;
}

/**
 * Renders high-quality match result summary card directly onto an HTML5 Canvas.
 */
export function drawMatchResultCardOnCanvas(canvas: HTMLCanvasElement, match: MatchItem): void {
  const width = 1200;
  const height = 675;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const summary = getMatchSummaryDetails(match);

  // Background Gradient
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#0f172a'); // slate-900
  bgGradient.addColorStop(0.5, '#1e1b4b'); // indigo-950
  bgGradient.addColorStop(1, '#020617'); // slate-955
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Decorative Accent Circles
  ctx.save();
  ctx.globalAlpha = 0.15;
  const gradCircle1 = ctx.createRadialGradient(200, 150, 10, 200, 150, 400);
  gradCircle1.addColorStop(0, '#3b82f6');
  gradCircle1.addColorStop(1, 'transparent');
  ctx.fillStyle = gradCircle1;
  ctx.beginPath();
  ctx.arc(200, 150, 400, 0, Math.PI * 2);
  ctx.fill();

  const gradCircle2 = ctx.createRadialGradient(1000, 520, 10, 1000, 520, 450);
  gradCircle2.addColorStop(0, '#eab308');
  gradCircle2.addColorStop(1, 'transparent');
  ctx.fillStyle = gradCircle2;
  ctx.beginPath();
  ctx.arc(1000, 520, 450, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Outer Border Box
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  // Inner Card Container
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(40, 40, width - 80, height - 80, 20);
  ctx.fill();
  ctx.stroke();

  // Header Badge (Top Center)
  ctx.save();
  ctx.fillStyle = '#f59e0b'; // Amber badge
  ctx.beginPath();
  ctx.roundRect(width / 2 - 140, 60, 280, 36, 18);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🏆 ${summary.statusText}`, width / 2, 78);
  ctx.restore();

  // Subtitle / Round / Court
  ctx.fillStyle = '#94a3b8'; // slate-400
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${summary.sportName} • ${summary.roundText} | ${summary.courtText}`, width / 2, 112);

  // Scoreboard Container
  const sbX = 80;
  const sbY = 160;
  const sbW = width - 160;
  const sbH = 200;

  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(sbX, sbY, sbW, sbH, 16);
  ctx.fill();
  ctx.stroke();

  // Home Team Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(summary.homeTeamName, sbX + sbW * 0.25, sbY + 60);

  // Away Team Name
  ctx.fillText(summary.awayTeamName, sbX + sbW * 0.75, sbY + 60);

  // Main Score Display
  ctx.fillStyle = '#f59e0b'; // Amber 500
  ctx.font = 'bold 80px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${summary.homeScore} : ${summary.awayScore}`, width / 2, sbY + 70);

  // Penalty Shootout label if applicable
  if (typeof summary.homePenaltyScore === 'number' && typeof summary.awayPenaltyScore === 'number') {
    ctx.fillStyle = '#38bdf8'; // Sky 400
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`(PK ${summary.homePenaltyScore} : ${summary.awayPenaltyScore})`, width / 2, sbY + 130);
  }

  // Scorers Section
  const scY = sbY + sbH + 25;

  // Helper to render team scorers cleanly
  const renderTeamScorers = (
    label: string,
    scorers: TeamScorerInfo[],
    xPos: number,
    maxWidth: number
  ) => {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(label, xPos, scY);

    ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    if (scorers.length > 0) {
      ctx.fillStyle = '#f8fafc';
      let currentY = scY + 26;
      scorers.slice(0, 3).forEach((s) => {
        const text = `• ${s.player} (${s.details.join(', ')})`;
        ctx.fillText(text, xPos, currentY, maxWidth);
        currentY += 22;
      });
      if (scorers.length > 3) {
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`외 ${scorers.length - 3}명`, xPos, currentY, maxWidth);
      }
    } else {
      ctx.fillStyle = '#64748b';
      ctx.fillText('득점 기록 없음', xPos, scY + 26);
    }
  };

  renderTeamScorers('⚽ 홈팀 득점', summary.homeScorers, sbX + 20, sbW * 0.45);
  renderTeamScorers('⚽ 원정팀 득점', summary.awayScorers, sbX + sbW * 0.5 + 20, sbW * 0.45);

  // MVP Section Banner (Bottom Left/Center)
  const mvpY = sbY + sbH + 140;
  ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(sbX, mvpY, sbW * 0.58, 48, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🌟 경기 MVP: ${summary.mvpWinner}`, sbX + 20, mvpY + 24);

  // Footer Credit Banner (Bottom Right - MANDATORY RULE: made by SMARTLAB)
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`made by SMARTLAB`, sbX + sbW, mvpY + 24);
}

/**
 * Generates PNG Data URL from MatchItem.
 */
export function generateMatchResultCardDataUrl(match: MatchItem): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  drawMatchResultCardOnCanvas(canvas, match);
  return canvas.toDataURL('image/png');
}

/**
 * Triggers a download of the match result card PNG image.
 */
export function downloadMatchResultCardImage(match: MatchItem, customFilename?: string): void {
  if (typeof document === 'undefined') return;
  const dataUrl = generateMatchResultCardDataUrl(match);
  if (!dataUrl) return;

  const filename = customFilename || `match-result-${match.id || 'card'}.png`;
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Shares the match result card using Web Share API or falls back to text clipboard copy.
 */
export async function shareMatchResultCard(match: MatchItem): Promise<{
  success: boolean;
  method: 'web-share' | 'clipboard';
}> {
  const summaryText = formatMatchSummaryText(match);

  // Attempt Web Share with File if supported
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const dataUrl = generateMatchResultCardDataUrl(match);
      if (dataUrl) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `match-result-${match.id}.png`, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `[상산제] ${match.title || '경기 결과'}`,
            text: summaryText,
            files: [file]
          });
          return { success: true, method: 'web-share' };
        }
      }

      // Fallback Web Share text only
      await navigator.share({
        title: `[상산제] ${match.title || '경기 결과'}`,
        text: summaryText
      });
      return { success: true, method: 'web-share' };
    } catch (e) {
      // User cancelled share or share failed
      if ((e as Error)?.name === 'AbortError') {
        return { success: false, method: 'web-share' };
      }
    }
  }

  // Fallback to Clipboard Copy
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(summaryText);
      return { success: true, method: 'clipboard' };
    } catch {
      return { success: false, method: 'clipboard' };
    }
  }

  return { success: false, method: 'clipboard' };
}
