import { useState, useEffect, useCallback } from 'react';
import { flashcards, type FlashcardData } from '../data/flashcards';

// ── SM-2 Spaced Repetition ──────────────────────────────────────────────────
interface CardSR {
  id: string;
  interval: number;      // days until next review
  repetitions: number;
  easeFactor: number;    // starts at 2.5
  nextReview: number;    // epoch ms
  totalReviews: number;
}

type Rating = 1 | 2 | 3 | 4; // Again | Hard | Good | Easy

function sm2(card: CardSR, rating: Rating): CardSR {
  let { interval, repetitions, easeFactor } = card;

  if (rating < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  }

  const delta = 0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02);
  easeFactor = Math.max(1.3, easeFactor + delta);

  if (rating === 1) { easeFactor = Math.max(1.3, easeFactor - 0.15); interval = 1; }
  if (rating === 2) { interval = Math.max(1, Math.round(interval * 1.2)); }

  return {
    ...card,
    interval,
    repetitions,
    easeFactor,
    nextReview: Date.now() + interval * 86400000,
    totalReviews: card.totalReviews + 1,
  };
}

const STORAGE_KEY = 'snowflake-sr-state';
const DOMAINS = ['All', 'Architecture', 'Security', 'Performance', 'Data Loading', 'Transformations', 'Data Protection'] as const;

function initCard(id: string): CardSR {
  return { id, interval: 1, repetitions: 0, easeFactor: 2.5, nextReview: 0, totalReviews: 0 };
}

