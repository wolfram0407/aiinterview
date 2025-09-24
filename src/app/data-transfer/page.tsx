"use client";

export default function DataTransferPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">데이터 전송</h1>
        <p className="text-gray-600 mb-8">면접 데이터를 Make.com으로 전송합니다.</p>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">전송 데이터</h2>
          <ul className="text-left text-gray-600 space-y-2">
            <li>• 연락처 정보</li>
            <li>• 면접 시작/종료 시간</li>
            <li>• 질문-답변 로그 (QA)</li>
            <li>• GPT 요약본</li>
            <li>• 언어 설정 (ko-KR)</li>
          </ul>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-orange-800 mb-2">Webhook 설정</h3>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• Method: POST</li>
            <li>• URL: MAKE_WEBHOOK_URL</li>
            <li>• Timeout: 5초</li>
            <li>• Retry: 2회 (지수 백오프)</li>
          </ul>
        </div>

        <div className="text-sm text-gray-500">
          <p>⚠️ 아직 구현되지 않은 기능입니다.</p>
          <p>PRD Step 6: 데이터 전송 단계</p>
        </div>
      </div>
    </div>
  );
}
