/**
 * StreakTracker — records daily study activity and displays consecutive-day streak.
 *
 * A "study day" is any day on which the user:
 *  - Visits a module page (recorded by CourseLayout)
 *  - Completes a flashcard session (recorded by FlashcardsApp)
 *  - Submits an exam (recorded by ExamSimulator)
 *
 * Storage: localStorage key 'sf-streak'
 *   { dates: string[] }  — ISO date strings (YYYY-MM-DD) of activity days, deduped
 */
import { useEffect, useState } from 'react';

export const STREAK_KEY = 'sf-streak';

/** Call this anywhere to record today as a study day. */
export function recordStudyDay() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(STREAK_KEY);
    const data: { dates: string[] } = raw ? JSON.parse(raw) : { dates: [] };
    if (!data.dates.includes(today)) {
      data.dates.push(today);
      // Keep only last 365 days
      data.dates = data.dates.sort().slice(-365);
      localStorage.setItem(STREAK_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('sf:streak-update'));
    }
  } catch {}
}

function calcStreak(dates: string[]): { current: number; longest: number; todayStudied: boolean } {
  if (dates.length === 0) return { current: 0, longest: 0, todayStudied: false };

  const sorted = [...dates].sort();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const todayStudied = sorted.includes(today);

  // Current streak: count backwards from today (or yesterday if not studied today)
  let current = 0;
  let check = todayStudied ? today : yesterday;
  while (sorted.includes(check)) {
    current++;
    check = new Date(new Date(check).getTime() - 86400000).toISOString().slice(0, 10);
  }
  if (!todayStudied && !sorted.includes(yesterday)) current = 0;

  // Longest streak ever
  let longest = 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  longest = Math.max(longest, run, current);

  return { current, longest, todayStudied };
}

interface Props {
  compact?: boolean; // true = small inline badge for sidebar; false = full card
}

export default function StreakTracker({ compact = false }: Props) {
  const [streak, setStreak] = useState({ current: 0, longest: 0, todayStudied: false });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const load = () => {
      try {
        const raw = localStorage.getItem(STREAK_KEY);
        const data: { dates: string[] } = raw ? JSON.parse(raw) : { dates: [] };
        setStreak(calcStreak(data.dates));
      } catch {}
    };
    load();
    window.addEventListener('sf:streak-update', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('sf:streak-update', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  if (!isClient) return null;

  const { current, longest, todayStudied } = streak;
  const flame = current >= 7 ? '🔥' : current >= 3 ? '⚡' : '📅';

  if (compact) {
    // Slim badge for ProgressTracker sidebar
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          background: todayStudied ? '#fef3c7' : 'var(--surface-card-2)',
          border: `1px solid ${todayStudied ? '#fcd34d' : 'var(--surface-border)'}`,
          marginBottom: '1rem',
        }}
        title={`Longest streak: ${longest} days`}
      >
        <span style={{ fontSize: '1.125rem', lineHeight: 1 }} aria-hidden="true">{flame}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: todayStudied ? '#92400e' : 'var(--text-primary)' }}>
            {current} day{current !== 1 ? 's' : ''} streak
          </span>
          {!todayStudied && current > 0 && (
            <span style={{ fontSize: '0.7rem', color: '#ef4444', display: 'block', lineHeight: 1, marginTop: '0.1rem' }}>
              Study today to keep it going!
            </span>
          )}
          {todayStudied && (
            <span style={{ fontSize: '0.7rem', color: '#16a34a', display: 'block', lineHeight: 1, marginTop: '0.1rem' }}>
              Studied today ✓
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Best: {longest}d
        </span>
      </div>
    );
  }

  // Full card for flashcard hub / modules page
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '1rem 1.25rem',
        borderRadius: '0.875rem',
        background: todayStudied
          ? 'linear-gradient(135deg, #fef3c7, #fffbeb)'
          : 'var(--surface-card-2)',
        border: `1px solid ${todayStudied ? '#fcd34d' : 'var(--surface-border)'}`,
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ fontSize: '2.5rem', lineHeight: 1 }} aria-hidden="true">{flame}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: '1.5rem', color: todayStudied ? '#92400e' : 'var(--text-primary)', lineHeight: 1 }}>
          {current} <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>day{current !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ fontSize: '0.8125rem', color: todayStudied ? '#a16207' : 'var(--text-muted)', marginTop: '0.1rem' }}>
          {todayStudied
            ? 'You studied today — streak intact!'
            : current > 0
            ? 'Study something today to keep your streak going'
            : 'Start studying to build your streak'}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Longest</div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{longest}d</div>
      </div>
    </div>
  );
}
