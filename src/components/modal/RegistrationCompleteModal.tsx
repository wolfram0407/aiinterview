"use client";

interface RegistrationCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  phoneNumber: string;
}

export default function RegistrationCompleteModal({ isOpen, onClose, onNext, phoneNumber }: RegistrationCompleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">등록 완료</h2>
          <p className="text-gray-600 mb-4">
            전화번호 <span className="font-semibold">{phoneNumber}</span>가
            <br />
            성공적으로 등록되었습니다.
          </p>

          <div className="flex justify-center">
            <button onClick={onNext} className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              다음 단계
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
