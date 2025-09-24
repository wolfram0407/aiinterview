"use client";

import AudioRecorder from "@/components/audio/AudioRecorder";
import WaveformCanvas from "@/components/audio/WaveformCanvas";
import { useEffect, useState } from "react";

// 면접 상태 타입 정의
type InterviewState = "question" | "waiting" | "recording" | "processing" | "completed";

export default function InterviewPage() {
  // 면접 질문 배열
  const questions = [
    "자기소개를 해주세요.",
    "왜 이 회사에 지원하게 되었나요?",
    "가장 어려웠던 프로젝트 경험을 말씀해주세요.",
    "5년 후 자신의 모습을 어떻게 그리고 계신가요?",
    "마지막으로 하고 싶은 말씀이 있으신가요?",
  ];

  const [interviewState, setInterviewState] = useState<InterviewState>("question");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(questions[0]);
  const [answerLog, setAnswerLog] = useState<Array<{ question: string; answer: string; timestamp: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 녹음 완료 핸들러
  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setInterviewState("processing");

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      // Whisper API 호출
      const response = await fetch("/api/whisper", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("음성 인식에 실패했습니다.");
      }

      const result = await response.json();

      if (result.success) {
        // 답변 로그에 실제 인식된 텍스트 추가
        const newAnswer = {
          question: currentQuestion,
          answer: result.text,
          timestamp: new Date().toLocaleTimeString(),
        };

        setAnswerLog((prev) => {
          const updated = [...prev, newAnswer];
          console.log("실제 음성 인식 결과:", result.text);
          return updated;
        });
      } else {
        throw new Error(result.error || "음성 인식에 실패했습니다.");
      }
    } catch (error) {
      console.error("음성 인식 오류:", error);
      // 에러 발생 시 기본 메시지로 대체
      const newAnswer = {
        question: currentQuestion,
        answer: "음성 인식에 실패했습니다. 다시 시도해주세요.",
        timestamp: new Date().toLocaleTimeString(),
      };

      setAnswerLog((prev) => [...prev, newAnswer]);
    } finally {
      setIsProcessing(false);

      // 녹음 상태 완전히 리셋
      resetRecording();

      // 다음 질문으로 이동
      setTimeout(() => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
          setCurrentQuestionIndex(nextIndex);
          setCurrentQuestion(questions[nextIndex]);
          setInterviewState("question");
        } else {
          // 모든 질문 완료
          setInterviewState("completed");
        }
      }, 2000);
    }
  };

  // 녹음 에러 핸들러
  const handleRecordingError = (error: string) => {
    console.error("녹음 오류:", error);
    setInterviewState("waiting");
    resetRecording();
    // 에러 메시지를 사용자에게 표시할 수 있음
  };

  // AudioRecorder 훅 사용
  const {
    isRecording,
    isProcessing: audioProcessing,
    recordingTime,
    hasPermission,
    canStop,
    audioStream,
    startRecording,
    stopRecording,
    resetRecording,
    cleanup,
  } = AudioRecorder({
    onRecordingComplete: handleRecordingComplete,
    onError: handleRecordingError,
  });

  // 질문 상태에서 대기 상태로 자동 전환 (3초 후)
  useEffect(() => {
    if (interviewState === "question") {
      // 새 질문 시작 시 녹음 상태 완전히 리셋
      resetRecording();

      const timer = setTimeout(() => {
        setInterviewState("waiting");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [interviewState, resetRecording]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // 녹음 버튼 클릭 핸들러
  const handleRecordClick = () => {
    if (interviewState === "waiting") {
      startRecording();
      setInterviewState("recording");
    } else if (interviewState === "recording") {
      stopRecording();
    }
  };

  // 녹음 버튼 스타일 결정
  const getRecordButtonStyle = () => {
    switch (interviewState) {
      case "question":
        return "bg-gray-300 text-gray-500 cursor-not-allowed";
      case "waiting":
        return "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer";
      case "recording":
        return "bg-red-500 animate-pulse text-white cursor-pointer";
      case "processing":
        return "bg-yellow-500 text-white cursor-not-allowed";
      case "completed":
        return "bg-green-500 text-white cursor-not-allowed";
      default:
        return "bg-gray-300 text-gray-500 cursor-not-allowed";
    }
  };

  // 녹음 버튼 텍스트 결정
  const getRecordButtonText = () => {
    switch (interviewState) {
      case "question":
        return "질문 중...";
      case "waiting":
        return "녹음 시작";
      case "recording":
        return "녹음 중지";
      case "processing":
        return "처리 중...";
      case "completed":
        return "면접 완료";
      default:
        return "대기 중";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">AI 면접 진행</h1>
              <p className="text-xs sm:text-sm text-gray-500">실시간 음성 면접</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">마이크 연결됨</span>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex-1 flex flex-col space-y-4 sm:space-y-6">
          {/* 질문 카드 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-blue-600">Q</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">질문</h2>
                  <div className="flex items-center space-x-2">
                    {interviewState === "question" && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-600">질문 중...</span>
                      </div>
                    )}
                    {interviewState === "waiting" && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">답변 준비</span>
                      </div>
                    )}
                    {interviewState === "recording" && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-red-600">녹음 중</span>
                      </div>
                    )}
                    {interviewState === "processing" && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-spin"></div>
                        <span className="text-xs text-yellow-600">처리 중</span>
                      </div>
                    )}
                    {interviewState === "completed" && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">면접 완료</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{currentQuestion}</p>
              </div>
            </div>
          </div>

          {/* 웨이브폼 영역 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">음성 파형</h3>
              <div
                className={`rounded-lg p-4 transition-colors duration-200 ${
                  interviewState === "recording"
                    ? "bg-red-50 border-2 border-red-200"
                    : interviewState === "waiting"
                    ? "bg-blue-50 border-2 border-blue-200"
                    : interviewState === "completed"
                    ? "bg-green-50 border-2 border-green-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <WaveformCanvas isRecording={isRecording} audioStream={audioStream} className="h-20" />
              </div>
              <p
                className={`text-sm mt-2 transition-colors duration-200 ${
                  interviewState === "recording"
                    ? "text-red-600"
                    : interviewState === "waiting"
                    ? "text-blue-600"
                    : interviewState === "completed"
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {interviewState === "recording"
                  ? `🎤 음성을 감지하고 있습니다... (${recordingTime.toFixed(1)}초)`
                  : interviewState === "waiting"
                  ? "🎯 녹음 버튼을 눌러 답변을 시작하세요"
                  : interviewState === "question"
                  ? "⏳ 질문을 준비하고 있습니다..."
                  : interviewState === "completed"
                  ? "✅ 모든 면접이 완료되었습니다"
                  : "📊 음성 파형이 여기에 표시됩니다"}
              </p>
            </div>
          </div>

          {/* 녹음 버튼 */}
          <div className="flex justify-center">
            <button
              onClick={handleRecordClick}
              disabled={interviewState === "question" || interviewState === "processing" || interviewState === "completed"}
              className={`px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 ${getRecordButtonStyle()}`}
            >
              {getRecordButtonText()}
            </button>
          </div>

          {/* 면접 진행 상황 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">면접 진행 상황</h3>
              <span className="text-sm text-gray-500">
                {currentQuestionIndex + 1}/{questions.length} 질문
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>시작</span>
              <span>진행 중</span>
              <span>완료</span>
            </div>
          </div>

          {/* 답변 로그 */}
          {answerLog.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">답변 기록 ({answerLog.length}개)</h3>
              <div className="space-y-4">
                {answerLog.map((item, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Q{index + 1}</span>
                      <span className="text-xs text-gray-500">{item.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 font-medium">{item.question}</p>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-sm text-gray-600">{item.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 면접 종료 버튼 */}
        <div className="flex justify-center pt-6">
          <button className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>면접 종료</span>
          </button>
        </div>
      </main>
    </div>
  );
}
