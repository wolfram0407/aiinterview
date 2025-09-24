"use client";

export default function CompletePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">면접이 종료되었습니다</h1>
        <p className="text-gray-600 mb-8">
          AI 면접이 성공적으로 완료되었습니다.
          <br />
          결과는 등록하신 연락처로 전달됩니다.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">완료된 작업</h2>
          <ul className="text-left text-gray-600 space-y-2">
            <li>✅ 전화번호 등록</li>
            <li>✅ 음성 테스트</li>
            <li>✅ 준비 체크리스트</li>
            <li>✅ AI 면접 진행</li>
            <li>✅ 데이터 전송</li>
          </ul>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-green-800 mb-2">다음 단계</h3>
          <p className="text-sm text-green-700">
            면접 결과와 요약본이 Make.com을 통해
            <br />
            자동으로 처리됩니다.
          </p>
        </div>
        
        <button className="w-full py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          닫기
        </button>
        
        <div className="text-sm text-gray-500 mt-6">
          <p>⚠️ 아직 구현되지 않은 기능입니다.</p>
          <p>PRD Step 7: 종료 안내 단계</p>
        </div>
      </div>
    </div>
  );
}
