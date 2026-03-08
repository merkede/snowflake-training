/**
 * OnboardingModal — first-visit welcome modal.
 * Shown once (localStorage flag `sf-onboarded`).
 * Step 0: feature overview ("here's how it works")
 * Step 1: optional exam date → stores to `sf-exam-date`
 */
import { useEffect, useState } from 'react';
import { BookOpen, CreditCard, ClipboardList, Trophy, ArrowRight, X, Calendar } from 'lucide-react';

const ONBOARDED_KEY = 'sf-onboarded';
export const EXAM_DATE_KEY = 'sf-exam-date';

const FEATURES = [
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: '23 Modules',
    desc: 'Structured content covering all 6 COF-C02 domains — auto-marks complete as you scroll.',
    color: '#29b5e8',
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Flashcards',
    desc: 'SM-2 spaced repetition for active recall. Builds a daily study streak.',
    color: '#10b981',
  },
  {
    icon: <ClipboardList className="w-5 h-5" />,
    title: 'Mock Exam',
    desc: '100-question timed exam with domain breakdown, scoring, and history.',
    color: '#8b5cf6',
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    title: 'Cheat Sheets & Certificate',
    desc: 'Quick-reference sheets for every domain, plus a printable completion certificate.',
    color: '#f59e0b',
  },
];

export default function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [examDate, setExamDate] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      if (!localStorage.getItem(ONBOARDED_KEY)) {
        // Small delay so page paint finishes first
        setTimeout(() => setShow(true), 400);
      }
    } catch {}
  }, []);

  const handleComplete = () => {
    try {
      if (examDate) localStorage.setItem(EXAM_DATE_KEY, examDate);
      localStorage.setItem(ONBOARDED_KEY, '1');
      window.dispatchEvent(new CustomEvent('sf:onboarded', {}));
    } catch {}
    setShow(false);
  };

  const handleDismiss = () => {
    try { localStorage.setItem(ONBOARDED_KEY, '1'); } catch {}
    setShow(false);
  };

  if (!isClient || !show) return null;

  // Min date = today
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'modalFadeIn 0.25s ease',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Snowflake Training"
    >
      <div
        style={{
          background: 'var(--surface-card)',
          borderRadius: '1.25rem',
          width: '100%',
          maxWidth: '540px',
          boxShadow: '0 24px 64px rgb(0 0 0 / 0.3)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header gradient band */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
          padding: '1.5rem 1.5rem 1.25rem',
          position: 'relative',
        }}>
          <button
            onClick={handleDismiss}
            aria-label="Close welcome modal"
            style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            }}
          >
            <X className="w-4 h-4" />
          </button>

          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❄️</div>
          <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.375rem', margin: 0, lineHeight: 1.2 }}>
            Welcome to Snowflake Training
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.375rem', marginBottom: 0 }}>
            Your COF-C02 exam prep resource
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          {step === 0 ? (
            <>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 0, marginBottom: '1.25rem' }}>
                Here's what's included:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    style={{
                      border: '1px solid var(--surface-border)',
                      borderRadius: '0.75rem',
                      padding: '0.875rem',
                      background: 'var(--surface-card-2)',
                    }}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: `${f.color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: f.color, marginBottom: '0.5rem',
                    }}>
                      {f.icon}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {f.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {f.desc}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                style={{
                  width: '100%', padding: '0.875rem',
                  background: 'linear-gradient(135deg, #29b5e8, #56c4ed)',
                  color: 'white', border: 'none', borderRadius: '0.75rem',
                  fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                Next: Set your exam date <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleDismiss}
                style={{
                  width: '100%', marginTop: '0.5rem', padding: '0.625rem',
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: '0.8125rem', cursor: 'pointer',
                }}
              >
                Skip for now
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Calendar className="w-5 h-5" style={{ color: '#29b5e8', flexShrink: 0 }} />
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  When's your exam? <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.875rem' }}>(optional)</span>
                </h3>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 0, marginBottom: '1rem' }}>
                Set your target date and we'll show a countdown on every page to keep you on track.
              </p>

              <input
                type="date"
                min={today}
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem', boxSizing: 'border-box',
                  border: '2px solid var(--surface-border)',
                  borderRadius: '0.75rem',
                  background: 'var(--surface-card-2)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  outline: 'none',
                  marginBottom: '1.25rem',
                  cursor: 'pointer',
                }}
                aria-label="Target exam date"
              />

              {examDate && (() => {
                const days = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000);
                return (
                  <div style={{
                    padding: '0.75rem 1rem', borderRadius: '0.75rem',
                    background: days <= 14 ? '#fef3c7' : '#f0fdf4',
                    border: `1px solid ${days <= 14 ? '#fcd34d' : '#bbf7d0'}`,
                    marginBottom: '1.25rem',
                    fontSize: '0.875rem',
                    color: days <= 14 ? '#92400e' : '#166534',
                    fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                    {days <= 0 ? '⚠️ That date has passed!' :
                     days === 1 ? '⚡ Exam is tomorrow — good luck!' :
                     days <= 7 ? `⚡ ${days} days to go — keep going!` :
                     days <= 30 ? `📅 ${days} days to go — you've got this!` :
                     `🗓️ ${days} days to go — you have time, use it well.`}
                  </div>
                );
              })()}

              <button
                onClick={handleComplete}
                style={{
                  width: '100%', padding: '0.875rem',
                  background: 'linear-gradient(135deg, #29b5e8, #56c4ed)',
                  color: 'white', border: 'none', borderRadius: '0.75rem',
                  fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                Start Learning <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleComplete}
                style={{
                  width: '100%', marginTop: '0.5rem', padding: '0.625rem',
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: '0.8125rem', cursor: 'pointer',
                }}
              >
                Skip, I'll set it later
              </button>
            </>
          )}
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', paddingBottom: '1.25rem' }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              width: i === step ? '20px' : '8px', height: '8px',
              borderRadius: '9999px', transition: 'all 0.25s ease',
              background: i === step ? '#29b5e8' : 'var(--surface-border)',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
