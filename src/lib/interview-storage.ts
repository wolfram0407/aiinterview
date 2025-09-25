// 면접 데이터 타입 정의
export interface QA {
  q: string;
  aText: string;
  aAudioUrl?: string;
  durationSec: number;
}

export interface InterviewData {
  contact: string;
  startedAt: string;
  endedAt?: string;
  qa: QA[];
  summary?: string;
  language: "ko-KR";
}

const STORAGE_KEY = "aiInterviewCache";

// 로컬 스토리지에서 면접 데이터 가져오기
export function getInterviewData(): InterviewData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('면접 데이터 로드 실패:', error);
    return null;
  }
}

// 로컬 스토리지에 면접 데이터 저장
export function saveInterviewData(data: InterviewData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('면접 데이터 저장 실패:', error);
  }
}

// 면접 데이터 업데이트 (기존 데이터에 추가)
export function updateInterviewData(updates: Partial<InterviewData>): void {
  try {
    const existing = getInterviewData();
    const updated = existing ? {...existing, ...updates} : {
      contact: "",
      startedAt: new Date().toISOString(),
      qa: [],
      language: "ko-KR" as const,
      ...updates
    };
    saveInterviewData(updated);
  } catch (error) {
    console.error('면접 데이터 업데이트 실패:', error);
  }
}

// QA 추가
export function addQA(qa: QA): void {
  try {
    const existing = getInterviewData();
    if (existing) {
      const updated = {
        ...existing,
        qa: [...existing.qa, qa]
      };
      saveInterviewData(updated);
    }
  } catch (error) {
    console.error('QA 추가 실패:', error);
  }
}

// 면접 데이터 초기화
export function initializeInterviewData(contact: string): void {
  const initialData: InterviewData = {
    contact,
    startedAt: new Date().toISOString(),
    qa: [],
    language: "ko-KR"
  };
  saveInterviewData(initialData);
}

// 면접 데이터 삭제 (전송 후)
export function clearInterviewData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('면접 데이터 삭제 실패:', error);
  }
}

// 면접 요약 생성 (GPT Assistant를 통해)
export async function generateSummary(qa: QA[]): Promise<string> {
  try {
    const qaText = qa.map((item, index) =>
      `Q${index + 1}: ${item.q}\nA${index + 1}: ${item.aText}`
    ).join('\n\n');

    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send_message',
        threadId: 'summary-thread', // 별도 스레드 사용
        message: `다음 면접 내용을 바탕으로 지원자의 강점, 약점, 그리고 전반적인 평가를 요약해주세요:\n\n${qaText}`
      })
    });

    if (!response.ok) {
      throw new Error('요약 생성에 실패했습니다.');
    }

    const result = await response.json();
    return result.response || '요약을 생성할 수 없습니다.';
  } catch (error) {
    console.error('요약 생성 오류:', error);
    return '요약 생성 중 오류가 발생했습니다.';
  }
}
