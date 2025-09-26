const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/ru8oohh55yrhjnoj043lkywqu5vz36f7";
const INTERVIEW_WEBHOOK_URL = "https://hook.eu2.make.com/wcvg0lajwfb1whab1uffa2850fxfejl9";

export interface WebhookResponse {
  success: boolean;
  message?: string;
  code?: number;
}

export interface InterviewLogData {
  contact: string;
  startedAt: string;
  endedAt?: string;
  qa: Array<{
    q: string;
    aText: string;
    durationSec: number;
  }>;
  summary?: string;
}

export async function sendPhoneRegistration(phoneNumber: string): Promise<WebhookResponse> {
  try {
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contact: phoneNumber,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Make.com에서 응답 데이터 파싱
    const responseData = await response.json();

    // Make.com에서 success: true를 반환했는지 확인
    if (responseData && responseData.success === true) {
      return {
        success: true,
        message: responseData.message || "등록이 완료되었습니다.",
        code: responseData.code
      };
    } else {
      return {
        success: false,
        message: responseData.message || "등록 처리 중 오류가 발생했습니다.",
        code: responseData.code
      };
    }
  } catch (error) {
    console.error("웹훅 전송 실패:", error);
    return {
      success: false,
      message: "네트워크 오류가 발생했습니다. 다시 시도해주세요."
    };
  }
}

// 면접 데이터를 텍스트 형태로 포맷팅
function formatInterviewLog(interviewData: InterviewLogData): string {
  const {contact, startedAt, endedAt, qa, summary} = interviewData;

  let logText = `면접 대상: ${contact}\n`;
  logText += `면접 시작: ${new Date(startedAt).toLocaleString('ko-KR')}\n`;
  if (endedAt) {
    logText += `면접 종료: ${new Date(endedAt).toLocaleString('ko-KR')}\n`;
  }
  logText += `\n=== 면접 내용 ===\n\n`;

  qa.forEach((item, index) => {
    logText += `질문 ${index + 1}: ${item.q}\n`;
    logText += `답변: ${item.aText}\n`;
    logText += `답변 시간: ${item.durationSec.toFixed(1)}초\n\n`;
  });

  if (summary) {
    logText += `=== 면접 요약 ===\n${summary}\n`;
  }

  return logText;
}

// 면접 로그를 웹훅으로 전송
export async function sendInterviewLog(interviewData: InterviewLogData): Promise<WebhookResponse> {
  try {
    const interviewLogText = formatInterviewLog(interviewData);

    const response = await fetch(INTERVIEW_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        interviewlog: interviewLogText,
        phone: interviewData.contact,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Make.com에서 응답 데이터 파싱
    const responseData = await response.json();

    // Make.com에서 success: true를 반환했는지 확인
    if (responseData && responseData.success === true) {
      return {
        success: true,
        message: responseData.message || "면접 로그 전송이 완료되었습니다.",
        code: responseData.code
      };
    } else {
      return {
        success: false,
        message: responseData.message || "면접 로그 전송 처리 중 오류가 발생했습니다.",
        code: responseData.code
      };
    }
  } catch (error) {
    console.error("면접 로그 웹훅 전송 실패:", error);
    return {
      success: false,
      message: "네트워크 오류가 발생했습니다. 다시 시도해주세요."
    };
  }
}
