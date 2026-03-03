import { useState, useEffect, useRef, useCallback } from 'react';
import { examQuestions, type ExamQuestion } from '../data/examQuestions';
import { CheckCircle2, XCircle, Flag, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

type Mode = 'setup' | 'exam' | 'review';
type ExamMode = 'full' | 'quick';

const DOMAIN_COLORS: Record<number, string> = {
  1: '#29b5e8',
  2: '#7c3aed',
  3: '#ea580c',
  4: '#16a34a',
  5: '#db2777',
  6: '#164365',
};

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

export default function ExamSimulator() {
  const [mode, setMode] = useState<Mode>('setup');
  const [examMode, setExamMode] = useState<ExamMode>('full');
  const [filterDomain, setFilterDomain] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = examMode === 'full' ? 115 * 60 : 30 * 60;
  const questionCount = examMode === 'full' ? 100 : 20;

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

  function startExam() {
    let pool = examMode === 'full'
      ? examQuestions
      : filterDomain
        ? examQuestions.filter(q => q.domainNum === filterDomain)
        : examQuestions;

    const shuffled = shuffle(pool).slice(0, Math.min(questionCount, pool.length));
    setQuestions(shuffled);
    setAnswers({});
    setFlagged(new Set());
    setCurrentIdx(0);
    setTimeLeft(totalTime);
    setExamSubmitted(false);
    setMode('exam');
  }

  function submitExam() {
    const unanswered = questions.filter((_, i) => !answers[i]).length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`)) return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setExamSubmitted(true);
    setMode('review');
  }

  function toggleFlag(idx: number) {
    setFlagged(prev => {
      const n = new Set(prev);
      n.has(idx) ? n.delete(idx) : n.add(idx);
      return n;
    });
  }

  // ── SETUP ──────────────────────────────────────────────────────────────
  if (mode === 'setup') {
    const domains = [
      { num: 1, name: 'Architecture & Features', weight: '25%' },
      { num: 2, name: 'Account Access & Security', weight: '20%' },
      { num: 3, name: 'Performance Concepts', weight: '15%' },
      { num: 4, name: 'Data Loading & Unloading', weight: '15%' },
      { num: 5, name: 'Data Transformations', weight: '15%' },
      { num: 6, name: 'Data Protection & Sharing', weight: '10%' },
    ];

    return (
      <div className="max-w-2xl mx-auto">
        {/* Mode selector */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {([
            { key: 'full' as ExamMode, icon: '📋', title: 'Full Mock Exam', desc: '100 questions · 115 minutes · All domains · Mirrors the real COF-C02' },
            { key: 'quick' as ExamMode, icon: '⚡', title: 'Quick Practice', desc: '20 questions · 30 minutes · Choose domain or all' },
          ]).map(opt => (
            <button
              key={opt.key}
              onClick={() => setExamMode(opt.key)}
              className="p-5 rounded-xl border-2 text-left transition-all"
              style={{
                borderColor: examMode === opt.key ? 'var(--color-snowflake-blue)' : 'var(--color-slate-200)',
                background: examMode === opt.key ? 'var(--color-snowflake-light)' : 'white',
              }}
            >
              <div className="text-2xl mb-2">{opt.icon}</div>
              <div className="font-bold text-slate-900 mb-1">{opt.title}</div>
              <div className="text-sm text-slate-500">{opt.desc}</div>
            </button>
          ))}
        </div>

        {/* Domain filter for quick mode */}
        {examMode === 'quick' && (
          <div className="mb-8">
            <div className="text-sm font-medium text-slate-600 mb-3">Focus domain (optional):</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFilterDomain(null)}
                className="p-3 rounded-lg border text-left text-sm transition-all"
                style={{
                  borderColor: filterDomain === null ? 'var(--color-snowflake-blue)' : '#e2e8f0',
                  background: filterDomain === null ? 'var(--color-snowflake-light)' : 'white',
                  fontWeight: filterDomain === null ? 600 : 400,
                }}
              >
                All domains (random mix)
              </button>
              {domains.map(d => (
                <button
                  key={d.num}
                  onClick={() => setFilterDomain(d.num)}
                  className="p-3 rounded-lg border text-left text-sm transition-all"
                  style={{
                    borderColor: filterDomain === d.num ? DOMAIN_COLORS[d.num] : '#e2e8f0',
                    background: filterDomain === d.num ? '#f8fafc' : 'white',
                    fontWeight: filterDomain === d.num ? 600 : 400,
                  }}
                >
                  <span style={{ color: DOMAIN_COLORS[d.num] }}>●</span> {d.name}
                  <span className="ml-1 text-slate-400">{d.weight}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Exam info */}
        <div className="card mb-6 p-4 flex gap-6 text-sm text-slate-600">
          <div><span className="font-bold text-slate-900">{questionCount}</span> questions</div>
          <div><span className="font-bold text-slate-900">{examMode === 'full' ? '115' : '30'}</span> minutes</div>
          <div>Pass mark: <span className="font-bold text-slate-900">≥75%</span></div>
        </div>

        <button
          onClick={startExam}
          className="w-full py-4 rounded-xl font-bold text-lg text-white"
          style={{ background: 'linear-gradient(135deg, var(--color-snowflake-blue), var(--color-snowflake-sky))' }}
        >
          Start Exam →
        </button>
      </div>
    );
  }

  // ── EXAM ───────────────────────────────────────────────────────────────
  if (mode === 'exam') {
    const q = questions[currentIdx];
    const answeredCount = Object.keys(answers).length;
    const timeWarning = timeLeft < 600; // < 10 min

    return (
      <div className="max-w-4xl mx-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-600">
            Q{currentIdx + 1} of {questions.length}
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-slate-500">{answeredCount} answered</span>
            {flagged.size > 0 && <span className="text-amber-500 ml-1">· {flagged.size} flagged</span>}
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1.5 rounded-lg"
              style={{
                background: timeWarning ? '#fef2f2' : '#f0f9ff',
                color: timeWarning ? '#dc2626' : 'var(--color-snowflake-dark)',
              }}
            >
              <Clock className="w-4 h-4" />
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
            {/* Domain tag */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: DOMAIN_COLORS[q.domainNum] }}
              >
                Domain {q.domainNum}
              </span>
              <span className="text-xs text-slate-500">{q.domain}</span>
              <button
                onClick={() => toggleFlag(currentIdx)}
                className="ml-auto flex items-center gap-1 text-xs transition-colors"
                style={{ color: flagged.has(currentIdx) ? '#f59e0b' : '#94a3b8' }}
              >
                <Flag className="w-3.5 h-3.5" />
                {flagged.has(currentIdx) ? 'Flagged' : 'Flag'}
              </button>
            </div>

            {/* Question */}
            <div className="p-5 rounded-xl mb-4" style={{ background: 'linear-gradient(135deg, var(--color-snowflake-dark), var(--color-snowflake-navy))' }}>
              <p className="text-white font-semibold leading-relaxed">{q.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {q.options.map(opt => {
                const isSelected = answers[currentIdx] === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setAnswers(prev => ({ ...prev, [currentIdx]: opt.label }))}
                    className="w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: isSelected ? 'var(--color-snowflake-blue)' : '#e2e8f0',
                      background: isSelected ? 'var(--color-snowflake-light)' : 'white',
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        background: isSelected ? 'var(--color-snowflake-blue)' : '#f1f5f9',
                        color: isSelected ? 'white' : '#64748b',
                      }}
                    >
                      {opt.label}
                    </span>
                    <span className="text-sm text-slate-700 leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                style={{ background: '#f1f5f9', color: '#475569' }}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                disabled={currentIdx === questions.length - 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                style={{ background: '#f1f5f9', color: '#475569' }}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Question navigator */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 self-start sticky top-24">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Navigator</div>
            <div className="grid grid-cols-5 gap-1">
              {questions.map((_, i) => {
                const isAnswered = !!answers[i];
                const isFlagged = flagged.has(i);
                const isCurrent = i === currentIdx;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className="w-8 h-8 rounded text-xs font-bold transition-all"
                    style={{
                      background: isCurrent
                        ? 'var(--color-snowflake-blue)'
                        : isFlagged
                        ? '#fef3c7'
                        : isAnswered
                        ? '#dcfce7'
                        : '#f1f5f9',
                      color: isCurrent ? 'white' : isFlagged ? '#92400e' : isAnswered ? '#166534' : '#64748b',
                      outline: isCurrent ? '2px solid var(--color-snowflake-blue)' : 'none',
                      outlineOffset: '1px',
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Answered</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-100 inline-block" /> Flagged</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-slate-100 inline-block" /> Not answered</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── REVIEW ─────────────────────────────────────────────────────────────
  if (mode === 'review') {
    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    const pct = Math.round((correct / questions.length) * 100);
    const passed = pct >= 75;

    // Domain breakdown
    const domainStats: Record<number, { correct: number; total: number; name: string }> = {};
    questions.forEach((q, i) => {
      if (!domainStats[q.domainNum]) domainStats[q.domainNum] = { correct: 0, total: 0, name: q.domain };
      domainStats[q.domainNum].total++;
      if (answers[i] === q.correct) domainStats[q.domainNum].correct++;
    });

    const [reviewQ, setReviewQ] = useState<number | null>(null);

    return (
      <div className="max-w-4xl mx-auto">
        {/* Score banner */}
        <div
          className="rounded-2xl p-8 text-center text-white mb-8"
          style={{ background: passed ? 'linear-gradient(135deg, #166534, #22c55e)' : 'linear-gradient(135deg, #991b1b, #ef4444)' }}
        >
          <div className="text-6xl font-black mb-2">{pct}%</div>
          <div className="text-xl font-bold mb-1">{passed ? '✓ PASS' : '✗ FAIL'}</div>
          <div className="opacity-80 text-sm">{correct}/{questions.length} correct · Pass mark: 75%</div>
        </div>

        {/* Domain breakdown */}
        <div className="card mb-8 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Score by Domain</h3>
          <div className="space-y-3">
            {Object.entries(domainStats).sort(([a], [b]) => Number(a) - Number(b)).map(([num, stat]) => {
              const dpct = Math.round((stat.correct / stat.total) * 100);
              return (
                <div key={num}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium">{stat.name}</span>
                    <span className="font-bold" style={{ color: DOMAIN_COLORS[Number(num)] }}>{dpct}% ({stat.correct}/{stat.total})</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: '6px', background: '#e2e8f0' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${dpct}%`,
                        background: DOMAIN_COLORS[Number(num)],
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question review */}
        <div className="mb-6">
          <h3 className="font-bold text-slate-900 mb-4">Question Review</h3>
          <div className="space-y-2">
            {questions.map((q, i) => {
              const userAns = answers[i];
              const isCorrect = userAns === q.correct;
              const isOpen = reviewQ === i;
              return (
                <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: isCorrect ? '#bbf7d0' : userAns ? '#fecaca' : '#e2e8f0' }}>
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                    onClick={() => setReviewQ(isOpen ? null : i)}
                  >
                    {isCorrect
                      ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#22c55e' }} />
                      : userAns
                      ? <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />
                      : <span className="w-5 h-5 flex-shrink-0 rounded-full border-2 border-slate-300" />
                    }
                    <span className="text-sm font-medium text-slate-700 flex-1">Q{i + 1}: {q.question.slice(0, 80)}…</span>
                    <span className="text-xs px-2 py-1 rounded-full flex-shrink-0" style={{ background: DOMAIN_COLORS[q.domainNum] + '20', color: DOMAIN_COLORS[q.domainNum] }}>
                      D{q.domainNum}
                    </span>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                      <p className="font-medium text-slate-800 mb-3">{q.question}</p>
                      <div className="space-y-2 mb-4">
                        {q.options.map(opt => (
                          <div
                            key={opt.label}
                            className="flex gap-2 text-sm p-2 rounded-lg"
                            style={{
                              background: opt.label === q.correct ? '#dcfce7' : opt.label === userAns && !isCorrect ? '#fee2e2' : 'transparent',
                              color: opt.label === q.correct ? '#166534' : opt.label === userAns && !isCorrect ? '#991b1b' : '#475569',
                            }}
                          >
                            <span className="font-bold w-4">{opt.label}.</span>
                            <span>{opt.text}</span>
                            {opt.label === q.correct && <span className="ml-auto">✓ Correct</span>}
                          </div>
                        ))}
                      </div>
                      <div className="p-3 rounded-lg text-sm" style={{ background: '#eff6ff', color: '#1e3a8a' }}>
                        <span className="font-bold">Explanation: </span>{q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setMode('setup')}
          className="btn-primary px-8 py-3"
        >
          ← Back to Setup
        </button>
      </div>
    );
  }

  return null;
}
