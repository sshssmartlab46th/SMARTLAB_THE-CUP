import { LiveCommentaryItem, UserProfile } from '../types';

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

export function createSpeechRecognition(options: SpeechRecognitionOptions = {}) {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognitionClass();
  recognition.lang = options.language || 'ko-KR';
  recognition.continuous = options.continuous ?? true;
  recognition.interimResults = options.interimResults ?? true;

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    const currentText = finalTranscript || interimTranscript;
    const isFinal = Boolean(finalTranscript);
    options.onResult?.(currentText, isFinal);
  };

  recognition.onerror = (event: any) => {
    options.onError?.(event);
  };

  recognition.onend = () => {
    options.onEnd?.();
  };

  return recognition;
}

export function createLiveCommentaryPayload(
  matchId: string,
  text: string,
  commentatorName: string,
  user: UserProfile,
  isSttGenerated: boolean = true
): Omit<LiveCommentaryItem, 'id'> {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  return {
    matchId,
    authorId: user.studentId || user.uid,
    authorName: user.name,
    authorRole: user.role,
    commentatorName: commentatorName || `${user.name} 해설위원`,
    text: text.trim(),
    isSttGenerated,
    timestamp: timeStr,
    createdAt: now.toISOString()
  };
}
