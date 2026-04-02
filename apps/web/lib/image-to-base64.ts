export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // "data:image/jpeg;base64,..." 에서 base64 부분만 추출
      resolve(result.split(',')[1] || '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getImageMimeType(file: File): string {
  // 지원 형식: jpeg, png, gif, webp
  const supported = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  return supported.includes(file.type) ? file.type : 'image/jpeg'
}

export async function resizeImageIfNeeded(file: File, maxSizeMB = 4): Promise<File> {
  // Claude API 이미지 크기 제한: 5MB. 여유있게 4MB로 제한
  if (file.size <= maxSizeMB * 1024 * 1024) return file

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.sqrt((maxSizeMB * 1024 * 1024) / file.size)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        blob => resolve(new File([blob!], file.name, { type: 'image/jpeg' })),
        'image/jpeg', 0.85
      )
    }
    img.src = URL.createObjectURL(file)
  })
}
