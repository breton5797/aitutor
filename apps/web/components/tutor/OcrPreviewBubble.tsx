'use client'

import { useState } from 'react'
import Image from 'next/image'
import { InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface Props {
  imagePreviewUrl: string
  latex: string
  isProcessing: boolean
  onConfirm: (latex: string, userText: string) => void
  onRetry: () => void
  onCancel: () => void
}

export function OcrPreviewBubble({
  imagePreviewUrl,
  latex,
  isProcessing,
  onConfirm,
  onRetry,
  onCancel,
}: Props) {
  const [userText, setUserText] = useState('')

  if (isProcessing) {
    return (
      <div className="flex items-center gap-3 bg-purple-50 rounded-2xl rounded-tl-sm p-4 max-w-xs" style={{ background: '#f5f3ff', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px' }}>
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden' }}>
          <Image src={imagePreviewUrl} alt="업로드" width={32} height={32} className="object-cover" />
        </div>
        <div>
          <div className="text-sm text-purple-700 font-medium" style={{ fontSize: '14px', color: '#7e22ce', fontWeight: 500 }}>수식 인식 중...</div>
          <div className="flex gap-1 mt-1" style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c084fc', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-purple-100 rounded-2xl rounded-tl-sm p-4 max-w-sm shadow-sm" style={{ background: 'white', border: '1px solid #f3e8ff', borderRadius: '16px', padding: '16px', maxWidth: '384px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      {/* 이미지 썸네일 */}
      <div className="relative w-full h-24 rounded-lg overflow-hidden mb-3 bg-gray-50" style={{ position: 'relative', width: '100%', height: '96px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', background: '#f9fafb' }}>
        <Image src={imagePreviewUrl} alt="수식 사진" fill className="object-contain" style={{ objectFit: 'contain' }} />
      </div>

      {/* 인식된 수식 */}
      <div className="bg-purple-50 rounded-lg p-3 mb-3" style={{ background: '#f5f3ff', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
        <div className="text-xs text-purple-500 mb-1" style={{ fontSize: '12px', color: '#a855f7', marginBottom: '4px' }}>인식된 수식</div>
        <div className="text-center py-1 overflow-x-auto" style={{ textAlign: 'center', padding: '4px 0', overflowX: 'auto' }}>
          {latex ? (
            <InlineMath math={latex} />
          ) : (
            <span className="text-gray-400 text-sm" style={{ color: '#9ca3af', fontSize: '14px' }}>수식을 인식하지 못했어요</span>
          )}
        </div>
        <div className="text-xs text-gray-400 font-mono mt-1 truncate" style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{latex}</div>
      </div>

      {/* 추가 질문 입력 */}
      <input
        type="text"
        placeholder="추가 질문 (선택사항)"
        value={userText}
        onChange={e => setUserText(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 outline-none focus:border-purple-400"
        style={{ width: '100%', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', outline: 'none' }}
        onKeyDown={e => e.key === 'Enter' && latex && onConfirm(latex, userText)}
      />

      {/* 버튼 */}
      <div className="flex gap-2" style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => latex && onConfirm(latex, userText)}
          disabled={!latex}
          className="flex-1 bg-purple-600 text-white text-sm rounded-lg py-2 disabled:opacity-40 hover:bg-purple-700 transition-colors"
          style={{ flex: 1, background: '#9333ea', color: 'white', fontSize: '14px', borderRadius: '8px', padding: '8px 0', opacity: latex ? 1 : 0.4 }}
        >
          이 수식으로 질문하기
        </button>
        <button
          onClick={onRetry}
          className="px-3 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50"
          style={{ padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#6b7280' }}
        >
          재시도
        </button>
        <button
          onClick={onCancel}
          className="px-3 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50"
          style={{ padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#6b7280' }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
