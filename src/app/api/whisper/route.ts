import {NextRequest, NextResponse} from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        {error: '오디오 파일이 필요합니다.'},
        {status: 400}
      );
    }

    // OpenAI Whisper API 호출
    const openaiFormData = new FormData();
    openaiFormData.append('file', audioFile);
    openaiFormData.append('model', 'whisper-1');
    openaiFormData.append('language', 'ko');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Whisper API 오류:', errorData);
      return NextResponse.json(
        {error: '음성 인식에 실패했습니다.'},
        {status: response.status}
      );
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      text: result.text,
      language: result.language
    });

  } catch (error) {
    console.error('Whisper API 호출 오류:', error);
    return NextResponse.json(
      {error: '서버 오류가 발생했습니다.'},
      {status: 500}
    );
  }
}
