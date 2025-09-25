"use client";

import AudioRecorder from "@/components/audio/AudioRecorder";
import WaveformCanvas from "@/components/audio/WaveformCanvas";
import { useTTS } from "@/hooks/useTTS";
import { addQA, generateSummary, getInterviewData, updateInterviewData, type InterviewData, type QA } from "@/lib/interview-storage";
import { useCallback, useEffect, useRef, useState } from "react";

// 면접 상태 타입 정의
type InterviewState = "initializing" | "question" | "waiting" | "recording" | "processing" | "completed";

export default function InterviewManager() {
  const [interviewState, setInterviewState] = useState<InterviewState>("initializing");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [answerLog, setAnswerLog] = useState<QA[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  
  // 중복 실행 방지를 위한 ref
  const isInitializingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // TTS 훅 사용
  const { isPlaying: isTTSPlaying, isGenerating: isTTSGenerating, speak, stop: stopTTS } = useTTS();

  // 다음 질문 가져오기 (먼저 정의)
  const getNextQuestion = useCallback(
    async (currentThreadId: string) => {
      // 이미 질문이 있거나 처리 중인 경우 중복 실행 방지
      if (currentQuestion || isProcessing) {
        console.log("질문 요청 중복 실행 방지:", { currentQuestion: !!currentQuestion, isProcessing });
        return;
      }

      try {
        console.log("다음 질문 요청 시작, threadId:", currentThreadId);
        setInterviewState("question");

        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "send_message",
            threadId: currentThreadId,
            message: "면접을 시작해주세요. 첫 번째 질문을 해주세요.",
          }),
        });

        console.log("API 응답 상태:", response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API 오류 응답:", errorText);
          throw new Error(`질문을 가져올 수 없습니다. (${response.status})`);
        }

        const result = await response.json();
        setCurrentQuestion(result.response);

        // 질문을 TTS로 읽어주기
        await speak(result.response);

        // TTS 재생 완료 후 대기 상태로 전환 (TTS 재생 시간을 고려하여 더 긴 시간 설정)
        setTimeout(() => {
          setInterviewState("waiting");
        }, 5000);
      } catch (error) {
        console.error("질문 가져오기 오류:", error);
        setInterviewState("completed");
      }
    },
    [speak, currentQuestion, isProcessing]
  );

  // GPT Assistant 스레드 초기화
  const initializeAssistant = useCallback(async () => {
    // 이미 초기화 중이거나 완료된 경우 중복 실행 방지
    if (isInitializingRef.current || hasInitializedRef.current || threadId) {
      console.log("Assistant 초기화 중복 실행 방지:", { 
        isInitializing: isInitializingRef.current, 
        hasInitialized: hasInitializedRef.current, 
        threadId 
      });
      return;
    }

    isInitializingRef.current = true;
    hasInitializedRef.current = true;

    try {
      console.log("Assistant 초기화 시작");
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_thread",
        }),
      });

      if (!response.ok) {
        throw new Error("Assistant 초기화에 실패했습니다.");
      }

      const result = await response.json();

      if (!result.threadId) {
        throw new Error("Thread ID를 받지 못했습니다.");
      }

      setThreadId(result.threadId);
      console.log("Thread ID 설정됨:", result.threadId);

      // 첫 번째 질문 요청
      await getNextQuestion(result.threadId);
    } catch (error) {
      console.error("Assistant 초기화 오류:", error);
      setInterviewState("completed");
    }
  }, [interviewState, threadId, getNextQuestion]);

  // AudioRecorder 훅을 위한 임시 변수들 (나중에 실제 값으로 교체됨)
  let isRecording = false;
  let audioProcessing = false;
  let recordingTime = 0;
  let hasPermission: boolean | null = null;
  let canStop = false;
  let audioStream: MediaStream | null = null;
  let startRecording = () => {};
  let stopRecording = () => {};
  let resetRecording = () => {};
  let cleanup = () => {};

  // 답변 처리 및 다음 질문 요청
  const processAnswer = useCallback(
    async (answerText: string, duration: number) => {
      if (!threadId) return;

      try {
        setIsProcessing(true);
        setInterviewState("processing");

        // QA 데이터 추가
        const newQA: QA = {
          q: currentQuestion,
          aText: answerText,
          durationSec: duration,
        };

        setAnswerLog((prev) => [...prev, newQA]);
        addQA(newQA);

        // Assistant에게 답변 전달 및 다음 질문 요청
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "send_message",
            threadId: threadId,
            message: `답변: ${answerText}. 다음 질문을 해주세요.`,
          }),
        });

        if (!response.ok) {
          throw new Error("다음 질문을 가져올 수 없습니다.");
        }

        const result = await response.json();

        // 면접 종료 조건 확인 (예: "면접이 종료되었습니다" 같은 메시지)
        if (result.response.includes("종료") || result.response.includes("끝") || result.response.includes("마지막")) {
          setInterviewState("completed");

          // 면접 종료 시 요약 생성 및 데이터 업데이트
          const updatedQa = [...answerLog, newQA];
          const summary = await generateSummary(updatedQa);

          updateInterviewData({
            endedAt: new Date().toISOString(),
            summary,
          });
        } else {
          setCurrentQuestion(result.response);
          setInterviewState("question");

          // 질문을 TTS로 읽어주기
          await speak(result.response);

          // TTS 재생 완료 후 대기 상태로 전환 (TTS 재생 시간을 고려하여 더 긴 시간 설정)
          setTimeout(() => {
            setInterviewState("waiting");
          }, 5000);
        }
      } catch (error) {
        console.error("답변 처리 오류:", error);
        setInterviewState("completed");
      } finally {
        setIsProcessing(false);
        // 답변 처리 완료 후 녹음 상태 초기화
        resetRecording();
      }
    },
    [threadId, currentQuestion, resetRecording, speak]
  );

  // 녹음 완료 핸들러
  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob, duration: number) => {
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
          // 답변 처리
          await processAnswer(result.text, duration);
        } else {
          throw new Error(result.error || "음성 인식에 실패했습니다.");
        }
      } catch (error) {
        console.error("음성 인식 오류:", error);
        setInterviewState("waiting");
        // 오류 발생 시에도 녹음 상태 초기화
        resetRecording();
      }
    },
    [processAnswer, resetRecording]
  );

  // 녹음 에러 핸들러
  const handleRecordingError = useCallback(
    (error: string) => {
      console.error("녹음 오류:", error);
      setInterviewState("waiting");
      resetRecording();
    },
    [resetRecording]
  );

  // AudioRecorder 훅에 실제 콜백 함수 설정
  const audioRecorder = AudioRecorder({
    onRecordingComplete: handleRecordingComplete,
    onError: handleRecordingError,
  });

  // AudioRecorder 훅의 반환값을 기존 변수들에 할당
  isRecording = audioRecorder.isRecording;
  audioProcessing = audioRecorder.isProcessing;
  recordingTime = audioRecorder.recordingTime;
  hasPermission = audioRecorder.hasPermission;
  canStop = audioRecorder.canStop;
  audioStream = audioRecorder.audioStream;
  startRecording = audioRecorder.startRecording;
  stopRecording = audioRecorder.stopRecording;
  resetRecording = audioRecorder.resetRecording;
  cleanup = audioRecorder.cleanup;

  // 컴포넌트 마운트 시 기존 데이터 로드 및 Assistant 초기화
  useEffect(() => {
    let isInitialized = false;

    const initialize = async () => {
      if (isInitialized) return;
      isInitialized = true;

      // 기존 면접 데이터 로드
      const existingData = getInterviewData();
      if (existingData) {
        setInterviewData(existingData);
        setAnswerLog(existingData.qa);

        // 연락처가 있으면 Assistant 초기화
        if (existingData.contact) {
          await initializeAssistant();
        } else {
          // 연락처가 없으면 연락처 입력 페이지로 리다이렉트
          window.location.href = "/";
        }
      } else {
        // 면접 데이터가 없으면 연락처 입력 페이지로 리다이렉트
        window.location.href = "/";
      }
    };

    initialize();
  }, []); // 의존성 배열을 비워서 한 번만 실행되도록 함

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

  // 면접 종료 핸들러
  const handleEndInterview = async () => {
    setInterviewState("completed");

    // 면접 종료 시 요약 생성 및 데이터 업데이트
    const summary = await generateSummary(answerLog);

    updateInterviewData({
      endedAt: new Date().toISOString(),
      summary,
    });
  };

  // 녹음 버튼 스타일 결정
  const getRecordButtonStyle = () => {
    switch (interviewState) {
      case "initializing":
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
      case "initializing":
        return "초기화 중...";
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
              <p className="text-xs sm:text-sm text-gray-500">GPT Assistant 기반 실시간 음성 면접</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${hasPermission ? "bg-green-400 animate-pulse" : "bg-red-400"}`}></div>
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
              {hasPermission ? "마이크 연결됨" : "마이크 연결 필요"}
            </span>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex-1 flex flex-col space-y-4 sm:space-y-6">
          {/* 질문 카드 */}
          {currentQuestion && (
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

                  {/* TTS 컨트롤 */}
                  {currentQuestion && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isTTSGenerating && (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-spin"></div>
                            <span className="text-xs text-blue-600">음성 생성 중...</span>
                          </div>
                        )}
                        {isTTSPlaying && (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-600">음성 재생 중...</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => speak(currentQuestion)}
                          disabled={isTTSGenerating || isTTSPlaying}
                          className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-md transition-colors duration-200 flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>다시 듣기</span>
                        </button>
                        {isTTSPlaying && (
                          <button
                            onClick={stopTTS}
                            className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200 flex items-center space-x-1"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>정지</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
              disabled={
                interviewState === "initializing" ||
                interviewState === "question" ||
                interviewState === "processing" ||
                interviewState === "completed"
              }
              className={`px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 ${getRecordButtonStyle()}`}
            >
              {getRecordButtonText()}
            </button>
          </div>

          {/* 면접 진행 상황 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">면접 진행 상황</h3>
              <span className="text-sm text-gray-500">{answerLog.length}개 질문 완료</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((answerLog.length / 5) * 100, 100)}%` }}
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
                      <span className="text-xs text-gray-500">{item.durationSec.toFixed(1)}초</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 font-medium">{item.q}</p>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-sm text-gray-600">{item.aText}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 면접 종료 버튼 */}
        {interviewState !== "completed" && (
          <div className="flex justify-center pt-6">
            <button
              onClick={handleEndInterview}
              className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>면접 종료</span>
            </button>
          </div>
        )}

        {/* 면접 완료 시 데이터 전송 버튼 */}
        {interviewState === "completed" && (
          <div className="flex justify-center pt-6">
            <button
              onClick={() => {
                // 데이터 전송 페이지로 이동
                window.location.href = "/data-transfer";
              }}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>데이터 전송</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
