import { ClassStandingItem } from '../types';

export interface StandingsExportOptions {
  gradeFilter?: string;
  festivalName?: string;
}

/**
 * Exports overall class standings to a CSV file with UTF-8 BOM encoding for Excel compatibility.
 */
export function exportStandingsToCSV(
  standings: ClassStandingItem[],
  options: StandingsExportOptions = {}
): void {
  const gradeFilter = options.gradeFilter || 'ALL';
  const festivalName = options.festivalName || '상산고등학교 체육대회';

  const filtered = standings.filter((item) => {
    if (gradeFilter === 'ALL') return true;
    return item.grade === gradeFilter;
  });

  const headers = ['순위', '학년', '학급', '금메달(1위)', '은메달(2위)', '동메달(3위)', '승', '무', '패', '종합 점수(P)', '시상 구분'];

  const rows = filtered.map((item, idx) => {
    const rank = idx + 1;
    const gradeStr = `${item.grade}학년`;
    const classStr = item.classLabel || `${item.grade}-${item.classNum}반`;
    const gold = item.goldCount ?? 0;
    const silver = item.silverCount ?? 0;
    const bronze = item.bronzeCount ?? 0;
    const wins = (item as any).wins ?? 0;
    const draws = (item as any).draws ?? 0;
    const losses = (item as any).losses ?? 0;
    const points = item.points ?? (item as any).totalPoints ?? 0;

    let awardStr = '-';
    if (gradeFilter === 'ALL') {
      if (rank === 1) awardStr = '종합 우승 (1위)';
      else if (rank === 2) awardStr = '종합 준우승 (2위)';
      else if (rank === 3) awardStr = '종합 3위 (3위)';
    } else {
      if (rank === 1) awardStr = `${item.grade}학년 우승 (1위)`;
      else if (rank === 2) awardStr = `${item.grade}학년 준우승 (2위)`;
      else if (rank === 3) awardStr = `${item.grade}학년 3위 (3위)`;
    }

    return [
      rank,
      `"${gradeStr}"`,
      `"${classStr}"`,
      gold,
      silver,
      bronze,
      wins,
      draws,
      losses,
      points,
      `"${awardStr}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const gradeSuffix = gradeFilter === 'ALL' ? '전체' : `${gradeFilter}학년`;
  const filename = `${festivalName}_종합순위_시상리포트_${gradeSuffix}_${dateStr}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and triggers print/PDF saving for a formal Award Summary Report document.
 */
export function exportStandingsToPDF(
  standings: ClassStandingItem[],
  options: StandingsExportOptions = {}
): void {
  const gradeFilter = options.gradeFilter || 'ALL';
  const festivalName = options.festivalName || '상산고등학교 체육대회';

  const filtered = standings.filter((item) => {
    if (gradeFilter === 'ALL') return true;
    return item.grade === gradeFilter;
  });

  const gradeSuffix = gradeFilter === 'ALL' ? '전체 학년' : `${gradeFilter}학년`;
  const reportDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const top3 = filtered.slice(0, 3);

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    alert('팝업 창이 블록되었습니다. 팝업 허용 후 다시 시도해 주세요.');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${festivalName} - 최종 시상 리포트 (${gradeSuffix})</title>
  <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    * { box-sizing: border-box; font-family: 'Pretendard', sans-serif; }
    body { padding: 40px; background: #fff; color: #1e293b; line-height: 1.5; }
    .report-card { border: 2px solid #0f172a; padding: 36px; border-radius: 12px; }
    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 28px; }
    .header h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.5px; }
    .header p { font-size: 14px; color: #64748b; margin: 0; }
    .badge { display: inline-block; background: #e11d48; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px; }

    .podium { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .podium-card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; background: #f8fafc; }
    .podium-card.rank-1 { border-color: #f59e0b; background: #fffbeb; }
    .podium-card.rank-2 { border-color: #94a3b8; background: #f1f5f9; }
    .podium-card.rank-3 { border-color: #d97706; background: #fff7ed; }
    .podium-rank { font-size: 24px; margin-bottom: 4px; }
    .podium-title { font-size: 13px; font-weight: 700; color: #475569; }
    .podium-class { font-size: 20px; font-weight: 800; color: #0f172a; margin: 6px 0; }
    .podium-pts { font-size: 16px; font-weight: 800; color: #e11d48; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 13px; }
    th { background: #f1f5f9; font-weight: 700; color: #334155; text-align: center; padding: 10px; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; }
    td { text-align: center; padding: 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
    td.class-col { font-weight: 700; text-align: left; }
    td.pts-col { font-weight: 800; color: #e11d48; text-align: right; font-family: monospace; font-size: 14px; }
    tr:nth-child(even) { background: #fafafa; }

    .footer { margin-top: 40px; border-top: 2px solid #e2e8f0; pt: 20px; text-align: center; }
    .footer-stamp { margin-top: 24px; font-size: 16px; font-weight: 800; letter-spacing: 2px; color: #0f172a; }
    .credits { margin-top: 8px; font-size: 11px; color: #94a3b8; }

    @media print {
      body { padding: 0; }
      .report-card { border: none; padding: 0; }
      @page { size: A4 portrait; margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="report-card">
    <div class="header">
      <div class="badge">${gradeSuffix} 시상 리포트</div>
      <h1>${festivalName} 종합 순위 및 최종 시상 보고서</h1>
      <p>발행일자: ${reportDate} | 상산고등학교 체육대회 집계본부</p>
    </div>

    ${
      top3.length > 0
        ? `
    <div class="podium">
      ${top3
        .map((item, idx) => {
          const rank = idx + 1;
          const icon = rank === 1 ? '🏆' : rank === 2 ? '🥈' : '🥉';
          const title =
            gradeFilter === 'ALL'
              ? rank === 1
                ? '종합 우승'
                : rank === 2
                ? '종합 준우승'
                : '종합 3위'
              : `${item.grade}학년 ${rank === 1 ? '우승' : rank === 2 ? '준우승' : '3위'}`;
          return `
        <div class="podium-card rank-${rank}">
          <div class="podium-rank">${icon}</div>
          <div class="podium-title">${title}</div>
          <div class="podium-class">${item.classLabel || `${item.grade}-${item.classNum}반`}</div>
          <div class="podium-pts">${Number(item.points ?? (item as any).totalPoints ?? 0).toLocaleString()} P</div>
        </div>
        `;
        })
        .join('')}
    </div>
    `
        : ''
    }

    <table>
      <thead>
        <tr>
          <th style="width: 50px;">순위</th>
          <th>학급</th>
          <th style="width: 65px;">금메달</th>
          <th style="width: 65px;">은메달</th>
          <th style="width: 65px;">동메달</th>
          <th style="width: 60px;">승</th>
          <th style="width: 60px;">무</th>
          <th style="width: 60px;">패</th>
          <th style="text-align: right; width: 110px;">종합 점수</th>
        </tr>
      </thead>
      <tbody>
        ${filtered
          .map((item, idx) => {
            const rank = idx + 1;
            const gold = item.goldCount ?? 0;
            const silver = item.silverCount ?? 0;
            const bronze = item.bronzeCount ?? 0;
            const wins = (item as any).wins ?? 0;
            const draws = (item as any).draws ?? 0;
            const losses = (item as any).losses ?? 0;
            const points = Number(item.points ?? (item as any).totalPoints ?? 0);

            return `
          <tr>
            <td><strong>${rank}</strong></td>
            <td class="class-col">${item.classLabel || `${item.grade}-${item.classNum}반`}</td>
            <td style="color: #d97706; font-weight: 700;">${gold}</td>
            <td style="color: #64748b; font-weight: 700;">${silver}</td>
            <td style="color: #b45309; font-weight: 700;">${bronze}</td>
            <td>${wins}</td>
            <td>${draws}</td>
            <td>${losses}</td>
            <td class="pts-col">${points.toLocaleString()} P</td>
          </tr>
          `;
          })
          .join('')}
      </tbody>
    </table>

    <div class="footer">
      <p style="font-size: 12px; color: #64748b; margin: 0;">
        본 보고서는 체육대회 집계 시스템에서 자동으로 검증 및 산출된 공식 최종 순위 리포트입니다.
      </p>
      <div class="footer-stamp">상 산 고 등 학 교 체 육 대 회 집 계 본 부</div>
      <div class="credits">made by SMARTLAB</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
