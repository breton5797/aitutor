'use client';

import { useEffect } from 'react';

export function WakeUp() {
  useEffect(() => {
    const pingBackend = () => {
      // url depends on NEXT_PUBLIC_API_URL or defaults to localhost
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      fetch(apiUrl).catch(() => {}); // fire and forget
    };

    // 바로 한 번 Ping 실행 (랜딩/페이지 첫 접속 시 서버 꺠우기)
    pingBackend();

    // 14분마다 Ping (Render의 15분 Sleep 방지)
    const interval = setInterval(pingBackend, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