// ── Component ──────────────────────────────────────────────────────────────
export default function FlashcardsApp() {
  const [cardStates, setCardStates] = useState<Record<string, CardSR>>({});
  const [domain, setDomain] = useState<string>('All');
  const [screen, setScreen] = useState<'hub' | 'study' | 'done'>('hub');
  const [queue, setQueue] = useState<FlashcardData[]>([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<Rating[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Load state from localStorage
  useEffect(() => {
    setIsClient(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCardStates(JSON.parse(raw));
    } catch {}
  }, []);

  const saveStates = useCallback((states: Record<string, CardSR>) => {
    setCardStates(states);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  }, []);

  // Filtered flashcards
  const filtered = domain === 'All' ? flashcards : flashcards.filter(c => c.domain === domain);

  // Stats
  const now = Date.now();
  const dueCards = filtered.filter(c => {
    const state = cardStates[c.id];
    return !state || state.nextReview <= now;
  });
  const newCards = filtered.filter(c => !cardStates[c.id]);
  const studiedCards = filtered.filter(c => cardStates[c.id]?.totalReviews > 0);
  const masteredCards = filtered.filter(c => (cardStates[c.id]?.interval ?? 0) >= 21);

  function startSession() {
    // Priority: overdue first, then new cards
    const overdue = filtered.filter(c => {
      const s = cardStates[c.id];
      return s && s.nextReview <= now;
    }).sort((a, b) => (cardStates[a.id]?.nextReview ?? 0) - (cardStates[b.id]?.nextReview ?? 0));

    const fresh = filtered.filter(c => !cardStates[c.id]);

    const sessionCards = [...overdue, ...fresh].slice(0, 30); // cap at 30 per session
    if (sessionCards.length === 0) return;

    setQueue(sessionCards);
    setQueueIdx(0);
    setFlipped(false);
    setSessionRatings([]);
    setScreen('study');
  }

  function handleRating(rating: Rating) {
    const card = queue[queueIdx];
    const currentState = cardStates[card.id] ?? initCard(card.id);
    const newState = sm2(currentState, rating);
    const newStates = { ...cardStates, [card.id]: newState };
    saveStates(newStates);
    setSessionRatings(prev => [...prev, rating]);

    if (queueIdx + 1 >= queue.length) {
      setScreen('done');
    } else {
      setQueueIdx(prev => prev + 1);
      setFlipped(false);
    }
  }

  function resetAll() {
    if (!confirm('Reset ALL flashcard progress? This cannot be undone.')) return;
    saveStates({});
    setScreen('hub');
  }

  const currentCard = queue[queueIdx];
  const progress = queue.length > 0 ? ((queueIdx) / queue.length) * 100 : 0;

  const ratingLabels: { rating: Rating; label: string; desc: string; color: string }[] = [
    { rating: 1, label: 'Again', desc: '<1 day', color: '#ef4444' },
    { rating: 2, label: 'Hard', desc: 'few days', color: '#f97316' },
    { rating: 3, label: 'Good', desc: `${(cardStates[currentCard?.id]?.interval ?? 1)} days`, color: '#22c55e' },
    { rating: 4, label: 'Easy', desc: 'longer', color: '#29b5e8' },
  ];

  if (!isClient) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm">Loading your progress…</div>
      </div>
    );
  }

  // ── HUB ─────────────────────────────────────────────────────────
  if (screen === 'hub') {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Domain filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {DOMAINS.map(d => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: domain === d ? 'linear-gradient(135deg, var(--color-snowflake-blue), var(--color-snowflake-sky))' : 'white',
                color: domain === d ? 'white' : 'var(--color-slate-600)',
                border: `1px solid ${domain === d ? 'transparent' : 'var(--color-slate-200)'}`,
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Due Now', value: dueCards.length, color: dueCards.length > 0 ? '#ef4444' : '#22c55e' },
            { label: 'New', value: newCards.length, color: 'var(--color-snowflake-blue)' },
            { label: 'Studied', value: studiedCards.length, color: '#7c3aed' },
            { label: 'Mastered', value: masteredCards.length, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="card text-center p-4">
              <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Cards list preview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800">{filtered.length} cards in "{domain}"</h3>
            <button onClick={resetAll} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
              Reset progress
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {filtered.map(card => {
              const s = cardStates[card.id];
              const isDue = !s || s.nextReview <= now;
              const daysLeft = s ? Math.ceil((s.nextReview - now) / 86400000) : 0;
              return (
                <div key={card.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-100 text-sm">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: !s ? '#94a3b8' : isDue ? '#ef4444' : '#22c55e' }}
                  />
                  <span className="flex-1 text-slate-700 truncate">{card.question.slice(0, 70)}…</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {!s ? 'New' : isDue ? 'Due' : `${daysLeft}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={startSession}
          disabled={dueCards.length === 0 && newCards.length === 0}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all"
          style={{
            background: (dueCards.length > 0 || newCards.length > 0)
              ? 'linear-gradient(135deg, var(--color-snowflake-blue), var(--color-snowflake-sky))'
              : '#e2e8f0',
            color: (dueCards.length > 0 || newCards.length > 0) ? 'white' : '#94a3b8',
          }}
        >
          {dueCards.length === 0 && newCards.length === 0
            ? '🎉 All caught up! Come back tomorrow.'
            : `Study ${Math.min(dueCards.length + newCards.length, 30)} Cards →`}
        </button>
      </div>
    );
  }

  // ── STUDY ───────────────────────────────────────────────────────
  if (screen === 'study' && currentCard) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setScreen('hub')}
            className="text-slate-400 hover:text-slate-600 transition-colors text-sm"
          >
            ← Exit
          </button>
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: '6px', background: '#e2e8f0' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--color-snowflake-blue), var(--color-snowflake-sky))',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span className="text-sm text-slate-500 flex-shrink-0">{queueIdx}/{queue.length}</span>
        </div>

        {/* Category badge */}
        <div className="mb-3">
          <span className="exam-badge">{currentCard.category}</span>
        </div>

        {/* Card */}
        <div
          className={`flashcard cursor-pointer mb-6 ${flipped ? 'flipped' : ''}`}
          onClick={() => !flipped && setFlipped(true)}
          style={{ minHeight: '220px' }}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front card flex items-center justify-center p-8 bg-gradient-to-br from-white to-slate-50">
              <div className="text-center">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-4">Question</div>
                <p className="text-xl font-semibold text-slate-800 leading-relaxed">{currentCard.question}</p>
                {!flipped && (
                  <div className="mt-6 text-sm text-slate-400">Tap to reveal answer</div>
                )}
              </div>
            </div>
            <div className="flashcard-back card flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, var(--color-snowflake-light), white)', borderColor: 'var(--color-snowflake-blue)' }}>
              <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-snowflake-blue)' }}>Answer</div>
                <p className="text-base text-slate-700 leading-relaxed">{currentCard.answer}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rating buttons — only show after flip */}
        {flipped ? (
          <div>
            <div className="text-center text-xs text-slate-400 mb-3 font-medium">How well did you know this?</div>
            <div className="grid grid-cols-4 gap-3">
              {ratingLabels.map(({ rating, label, desc, color }) => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  className="py-3 px-2 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                  style={{ background: color }}
                >
                  <div>{label}</div>
                  <div className="text-xs font-normal opacity-80">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={() => setFlipped(true)}
              className="btn-primary px-8 py-3"
            >
              Show Answer
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── DONE ────────────────────────────────────────────────────────
  if (screen === 'done') {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    sessionRatings.forEach(r => counts[r]++);
    const correct = counts[3] + counts[4];
    const pct = Math.round((correct / sessionRatings.length) * 100);

    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-5xl mb-4">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Complete!</h2>
        <p className="text-slate-500 mb-8">{sessionRatings.length} cards reviewed · {pct}% correct</p>

        <div className="grid grid-cols-4 gap-3 mb-8">
          {([
            { label: 'Again', count: counts[1], color: '#ef4444' },
            { label: 'Hard', count: counts[2], color: '#f97316' },
            { label: 'Good', count: counts[3], color: '#22c55e' },
            { label: 'Easy', count: counts[4], color: '#29b5e8' },
          ] as const).map(({ label, count, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className="text-2xl font-black mb-1" style={{ color }}>{count}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => setScreen('hub')} className="btn-secondary px-6 py-3">
            Back to Hub
          </button>
          <button onClick={startSession} className="btn-primary px-6 py-3">
            Study Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
