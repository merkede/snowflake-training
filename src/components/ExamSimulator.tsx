import { useState, useEffect, useRef, useCallback } from 'react';
import { examQuestions, type ExamQuestion } from '../data/examQuestions';
import { CheckCircle2, XCircle, Flag, Clock, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, RotateCcw } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

type Mode = 'setup' | 'exam' | 'review';
type ExamMode = 'full' | 'quick' | 'bookmarked' | 'weak';
type SetupTab = 'new' | 'history';

const DOMAIN_COLORS: Record<number, string> = {
  1: '#29b5e8', 2: '#7c3aed', 3: '#ea580c',
  4: '#16a34a', 5: '#db2777', 6: '#164365',
};

const DOMAIN_NAMES: Record<number, string> = {
  1: 'Architecture & Features',
  2: 'Account Access & Security',
  3: 'Performance Concepts',
  4: 'Data Loading & Unloading',
  5: 'Data Transformations',
  6: 'Data Protection & Sharing',
};

// ── Storage keys ───────────────────────────────────────────────────────────
const KEYS = {
  autosave:  'snowflake-exam-autosave',
  history:   'snowflake-exam-history',
  bookmarks: 'snowflake-exam-bookmarks',
  weak:      'snowflake-exam-weak',
};

interface ExamRecord {
  date: string;
  score: number;
  total: number;
  pct: number;
  passed: boolean;
  examMode: ExamMode;
  domainBreakdown: Record<number, { correct: number; total: number }>;
}

interface AutoSave {
  questions: ExamQuestion[];
  answers: Record<number, string>;
  flagged: number[];
  currentIdx: number;
  timeLeft: number;
  examMode: ExamMode;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ls<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Inner component ────────────────────────────────────────────────────────
function ExamSimulatorInner() {
  const [mode, setMode] = useState<Mode>('setup');
  const [setupTab, setSetupTab] = useState<SetupTab>('new');
  const [examMode, setExamMode] = useState<ExamMode>('full');
  const [filterDomain, setFilterDomain] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);

  // Review state — declared unconditionally (Rules of Hooks)
  const [reviewQ, setReviewQ] = useState<number | null>(null);
  const [showAllAnnotated, setShowAllAnnotated] = useState(false);

