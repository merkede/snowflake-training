interface Term {
  term: string;
  definition: string;
  abbr?: string;
}

interface KeyTermsProps {
  terms: Term[];
  title?: string;
}

export default function KeyTerms({ terms, title = 'Key Terms & Definitions' }: KeyTermsProps) {
  return (
    <div className="my-8 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="px-6 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, var(--color-snowflake-blue), var(--color-snowflake-sky))' }}>
        <span className="text-2xl">📖</span>
        <h4 className="font-bold text-white text-lg" style={{ color: 'white' }}>{title}</h4>
      </div>

      <div className="divide-y divide-slate-100 bg-white">
        {terms.map((item, i) => (
          <div key={i} className="px-6 py-4 flex gap-4 items-start hover:bg-slate-50 transition-colors">
            <div className="flex-shrink-0 mt-0.5">
              <span
                className="inline-block px-2.5 py-1 rounded-lg text-sm font-bold"
                style={{
                  background: 'var(--color-snowflake-light)',
                  color: 'var(--color-snowflake-dark)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {item.abbr || item.term.substring(0, 3).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-900">{item.term}</p>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.definition}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
