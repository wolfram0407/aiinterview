"use client";

import AudioRecorder from "@/components/audio/AudioRecorder";
import WaveformCanvas from "@/components/audio/WaveformCanvas";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type TestStatus = "idle" | "recording" | "processing" | "success" | "error";

export default function MicTestPage() {
  const router = useRouter();
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [transcribedText, setTranscribedText] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const audioRecorder = AudioRecorder({
    onRecordingComplete: async (audioBlob, duration) => {
      setTestStatus("processing");
      setTranscribedText("");

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        const response = await fetch("/api/whisper", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          setTranscribedText(result.text);
          setTestStatus("success");
        } else {
          setErrorMessage(result.error || "음성 인식에 실패했습니다.");
          setTestStatus("error");
        }
      } catch (error) {
        console.error("음성 인식 오류:", error);
        setErrorMessage("음성 인식 중 오류가 발생했습니다.");
        setTestStatus("error");
      }
    },
    onError: (error) => {
      setErrorMessage(error);
      setTestStatus("error");
    },
  });

  const handleStartTest = async () => {
    setTestStatus("recording");
    setErrorMessage("");
    setTranscribedText("");
    await audioRecorder.startRecording();
  };

  const handleRetry = () => {
    audioRecorder.resetRecording();
    setTestStatus("idle");
    setErrorMessage("");
    setTranscribedText("");
  };

  const handleNext = () => {
    router.push("/pre-check");
  };

  // 녹음 시간 업데이트
  useEffect(() => {
    if (audioRecorder.isRecording) {
      setRecordingTime(audioRecorder.recordingTime);
    }
  }, [audioRecorder.isRecording, audioRecorder.recordingTime]);

  // 마이크 권한 상태 업데이트
  useEffect(() => {
    setHasPermission(audioRecorder.hasPermission);
  }, [audioRecorder.hasPermission]);

  const getStatusIcon = () => {
    switch (testStatus) {
      case "recording":
        return (
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </div>
        );
      case "processing":
        return (
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-yellow-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        );
      case "success":
        return (
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
        );
    }
  };

  const getStatusMessage = () => {
    switch (testStatus) {
      case "recording":
        if (audioRecorder.canStop) {
          return `녹음 중... ${recordingTime.toFixed(1)}초 (아래 버튼으로 종료 가능)`;
        } else {
          return `녹음 중... ${recordingTime.toFixed(1)}초 (5초 후 종료 가능)`;
        }
      case "processing":
        return "음성을 텍스트로 변환 중...";
      case "success":
        return "음성 인식이 성공적으로 완료되었습니다!";
      case "error":
        return "음성 인식에 실패했습니다.";
      default:
        return "마이크 권한을 허용하고 음성 인식이 정상적으로 작동하는지 테스트합니다.";
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6">
      {/* 헤더 */}
      <div className="text-center pt-16 pb-8">
        <h1 className="text-2xl font-bold text-black mb-2">음성 테스트</h1>
        <p className="text-base text-black">마이크와 음성 인식을 테스트합니다</p>
      </div>

      {/* 상태 아이콘 */}
      {getStatusIcon()}

      {/* 상태 메시지 */}
      <div className="text-center mb-8">
        <p className="text-lg text-gray-700 mb-4">{getStatusMessage()}</p>

        {hasPermission === false && (
          <p className="text-sm text-red-600 mb-4">마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.</p>
        )}
      </div>

      {/* 웨이브폼 */}
      <div className="mb-8">
        <WaveformCanvas isRecording={audioRecorder.isRecording} audioStream={audioRecorder.audioStream} />

        {/* 녹음 안내 */}
        {testStatus === "recording" && (
          <div className="mt-4 text-center">
            {audioRecorder.canStop ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm font-medium">✅ 최소 녹음 시간 완료! 언제든지 종료할 수 있습니다</p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-700 text-sm">💡 5초 후에 녹음을 종료할 수 있습니다</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 변환된 텍스트 */}
      {transcribedText && (
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">인식된 텍스트:</h3>
          <p className="text-gray-800">{transcribedText}</p>
        </div>
      )}

      {/* 오류 메시지 */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* 버튼들 */}
      <div className="flex-1 flex flex-col justify-end pb-8 space-y-4">
        {testStatus === "idle" && (
          <button
            onClick={handleStartTest}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium text-lg rounded-lg transition-colors"
          >
            음성 테스트 시작
          </button>
        )}

        {testStatus === "recording" && audioRecorder.canStop && (
          <button
            onClick={() => audioRecorder.stopRecording()}
            className="w-full py-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-medium text-lg rounded-lg transition-colors animate-pulse"
          >
            🎤 녹음 종료하기
          </button>
        )}

        {testStatus === "error" && (
          <button
            onClick={handleRetry}
            className="w-full py-4 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-medium text-lg rounded-lg transition-colors"
          >
            다시 시도
          </button>
        )}

        {testStatus === "success" && (
          <button
            onClick={handleNext}
            className="w-full py-4 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-medium text-lg rounded-lg transition-colors"
          >
            다음 단계로
          </button>
        )}

        {testStatus === "success" && (
          <button
            onClick={handleRetry}
            className="w-full py-4 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 font-medium text-lg rounded-lg transition-colors"
          >
            다시 테스트
          </button>
        )}
      </div>
    </div>
  );
}
