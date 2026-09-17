import React, { useState, useEffect, useRef } from 'react';
import { DirectMessage, UserProfile } from '../../types';
import { 
  Send, 
  Inbox, 
  SendHorizontal, 
  Mail, 
  Trash2, 
  Reply, 
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  Image as ImageIcon,
  UploadCloud,
  X,
  ZoomIn,
  Loader2,
  Paperclip
} from 'lucide-react';
import { 
  sendDirectMessage, 
  listenAllDirectMessages, 
  deleteDirectMessage 
} from '../../services/firebaseService';
import { formatKSTDateTime } from '../../utils/kstTime';
import { compressImageFile } from '../../utils/imageCompressor';
import { ImageLightboxModal } from '../common/ImageLightboxModal';

interface MessagesPageProps {
  currentUser: UserProfile | null;
  onOpenLogin?: () => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  currentUser,
  onOpenLogin
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Compose fields
  const [targetType, setTargetType] = useState<string>('class'); // 'class', 'teachers', 'council', 'all'
  const [targetGrade, setTargetGrade] = useState<string>('1');
  const [targetClass, setTargetClass] = useState<string>('1');
  const [targetRole, setTargetRole] = useState<string>('class_president');
  const [messageContent, setMessageContent] = useState<string>('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = listenAllDirectMessages((list) => {
      setMessages(list);
    });
    return () => unsub();
  }, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(JPG, PNG, GIF, WebP 등)만 첨부할 수 있습니다.');
      return;
    }
    setIsCompressing(true);
    try {
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.78
      });
      setAttachedImage(compressedDataUrl);
    } catch (err: any) {
      console.error(err);
      alert(err.message || '이미지 압축 처리 중 오류가 발생했습니다.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Filter messages for current user
  // User's class code: e.g. "101", "203" or "teacher" or "admin"
  const userClassCode = currentUser?.isTeacher 
    ? 'teacher' 
    : `${currentUser?.grade || '1'}${String(currentUser?.classNum || '1').padStart(2, '0')}`;

  const inboxMessages = messages.filter((m) => {
    if (!currentUser) return false;
    // Admins see all
    if (currentUser.role === 'admin') return true;
    // Sent to user's class
    if (m.toClass === userClassCode || m.toClass === 'all') return true;
    // Sent to role
    if (m.toRole === currentUser.role || m.toRole === 'all') return true;
    // If teacher and sent to teachers
    if (currentUser.isTeacher && (m.toRole === 'teacher' || m.toClass === 'teacher')) return true;
    return false;
  });

  const sentMessages = messages.filter((m) => {
    return m.fromId === currentUser?.studentId;
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!messageContent.trim()) {
      alert('쪽지 내용을 입력하세요.');
      return;
    }

    setIsSending(true);
    try {
      let finalToClass = 'all';
      let finalToRole = 'student';

      if (targetType === 'class') {
        finalToClass = `${targetGrade}${targetClass.padStart(2, '0')}`;
        finalToRole = targetRole;
      } else if (targetType === 'teachers') {
        finalToClass = 'teacher';
        finalToRole = 'teacher';
      } else if (targetType === 'referees') {
        finalToClass = 'all';
        finalToRole = 'referee';
      } else if (targetType === 'council') {
        finalToClass = 'all';
        finalToRole = 'student_council';
      } else if (targetType === 'all') {
        finalToClass = 'all';
        finalToRole = 'all';
      }

      await sendDirectMessage({
        fromId: currentUser.studentId,
        fromName: `${currentUser.name} (${currentUser.isTeacher ? '선생님' : `${currentUser.grade}-${currentUser.classNum}`})`,
        fromRole: currentUser.role,
        toClass: finalToClass,
        toRole: finalToRole,
        content: messageContent.trim(),
        ...(attachedImage ? { imageUrl: attachedImage, images: [attachedImage] } : {})
      });

      setMessageContent('');
      setAttachedImage(null);
      showNotice('쪽지가 성공적으로 발송되었습니다.');
      setActiveTab('sent');
    } catch (err) {
      console.error(err);
      alert('쪽지 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('이 쪽지를 삭제하시겠습니까?')) {
      try {
        await deleteDirectMessage(id);
        showNotice('쪽지가 삭제되었습니다.');
      } catch (err) {
        console.error(err);
        alert('삭제 실패');
      }
    }
  };

  const handleReplyTo = (msg: DirectMessage) => {
    setActiveTab('compose');
    setTargetType('class');
    setMessageContent(`[답장] ${msg.fromName} 학우/선생님께:\n> ${msg.content.slice(0, 30)}...\n\n`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-navy-800 text-white bg-slate-800 dark:bg-slate-700">
              COMMUNICATION
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              반장·교사·학생회 상호 연락망
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Mail className="w-6 h-6 text-red-600" />
            상산고 실시간 쪽지함 (Messages)
          </h2>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>받은 쪽지 ({inboxMessages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <SendHorizontal className="w-4 h-4" />
            <span>보낸 쪽지 ({sentMessages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'compose'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>새 쪽지 쓰기</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Tab 1: Inbox */}
      {activeTab === 'inbox' && (
        <div className="space-y-3">
          {inboxMessages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-xs text-slate-400">
              <Mail className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              도착한 새 쪽지가 없습니다.
            </div>
          ) : (
            inboxMessages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3 transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs">
                      {msg.fromName ? msg.fromName.charAt(0) : 'S'}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{msg.fromName}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {msg.fromRole}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {msg.createdAt ? formatKSTDateTime(msg.createdAt) : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleReplyTo(msg)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>답장</span>
                    </button>
                    {(currentUser?.role === 'admin' || currentUser?.studentId === msg.fromId) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(msg.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 transition cursor-pointer"
                        title="쪽지 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>

                {/* Attached Image Thumbnail */}
                {(msg.imageUrl || (msg.images && msg.images.length > 0)) && (
                  <div className="pt-2">
                    <div
                      className="relative inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer group shadow-xs max-w-xs sm:max-w-sm"
                      onClick={() => setLightboxSrc(msg.imageUrl || msg.images![0])}
                    >
                      <img
                        src={msg.imageUrl || msg.images![0]}
                        alt="쪽지 첨부 이미지"
                        referrerPolicy="no-referrer"
                        className="max-h-52 w-auto object-cover rounded-xl group-hover:opacity-90 transition"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1.5 font-bold text-xs backdrop-blur-[1px]">
                        <ZoomIn className="w-4 h-4" />
                        <span>크게 보기</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Sent */}
      {activeTab === 'sent' && (
        <div className="space-y-3">
          {sentMessages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-xs text-slate-400">
              <SendHorizontal className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              보낸 쪽지 내역이 없습니다.
            </div>
          ) : (
            sentMessages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      수신: {msg.toClass === 'all' ? '전체 대상' : msg.toClass === 'teacher' ? '교사 전체' : `${msg.toClass} (${msg.toRole})`}
                    </span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      {msg.createdAt ? formatKSTDateTime(msg.createdAt) : ''}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(msg.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 transition cursor-pointer"
                    title="쪽지 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>

                {/* Attached Image Thumbnail */}
                {(msg.imageUrl || (msg.images && msg.images.length > 0)) && (
                  <div className="pt-2">
                    <div
                      className="relative inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer group shadow-xs max-w-xs sm:max-w-sm"
                      onClick={() => setLightboxSrc(msg.imageUrl || msg.images![0])}
                    >
                      <img
                        src={msg.imageUrl || msg.images![0]}
                        alt="보낸 쪽지 첨부 이미지"
                        referrerPolicy="no-referrer"
                        className="max-h-52 w-auto object-cover rounded-xl group-hover:opacity-90 transition"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1.5 font-bold text-xs backdrop-blur-[1px]">
                        <ZoomIn className="w-4 h-4" />
                        <span>크게 보기</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Compose */}
      {activeTab === 'compose' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-red-600" />
            새 쪽지 발송
          </h3>

          <form onSubmit={handleSend} className="space-y-4 text-xs">
            {/* Target Category */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                수신 대상 선택
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'class', label: '특정 학급 (반장/담임)' },
                  { key: 'teachers', label: '교사 (선생님) 전체' },
                  { key: 'referees', label: '심판 / 기록원 전체' },
                  { key: 'council', label: '학생회 / 체육부' },
                  { key: 'all', label: '전체 공지 (공통)' }
                ].map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTargetType(t.key)}
                    className={`p-2.5 rounded-xl font-bold transition cursor-pointer text-center ${
                      targetType === t.key
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Class Details if 'class' */}
            {targetType === 'class' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    수신 학년
                  </label>
                  <select
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                  >
                    <option value="1">1학년</option>
                    <option value="2">2학년</option>
                    <option value="3">3학년</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    수신 학급 (1~12반)
                  </label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(c => (
                      <option key={c} value={c}>{c}반</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    수신자 직책
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                  >
                    <option value="class_president">학급 반장</option>
                    <option value="teacher">담임 선생님</option>
                    <option value="student">학급 전체 학우</option>
                  </select>
                </div>
              </div>
            )}

            {/* Message Content */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                쪽지 내용
              </label>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="전달할 긴급 일정, 엔트리 제출 확인, 조율 사항 등을 자유롭게 작성하세요."
                rows={5}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-hidden focus:border-red-500"
                required
              />
            </div>

            {/* Photo Attachment Section */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-red-600" />
                  사진 첨부 (선택)
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  대진표 수정 요청, 경기 현장 증빙 사진 등
                </span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                id="message-file-upload"
              />

              {!attachedImage ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  {isCompressing ? (
                    <div className="flex flex-col items-center py-2 text-red-600">
                      <Loader2 className="w-7 h-7 animate-spin mb-1" />
                      <span className="text-xs font-semibold">이미지 최적화 처리 중...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xs">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          클릭하여 사진 첨부 또는 파일 끌어다 놓기
                        </p>
                        <p className="text-[11px] text-slate-400">
                          JPG, PNG, GIF, WebP (최대 10MB, 자동 최적화)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
                  <div
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 cursor-pointer group"
                    onClick={() => setLightboxSrc(attachedImage)}
                  >
                    <img
                      src={attachedImage}
                      alt="첨부된 사진 미리보기"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:opacity-90 transition"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <ZoomIn className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-1 text-center sm:text-left">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      사진 첨부 완료
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      쪽지와 함께 고화질로 압축되어 안전하게 전송됩니다.
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      >
                        사진 변경
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachedImage(null)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition cursor-pointer"
                      >
                        사진 삭제
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSending || isCompressing}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? '발송 중...' : '쪽지 발송'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Image Lightbox Modal */}
      <ImageLightboxModal
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
};
