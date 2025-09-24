"use client";

import { NumericKeypad } from "@/components";
import { RegistrationCompleteModal } from "@/components/modal";
import { sendPhoneRegistration } from "@/lib/webhook";
import { useState } from "react";

interface PhoneInputProps {
  onConfirm: (phoneNumber: string) => void;
}

export default function PhoneInput({ onConfirm }: PhoneInputProps) {
  const [inputNumbers, setInputNumbers] = useState(""); // 010 제외한 8자리 숫자만 저장
  const [isValid, setIsValid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [registeredPhoneNumber, setRegisteredPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatDisplayText = (numbers: string) => {
    if (numbers.length === 0) {
      return "010-xxxx-xxxx";
    } else if (numbers.length <= 4) {
      return `010-${numbers}${"x".repeat(4 - numbers.length)}-xxxx`;
    } else {
      return `010-${numbers.slice(0, 4)}-${numbers.slice(4, 8)}${"x".repeat(4 - (numbers.length - 4))}`;
    }
  };

  const getDisplayText = () => {
    return formatDisplayText(inputNumbers);
  };

  const handleNumberClick = (number: string) => {
    if (inputNumbers.length < 8) {
      const newNumbers = inputNumbers + number;
      setInputNumbers(newNumbers);

      // 8자리 모두 입력되었을 때 유효성 검사
      setIsValid(newNumbers.length === 8);
    }
  };

  const handleBackspace = () => {
    if (inputNumbers.length > 0) {
      const newNumbers = inputNumbers.slice(0, -1);
      setInputNumbers(newNumbers);
      setIsValid(false);
    }
  };

  const handleConfirm = async () => {
    if (isValid && !isLoading) {
      setIsLoading(true);
      const fullPhoneNumber = `010-${inputNumbers.slice(0, 4)}-${inputNumbers.slice(4, 8)}`;

      try {
        // 웹훅으로 전화번호 등록 데이터 전송
        const response = await sendPhoneRegistration(fullPhoneNumber);

        if (response.success) {
          setRegisteredPhoneNumber(fullPhoneNumber);
          setShowModal(true);
        } else {
          alert(response.message || "등록 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
      } catch (error) {
        console.error("전화번호 등록 실패:", error);
        alert("등록 중 오류가 발생했습니다. 다시 시도해주세요.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNextStep = () => {
    setShowModal(false);
    onConfirm(registeredPhoneNumber);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <div className="text-center pt-16 pb-8 px-6">
        <h1 className="text-2xl font-bold text-black mb-2">AI 면접 프로그램</h1>
        <p className="text-base text-black">입력 후 확인 버튼을 눌러주세요</p>
      </div>

      {/* 입력 필드 */}
      <div className="px-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-4 min-h-[60px] flex items-center">
          <span className={`text-lg ${inputNumbers ? "text-black" : "text-gray-400"}`}>{getDisplayText()}</span>
        </div>
      </div>

      {/* 키패드 */}
      <div className="flex-1 px-6 pb-8">
        <NumericKeypad onNumberClick={handleNumberClick} onBackspace={handleBackspace} />
      </div>

      {/* 확인 버튼 */}
      <div className="px-6 pb-8">
        <button
          onClick={handleConfirm}
          disabled={!isValid || isLoading}
          className={`w-full py-4 rounded-lg text-white font-medium text-lg transition-colors ${
            isValid && !isLoading ? "bg-blue-500 hover:bg-blue-600 active:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              등록 중...
            </div>
          ) : (
            "확인"
          )}
        </button>
      </div>

      {/* 등록 완료 모달 */}
      <RegistrationCompleteModal
        isOpen={showModal}
        onClose={() => {}} // 빈 함수로 처리 (사용되지 않음)
        onNext={handleNextStep}
        phoneNumber={registeredPhoneNumber}
      />
    </div>
  );
}
