import { useState, useEffect, useCallback, useRef } from 'react';
import { flashcards, type FlashcardData } from '../data/flashcards';
import { ErrorBoundary } from './ErrorBoundary';

// ── SM-2 Spaced Repetition ───────────────────────────────────────────────────
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

// ── Inner component (wrapped by ErrorBoundary below) ─────────────────────────
function FlashcardsAppInner() {
  const [cardStates, setCardStates] = useState<Record<string, CardSR>>({});
  const [domain, setDomain] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [screen, setScreen] = useState<'hub' | 'study' | 'done'>('hub');
  const [queue, setQueue] = useState<FlashcardData[]>([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<Rating[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(states)); } catch {}
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  const handleRating = useCallback((rating: Rating) => {
    const card = queue[queueIdx];
    if (!card) return;
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
  }, [queue, queueIdx, cardStates, saveStates]);

  const flipCard = useCallback(() => setFlipped(true), []);

  useEffect(() => {
    if (screen !== 'study') return;

    function onKey(e: KeyboardEvent) {
      // Don't fire if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!flipped) flipCard();
      }
      if (flipped) {
        if (e.key === '1') handleRating(1);
        if (e.key === '2') handleRating(2);
        if (e.key === '3') handleRating(3);
        if (e.key === '4') handleRating(4);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, flipped, flipCard, handleRating]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const now = Date.now();
  const domainFiltered = domain === 'All' ? flashcards : flashcards.filter(c => c.domain === domain);
  const filtered = search.trim()
    ? domainFiltered.filter(c =>
        c.question.toLowerCase().includes(search.trim().toLowerCase()) ||
        c.answer.toLowerCase().includes(search.trim().toLowerCase())
      )
    : domainFiltered;

  const dueCards    = filtered.filter(c => { const s = cardStates[c.id]; return !s || s.nextReview <= now; });
  const newCards    = filtered.filter(c => !cardStates[c.id]);
  const studiedCards = filtered.filter(c => cardStates[c.id]?.totalReviews > 0);
  const masteredCards = filtered.filter(c => (cardStates[c.id]?.interval ?? 0) >= 21);

  // Next scheduled review (earliest future nextReview across all studied cards)
  const nextReviewMs = domainFiltered.reduce<number | null>((min, c) => {
    const s = cardStates[c.id];
    if (!s || s.nextReview <= now) return min;
    return min === null ? s.nextReview : Math.min(min, s.nextReview);
  }, null);
  function formatNextReview(ms: number): string {
    const diff = ms - now;
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hrs >= 24) return `in ${Math.floor(hrs / 24)}d`;
    if (hrs > 0) return `in ${hrs}h ${mins}m`;
    return `in ${Math.max(1, mins)}m`;
  }

  function startSession() {
    const overdue = filtered.filter(c => {
      const s = cardStates[c.id];
      return s && s.nextReview <= now;
    }).sort((a, b) => (cardStates[a.id]?.nextReview ?? 0) - (cardStates[b.id]?.nextReview ?? 0));
    const fresh = filtered.filter(c => !cardStates[c.id]);
    const sessionCards = [...overdue, ...fresh].slice(0, 30);
    if (sessionCards.length === 0) return;
    setQueue(sessionCards);
    setQueueIdx(0);
    setFlipped(false);
    setSessionRatings([]);
    setScreen('study');
  }

  function resetAll() {
    if (!confirm('Reset ALL flashcard progress? This cannot be undone.')) return;
    saveStates({});
    setScreen('hub');
  }

  // ── Export / Import ────────────────────────────────────────────────────────
  function exportProgress() {
    const data = {
      exportedAt: new Date().toISOString(),
      version: 1,
      cardStates,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snowflake-flashcards-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed.cardStates || typeof parsed.cardStates !== 'object') throw new Error('Invalid format');
        if (!confirm(`Import ${Object.keys(parsed.cardStates).length} card records? This will overwrite your current progress.`)) return;
        saveStates(parsed.cardStates);
        setImportError('');
      } catch {
        setImportError('Invalid file. Please use a previously exported JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  }

  const currentCard = queue[queueIdx];
  const progress = queue.length > 0 ? (queueIdx / queue.length) * 100 : 0;

  const ratingLabels: { rating: Rating; label: string; desc: string; color: string; key: string }[] = [
    { rating: 1, label: 'Again', desc: '<1 day',  color: '#ef4444', key: '1' },
    { rating: 2, label: 'Hard',  desc: 'few days', color: '#f97316', key: '2' },
    { rating: 3, label: 'Good',  desc: `${(cardStates[currentCard?.id]?.interval ?? 1)}d`, color: '#22c55e', key: '3' },
    { rating: 4, label: 'Easy',  desc: 'longer',   color: '#29b5e8', key: '4' },
  ];

  if (!isClient) {
    return (
      <div className="max-w-3xl mx-auto" aria-busy="true" aria-label="Loading flashcards">
        {/* Domain filter pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[80, 64, 72, 88, 96, 64, 80].map((w, i) => (
            <div key={i} className="skeleton h-9 rounded-full" style={{ width: `${w}px` }} />
          ))}
        </div>
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[0,1,2,3].map(i => (
            <div key={i} className="card p-4 text-center">
              <div className="skeleton h-8 w-10 mx-auto mb-2 rounded" />
              <div className="skeleton h-3 w-14 mx-auto rounded" />
            </div>
          ))}
        </div>
        {/* Card list */}
        <div className="space-y-2 mb-6">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="skeleton h-11 w-full" />
          ))}
        </div>
        {/* Start button */}
        <div className="skeleton h-14 w-full rounded-xl mb-6" />
      </div>
    );
  }

  // ── HUB ───────────────────────────────────────────────────────────────────
  if (screen === 'hub') {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Search + Domain filter row */}
        <div className="mb-6">
          <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cards by keyword…"
              aria-label="Search flashcards"
              style={{
                width: '100%', padding: '0.625rem 1rem 0.625rem 2.25rem',
                borderRadius: '0.625rem', border: '1px solid var(--surface-border)',
                background: 'var(--surface-card)', color: 'var(--text-primary)',
                fontSize: '0.875rem', outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-snowflake-blue)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--surface-border)')}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  fontSize: '1rem', lineHeight: 1,
                }}
              >×</button>
            )}
          </div>

          {/* Domain filter pills */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by domain">
          {DOMAINS.map(d => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              aria-pressed={domain === d}
              style={{
                background: domain === d ? 'linear-gradient(135deg, var(--color-snowflake-blue), var(--color-snowflake-sky))' : 'var(--surface-card)',
                color: domain === d ? 'white' : 'var(--text-muted)',
                border: `1px solid ${domain === d ? 'transparent' : 'var(--surface-border)'}`,
              }}
            >
              {d}
            </button>
          ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Due Now',  value: dueCards.length,     color: dueCards.length > 0 ? '#ef4444' : '#22c55e' },
            { label: 'New',      value: newCards.length,      color: 'var(--color-snowflake-blue)' },
            { label: 'Studied',  value: studiedCards.length,  color: '#7c3aed' },
            { label: 'Mastered', value: masteredCards.length, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="card text-center p-4">
              <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Cards list preview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {filtered.length} {search ? `result${filtered.length !== 1 ? 's' : ''}` : `card${filtered.length !== 1 ? 's' : ''}`}
              {search ? ` for "${search}"` : ` in "${domain}"`}
            </h3>
            <button onClick={resetAll} className="text-xs hover:text-red-500 transition-colors" style={{ color: 'var(--text-muted)' }}>
              Reset progress
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1" role="list" aria-label="Card list">
            {filtered.map(card => {
              const s = cardStates[card.id];
              const isDue = !s || s.nextReview <= now;
              const daysLeft = s ? Math.ceil((s.nextReview - now) / 86400000) : 0;
              return (
                <div key={card.id} className="flex items-center gap-3 p-3 rounded-lg border text-sm" style={{ background: 'var(--surface-card)', borderColor: 'var(--surface-border)' }} role="listitem">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: !s ? '#94a3b8' : isDue ? '#ef4444' : '#22c55e' }} aria-hidden="true" />
                  <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{card.question.slice(0, 70)}…</span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {!s ? 'New' : isDue ? 'Due' : `${daysLeft}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={startSession}
          disabled={dueCards.length === 0 && newCards.length === 0}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all mb-6"
          style={{
            background: (dueCards.length > 0 || newCards.length > 0)
              ? 'linear-gradient(135deg, var(--color-snowflake-blue), var(--color-snowflake-sky))'
              : 'var(--surface-border)',
            color: (dueCards.length > 0 || newCards.length > 0) ? 'white' : 'var(--text-muted)',
          }}
        >
          {dueCards.length === 0 && newCards.length === 0
            ? nextReviewMs
              ? `🎉 All caught up! Next review ${formatNextReview(nextReviewMs)}`
              : '🎉 All cards mastered!'
            : `Study ${Math.min(dueCards.length + newCards.length, 30)} Cards →`}
        </button>

        {/* Export / Import */}
        <div className="border rounded-xl p-4 flex flex-wrap items-center gap-3" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-card-2)' }}>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Progress backup</span>
          <div className="flex gap-2 ml-auto flex-wrap">
            <button
              onClick={exportProgress}
              className="text-xs px-3 py-1.5 rounded-lg font-medium border transition-all"
              style={{ borderColor: 'var(--color-snowflake-blue)', color: 'var(--color-snowflake-blue)', background: 'transparent' }}
            >
              Export JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-lg font-medium border transition-all"
              style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)', background: 'transparent' }}
            >
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
              aria-label="Import progress JSON file"
            />
          </div>
          {importError && (
            <p className="w-full text-xs text-red-600 mt-1" role="alert">{importError}</p>
          )}
        </div>
      </div>
    );
  }

  // ── STUDY ─────────────────────────────────────────────────────────────────
  if (screen === 'study' && currentCard) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setScreen('hub')}
            className="text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Exit session and return to hub"
          >
            ← Exit
          </button>
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: '6px', background: 'var(--surface-border)' }} role="progressbar" aria-valuenow={queueIdx} aria-valuemax={queue.length} aria-valuetext={`Card ${queueIdx} of ${queue.length}`}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--color-snowflake-blue), var(--color-snowflake-sky))',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{queueIdx}/{queue.length}</span>
        </div>

        {/* Category badge */}
        <div className="mb-3">
          <span className="exam-badge">{currentCard.category}</span>
        </div>

        {/* Keyboard hint */}
        <div className="text-xs text-right mb-2" style={{ color: 'var(--text-muted)' }}>
          {!flipped ? (
            <span>Press <kbd className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--surface-card-2)', border: '1px solid var(--surface-border)' }}>Space</kbd> to flip</span>
          ) : (
            <span>Press <kbd className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--surface-card-2)', border: '1px solid var(--surface-border)' }}>1</kbd>–<kbd className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--surface-card-2)', border: '1px solid var(--surface-border)' }}>4</kbd> to rate</span>
          )}
        </div>

        {/* Card */}
        <div
          className={`flashcard cursor-pointer mb-6 ${flipped ? 'flipped' : ''}`}
          onClick={() => !flipped && flipCard()}
          style={{ minHeight: '220px' }}
          role="button"
          tabIndex={0}
          aria-label={flipped ? `Answer: ${currentCard.answer}` : `Question: ${currentCard.question}. Press Space or click to reveal.`}
          onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !flipped) { e.preventDefault(); flipCard(); } }}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front card flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, var(--surface-card), var(--surface-card-2))' }}>
              <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Question</div>
                <p className="text-xl font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>{currentCard.question}</p>
                {!flipped && (
                  <div className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>Tap to reveal answer</div>
                )}
              </div>
            </div>
            <div className="flashcard-back card flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, var(--color-snowflake-light), white)', borderColor: 'var(--color-snowflake-blue)' }}>
              <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-snowflake-blue)' }}>Answer</div>
                <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{currentCard.answer}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rating buttons — only show after flip */}
        {flipped ? (
          <div>
            <div className="text-center text-xs mb-3 font-medium" style={{ color: 'var(--text-muted)' }}>How well did you know this?</div>
            <div className="grid grid-cols-4 gap-3" role="group" aria-label="Rate your recall">
              {ratingLabels.map(({ rating, label, desc, color, key }) => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  className="py-3 px-2 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                  style={{ background: color }}
                  aria-label={`${label} — ${desc} (press ${key})`}
                >
                  <div>{label}</div>
                  <div className="text-xs font-normal opacity-80">{desc}</div>
                  <div className="text-xs font-normal opacity-50 mt-0.5">[{key}]</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button onClick={flipCard} className="btn-primary px-8 py-3">
              Show Answer
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (screen === 'done') {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    sessionRatings.forEach(r => counts[r]++);
    const correct = counts[3] + counts[4];
    const pct = Math.round((correct / sessionRatings.length) * 100);

    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-5xl mb-4" aria-hidden="true">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Session Complete!</h2>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>{sessionRatings.length} cards reviewed · {pct}% correct</p>

        <div className="grid grid-cols-4 gap-3 mb-8">
          {([
            { label: 'Again', count: counts[1], color: '#ef4444' },
            { label: 'Hard',  count: counts[2], color: '#f97316' },
            { label: 'Good',  count: counts[3], color: '#22c55e' },
            { label: 'Easy',  count: counts[4], color: '#29b5e8' },
          ] as const).map(({ label, count, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className="text-2xl font-black mb-1" style={{ color }}>{count}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => setScreen('hub')} className="btn-secondary px-6 py-3">
            Back to Hub
          </button>
          <button onClick={startSession} className="btn-primary px-6 py-3"
            disabled={dueCards.length === 0 && newCards.length === 0}
          >
            Study Again
          </button>
          <a href="/exam-sim" className="px-6 py-3 rounded-xl font-semibold text-white no-underline" style={{ background: '#22c55e' }}>
            Take Mock Exam →
          </a>
        </div>
      </div>
    );
  }

  return null;
}

// ── Public export — self-wrapped in ErrorBoundary ─────────────────────────────
export default function FlashcardsApp() {
  return (
    <ErrorBoundary>
      <FlashcardsAppInner />
    </ErrorBoundary>
  );
}
