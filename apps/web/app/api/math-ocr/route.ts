import Anthropic from '@anthropic-ai/sdk'
import { cleanLatex } from '../../../lib/latex-parser'

export const runtime = 'nodejs'
export const maxDuration = 30  // OCR은 최대 30초 허용

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()

    if (!imageBase64) {
      return Response.json({ error: 'imageBase64 is required' }, { status: 400 })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-dummy-for-now-change-later'
    })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `이 이미지에서 수학 수식을 찾아 LaTeX 형식으로 변환하세요.

규칙:
1. 수식만 LaTeX로 출력하고 설명은 쓰지 마세요
2. 수식이 여러 개면 각각 새 줄로 구분하세요
3. 손글씨라도 최대한 정확하게 인식하세요
4. 분수는 \\frac{}{}, 제곱근은 \\sqrt{}, 그리스 문자는 \\alpha, \\beta 등으로
5. 수식이 없으면 "NO_MATH"라고만 출력하세요

출력 예시:
x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}`,
            },
          ],
        },
      ],
    })

    const rawText = response.content?.[0]?.type === 'text' ? response.content[0].text : ''

    if (rawText.trim() === 'NO_MATH') {
      return Response.json({ latex: '', confidence: 0, hasNoMath: true })
    }

    const latex = cleanLatex(rawText)

    // 신뢰도: LaTeX 특수문자 비율로 간이 계산
    const specialChars = (latex.match(/\\[a-zA-Z]+|[{}^_]/g) || []).length
    const confidence = Math.min(0.99, Math.max(0.5, specialChars / 10))

    return Response.json({ latex, confidence, hasNoMath: false })
  } catch (error) {
    console.error('Math OCR error:', error)
    return Response.json({ error: 'OCR 처리 중 오류가 발생했습니다' }, { status: 500 })
  }
}
