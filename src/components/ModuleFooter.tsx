import { useEffect, useState } from 'react';

interface Props {
  moduleId: string;
  moduleTitle: string;
  nextSlug: string | null;
  nextTitle: string | null;
  nextDomain: string | null;
  prevSlug: string | null;
  prevTitle: string | null;
  prevDomain: string | null;
}

const STORAGE_KEY = 'snowflake-training-progress';

export default function ModuleFooter({
  moduleId, moduleTitle,
  nextSlug, nextTitle, nextDomain,
  prevSlug, prevTitle, prevDomain,
}: Props) {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const check = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      const ids: string[] = saved ? JSON.parse(saved) : [];
      setIsComplete(ids.includes(moduleId));
    };
    check();
    window.addEventListener('snowflake:progress-update', check);
    window.addEventListener('storage', check);
    return () => {
      window.removeEventListener('snowflake:progress-update', check);
      window.removeEventListener('storage', check);
    };
  }, [moduleId]);

  // Derive a domain key for flashcards filtering from the moduleId
  // Map module domains to flashcard domain filter values
  const domainMap: Record<string, string> = {
    'intro':             'Architecture',
    'architecture':      'Architecture',
    'databases-schemas': 'Architecture',
    'virtual-warehouses':'Architecture',
    'data-storage':      'Architecture',
    'user-management':   'Security',
    'rbac':              'Security',
    'network-security':  'Security',
    'authentication':    'Security',
    'query-optimization':'Performance',
    'caching':           'Performance',
    'clustering-keys':   'Performance',
    'search-optimization':'Performance',
    'bulk-loading':      'Data Loading',
    'snowpipe':          'Data Loading',
    'external-stages':   'Data Loading',
    'unloading':         'Data Loading',
    'sql-basics':        'Transformations',
    'functions':         'Transformations',
    'streams-tasks':     'Transformations',
    'time-travel':       'Data Protection',
    'cloning':           'Data Protection',
    'data-sharing':      'Data Protection',
  };
  const flashcardDomain = domainMap[moduleId] ?? 'All';

  return (
    <div className="not-prose mt-12">
      {/* ── Flashcard CTA ─────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
          border: '1px solid #bfdbfe',
          borderRadius: '0.875rem',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: '2rem', lineHeight: 1 }} aria-hidden="true">🧠</div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
            Reinforce what you just read
          </p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#475569' }}>
            Study the <strong>{flashcardDomain}</strong> flashcards with spaced repetition to lock it in.
          </p>
        </div>
        <a
          href={`/flashcards`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1.125rem',
            borderRadius: '0.5rem',
            fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
            background: 'linear-gradient(135deg, var(--color-snowflake-blue), var(--color-snowflake-sky))',
            color: '#fff',
            whiteSpace: 'nowrap',
          }}
        >
          Study flashcards →
        </a>
      </div>

      {/* ── Prev / Next nav ───────────────────────────────────────── */}
      <nav
        className="grid sm:grid-cols-2 gap-4 pt-8 border-t border-slate-200"
        aria-label="Module navigation"
      >
        {/* Previous */}
        {prevSlug ? (
          <a
            href={`/${prevSlug}`}
            className="group flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-slate-50 no-underline transition-all"
            rel="prev"
          >
            <svg className="w-5 h-5 text-slate-400 group-hover:text-primary flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <div className="min-w-0">
              <div className="text-xs text-slate-400 font-medium mb-0.5">Previous</div>
              <div className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors truncate">{prevTitle}</div>
              <div className="text-xs text-slate-400">{prevDomain}</div>
            </div>
          </a>
        ) : <div />}

        {/* Next — celebratory if just completed */}
        {nextSlug ? (
          <a
            href={`/${nextSlug}`}
            rel="next"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem', borderRadius: '0.75rem', textDecoration: 'none',
              flexDirection: 'row-reverse', textAlign: 'right',
              border: `1px solid ${isComplete ? '#86efac' : '#e2e8f0'}`,
              background: isComplete ? '#f0fdf4' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, color: isComplete ? '#22c55e' : '#94a3b8', transition: 'color 0.2s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div className="min-w-0">
              {isComplete && (
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', marginBottom: '0.125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ✓ Complete — Up next
                </div>
              )}
              {!isComplete && (
                <div className="text-xs text-slate-400 font-medium mb-0.5">Next</div>
              )}
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isComplete ? '#15803d' : '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nextTitle}
              </div>
              <div className="text-xs text-slate-400">{nextDomain}</div>
            </div>
          </a>
        ) : (
          <a
            href="/exam-sim"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem', borderRadius: '0.75rem', textDecoration: 'none',
              flexDirection: 'row-reverse', textAlign: 'right',
              border: '2px solid #22c55e', background: '#f0fdf4',
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="min-w-0">
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', marginBottom: '0.125rem' }}>All modules complete!</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#166534' }}>Take the Mock Exam →</div>
            </div>
          </a>
        )}
      </nav>
    </div>
  );
}
