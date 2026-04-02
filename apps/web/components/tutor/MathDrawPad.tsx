'use client'

import { useRef, useState } from 'react'
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas'

interface Props {
  onSubmit: (imageDataUrl: string) => void
  onClose: () => void
}

export function MathDrawPad({ onSubmit, onClose }: Props) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null)
  const [strokeColor, setStrokeColor] = useState('#1A1A2E')

  const handleSubmit = async () => {
    const dataUrl = await canvasRef.current?.exportImage('png')
    if (dataUrl) onSubmit(dataUrl)
  }

  return (
    // 모달 오버레이 — position:fixed 대신 부모 relative + absolute 사용
    <div className="absolute inset-0 bg-black/30 flex items-end justify-center z-50 rounded-2xl" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, borderRadius: '16px' }}>
      <div className="bg-white w-full rounded-t-2xl p-4 shadow-xl" style={{ background: 'white', width: '100%', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '16px', boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span className="text-sm font-medium text-gray-700" style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>수식 직접 그리기</span>
          <div className="flex gap-2" style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => canvasRef.current?.clearCanvas()}
              className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1"
              style={{ fontSize: '12px', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '4px 12px' }}
            >
              지우기
            </button>
            <button
              onClick={() => canvasRef.current?.undo()}
              className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1"
              style={{ fontSize: '12px', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '4px 12px' }}
            >
              되돌리기
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" style={{ color: '#9ca3af', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* 캔버스 */}
        <div className="border-2 border-dashed border-purple-200 rounded-xl overflow-hidden mb-3 bg-gray-50" style={{ border: '2px dashed #e9d5ff', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', background: '#f9fafb' }}>
          <ReactSketchCanvas
            ref={canvasRef}
            width="100%"
            height="200px"
            strokeWidth={3}
            strokeColor={strokeColor}
            canvasColor="white"
            style={{ border: 'none' }}
          />
        </div>

        {/* 색상 선택 */}
        <div className="flex gap-2 mb-3" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {['#1A1A2E', '#7F77DD', '#1D9E75', '#D85A30'].map(c => (
            <button
              key={c}
              onClick={() => setStrokeColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                strokeColor === c ? 'border-gray-400 scale-110' : 'border-transparent'
              }`}
              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid', borderColor: strokeColor === c ? '#9ca3af' : 'transparent', backgroundColor: c, cursor: 'pointer' }}
            />
          ))}
        </div>

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          className="w-full bg-purple-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-purple-700 transition-colors"
          style={{ width: '100%', background: '#9333ea', color: 'white', borderRadius: '12px', padding: '12px 0', fontSize: '14px', fontWeight: 500 }}
        >
          수식 인식하기 →
        </button>
      </div>
    </div>
  )
}
