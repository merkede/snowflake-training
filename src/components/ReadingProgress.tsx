import { useEffect, useState, useRef } from 'react';

const STORAGE_KEY = 'snowflake-training-progress';
const PROGRESS_EVENT = 'snowflake:progress-update';

interface Props {
  moduleId: string;
  moduleTitle: string;
}

export default function ReadingProgress({ moduleId, moduleTitle }: Props) {
  const [scrollPct, setScrollPct]   = useState(0);
  const [showToast, setShowToast]   = useState(false);
  const [timerPct, setTimerPct]     = useState(100);

  const completedRef      = useRef(false);
  const timerInterval     = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissTimeout    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if this module is already marked complete on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const ids = JSON.parse(saved) as string[];
      if (ids.includes(moduleId)) completedRef.current = true;
    }
  }, [moduleId]);

  // Scroll → update progress bar width
  useEffect(() => {
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // init on mount
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // IntersectionObserver on sentinel div at bottom of article
  useEffect(() => {
    const sentinel = document.getElementById('article-end');
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !completedRef.current) triggerComplete();
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  function triggerComplete() {
    completedRef.current = true;

    // Persist to localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    const ids = new Set<string>(saved ? JSON.parse(saved) : []);
    ids.add(moduleId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));

    // Tell ProgressTracker sidebar to refresh (same-tab custom event)
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));

    // Show toast and start 5-second countdown
    setShowToast(true);
    setTimerPct(100);

    let pct = 100;
    timerInterval.current = setInterval(() => {
      pct -= 2; // 50 steps × 100 ms = 5 s
      setTimerPct(Math.max(0, pct));
      if (pct <= 0) clearInterval(timerInterval.current!);
    }, 100);

    dismissTimeout.current = setTimeout(() => setShowToast(false), 5000);
  }

  function handleUndo() {
    // Remove from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const ids = new Set<string>(JSON.parse(saved));
      ids.delete(moduleId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
      window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
    }
    completedRef.current = false;
    setShowToast(false);
    if (timerInterval.current)  clearInterval(timerInterval.current);
    if (dismissTimeout.current) clearTimeout(dismissTimeout.current);
  }

  return (
    <>
      {/* ── Reading progress bar (top of viewport) ─────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '3px',
          width: `${scrollPct}%`,
          background: 'linear-gradient(90deg, var(--color-snowflake-blue), var(--color-snowflake-sky))',
          zIndex: 9999,
          borderRadius: '0 2px 2px 0',
          pointerEvents: 'none',
          transition: 'width 0.08s linear',
        }}
      />

      {/* ── Completion toast (bottom-right) ─────────────────────────── */}
      {showToast && (
        <div
          className="completion-toast"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Green check bubble */}
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '50%',
              background: '#dcfce7', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
                stroke="#16a34a" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0, fontWeight: 700, fontSize: '0.875rem',
                color: 'var(--text-primary)', lineHeight: 1.3,
              }}>
                Module complete!
              </p>
              <p style={{
                margin: '0.15rem 0 0', fontSize: '0.75rem',
                color: 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {moduleTitle}
              </p>
            </div>

            {/* Undo button */}
            <button
              onClick={handleUndo}
              aria-label="Undo module completion"
              style={{
                flexShrink: 0, cursor: 'pointer', background: 'none',
                border: '1px solid var(--surface-border)',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.625rem',
                fontSize: '0.75rem', fontWeight: 500,
                color: 'var(--text-muted)',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-snowflake-blue)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-snowflake-blue)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--surface-border)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              }}
            >
              Undo
            </button>
          </div>

          {/* 5-second countdown strip */}
          <div style={{
            marginTop: '0.875rem', height: '3px',
            background: 'var(--surface-border)', borderRadius: '9999px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${timerPct}%`,
              background: '#22c55e', borderRadius: '9999px',
              transition: 'width 0.1s linear',
            }} />
          </div>
        </div>
      )}
    </>
  );
}
