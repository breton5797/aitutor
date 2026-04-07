'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    fontFamily: 'Pretendard, sans-serif',
    primaryColor: '#eef2ff',
    primaryTextColor: '#1e1b4b',
    primaryBorderColor: '#a5b4fc',
    lineColor: '#6366f1',
    secondaryColor: '#fef3c7',
    tertiaryColor: '#f1f5f9',
  },
});

export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svgStr, setSvgStr] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (chart) {
      const id = `mermaid-${Math.round(Math.random() * 100000)}`;
      mermaid.render(id, chart)
        .then(({ svg }) => {
          if (isMounted) {
            setSvgStr(svg);
            setError(false);
          }
        })
        .catch((e) => {
          console.error('Mermaid render error', e);
          if (isMounted) setError(true);
        });
    }
    return () => { isMounted = false; };
  }, [chart]);

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">그래프(Mermaid) 렌더링에 실패했습니다.</div>;
  }

  return (
    <div
      ref={ref}
      className="mermaid flex justify-center py-4 overflow-auto"
      dangerouslySetInnerHTML={{ __html: svgStr }}
    />
  );
}
