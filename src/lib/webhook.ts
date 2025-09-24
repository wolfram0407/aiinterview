const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/ru8oohh55yrhjnoj043lkywqu5vz36f7";

export interface WebhookResponse {
  success: boolean;
  message?: string;
  code?: number;
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
