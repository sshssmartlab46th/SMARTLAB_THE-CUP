import { useState, useEffect, useRef, useCallback } from 'react';
import { isSpeechRecognitionSupported, createSpeechRecognition } from '../services/sttService';

export interface UseSpeechToTextOptions {
  autoDispatchIntervalMs?: number; // Default 10,000ms (10 seconds)
  onAutoDispatch?: (transcript: string) => void;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { autoDispatchIntervalMs = 10000, onAutoDispatch } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [autoDispatchEnabled, setAutoDispatchEnabled] = useState(true);
  const [secondsUntilNextDispatch, setSecondsUntilNextDispatch] = useState(10);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const transcriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const onAutoDispatchRef = useRef(onAutoDispatch);
  const autoDispatchTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);

  onAutoDispatchRef.current = onAutoDispatch;
  transcriptRef.current = transcript;
  interimTranscriptRef.current = interimTranscript;
  isListeningRef.current = isListening;

  const isSupported = isSpeechRecognitionSupported();

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('이 브라우저는 음성 인식(STT)을 지원하지 않습니다.');
      return;
    }

    setError(null);

    if (recognitionRef.current) {
      stopListening();
    }

    const recognition = createSpeechRecognition({
      language: 'ko-KR',
      continuous: true,
      interimResults: true,
      onResult: (text, isFinal) => {
        if (isFinal) {
          setTranscript((prev) => (prev ? `${prev} ${text}` : text));
          setInterimTranscript('');
        } else {
          setInterimTranscript(text);
        }
      },
      onError: (err: any) => {
        console.warn('STT Speech Recognition Error:', err);
        if (err.error === 'not-allowed') {
          setError('마이크 접근 권한이 거부되었습니다. 마이크 권한을 허용해 주세요.');
          stopListening();
        } else if (err.error !== 'no-speech') {
          setError(`음성 인식 오류: ${err.error || '알 수 없는 오류'}`);
        }
      },
      onEnd: () => {
        // Auto restart if still supposed to be listening
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        }
      }
    });

    if (recognition) {
      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
      } catch (e: any) {
        setError('음성 인식을 시작할 수 없습니다.');
        setIsListening(false);
      }
    }
  }, [isSupported, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // 10-second auto-dispatch interval
  useEffect(() => {
    if (!isListening || !autoDispatchEnabled) {
      if (autoDispatchTimerRef.current) clearInterval(autoDispatchTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setSecondsUntilNextDispatch(10);
      return;
    }

    setSecondsUntilNextDispatch(Math.floor(autoDispatchIntervalMs / 1000));

    // Countdown tick (1s)
    countdownTimerRef.current = setInterval(() => {
      setSecondsUntilNextDispatch((prev) => {
        if (prev <= 1) return Math.floor(autoDispatchIntervalMs / 1000);
        return prev - 1;
      });
    }, 1000);

    // Auto-dispatch timer
    autoDispatchTimerRef.current = setInterval(() => {
      const currentFullText = `${transcriptRef.current} ${interimTranscriptRef.current}`.trim();
      if (currentFullText && onAutoDispatchRef.current) {
        onAutoDispatchRef.current(currentFullText);
        setTranscript('');
        setInterimTranscript('');
      }
    }, autoDispatchIntervalMs);

    return () => {
      if (autoDispatchTimerRef.current) clearInterval(autoDispatchTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isListening, autoDispatchEnabled, autoDispatchIntervalMs]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    fullTranscript: `${transcript} ${interimTranscript}`.trim(),
    error,
    autoDispatchEnabled,
    secondsUntilNextDispatch,
    setAutoDispatchEnabled,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript
  };
}
