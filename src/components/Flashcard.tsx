import { useState } from 'react';

interface FlashcardProps {
  question: string;
  answer: string;
  category?: string;
}

export default function Flashcard({ question, answer, category }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      {category && (
        <div className="mb-2">
          <span className="exam-badge">{category}</span>
        </div>
      )}
      <div
        className={`flashcard ${isFlipped ? 'flipped' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="flashcard-inner">
          {/* Front of card */}
          <div className="flashcard-front card flex items-center justify-center p-8 bg-gradient-to-br from-white to-slate-50">
            <div className="text-center">
              <div className="text-sm text-slate-500 mb-3 font-medium">QUESTION</div>
              <p className="text-xl font-semibold text-slate-800">{question}</p>
              <div className="mt-6 text-sm text-slate-400">Click to reveal answer</div>
            </div>
          </div>

          {/* Back of card */}
          <div className="flashcard-back card flex items-center justify-center p-8 bg-gradient-to-br from-snowflake-light to-white border-2 border-primary">
            <div className="text-center">
              <div className="text-sm font-medium mb-3" style={{ color: 'var(--color-snowflake-blue)' }}>
                ANSWER
              </div>
              <p className="text-lg text-slate-700 leading-relaxed">{answer}</p>
              <div className="mt-6 text-sm text-slate-400">Click to see question</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
