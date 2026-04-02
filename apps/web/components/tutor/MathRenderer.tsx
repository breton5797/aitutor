'use client'

import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import { parseLatexSegments } from '../../lib/latex-parser'

interface Props {
  text: string
  className?: string
}

export function MathRenderer({ text, className }: Props) {
  const segments = parseLatexSegments(text)

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'block') {
          return (
            <span key={i} className="block my-3 overflow-x-auto">
              <BlockMath
                math={seg.latex}
                errorColor="#E24B4A"
                renderError={(err) => (
                  <span className="text-red-500 text-xs font-mono">{seg.latex}</span>
                )}
              />
            </span>
          )
        }
        if (seg.type === 'inline') {
          return (
            <InlineMath
              key={i}
              math={seg.latex}
              errorColor="#E24B4A"
              renderError={() => (
                <code className="text-xs bg-purple-50 text-purple-800 px-1 rounded">
                  {seg.latex}
                </code>
              )}
            />
          )
        }
        // 일반 텍스트: 줄바꿈 처리
        return (
          <span key={i}>
            {seg.content.split('\n').map((line, j) => (
              <span key={j}>
                {line}
                {j < seg.content.split('\n').length - 1 && <br />}
              </span>
            ))}
          </span>
        )
      })}
    </span>
  )
}