  // Persistent data
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set()); // question IDs
  const [weakMap, setWeakMap] = useState<Record<number, { w: number; c: number }>>({}); // qId → {wrong, correct}
  const [history, setHistory] = useState<ExamRecord[]>([]);
  const [hasSaved, setHasSaved] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load persisted data on mount
  useEffect(() => {
    setIsClient(true);
    setBookmarks(new Set(ls<number[]>(KEYS.bookmarks, [])));
    setWeakMap(ls(KEYS.weak, {}));
    setHistory(ls<ExamRecord[]>(KEYS.history, []));
    setHasSaved(!!localStorage.getItem(KEYS.autosave));
  }, []);

  // Timer
  useEffect(() => {
    if (mode === 'exam' && !examSubmitted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setExamSubmitted(true);
            setMode('review');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, examSubmitted]);

  // Auto-save exam state whenever answers/position/time changes
  useEffect(() => {
    if (mode !== 'exam' || examSubmitted) return;
    const save: AutoSave = {
      questions,
      answers,
      flagged: [...flagged],
      currentIdx,
      timeLeft,
      examMode,
    };
    lsSet(KEYS.autosave, save);
  }, [mode, examSubmitted, answers, flagged, currentIdx, timeLeft, questions, examMode]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const totalTime = (em: ExamMode) => em === 'full' ? 115 * 60 : 30 * 60;
  const questionCount = (em: ExamMode) => em === 'full' ? 100 : 20;

  function buildPool(em: ExamMode): ExamQuestion[] {
    if (em === 'bookmarked') {
      const bkIds = [...bookmarks];
      const pool = examQuestions.filter(q => bkIds.includes(q.id));
      return pool.length > 0 ? pool : examQuestions; // fallback
    }
    if (em === 'weak') {
      const weakIds = Object.entries(weakMap)
        .filter(([, v]) => v.w > 0)
        .sort(([, a], [, b]) => (b.w - b.c) - (a.w - a.c))
        .map(([id]) => Number(id));
      const pool = examQuestions.filter(q => weakIds.includes(q.id));
      return pool.length >= 5 ? pool : examQuestions; // fallback if insufficient
    }
    if (em === 'quick' && filterDomain) {
      return examQuestions.filter(q => q.domainNum === filterDomain);
    }
    return examQuestions;
  }

  function startExam() {
    const pool = buildPool(examMode);
    const count = examMode === 'full' ? 100 : Math.min(20, pool.length);
    const shuffled = shuffle(pool).slice(0, count);
    setQuestions(shuffled);
    setAnswers({});
    setFlagged(new Set());
    setCurrentIdx(0);
    setTimeLeft(totalTime(examMode));
    setExamSubmitted(false);
    setReviewQ(null);
    setShowAllAnnotated(false);
    lsSet(KEYS.autosave, null);
    setMode('exam');
  }

  function resumeExam() {
    const saved = ls<AutoSave | null>(KEYS.autosave, null);
    if (!saved) return;
    setQuestions(saved.questions);
    setAnswers(saved.answers);
    setFlagged(new Set(saved.flagged));
    setCurrentIdx(saved.currentIdx);
    setTimeLeft(saved.timeLeft);
    setExamMode(saved.examMode);
    setExamSubmitted(false);
    setReviewQ(null);
    setShowAllAnnotated(false);
    setMode('exam');
  }

  function submitExam() {
    const unanswered = questions.filter((_, i) => !answers[i]).length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`)) return;
    }
    if (timerRef.current) clearInterval(timerRef.current);

    // Compute domain breakdown
    const domainBreakdown: Record<number, { correct: number; total: number }> = {};
    questions.forEach((q, i) => {
      if (!domainBreakdown[q.domainNum]) domainBreakdown[q.domainNum] = { correct: 0, total: 0 };
      domainBreakdown[q.domainNum].total++;
      if (answers[i] === q.correct) domainBreakdown[q.domainNum].correct++;
    });

    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    const pct = Math.round((correct / questions.length) * 100);

    // Update history
    const record: ExamRecord = {
      date: new Date().toISOString(),
      score: correct,
      total: questions.length,
      pct,
      passed: pct >= 75,
      examMode,
      domainBreakdown,
    };
    const newHistory = [record, ...history].slice(0, 20);
    setHistory(newHistory);
    lsSet(KEYS.history, newHistory);

    // Update weak areas
    const newWeak = { ...weakMap };
    questions.forEach((q, i) => {
      if (!newWeak[q.id]) newWeak[q.id] = { w: 0, c: 0 };
      if (answers[i] === q.correct) newWeak[q.id].c++;
      else newWeak[q.id].w++;
    });
    setWeakMap(newWeak);
    lsSet(KEYS.weak, newWeak);

    // Clear autosave
    lsSet(KEYS.autosave, null);
    setHasSaved(false);
    setExamSubmitted(true);
    setReviewQ(null);
    setShowAllAnnotated(false);
    setMode('review');
  }

  function toggleFlag(idx: number) {
    setFlagged(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  }

  function toggleBookmark(questionId: number) {
    setBookmarks(prev => {
      const n = new Set(prev);
      n.has(questionId) ? n.delete(questionId) : n.add(questionId);
      lsSet(KEYS.bookmarks, [...n]);
      return n;
    });
  }

  function resetWeakAreas() {
    if (!confirm('Clear all weak-area data? This cannot be undone.')) return;
    setWeakMap({});
    lsSet(KEYS.weak, {});
  }

  const weakCount = Object.values(weakMap).filter(v => v.w > v.c).length;
  const bookmarkCount = bookmarks.size;

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (mode === 'setup') {
    const savedInfo = hasSaved ? ls<AutoSave | null>(KEYS.autosave, null) : null;

    return (
      <div className="max-w-2xl mx-auto">
        {/* Resume banner */}
        {savedInfo && (
          <div className="rounded-xl border-2 p-4 mb-6 flex items-center gap-3 flex-wrap" style={{ borderColor: '#f59e0b', background: '#fffbeb' }}>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold" style={{ color: '#92400e' }}>Exam in progress</div>
              <div className="text-xs" style={{ color: '#a16207' }}>
                Q{savedInfo.currentIdx + 1} of {savedInfo.questions.length} · {formatTime(savedInfo.timeLeft)} remaining
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resumeExam}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                style={{ background: '#f59e0b' }}
              >
                Resume →
              </button>
              <button
                onClick={() => { lsSet(KEYS.autosave, null); setHasSaved(false); }}
                className="px-3 py-2 rounded-lg text-sm text-amber-700 hover:bg-amber-100"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Tabs: New Exam / History */}
        <div className="flex border-b border-slate-200 mb-6" role="tablist">
          {(['new', 'history'] as SetupTab[]).map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={setupTab === tab}
              onClick={() => setSetupTab(tab)}
              className="px-5 py-3 text-sm font-semibold capitalize transition-colors"
              style={{
                color: setupTab === tab ? 'var(--color-snowflake-blue)' : 'var(--text-muted)',
                borderBottom: setupTab === tab ? '2px solid var(--color-snowflake-blue)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {tab === 'new' ? 'New Exam' : `History ${history.length > 0 ? `(${history.length})` : ''}`}
            </button>
          ))}
        </div>

        {setupTab === 'new' && (
          <>
            {/* Mode selector */}
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {([
                { key: 'full'       as ExamMode, icon: '📋', title: 'Full Mock Exam',        desc: '100 questions · 115 minutes · All domains' },
                { key: 'quick'      as ExamMode, icon: '⚡', title: 'Quick Practice',         desc: '20 questions · 30 minutes · Domain optional' },
                { key: 'bookmarked' as ExamMode, icon: '🔖', title: `Bookmarked (${bookmarkCount})`, desc: 'Review your saved questions' },
                { key: 'weak'       as ExamMode, icon: '🎯', title: `Weak Areas (${weakCount})`,    desc: 'Focus on questions you got wrong' },
              ]).map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setExamMode(opt.key)}
                  disabled={(opt.key === 'bookmarked' && bookmarkCount === 0) || (opt.key === 'weak' && weakCount === 0)}
                  className="p-4 rounded-xl border-2 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-pressed={examMode === opt.key}
                  style={{
                    borderColor: examMode === opt.key ? 'var(--color-snowflake-blue)' : 'var(--surface-border)',
                    background: examMode === opt.key ? 'var(--color-snowflake-light)' : 'var(--surface-card)',
                  }}
                >
                  <div className="text-xl mb-1.5" aria-hidden="true">{opt.icon}</div>
                  <div className="font-bold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{opt.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.desc}</div>
                </button>
              ))}
            </div>

            {/* Domain filter for quick mode */}
            {examMode === 'quick' && (
              <div className="mb-6">
                <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Focus domain (optional):</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFilterDomain(null)}
                    className="p-3 rounded-lg border text-left text-sm transition-all"
                    style={{
                      borderColor: filterDomain === null ? 'var(--color-snowflake-blue)' : 'var(--surface-border)',
                      background: filterDomain === null ? 'var(--color-snowflake-light)' : 'var(--surface-card)',
                      fontWeight: filterDomain === null ? 600 : 400,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    All domains (random mix)
                  </button>
                  {Object.entries(DOMAIN_NAMES).map(([num, name]) => {
                    const n = Number(num);
                    return (
                      <button
                        key={n}
                        onClick={() => setFilterDomain(n)}
                        className="p-3 rounded-lg border text-left text-sm transition-all"
                        style={{
                          borderColor: filterDomain === n ? DOMAIN_COLORS[n] : 'var(--surface-border)',
                          background: filterDomain === n ? 'var(--surface-card-2)' : 'var(--surface-card)',
                          fontWeight: filterDomain === n ? 600 : 400,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span style={{ color: DOMAIN_COLORS[n] }}>●</span> {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Exam info */}
            <div className="card mb-6 p-4 flex gap-6 text-sm flex-wrap" style={{ color: 'var(--text-muted)' }}>
              <div><span className="font-bold" style={{ color: 'var(--text-primary)' }}>{examMode === 'full' ? 100 : 20}</span> questions</div>
              <div><span className="font-bold" style={{ color: 'var(--text-primary)' }}>{examMode === 'full' ? '115' : '30'}</span> minutes</div>
              <div>Pass mark: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>≥75%</span></div>
              {weakCount > 0 && (
                <button onClick={resetWeakAreas} className="ml-auto text-xs hover:text-red-500 transition-colors" style={{ color: 'var(--text-muted)' }}>
                  Clear weak data
                </button>
              )}
            </div>

            <button
              onClick={startExam}
              className="w-full py-4 rounded-xl font-bold text-lg text-white"
              style={{ background: 'linear-gradient(135deg, var(--color-snowflake-blue), var(--color-snowflake-sky))' }}
            >
              Start Exam →
            </button>
          </>
        )}

        {setupTab === 'history' && (
          <div>
            {history.length === 0 ? (
              <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
                <div className="text-4xl mb-3" aria-hidden="true">📊</div>
                <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No exam history yet</p>
                <p className="text-sm">Complete your first exam to start tracking your progress.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((r, i) => (
                  <div key={i} className="card p-4">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <span
                          className="text-2xl font-black mr-2"
                          style={{ color: r.passed ? '#22c55e' : '#ef4444' }}
                        >
                          {r.pct}%
                        </span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: r.passed ? '#dcfce7' : '#fee2e2',
                            color: r.passed ? '#166534' : '#991b1b',
                          }}
                        >
                          {r.passed ? '✓ PASS' : '✗ FAIL'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(r.date)}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {r.score}/{r.total} · {r.examMode}
                        </div>
                      </div>
                    </div>
                    {/* Mini domain breakdown */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {Object.entries(r.domainBreakdown).map(([num, stat]) => {
                        const dpct = Math.round((stat.correct / stat.total) * 100);
                        return (
                          <div key={num} className="text-center rounded p-1.5" style={{ background: 'var(--surface-card-2)' }}>
                            <div className="text-xs font-bold" style={{ color: DOMAIN_COLORS[Number(num)] }}>D{num}: {dpct}%</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.correct}/{stat.total}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => { if (confirm('Clear all exam history?')) { setHistory([]); lsSet(KEYS.history, []); } }}
                  className="text-xs w-full text-center py-2 hover:text-red-500 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Clear history
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── EXAM ──────────────────────────────────────────────────────────────────
  if (mode === 'exam') {
    const q = questions[currentIdx];
    const answeredCount = Object.keys(answers).length;
    const timeWarning = timeLeft < 600;
    const isBookmarked = bookmarks.has(q.id);

    return (
      <div className="max-w-4xl mx-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6 p-3 rounded-xl border shadow-sm flex-wrap gap-2" style={{ background: 'var(--surface-card)', borderColor: 'var(--surface-border)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Q{currentIdx + 1} of {questions.length}
            <span className="mx-2" style={{ color: 'var(--surface-border)' }}>|</span>
            <span>{answeredCount} answered</span>
            {flagged.size > 0 && <span className="text-amber-500 ml-1">· {flagged.size} flagged</span>}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1.5 rounded-lg"
              style={{
                background: timeWarning ? '#fef2f2' : '#f0f9ff',
                color: timeWarning ? '#dc2626' : 'var(--color-snowflake-dark)',
              }}
              aria-live="polite"
              aria-label={`Time remaining: ${formatTime(timeLeft)}`}
            >
              <Clock className="w-4 h-4" aria-hidden="true" />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={submitExam}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#22c55e' }}
            >
              Submit
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_220px] gap-6">
          {/* Question panel */}
          <div>
            {/* Domain tag + flags */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: DOMAIN_COLORS[q.domainNum] }}>
                Domain {q.domainNum}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{q.domain}</span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => toggleBookmark(q.id)}
                  className="flex items-center gap-1 text-xs transition-colors"
                  style={{ color: isBookmarked ? '#7c3aed' : 'var(--text-muted)' }}
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this question'}
                  aria-pressed={isBookmarked}
                >
                  {isBookmarked
                    ? <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
                    : <Bookmark className="w-4 h-4" aria-hidden="true" />
                  }
                  {isBookmarked ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={() => toggleFlag(currentIdx)}
                  className="flex items-center gap-1 text-xs transition-colors"
                  style={{ color: flagged.has(currentIdx) ? '#f59e0b' : 'var(--text-muted)' }}
                  aria-label={flagged.has(currentIdx) ? 'Remove flag' : 'Flag for review'}
                  aria-pressed={flagged.has(currentIdx)}
                >
                  <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                  {flagged.has(currentIdx) ? 'Flagged' : 'Flag'}
                </button>
              </div>
            </div>

            {/* Question */}
            <div className="p-5 rounded-xl mb-4" style={{ background: 'linear-gradient(135deg, var(--color-snowflake-dark), var(--color-snowflake-navy))' }}>
              <p className="text-white font-semibold leading-relaxed">{q.question}</p>
            </div>

            {/* Options */}
            <fieldset className="space-y-3 mb-6">
              <legend className="sr-only">Answer options for question {currentIdx + 1}</legend>
              {q.options.map(opt => {
                const isSelected = answers[currentIdx] === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setAnswers(prev => ({ ...prev, [currentIdx]: opt.label }))}
                    className="w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: isSelected ? 'var(--color-snowflake-blue)' : 'var(--surface-border)',
                      background: isSelected ? 'var(--color-snowflake-light)' : 'var(--surface-card)',
                    }}
                    aria-pressed={isSelected}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        background: isSelected ? 'var(--color-snowflake-blue)' : 'var(--surface-card-2)',
                        color: isSelected ? 'white' : 'var(--text-muted)',
                      }}
                      aria-hidden="true"
                    >
                      {opt.label}
                    </span>
                    <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{opt.text}</span>
                  </button>
                );
              })}
            </fieldset>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                style={{ background: 'var(--surface-card-2)', color: 'var(--text-secondary)' }}
                aria-label="Previous question"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Previous
              </button>
              <button
                onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                disabled={currentIdx === questions.length - 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                style={{ background: 'var(--surface-card-2)', color: 'var(--text-secondary)' }}
                aria-label="Next question"
              >
                Next <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Question navigator */}
          <div className="rounded-xl border p-4 self-start sticky top-24" style={{ background: 'var(--surface-card)', borderColor: 'var(--surface-border)' }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Navigator</div>
            <div className="grid grid-cols-5 gap-1" role="group" aria-label="Question navigator">
              {questions.map((_, i) => {
                const isAnswered = !!answers[i];
                const isFlagged = flagged.has(i);
                const isCurrent = i === currentIdx;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className="w-8 h-8 rounded text-xs font-bold transition-all"
                    aria-label={`Question ${i + 1}${isAnswered ? ', answered' : ''}${isFlagged ? ', flagged' : ''}`}
                    aria-current={isCurrent ? 'true' : undefined}
                    style={{
                      background: isCurrent ? 'var(--color-snowflake-blue)' : isFlagged ? '#fef3c7' : isAnswered ? '#dcfce7' : 'var(--surface-card-2)',
                      color: isCurrent ? 'white' : isFlagged ? '#92400e' : isAnswered ? '#166534' : 'var(--text-muted)',
                      outline: isCurrent ? '2px solid var(--color-snowflake-blue)' : 'none',
                      outlineOffset: '1px',
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-100 inline-block" aria-hidden="true" /> Answered</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-100 inline-block" aria-hidden="true" /> Flagged</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded inline-block" style={{ background: 'var(--surface-card-2)' }} aria-hidden="true" /> Unanswered</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── REVIEW ────────────────────────────────────────────────────────────────
  if (mode === 'review') {
    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    const pct = Math.round((correct / questions.length) * 100);
    const passed = pct >= 75;

    const domainStats: Record<number, { correct: number; total: number; name: string }> = {};
    questions.forEach((q, i) => {
      if (!domainStats[q.domainNum]) domainStats[q.domainNum] = { correct: 0, total: 0, name: q.domain };
      domainStats[q.domainNum].total++;
      if (answers[i] === q.correct) domainStats[q.domainNum].correct++;
    });

    return (
      <div className="max-w-4xl mx-auto">
        {/* Score banner */}
        <div
          className="rounded-2xl p-8 text-center text-white mb-8"
          style={{ background: passed ? 'linear-gradient(135deg, #166534, #22c55e)' : 'linear-gradient(135deg, #991b1b, #ef4444)' }}
          role="region"
          aria-label={`Exam result: ${pct}% — ${passed ? 'Pass' : 'Fail'}`}
        >
          <div className="text-6xl font-black mb-2">{pct}%</div>
          <div className="text-xl font-bold mb-1">{passed ? '✓ PASS' : '✗ FAIL'}</div>
          <div className="opacity-80 text-sm">{correct}/{questions.length} correct · Pass mark: 75%</div>
          {passed && (
            <a
              href="/certificate"
              className="inline-block mt-4 px-5 py-2 rounded-lg text-sm font-bold no-underline"
              style={{ background: 'rgba(255,255,255,0.25)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}
            >
              🏆 Get Your Certificate
            </a>
          )}
        </div>

        {/* Domain breakdown */}
        <div className="card mb-8 p-6">
          <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Score by Domain</h3>
          <div className="space-y-3">
            {Object.entries(domainStats).sort(([a], [b]) => Number(a) - Number(b)).map(([num, stat]) => {
              const dpct = Math.round((stat.correct / stat.total) * 100);
              return (
                <div key={num}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{stat.name}</span>
                    <span className="font-bold" style={{ color: DOMAIN_COLORS[Number(num)] }}>{dpct}% ({stat.correct}/{stat.total})</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: '6px', background: 'var(--surface-border)' }}>
                    <div style={{ height: '100%', width: `${dpct}%`, background: DOMAIN_COLORS[Number(num)], transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question review */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
              Question Review
              {showAllAnnotated && (
                <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                  — {correct} correct, {questions.length - correct} wrong
                </span>
              )}
            </h3>
            <button
              onClick={() => { setShowAllAnnotated(v => !v); setReviewQ(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border-2"
              style={showAllAnnotated
                ? { borderColor: '#22c55e', background: '#f0fdf4', color: '#166534' }
                : { borderColor: 'var(--color-snowflake-blue)', background: 'var(--color-snowflake-light)', color: 'var(--color-snowflake-dark)' }
              }
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              {showAllAnnotated ? 'Hide annotations' : 'Check Answers'}
            </button>
          </div>

          <div className="space-y-2" role="list" aria-label="Question review list">
            {questions.map((q, i) => {
              const userAns = answers[i];
              const isCorrect = userAns === q.correct;
              const isOpen = showAllAnnotated || reviewQ === i;
              const isBookmarked = bookmarks.has(q.id);
              const borderColor = showAllAnnotated
                ? isCorrect ? '#86efac' : '#fca5a5'
                : isCorrect ? '#bbf7d0' : userAns ? '#fecaca' : 'var(--surface-border)';
              const rowBg = showAllAnnotated
                ? isCorrect ? '#f0fdf4' : '#fff1f2'
                : 'var(--surface-card)';

              return (
                <div key={i} className="rounded-xl border-2 overflow-hidden" style={{ borderColor, background: rowBg }} role="listitem">
                  <div className="flex items-center gap-3 p-4 flex-wrap">
                    <button
                      className="flex items-center gap-3 flex-1 text-left hover:brightness-95 transition-all min-w-0"
                      onClick={() => !showAllAnnotated && setReviewQ(isOpen ? null : i)}
                      style={{ cursor: showAllAnnotated ? 'default' : 'pointer', background: 'transparent', border: 'none', padding: 0 }}
                      aria-expanded={isOpen}
                      aria-controls={`review-q-${i}`}
                    >
                      {isCorrect
                        ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#22c55e' }} aria-label="Correct" />
                        : userAns
                        ? <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} aria-label="Wrong" />
                        : <span className="w-5 h-5 flex-shrink-0 rounded-full border-2" style={{ borderColor: 'var(--text-muted)' }} aria-label="Skipped" />
                      }
                      <span className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                        Q{i + 1}: {q.question.slice(0, 80)}{q.question.length > 80 ? '…' : ''}
                      </span>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {showAllAnnotated && (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={isCorrect
                            ? { background: '#dcfce7', color: '#166534' }
                            : { background: '#fee2e2', color: '#991b1b' }
                          }
                        >
                          {isCorrect ? '✓ Correct' : `✗ ${userAns ? `You: ${userAns}` : 'Skipped'}`}
                        </span>
                      )}
                      <button
                        onClick={() => toggleBookmark(q.id)}
                        className="transition-colors"
                        style={{ color: isBookmarked ? '#7c3aed' : 'var(--text-muted)' }}
                        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                        aria-pressed={isBookmarked}
                      >
                        {isBookmarked
                          ? <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
                          : <Bookmark className="w-4 h-4" aria-hidden="true" />
                        }
                      </button>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: DOMAIN_COLORS[q.domainNum] + '20', color: DOMAIN_COLORS[q.domainNum] }}>D{q.domainNum}</span>
                      {!showAllAnnotated && (
                        <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div id={`review-q-${i}`} className="p-4 border-t" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'var(--surface-border)' }}>
                      <p className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>{q.question}</p>
                      <div className="space-y-2 mb-4" role="list">
                        {q.options.map(opt => {
                          const isRight = opt.label === q.correct;
                          const isUserWrong = opt.label === userAns && !isCorrect;
                          return (
                            <div
                              key={opt.label}
                              className="flex gap-2 text-sm p-2.5 rounded-lg"
                              style={{
                                background: isRight ? '#dcfce7' : isUserWrong ? '#fee2e2' : 'transparent',
                                color: isRight ? '#166534' : isUserWrong ? '#991b1b' : 'var(--text-secondary)',
                                border: isRight ? '1px solid #86efac' : isUserWrong ? '1px solid #fca5a5' : '1px solid transparent',
                              }}
                              role="listitem"
                            >
                              <span className="font-bold w-4 flex-shrink-0">{opt.label}.</span>
                              <span className="flex-1">{opt.text}</span>
                              {isRight && <span className="flex-shrink-0 font-semibold">✓ Correct</span>}
                              {isUserWrong && <span className="flex-shrink-0 font-semibold">✗ Your answer</span>}
                            </div>
                          );
                        })}
                      </div>
                      <div className="p-3 rounded-lg text-sm" style={{ background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe' }}>
                        <span className="font-bold">Explanation: </span>{q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => { setMode('setup'); setSetupTab('new'); }}
            className="btn-primary px-8 py-3"
          >
            ← Take Another Exam
          </button>
          <button
            onClick={() => { setSetupTab('history'); setMode('setup'); }}
            className="px-6 py-3 rounded-xl border-2 font-semibold transition-colors"
            style={{ borderColor: 'var(--surface-border)', color: 'var(--text-secondary)', background: 'var(--surface-card)' }}
          >
            View History
          </button>
          {!passed && (
            <a href="/flashcards" className="px-6 py-3 rounded-xl border-2 font-semibold no-underline transition-colors" style={{ borderColor: 'var(--surface-border)', color: 'var(--text-secondary)' }}>
              Study Flashcards
            </a>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ── Public export — self-wrapped in ErrorBoundary ─────────────────────────────
export default function ExamSimulator() {
  return (
    <ErrorBoundary>
      <ExamSimulatorInner />
    </ErrorBoundary>
  );
}
