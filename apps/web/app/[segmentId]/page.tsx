'use client';

import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SEGMENTS } from '../../config/segments';
import api from '../../lib/api';

export default function SegmentPage({ params }: { params: { segmentId: string } }) {
  const router = useRouter();
  const segment = SEGMENTS[params.segmentId];
  if (!segment) {
    notFound();
  }

  // Determine CSS variables based on segment UI mode
  const cssVars = {
    '--theme-color': segment.accentColor,
    '--bg-color': segment.bgColor,
    '--text-on-accent': segment.textOnAccent,
    'fontFamily': segment.uiMode === 'senior' ? 'var(--font-noto-sans-kr)' : 'var(--font-inter)',
    'fontSize': segment.fontSize === 'xl' ? '1.2rem' : '1rem',
  } as React.CSSProperties;

  const startChat = async (subjectId: string, courseId: string, courseName: string) => {
    try {
      const res = await api.post('/conversations', {
        segmentId: segment.id,
        subjectId: subjectId,
        courseId: courseId,
        title: courseName,
      });
      router.push(`/chat/${res.data.id}`);
    } catch (error) {
      console.error('Failed to create conversation', error);
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ ...cssVars, minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <header style={{ padding: '20px', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div>
          <Link href="/" style={{ textDecoration: 'none', color: '#666', marginRight: '20px', fontWeight: 'bold' }}>← 홈으로</Link>
          <span style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--theme-color)' }}>{segment.name} 클래스</span>
        </div>
      </header>

      <main style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontWeight: 800, marginBottom: '10px', fontSize: segment.fontSize === 'xl' ? '2rem' : '1.5rem' }}>어떤 과목을 공부할까요?</h1>
        <p style={{ color: '#555', marginBottom: '40px' }}>선생님 <b>{segment.teacherPersona.tone}</b> 말투로 꼼꼼하게 알려드릴게요.</p>
        
        {segment.subjects.map((subject) => (
          <div key={subject.id} style={{ marginBottom: '40px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', marginBottom: '20px' }}>
              <span>{subject.icon}</span> {subject.name}
              <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', backgroundColor: '#e0e0e0', padding: '2px 8px', borderRadius: '12px' }}>{subject.description}</span>
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
              {subject.courses.map((course) => (
                <button 
                  key={course.id} 
                  onClick={() => startChat(subject.id, course.id, course.name)}
                  style={{
                    display: 'block',
                    textAlign: 'left',
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: '#333',
                    border: '1px solid #eaeaea',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                >
                  {course.isHot && <span style={{ position: 'absolute', top: '-10px', right: '10px', backgroundColor: '#f43f5e', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>HOT</span>}
                  {course.isNew && <span style={{ position: 'absolute', top: '-10px', right: '50px', backgroundColor: '#3b82f6', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>NEW</span>}
                  
                  <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>{course.level}</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>{course.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '16px', lineHeight: 1.4 }}>{course.description}</p>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {course.tags.map(tag => (
                      <span key={tag} style={{ fontSize: '0.75rem', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: '4px' }}>#{tag}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
