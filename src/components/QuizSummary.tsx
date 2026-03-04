/**
 * QuizSummary — floating score badge that appears after the first quiz answer
 * on a module page. Listens for `quiz:answered` and `quiz:reset` events
 * dispatched by Quiz.tsx and counts [data-quiz] elements for the total.
 */
import { useEffect, useState } from 'react';
import { Trophy, X } from 'lucide-react';

export default function QuizSummary() {
  const [total, setTotal] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    // Count quiz questions on mount (slight delay for hydration)
    const countTotal = () => {
      const count = document.querySelectorAll('[data-quiz]').length;
      setTotal(count);
    };
    setTimeout(countTotal, 300);

    const onAnswered = (e: Event) => {
      const detail = (e as CustomEvent<{ correct: boolean }>).detail;
      setAnswered(prev => prev + 1);
      if (detail.correct) setCorrect(prev => prev + 1);
      setVisible(true);
    };

    const onReset = () => {
      setAnswered(prev => Math.max(0, prev - 1));
      // Correct count might be off after retry, but that's acceptable
    };

    window.addEventListener('quiz:answered', onAnswered);
    window.addEventListener('quiz:reset', onReset);
    return () => {
      window.removeEventListener('quiz:answered', onAnswered);
      window.removeEventListener('quiz:reset', onReset);
    };
  }, []);

  // Trigger celebration when all answered
  useEffect(() => {
    if (total > 0 && answered >= total && !celebrating) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 3000);
    }
  }, [answered, total]);

  if (!visible || dismissed || total === 0) return null;

  const allDone = answered >= total;
  const pct = Math.round((correct / Math.max(answered, 1)) * 100);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '5rem', // above MobileProgressBar
        right: '1rem',
        zIndex: 9980,
        background: allDone
          ? 'linear-gradient(135deg, #065f46, #047857)'
          : 'var(--surface-card)',
        border: `1px solid ${allDone ? '#34d399' : 'var(--surface-border)'}`,
        borderRadius: '0.875rem',
        padding: '0.75rem 1rem',
        boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        minWidth: '180px',
        animation: celebrating ? 'quizCelebrate 0.5s ease' : undefined,
      }}
      role="status"
      aria-label={`Quiz score: ${correct} of ${answered} correct`}
    >
      {/* Icon */}
      <div style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>
        {allDone ? <Trophy className="w-5 h-5" style={{ color: '#6ee7b7' }} /> : '📝'}
      </div>

      {/* Score */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: 700,
          fontSize: '0.875rem',
          color: allDone ? '#d1fae5' : 'var(--text-primary)',
          lineHeight: 1,
        }}>
          {correct}/{answered} correct
          {allDone && total > 0 && ` · ${pct}%`}
        </div>
        <div style={{
          fontSize: '0.7rem',
          color: allDone ? '#6ee7b7' : 'var(--text-muted)',
          marginTop: '0.15rem',
          lineHeight: 1,
        }}>
          {allDone
            ? celebrating ? 'All done! Great work!' : 'Module complete!'
            : `${total - answered} question${total - answered !== 1 ? 's' : ''} left`}
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss quiz summary"
        style={{
          flexShrink: 0, background: 'none', border: 'none', padding: '0.2rem',
          color: allDone ? '#6ee7b7' : 'var(--text-muted)', cursor: 'pointer', lineHeight: 1,
        }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
