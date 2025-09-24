"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  icon: string;
};

export default function PreCheckPage() {
  const router = useRouter();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: "noise",
      label: "주변 소음 확인",
      description: "조용한 환경에서 면접을 진행할 수 있는지 확인해주세요",
      checked: false,
      icon: "🔇",
    },
    {
      id: "microphone",
      label: "마이크 상태",
      description: "마이크가 정상적으로 작동하는지 확인해주세요",
      checked: false,
      icon: "🎤",
    },
    {
      id: "internet",
      label: "인터넷 상태",
      description: "안정적인 인터넷 연결 상태인지 확인해주세요",
      checked: false,
      icon: "🌐",
    },
    {
      id: "mindset",
      label: "마음가짐 확인",
      description: "면접에 집중할 준비가 되었는지 확인해주세요",
      checked: false,
      icon: "💪",
    },
  ]);

  const [allChecked, setAllChecked] = useState(false);

  // 모든 항목이 체크되었는지 확인
  useEffect(() => {
    const checked = checklist.every((item) => item.checked);
    setAllChecked(checked);
  }, [checklist]);

  const toggleCheck = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const handleNext = () => {
    if (allChecked) {
      router.push("/interview");
    }
  };

  const getProgressPercentage = () => {
    const checkedCount = checklist.filter((item) => item.checked).length;
    return (checkedCount / checklist.length) * 100;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6">
      {/* 헤더 */}
      <div className="text-center pt-16 pb-8">
        <h1 className="text-2xl font-bold text-black mb-2">준비 체크리스트</h1>
        <p className="text-base text-black">면접을 시작하기 전에 환경을 점검해보세요</p>
      </div>

      {/* 진행률 표시 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">진행률</span>
          <span className="text-sm font-medium text-gray-700">
            {checklist.filter((item) => item.checked).length}/{checklist.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* 체크리스트 */}
      <div className="flex-1">
        <div className="space-y-4">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`bg-white border-2 rounded-lg p-4 transition-all duration-200 ${
                item.checked ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start space-x-4 cursor-pointer" onClick={() => toggleCheck(item.id)}>
                {/* 체크박스 */}
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      item.checked ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {item.checked && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* 아이콘 */}
                <div className="flex-shrink-0 text-2xl">{item.icon}</div>

                {/* 내용 */}
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg mb-1 transition-colors ${item.checked ? "text-green-800" : "text-gray-800"}`}>
                    {item.label}
                  </h3>
                  <p className={`text-sm transition-colors ${item.checked ? "text-green-600" : "text-gray-600"}`}>{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 완료 안내 */}
      {allChecked && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-700 font-medium">모든 준비가 완료되었습니다!</p>
          </div>
          <p className="text-green-600 text-sm mt-1">이제 면접을 시작할 수 있습니다.</p>
        </div>
      )}

      {/* 버튼들 */}
      <div className="pb-8 space-y-4">
        <button
          onClick={handleNext}
          disabled={!allChecked}
          className={`w-full py-4 font-medium text-lg rounded-lg transition-all duration-200 ${
            allChecked
              ? "bg-green-500 hover:bg-green-600 active:bg-green-700 text-white shadow-lg"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {allChecked ? "면접 시작하기" : "모든 항목을 체크해주세요"}
        </button>

        <button
          onClick={() => router.back()}
          className="w-full py-4 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 font-medium text-lg rounded-lg transition-colors"
        >
          이전 단계로
        </button>
      </div>
    </div>
  );
}
