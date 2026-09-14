import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, UserRole, DirectMessage } from '../../types';
import { listenMessages, sendDirectMessage, listenAllUsers } from '../../services/firebaseService';
import { 
  Send, 
  Users, 
  MessageSquare, 
  X, 
  ShieldAlert, 
  Check, 
  Image as ImageIcon,
  ZoomIn,
  Loader2
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';
import { ImageLightboxModal } from '../common/ImageLightboxModal';

interface DirectMessageModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
  currentUser,
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeCategory, setActiveCategory] = useState<'class_president' | 'student_council' | 'admin' | 'teacher'>('class_president');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('ALL'); // 'ALL' or specific user studentId
  const [messageText, setMessageText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if role is authorized (반장, 학생회, 관리자, 선생님만 가능)
  const isAuthorized = ['class_president', 'student_council', 'admin', 'teacher'].includes(currentUser.role);

  useEffect(() => {
    if (!isOpen) return;

    const unMessages = listenMessages(
      currentUser.classNum,
      ['class_president', 'teacher', 'student_council', 'admin'].includes(currentUser.role),
      (list) => setMessages(list)
    );

    const unUsers = listenAllUsers((userList) => setUsers(userList));

    return () => {
      unMessages();
      unUsers();
    };
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 text-center space-y-4 border border-slate-200 dark:border-slate-800">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">쪽지 접근 권한 안내</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            쪽지 기능은 반장, 학생회, 선생님, 관리자 역할에 한해 제공됩니다. 일반 학생 문의는 [건의함]을 이용해주세요.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  // Filter users by active category
  const categoryUsers = users.filter((u) => u.role === activeCategory);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 첨부할 수 있습니다.');
      return;
    }
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.75 });
      setAttachedImage(compressed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !attachedImage) return;

    setIsSending(true);
    try {
      await sendDirectMessage({
        fromId: currentUser.studentId,
        fromName: `${currentUser.studentId} ${currentUser.name}`,
        fromRole: currentUser.role,
        toClass: selectedRecipient === 'ALL' ? 'all' : selectedRecipient,
        toRole: activeCategory,
        content: messageText.trim(),
        imageUrl: attachedImage || undefined,
        images: attachedImage ? [attachedImage] : undefined
      });

      setMessageText('');
      setAttachedImage(null);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              운영진 쪽지함 (DMs)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs: 반장 / 학생회 / 관리자 / 선생님 */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { key: 'class_president', label: '반장' },
            { key: 'student_council', label: '학생회' },
            { key: 'admin', label: '관리자' },
            { key: 'teacher', label: '선생님' }
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setActiveCategory(cat.key as any);
                setSelectedRecipient('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                activeCategory === cat.key
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Two-Pane Body: Left: recipient list & messages; Right: chat thread */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
          {/* Left Column: Recipient Selector */}
          <div className="p-3 overflow-y-auto space-y-2 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
            <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              발송 대상 선택
            </div>
            
            <button
              type="button"
              onClick={() => setSelectedRecipient('ALL')}
              className={`w-full text-left p-2.5 rounded-xl border transition ${
                selectedRecipient === 'ALL'
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              전체 발송 ({activeCategory === 'class_president' ? '모든 반장' : activeCategory === 'teacher' ? '모든 선생님' : activeCategory === 'student_council' ? '학생회 전체' : '관리자 전체'})
            </button>

            {categoryUsers.length === 0 ? (
              <p className="text-slate-400 text-[11px] p-2 text-center">해당 카테고리 구성원이 없습니다.</p>
            ) : (
              categoryUsers.map((u) => (
                <button
                  key={u.studentId}
                  type="button"
                  onClick={() => setSelectedRecipient(u.studentId)}
                  className={`w-full text-left p-2 rounded-xl border transition ${
                    selectedRecipient === u.studentId
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-semibold">{u.studentId} {u.name}</div>
                  <div className="text-[10px] text-slate-400">{u.grade} {u.classNum}반</div>
                </button>
              ))
            )}
          </div>

          {/* Right Column: Message History & Input */}
          <div className="col-span-2 flex flex-col h-full overflow-hidden p-3 bg-white dark:bg-slate-900">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2 text-xs">
              {messages.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  수신된 쪽지가 없습니다.
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.fromId === currentUser.studentId;
                  const isAdminMsg = m.fromRole === 'admin';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {m.fromName}
                        </span>
                        {isAdminMsg && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold text-[9px]">
                            관리자 공지쪽지
                          </span>
                        )}
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                          isMe
                            ? 'bg-red-600 text-white rounded-tr-xs'
                            : isAdminMsg
                            ? 'bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white rounded-tl-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                        }`}
                      >
                        {m.content}

                        {/* Attached Image inside bubble */}
                        {(m.imageUrl || (m.images && m.images.length > 0)) && (
                          <div className="mt-2">
                            <div
                              className="relative inline-block rounded-xl overflow-hidden border border-black/10 dark:border-white/10 cursor-pointer group max-w-[200px]"
                              onClick={() => setLightboxSrc(m.imageUrl || m.images![0])}
                            >
                              <img
                                src={m.imageUrl || m.images![0]}
                                alt="첨부 이미지"
                                referrerPolicy="no-referrer"
                                className="max-h-36 w-auto object-cover rounded-xl group-hover:opacity-90 transition"
                              />
                              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <ZoomIn className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSend} className="pt-2 border-t border-slate-200 dark:border-slate-800">
              {sendSuccess && (
                <div className="mb-2 text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" /> 쪽지가 성공적으로 발송되었습니다.
                </div>
              )}

              {attachedImage && (
                <div className="mb-2 flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px]">
                  <div
                    className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 cursor-pointer"
                    onClick={() => setLightboxSrc(attachedImage)}
                  >
                    <img src={attachedImage} alt="첨부 미리보기" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">사진 1장 첨부됨</span>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="ml-auto p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="dm-modal-file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer shrink-0"
                  title="사진 첨부"
                >
                  {isCompressing ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <ImageIcon className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`[${selectedRecipient === 'ALL' ? '전체' : selectedRecipient}] 대상 쪽지 작성...`}
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isSending || isCompressing || (!messageText.trim() && !attachedImage)}
                  className="p-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl transition shadow-xs cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ImageLightboxModal
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
};
