"use client";

import { useEffect, useRef } from "react";

interface WaveformCanvasProps {
  isRecording: boolean;
  audioStream?: MediaStream | null;
  className?: string;
}

export default function WaveformCanvas({ isRecording, audioStream, className = "" }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기 설정
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // 오디오 컨텍스트 초기화
    const initAudioContext = async () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      }
    };

    // 마이크 스트림 연결
    const connectMicrophone = async () => {
      try {
        await initAudioContext();

        // 기존 소스 정리
        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }

        if (audioStream) {
          const source = audioContextRef.current!.createMediaStreamSource(audioStream);
          source.connect(analyserRef.current!);
          sourceRef.current = source;
        }
      } catch (error) {
        console.error("마이크 연결 실패:", error);
      }
    };

    // 웨이브폼 그리기
    const drawWaveform = () => {
      if (!isRecording || !analyserRef.current || !dataArrayRef.current) {
        // 녹음 중이 아닐 때는 정적 상태 표시
        ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(0, canvas.height / window.devicePixelRatio / 2 - 2, canvas.width / window.devicePixelRatio, 4);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);

      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

      const barWidth = canvas.width / window.devicePixelRatio / dataArrayRef.current.length;
      const centerY = canvas.height / window.devicePixelRatio / 2;

      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const barHeight = (dataArrayRef.current[i] / 255) * (canvas.height / window.devicePixelRatio / 2);

        // 그라데이션 효과
        const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
        gradient.addColorStop(0, "#3b82f6");
        gradient.addColorStop(1, "#1d4ed8");

        ctx.fillStyle = gradient;
        ctx.fillRect(i * barWidth, centerY - barHeight, barWidth - 1, barHeight * 2);
      }

      animationRef.current = requestAnimationFrame(drawWaveform);
    };

    if (isRecording && audioStream) {
      connectMicrophone();
      drawWaveform();
    } else {
      drawWaveform();
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
    };
  }, [isRecording, audioStream]);

  return <canvas ref={canvasRef} className={`w-full h-20 ${className}`} style={{ background: "transparent" }} />;
}
