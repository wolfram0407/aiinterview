import {NextRequest, NextResponse} from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('Assistant API 호출됨');
    const {action, threadId, message} = await request.json();
    console.log('요청 데이터:', {action, threadId, message: message?.substring(0, 50)});

    switch (action) {
      case 'create_thread':
        // 간단한 스레드 ID 생성 (실제 OpenAI 스레드 대신)
        const newThreadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('가상 스레드 생성:', newThreadId);
        return NextResponse.json({
          success: true,
          threadId: newThreadId
        });

      case 'send_message':
        if (!threadId || !message) {
          return NextResponse.json(
            {error: 'threadId와 message가 필요합니다.'},
            {status: 400}
          );
        }

        console.log('GPT API 호출 시작:', message.substring(0, 50));

        try {
          // 직접 GPT API 호출
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "당신은 전문적인 면접관입니다. 지원자에게 적절한 면접 질문을 하고, 답변을 듣고 다음 질문을 준비합니다. 한국어로 대화하세요."
              },
              {
                role: "user",
                content: message
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          });

          const response = completion.choices[0]?.message?.content || "죄송합니다. 응답을 생성할 수 없습니다.";
          console.log('GPT 응답:', response.substring(0, 100));

          return NextResponse.json({
            success: true,
            response: response,
            threadId: threadId
          });

        } catch (gptError: unknown) {
          console.error('GPT API 오류:', gptError);
          const errorMessage = gptError instanceof Error ? gptError.message : '알 수 없는 오류가 발생했습니다.';
          throw new Error(`GPT API 호출 실패: ${errorMessage}`);
        }

      default:
        return NextResponse.json(
          {error: '유효하지 않은 액션입니다.'},
          {status: 400}
        );
    }

  } catch (error: unknown) {
    console.error('Assistant API 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    console.error('오류 상세:', errorMessage);
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
        details: errorMessage
      },
      {status: 500}
    );
  }
}