/**
 * ExamCountdown — slim banner shown below the header when the user has set
 * an exam date during onboarding (or later via the modules page).
 * Reads `sf-exam-date` from localStorage.
 */
import { useEffect, useState } from 'react';
import { EXAM_DATE_KEY } from './OnboardingModal';

export default function ExamCountdown() {
  const [days, setDays] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const load = () => {
      try {
        const d = localStorage.getItem(EXAM_DATE_KEY);
        if (!d) { setDays(null); return; }
        const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
        setDays(diff);
      } catch {}
    };
    load();
    window.addEventListener('sf:onboarded', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('sf:onboarded', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  if (!isClient || days === null || dismissed || days < 0) return null;

  const urgent = days <= 7;
  const emoji = days === 0 ? '🚨' : days <= 3 ? '⚡' : days <= 14 ? '📅' : '🗓️';
  const label = days === 0 ? 'Exam today — you\'ve got this!' :
                days === 1 ? 'Exam tomorrow — final review time!' :
                `${days} days until your exam`;

  return (
    <div
      style={{
        background: urgent
          ? 'linear-gradient(90deg, #fef3c7, #fffbeb)'
          : 'linear-gradient(90deg, #f0f9ff, #e0f2fe)',
        borderBottom: `1px solid ${urgent ? '#fcd34d' : '#bae6fd'}`,
        padding: '0.375rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: urgent ? '#92400e' : '#0c4a6e',
        position: 'relative',
      }}
      role="status"
      aria-label={label}
    >
      <span aria-hidden="true">{emoji}</span>
      <span>{label}</span>

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss exam countdown"
        style={{
          position: 'absolute', right: '0.75rem',
          background: 'none', border: 'none', padding: '0.25rem',
          color: urgent ? '#a16207' : '#0369a1', cursor: 'pointer',
          lineHeight: 1, opacity: 0.6,
        }}
      >
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
