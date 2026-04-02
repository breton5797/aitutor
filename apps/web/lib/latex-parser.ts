export function cleanLatex(raw: string): string {
  return raw
    .trim()
    // Claude가 백틱으로 감싸서 줄 때 제거
    .replace(/^```latex\n?/, '').replace(/\n?```$/, '')
    .replace(/^`/, '').replace(/`$/, '')
    // 불필요한 \displaystyle 제거 (KaTeX가 자동 처리)
    .replace(/^\\displaystyle\s*/, '')
    .trim()
}

// 텍스트에서 $...$ 와 $$...$$ 구간을 분리
export function parseLatexSegments(text: string): Array<
  | { type: 'text'; content: string }
  | { type: 'inline'; latex: string }
  | { type: 'block'; latex: string }
> {
  const segments: ReturnType<typeof parseLatexSegments> = []
  // $$...$$ 블록 수식 먼저 처리 (인라인보다 우선)
  const blockRe = /\$\$([\s\S]*?)\$\$/g
  const inlineRe = /\$((?:[^$\\]|\\.)*?)\$/g

  let lastIndex = 0
  const combined = /(\$\$[\s\S]*?\$\$|\$(?:[^$\\]|\\.)*?\$)/g
  let match: RegExpExecArray | null

  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    const raw = match[0]
    if (raw.startsWith('$$')) {
      segments.push({ type: 'block', latex: raw.slice(2, -2).trim() })
    } else {
      segments.push({ type: 'inline', latex: raw.slice(1, -1).trim() })
    }
    lastIndex = match.index + raw.length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return segments
}
