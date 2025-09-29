"use client";

import { useCallback, useRef, useState } from "react";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onError: (error: string) => void;
}

export default function AudioRecorder({ onRecordingComplete, onError }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [canStop, setCanStop] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startTimer = useCallback(() => {
    setRecordingTime(0);
    setCanStop(false);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        const newTime = prev + 0.1;
        // 5초에 도달하면 중단 버튼 활성화
        if (newTime >= 5 && !canStop) {
          setCanStop(true);
        }
        return newTime;
      });
    }, 100);
  }, [canStop]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      setHasPermission(true);
      streamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("마이크 권한 요청 실패:", error);
      setHasPermission(false);
      onError("마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.");
      return null;
    }
  }, [onError]);

  const startRecording = useCallback(async () => {
    if (isRecording || isProcessing) return;

    try {
      let stream = streamRef.current;

      if (!stream) {
        stream = await requestMicrophonePermission();
        if (!stream) return;
      }

      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        onRecordingComplete(audioBlob, recordingTime);
        setIsProcessing(true);
      };

      mediaRecorder.start(100); // 100ms 간격으로 데이터 수집
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.error("녹음 시작 실패:", error);
      onError("녹음을 시작할 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.");
    }
  }, [isRecording, isProcessing, requestMicrophonePermission, onRecordingComplete, startTimer, onError, recordingTime]);

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;

    try {
      // MediaRecorder 상태 확인
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      stopTimer();
    } catch (error) {
      console.error("녹음 중지 실패:", error);
      setIsRecording(false);
      stopTimer();
    }

    // 스트림은 resetRecording에서 정리
  }, [isRecording, stopTimer]);

  const resetRecording = useCallback(() => {
    setIsRecording(false);
    setIsProcessing(false);
    setRecordingTime(0);
    setCanStop(false);
    stopTimer();
    audioChunksRef.current = [];

    // MediaRecorder 정리
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.error("MediaRecorder 정리 중 오류:", error);
      }
      mediaRecorderRef.current = null;
    }
  }, [stopTimer]);

  // 컴포넌트 언마운트 시 정리
  const cleanup = useCallback(() => {
    stopTimer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [stopTimer]);

  return {
    isRecording,
    isProcessing,
    recordingTime,
    hasPermission,
    canStop,
    audioStream: streamRef.current,
    startRecording,
    stopRecording,
    resetRecording,
    cleanup,
  };
}
