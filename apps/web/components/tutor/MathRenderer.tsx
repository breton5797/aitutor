'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Mermaid } from './Mermaid';

interface Props {
  text: string;
  className?: string;
}

export function MathRenderer({ text, className }: Props) {
  // 간단한 전처리: $$로 감싸진 블록 내에 빈 줄이 있으면 remark-math가 깨질 수 있음.
  // 이 프로젝트에서는 정규식을 약간 수정하지 않고 그대로 사용하거나 기본적인 처리 가능
  // 필요하다면 text를 replace로 다듬을 수 있음

  return (
    <div className={`markdown-body ${className || ''}`} style={{ width: '100%', overflowWrap: 'break-word' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          table: ({ node, ...props }) => <table style={{ borderCollapse: 'collapse', width: '100%', margin: '16px 0' }} {...props} />,
          th: ({ node, ...props }) => <th style={{ border: '1px solid #d1d5db', padding: '8px', backgroundColor: '#f3f4f6' }} {...props} />,
          td: ({ node, ...props }) => <td style={{ border: '1px solid #d1d5db', padding: '8px' }} {...props} />,
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            if (!inline && language === 'mermaid') {
              return <Mermaid chart={String(children).replace(/\n$/, '')} />;
            }
            if (!inline) {
              return (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', overflowX: 'auto', margin: '12px 0' }}>
                  <code className={className} {...props} style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                    {children}
                  </code>
                </div>
              );
            }
            return (
              <code className={className} {...props} style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0f172a', fontSize: '13px' }}>
                {children}
              </code>
            );
          },
          p: ({ node, ...props }) => <p style={{ marginBottom: '12px', lineHeight: 1.6 }} {...props} />,
          ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginBottom: '16px' }} {...props} />,
          ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '24px', marginBottom: '16px' }} {...props} />,
          li: ({ node, ...props }) => <li style={{ marginBottom: '6px' }} {...props} />,
          h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '16px 0 8px' }} {...props} />,
          h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.3em', fontWeight: 'bold', margin: '14px 0 8px' }} {...props} />,
          h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '12px 0 8px' }} {...props} />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
