import React, { useState } from 'react';
import { NoticeItem } from '../../types';
import { 
  Bell, 
  Plus, 
  Trash2, 
  AlertCircle, 
  ExternalLink, 
  CheckCircle2, 
  Pin 
} from 'lucide-react';
import { createNotice, deleteNotice } from '../../services/firebaseService';

interface AdminNoticeManagerTabProps {
  notices: NoticeItem[];
  onNotice: (msg: string) => void;
}

export const AdminNoticeManagerTab: React.FC<AdminNoticeManagerTabProps> = ({
  notices,
  onNotice
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'tournament' | 'festival' | 'urgent' | 'general'>('general');
  const [important, setImportant] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      onNotice('공지 제목과 내용을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createNotice({
        title: title.trim(),
        content: content.trim(),
        type: 'global',
        authorName: '총괄본부 (관리자)',
        authorRole: 'admin',
        authorId: 'sshsgym',
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
      onNotice('공지사항이 성공적으로 등록되었습니다.');
    } catch (err) {
      console.error(err);
      onNotice('공지 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await deleteNotice(confirmDelete.id);
      onNotice(`"${confirmDelete.title}" 공지가 정상적으로 삭제되었습니다.`);
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      onNotice('공지 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Notice Creation Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-600 dark:text-emerald-400" />
              새 전교 공지사항 작성
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              등록된 공지는 학생 앱 상단 롤링 배너 및 첫 접속 팝업으로 노출됩니다.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            총 {notices.length}건 등록됨
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                공지 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: [총괄본부] 개회식 시간 및 정시 집합 안내"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                분류
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500"
              >
                <option value="general">일반 공지</option>
                <option value="tournament">경기/대진 공지</option>
                <option value="festival">축제/행사 공지</option>
                <option value="urgent">긴급 공지</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              공지 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="학생들에게 공지할 세부 내용을 입력해 주세요."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                바로가기 링크 URL (선택)
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                링크 버튼 문구 (선택)
              </label>
              <input
                type="text"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="예: 경기 규정집 보기"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={important}
                onChange={(e) => setImportant(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />
                긴급 중요 공지로 지정 (최우선 팝업 노출)
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? '등록 중...' : '공지 등록'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notice List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Pin className="w-4 h-4 text-slate-500" />
          현재 등록된 공지사항 목록
        </h3>

        {notices.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            현재 등록된 공지사항이 없습니다. 위 폼을 통해 관리자가 공지를 등록할 수 있습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                  n.important
                    ? 'border-red-300 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.important && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                        중요 긴급
                      </span>
                    )}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {n.category === 'tournament' ? '대진' : n.category === 'urgent' ? '긴급' : n.category === 'festival' ? '축제' : '일반'}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {n.title}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {n.content}
                  </p>

                  {n.linkUrl && (
                    <a
                      href={n.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{n.linkLabel || n.linkUrl}</span>
                    </a>
                  )}

                  <div className="text-[10px] text-slate-400 font-mono">
                    작성자: {n.authorName || '관리자'} · {new Date(n.createdAt).toLocaleString('ko-KR')}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmDelete({ id: n.id, title: n.title })}
                  className="self-end sm:self-start p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                  title="공지 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  공지사항 영구 삭제
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  &quot;{confirmDelete.title}&quot; 공지를 삭제하시겠습니까? 삭제 즉시 전교생 및 교직원 화면에서 제거됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
