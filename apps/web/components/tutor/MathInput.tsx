'use client'

import { useRef, useState } from 'react'
import { fileToBase64, getImageMimeType, resizeImageIfNeeded } from '../../lib/image-to-base64'
import { MathOcrResult } from '../../types/math'

interface Props {
  onOcrStart: (previewUrl: string) => void
  onOcrComplete: (result: MathOcrResult) => void
  onOcrError: (error: string) => void
  onDrawPadOpen: () => void
  disabled?: boolean
}

export function MathInput({
  onOcrStart,
  onOcrComplete,
  onOcrError,
  onDrawPadOpen,
  disabled,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    // 크기 초과 시 리사이즈
    const resized = await resizeImageIfNeeded(file)
    const previewUrl = URL.createObjectURL(resized)

    // 처리 시작 알림
    onOcrStart(previewUrl)

    try {
      const base64 = await fileToBase64(resized)
      const mimeType = getImageMimeType(resized)

      const response = await fetch('/api/math-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'OCR 실패')
      if (data.hasNoMath) throw new Error('수식을 찾을 수 없어요. 수식이 있는 부분을 다시 촬영해주세요.')

      onOcrComplete({
        latex: data.latex,
        confidence: data.confidence,
        imagePreviewUrl: previewUrl,
      })
    } catch (err) {
      onOcrError(err instanceof Error ? err.message : 'OCR 오류')
    }
  }

  // 클립보드 붙여넣기 이벤트 등록은 ChatInterface에서 처리

  return (
    <div className="flex gap-1" style={{ display: 'flex', gap: '4px' }}>
      {/* 카메라 버튼 */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) processFile(file)
          e.target.value = '' // 같은 파일 재선택 가능하게
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={disabled}
        title="수식 사진 찍기 (카메라)"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all disabled:opacity-40"
        style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#6b7280', cursor: 'pointer', background: 'white' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>

      {/* 갤러리 버튼 */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="gallery-input"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) processFile(file)
          e.target.value = ''
        }}
      />
      <button
        onClick={() => document.getElementById('gallery-input')?.click()}
        disabled={disabled}
        title="갤러리에서 선택"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all disabled:opacity-40"
        style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#6b7280', cursor: 'pointer', background: 'white' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </button>

      {/* 드로잉 패드 버튼 */}
      <button
        onClick={onDrawPadOpen}
        disabled={disabled}
        title="수식 직접 그리기"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all disabled:opacity-40"
        style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#6b7280', cursor: 'pointer', background: 'white' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    </div>
  )
}
