import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

interface QuizOption {
  label: string;
  text: string;
}

interface QuizProps {
  question: string;
  options: QuizOption[];
  correct: string;
  explanation: string;
  category?: string;
}

export default function Quiz({ question, options, correct, explanation, category }: QuizProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (label: string) => {
    if (revealed) return;
    setSelected(label);
  };

  const handleSubmit = () => {
    if (selected) setRevealed(true);
  };

  const isCorrect = selected === correct;

  return (
    <div className="my-8 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, var(--color-snowflake-dark), var(--color-snowflake-navy))' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-white/60">
            {category || 'Practice Question'}
          </span>
          {revealed && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isCorrect ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'}`}>
              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
            </span>
          )}
        </div>
        <p className="mt-2 font-semibold text-white leading-relaxed">{question}</p>
      </div>

      {/* Options */}
      <div className="bg-white p-4 space-y-3">
        {options.map((opt) => {
          const isSelected = selected === opt.label;
          const isRight = opt.label === correct;
          let bg = 'hover:bg-slate-50 border-slate-200';
          let icon = null;

          if (revealed) {
            if (isRight) {
              bg = 'bg-green-50 border-green-400';
              icon = <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#16a34a' }} />;
            } else if (isSelected && !isRight) {
              bg = 'bg-red-50 border-red-400';
              icon = <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />;
            } else {
              bg = 'border-slate-200 opacity-50';
            }
          } else if (isSelected) {
            bg = 'border-2 bg-blue-50';
            bg += ' border-snowflake-blue';
          }

          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              className={`w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${bg} ${!revealed ? 'cursor-pointer' : 'cursor-default'}`}
              style={isSelected && !revealed ? { borderColor: 'var(--color-snowflake-blue)', borderWidth: '2px' } : {}}
            >
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: revealed && isRight
                    ? '#16a34a'
                    : isSelected && !revealed
                    ? 'var(--color-snowflake-blue)'
                    : 'var(--color-slate-200)',
                  color: (revealed && isRight) || (isSelected && !revealed) ? 'white' : 'var(--color-slate-600)',
                }}
              >
                {opt.label}
              </span>
              <span className="text-sm text-slate-700 leading-relaxed flex-1">{opt.text}</span>
              {icon && <span>{icon}</span>}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        {!revealed ? (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className="w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2"
            style={{
              background: selected ? 'linear-gradient(135deg, var(--color-snowflake-blue), var(--color-snowflake-sky))' : 'var(--color-slate-200)',
              color: selected ? 'white' : 'var(--color-slate-400)',
              cursor: selected ? 'pointer' : 'not-allowed',
            }}
          >
            Check Answer <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className={`p-4 rounded-lg text-sm leading-relaxed ${isCorrect ? 'bg-green-50' : 'bg-amber-50'}`}>
            <p className="font-bold mb-1" style={{ color: isCorrect ? '#15803d' : '#92400e' }}>
              {isCorrect ? '✓ Well done!' : `✗ The correct answer was ${correct}`}
            </p>
            <p style={{ color: isCorrect ? '#166534' : '#78350f' }}>{explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
