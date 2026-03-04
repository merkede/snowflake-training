import { useEffect, useState } from 'react';

interface Module { id: string; slug: string; }

interface Props {
  modules: Module[];
  currentModuleId: string;
  totalModules: number;
}

const STORAGE_KEY = 'snowflake-training-progress';

export default function MobileProgressBar({ modules, currentModuleId, totalModules }: Props) {
  const [completed, setCompleted] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const currentIdx = modules.findIndex(m => m.id === currentModuleId);

  useEffect(() => {
    setIsClient(true);
    const load = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      const ids: string[] = saved ? JSON.parse(saved) : [];
      setCompleted(ids.length);
    };
    load();
    window.addEventListener('snowflake:progress-update', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('snowflake:progress-update', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  if (!isClient || dismissed) return null;

  const pct = Math.round((completed / totalModules) * 100);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 9990,
        background: 'var(--surface-card)',
        borderTop: '1px solid var(--surface-border)',
        padding: '0.625rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 -4px 12px rgb(0 0 0 / 0.08)',
      }}
      className="lg:hidden"
      role="status"
      aria-label={`Course progress: ${completed} of ${totalModules} modules complete`}
    >
      {/* Module position pill */}
      <span style={{
        flexShrink: 0, fontSize: '0.75rem', fontWeight: 700,
        color: 'var(--color-snowflake-blue)',
        background: 'var(--color-snowflake-light)',
        padding: '0.2rem 0.6rem', borderRadius: '9999px',
        whiteSpace: 'nowrap',
      }}>
        {currentIdx + 1}/{totalModules}
      </span>

      {/* Progress bar */}
      <div style={{ flex: 1, height: '6px', background: 'var(--surface-border)', borderRadius: '9999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--color-snowflake-blue), var(--color-snowflake-sky))',
          borderRadius: '9999px',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Percentage */}
      <span style={{ flexShrink: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {pct}%
      </span>

      {/* Modules link */}
      <a
        href="/modules"
        style={{
          flexShrink: 0, fontSize: '0.75rem', fontWeight: 600,
          color: 'var(--color-snowflake-blue)', textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
        aria-label="View all modules"
      >
        All modules
      </a>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss progress bar"
        style={{
          flexShrink: 0, background: 'none', border: 'none', padding: '0.25rem',
          color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1,
        }}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
