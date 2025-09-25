import {NextRequest, NextResponse} from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const {text} = await request.json();

    if (!text) {
      return NextResponse.json(
        {error: '텍스트가 필요합니다.'},
        {status: 400}
      );
    }

    console.log('TTS 요청:', text.substring(0, 50));

    // OpenAI TTS API 호출
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy", // alloy, echo, fable, onyx, nova, shimmer 중 선택
      input: text,
    });

    // MP3 데이터를 ArrayBuffer로 변환
    const buffer = await mp3.arrayBuffer();

    console.log('TTS 생성 완료, 크기:', buffer.byteLength);

    // MP3 데이터를 응답으로 반환
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error('TTS API 오류:', error);
    return NextResponse.json(
      {
        error: 'TTS 생성에 실패했습니다.',
        details: error.message
      },
      {status: 500}
    );
  }
}
