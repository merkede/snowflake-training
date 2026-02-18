import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface ModuleItem {
  id: string;
  title: string;
  slug: string;
}

interface DomainData {
  name: string;
  weight: string;
  gradient: string;
  modules: ModuleItem[];
}

export default function ModulesGrid({ domains }: { domains: DomainData[] }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('snowflake-training-progress');
    if (saved) setCompleted(new Set(JSON.parse(saved)));

    const handler = () => {
      const s = localStorage.getItem('snowflake-training-progress');
      if (s) setCompleted(new Set(JSON.parse(s)));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const totalModules = domains.reduce((sum, d) => sum + d.modules.length, 0);
  const totalCompleted = isClient ? completed.size : 0;
  const overallPct = totalModules ? Math.round((totalCompleted / totalModules) * 100) : 0;

  return (
    <div>
      {/* Overall progress banner */}
      <div
        className="mb-10 p-6 rounded-xl border-2"
        style={{ borderColor: 'var(--color-snowflake-blue)', background: 'linear-gradient(135deg, var(--color-snowflake-light), white)' }}
      >
        <div className="flex items-center justify-between mb-3 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-snowflake-dark)' }}>
              Your Progress
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-snowflake-dark)' }}>
              {isClient ? totalCompleted : '—'}
              <span className="text-slate-400 text-base font-medium"> of {totalModules} modules completed</span>
            </p>
          </div>
          <div className="text-4xl font-black flex-shrink-0" style={{ color: 'var(--color-snowflake-blue)' }}>
            {isClient ? `${overallPct}%` : ''}
          </div>
        </div>
        <div style={{ width: '100%', backgroundColor: 'white', borderRadius: '9999px', height: '0.5rem', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${isClient ? overallPct : 0}%`,
              background: 'linear-gradient(90deg, var(--color-snowflake-blue), var(--color-secondary))',
              transition: 'width 0.7s ease',
              borderRadius: '9999px',
            }}
          />
        </div>
        {!isClient && (
          <p className="text-xs text-slate-400 mt-2">Loading your progress…</p>
        )}
      </div>

      {/* Domains and modules */}
      <div className="space-y-12">
        {domains.map((domain, idx) => {
          const domainCompleted = isClient
            ? domain.modules.filter((m) => completed.has(m.id)).length
            : 0;
          const allDone = isClient && domainCompleted === domain.modules.length;

          return (
            <div key={idx}>
              {/* Domain header */}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ background: domain.gradient }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900 m-0">
                      {domain.name}
                    </h2>
                    <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 flex-shrink-0">
                      {domain.weight} of exam
                    </span>
                  </div>
                  {isClient && (
                    <p className="text-sm text-slate-500 mt-0.5">
                      {domainCompleted}/{domain.modules.length} completed
                      {allDone ? ' 🎉' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Module cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {domain.modules.map((mod) => {
                  const isDone = isClient && completed.has(mod.id);
                  return (
                    <a
                      key={mod.id}
                      href={mod.slug}
                      className="group block rounded-xl p-5 border-2 transition-all no-underline hover:shadow-md"
                      style={{
                        borderColor: isDone ? 'var(--color-accent)' : 'var(--color-slate-200)',
                        backgroundColor: isDone ? '#f0fdf4' : 'white',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="text-sm font-bold leading-snug m-0"
                          style={{ color: isDone ? '#166534' : 'var(--color-slate-800)' }}
                        >
                          {mod.title}
                        </h3>
                        {isDone ? (
                          <CheckCircle2
                            className="w-5 h-5 flex-shrink-0 mt-0.5"
                            style={{ color: 'var(--color-accent)' }}
                          />
                        ) : (
                          <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        )}
                      </div>
                      <div className="mt-3">
                        <span
                          className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: isDone ? '#dcfce7' : 'var(--color-slate-100)',
                            color: isDone ? '#166534' : 'var(--color-slate-500)',
                          }}
                        >
                          {isDone ? '✓ Completed' : 'Start module →'}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
