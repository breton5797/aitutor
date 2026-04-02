import type { Metadata } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'AI Tutor — 나만의 AI 선생님',
  description: '영어, 수학, 과학, 역사. 혼자 공부해도 옆에 선생님이 있는 것처럼.',
  keywords: '과외, ai과외, ai선생님, 수학, 영어, 과학, 역사, 학습',
  openGraph: {
    title: 'AI Tutor — 나만의 AI 선생님',
    description: '혼자 공부해도 옆에 선생님이 있는 것처럼.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#16162a',
              color: '#f8fafc',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#f8fafc' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#f8fafc' },
            },
          }}
        />
      </body>
    </html>
  );
}
