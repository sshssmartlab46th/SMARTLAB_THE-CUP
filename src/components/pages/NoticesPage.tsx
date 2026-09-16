import React, { useState, useMemo } from 'react';
import { NoticeItem, UserProfile } from '../../types';
import { 
  Bell, 
  Search, 
  Filter, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  Maximize2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';
import { formatKSTDateTime } from '../../utils/kstTime';
import { createNotice, deleteNotice } from '../../services/firebaseService';

export interface NoticesPageProps {
  notices: NoticeItem[];
  currentUser: UserProfile | null;
  onOpenPopup?: (notice: NoticeItem) => void;
  onNoticeActionFeedback?: (msg: string) => void;
}

export const NoticesPage: React.FC<NoticesPageProps> = ({
  notices,
  currentUser,
  onOpenPopup,
  onNoticeActionFeedback
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Search & Filter state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'important'>('newest');

  // Admin inline composer state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'tournament' | 'festival' | 'urgent' | 'general'>('general');
  const [important, setImportant] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  // Delete modal state
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showFeedback = (msg: string) => {
    setLocalFeedback(msg);
    if (onNoticeActionFeedback) {
      onNoticeActionFeedback(msg);
    }
    setTimeout(() => {
      setLocalFeedback(null);
    }, 4000);
  };

  // Submit new notice (Admin only)
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showFeedback('공지 제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createNotice({
        title: title.trim(),
        content: content.trim(),
        type: 'global',
        authorName: currentUser?.name ? `${currentUser.name} (총괄본부)` : '총괄본부 (관리자)',
        authorRole: 'admin',
        authorId: currentUser?.studentId || 'sshsgym',
        important,
        category,
        linkUrl: linkUrl.trim() || undefined,
        linkLabel: linkLabel.trim() || undefined
      });

      setTitle('');
      setContent('');
      setImportant(false);
      setLinkUrl('');
      setLinkLabel('');
      setIsComposerOpen(false);
      showFeedback('공지사항이 성공적으로 등록되었습니다. 전교생 및 교직원 화면에 즉시 반영됩니다.');
    } catch (err) {
      console.error('Failed to create notice:', err);
      showFeedback('공지 등록 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete notice (Admin only)
  const handleDeleteNotice = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await deleteNotice(confirmDelete.id);
      showFeedback(`"${confirmDelete.title}" 공지가 영구 삭제되었습니다.`);
      setConfirmDelete(null);
    } catch (err) {
      console.error('Failed to delete notice:', err);
      showFeedback('공지 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered and sorted notices
  const filteredNotices = useMemo(() => {
    let result = [...notices];

    // 1. Category filter
    if (selectedCategory === 'important') {
      result = result.filter(n => n.important || n.category === 'urgent');
    } else if (selectedCategory !== 'all') {
      result = result.filter(n => n.category === selectedCategory);
    }

    // 2. Search keyword filter
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      result = result.filter(n => 
        (n.title && n.title.toLowerCase().includes(kw)) ||
        (n.content && n.content.toLowerCase().includes(kw)) ||
        (n.authorName && n.authorName.toLowerCase().includes(kw))
      );
    }

    // 3. Sorting
    if (sortBy === 'important') {
      result.sort((a, b) => {
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [notices, selectedCategory, searchKeyword, sortBy]);

  const urgentCount = useMemo(() => {
    return notices.filter(n => n.important || n.category === 'urgent').length;
  }, [notices]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-xs font-bold text-red-600 dark:text-red-400">
            <Bell className="w-3.5 h-3.5" />
            상산고등학교 체육대회 & 축제 공식 알림 센터
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            공지사항 전체 보관소
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            총괄본부 및 대회 운영진이 전교생과 교직원에게 안내하는 실시간 일정 변경, 경기 안내, 비상 안전 수칙 등 모든 기존 공지를 확인할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-[11px] text-slate-400 font-medium">전체 등록 공지</div>
            <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {notices.length} <span className="text-xs font-normal">건</span>
            </div>
          </div>
          {urgentCount > 0 && (
            <div className="px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-center">
              <div className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                긴급 중요 공지
              </div>
              <div className="text-lg font-black text-red-600 dark:text-red-400 font-mono">
                {urgentCount} <span className="text-xs font-normal">건</span>
              </div>
            </div>
          )}

          {/* Admin Write Toggle Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsComposerOpen(!isComposerOpen)}
              className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              {isComposerOpen ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isComposerOpen ? '작성창 닫기' : '새 공지 직접 작성'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {localFeedback && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{localFeedback}</span>
        </div>
      )}

      {/* Admin Direct Notice Creation Form (Expanded or toggled) */}
      {isAdmin && isComposerOpen && (
        <div className="p-6 rounded-3xl border-2 border-red-500/40 dark:border-red-500/30 bg-white dark:bg-slate-900 shadow-md space-y-4 animate-in zoom-in-98 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  총괄 관리자 공지사항 직접 작성
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  발행된 공지는 즉시 상단 티커 및 사용자 접속 시 최신 팝업으로 노출됩니다.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-600 text-white">
              관리자 권한
            </span>
          </div>

          <form onSubmit={handleCreateNotice} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  공지 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: [안내] 2일차 오후 축구 결승전 시간 변경 및 관람석 안내"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  공지 분류
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500 font-medium"
                >
                  <option value="general">대회 본부 일반 공지</option>
                  <option value="tournament">경기/대진/일정 공지</option>
                  <option value="festival">축제/문화 행사 공지</option>
                  <option value="urgent">긴급 비상 공지</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                공지 세부 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="전교생 및 교직원에게 전달할 공지 세부 사항을 구체적으로 입력하세요."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500 leading-relaxed font-sans"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  바로가기 링크 URL (선택 사항)
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  링크 버튼 텍스트 (선택 사항)
                </label>
                <input
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="예: 경기 규정집 바로가기"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200 select-none">
                <input
                  type="checkbox"
                  checked={important}
                  onChange={(e) => setImportant(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  긴급 중요 공지로 지정 (최우선 팝업 노출 및 강조 표기)
                </span>
              </label>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? '전교 배포 중...' : '공지 발행 및 즉시 전교 배포'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { key: 'all', label: '전체 공지' },
              { key: 'important', label: '긴급·중요' },
              { key: 'tournament', label: '경기/대진' },
              { key: 'festival', label: '축제/행사' },
              { key: 'general', label: '일반/본부' }
            ].map(cat => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.key
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input & Sort Selector */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="제목, 내용, 작성자 검색..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-red-500"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden"
            >
              <option value="newest">최신순</option>
              <option value="important">중요순</option>
            </select>
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>
            총 <strong className="text-slate-700 dark:text-slate-300">{filteredNotices.length}</strong>건의 공지가 조회되었습니다.
          </span>
          <span>한국 표준시 (KST) 기준 실시간 동기화</span>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {filteredNotices.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              조건에 맞는 공지사항이 없습니다.
            </div>
            <p className="text-xs text-slate-400">
              검색어를 변경하거나 다른 카테고리 필터를 선택해 보세요.
            </p>
          </div>
        ) : (
          filteredNotices.map((n, index) => {
            const isMostRecent = index === 0 && sortBy === 'newest' && !searchKeyword && selectedCategory === 'all';
            return (
              <article
                key={n.id}
                className={`p-5 sm:p-6 rounded-3xl border transition shadow-xs flex flex-col gap-4 ${
                  n.important
                    ? 'border-red-300 dark:border-red-900/70 bg-red-50/40 dark:bg-red-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isMostRecent && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-xs">
                        최신 공지 (팝업 대상)
                      </span>
                    )}

                    {n.important && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        긴급 중요
                      </span>
                    )}

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      n.category === 'tournament' 
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' :
                      n.category === 'festival' 
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' :
                      n.category === 'urgent'
                        ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {n.category === 'tournament' ? '경기/대진' :
                       n.category === 'festival' ? '축제/행사' :
                       n.category === 'urgent' ? '긴급 비상' : '대회 본부'}
                    </span>

                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatKSTDateTime(n.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* View in Popup Button */}
                    {onOpenPopup && (
                      <button
                        type="button"
                        onClick={() => onOpenPopup(n)}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
                        title="팝업 창으로 크게 보기"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>팝업으로 보기</span>
                      </button>
                    )}

                    {/* Admin Delete Action */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ id: n.id, title: n.title })}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="공지 삭제 (관리자)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug break-keep">
                  {n.title}
                </h2>

                {/* Content */}
                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed break-words bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                  {n.content}
                </div>

                {/* External Link */}
                {n.linkUrl && (
                  <div>
                    <a
                      href={n.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition w-fit"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{n.linkLabel || '관련 링크 바로가기'}</span>
                    </a>
                  </div>
                )}

                {/* Footer / Author info */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>작성: <strong>{n.authorName || '총괄본부'}</strong></span>
                  <span className="font-mono">공지 ID: {n.id}</span>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  공지사항 영구 삭제
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  &quot;{confirmDelete.title}&quot; 공지를 삭제하시겠습니까? 삭제 즉시 전교생 및 교직원 화면에서 완전히 제거됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteNotice}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
              >
                {isDeleting ? '삭제 중...' : '삭제 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
