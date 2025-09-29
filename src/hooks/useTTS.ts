import {useCallback, useRef, useState} from 'react';

interface TTSState {
  isPlaying: boolean;
  isGenerating: boolean;
  error: string | null;
}

export const useTTS = () => {
  const [state, setState] = useState<TTSState>({
    isPlaying: false,
    isGenerating: false,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    try {
      setState(prev => ({...prev, isGenerating: true, error: null}));

      // 기존 오디오 정지
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // TTS API 호출
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({text}),
      });

      if (!response.ok) {
        throw new Error('TTS 생성에 실패했습니다.');
      }

      // 오디오 데이터를 Blob으로 변환
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // 오디오 엘리먼트 생성 및 재생
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      setState(prev => ({...prev, isGenerating: false, isPlaying: true}));

      // 재생 완료 시 상태 업데이트
      audio.onended = () => {
        setState(prev => ({...prev, isPlaying: false}));
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      // 오류 발생 시 상태 업데이트
      audio.onerror = () => {
        setState(prev => ({
          ...prev,
          isPlaying: false,
          error: '오디오 재생에 실패했습니다.'
        }));
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();

    } catch (error: unknown) {
      console.error('TTS 오류:', error);
      const errorMessage = error instanceof Error ? error.message : 'TTS 생성에 실패했습니다.';
      setState(prev => ({
        ...prev,
        isGenerating: false,
        isPlaying: false,
        error: errorMessage
      }));
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setState(prev => ({...prev, isPlaying: false}));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({...prev, error: null}));
  }, []);

  return {
    ...state,
    speak,
    stop,
    clearError,
  };
};
