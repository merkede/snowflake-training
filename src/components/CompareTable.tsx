interface CompareRow {
  feature: string;
  left: string;
  right: string;
  winner?: 'left' | 'right' | 'both';
}

interface CompareTableProps {
  title?: string;
  leftLabel: string;
  rightLabel: string;
  rows: CompareRow[];
}

export default function CompareTable({ title, leftLabel, rightLabel, rows }: CompareTableProps) {
  return (
    <div className="my-8 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {title && (
        <div className="px-6 py-4 text-center" style={{ background: 'linear-gradient(135deg, var(--color-snowflake-dark), var(--color-snowflake-navy))' }}>
          <h4 className="text-white font-bold text-lg" style={{ color: 'white', letterSpacing: '-0.01em' }}>{title}</h4>
        </div>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-3 text-sm font-bold border-b border-slate-200">
        <div className="p-4 bg-slate-50 text-slate-600 uppercase tracking-wide text-xs">Feature</div>
        <div
          className="p-4 text-center text-white text-xs uppercase tracking-wide"
          style={{ background: 'var(--color-snowflake-blue)' }}
        >
          {leftLabel}
        </div>
        <div className="p-4 text-center text-xs uppercase tracking-wide bg-slate-700 text-white">
          {rightLabel}
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div key={i} className={`grid grid-cols-3 border-b border-slate-100 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
          <div className="p-4 font-semibold text-slate-700">{row.feature}</div>
          <div
            className="p-4 text-center"
            style={{
              color: row.winner === 'left' || row.winner === 'both' ? '#15803d' : 'var(--color-slate-600)',
              fontWeight: row.winner === 'left' || row.winner === 'both' ? '600' : '400',
            }}
          >
            {row.winner === 'left' && <span className="mr-1">✓</span>}
            {row.winner === 'both' && <span className="mr-1">✓</span>}
            {row.left}
          </div>
          <div
            className="p-4 text-center"
            style={{
              color: row.winner === 'right' || row.winner === 'both' ? '#15803d' : 'var(--color-slate-600)',
              fontWeight: row.winner === 'right' || row.winner === 'both' ? '600' : '400',
            }}
          >
            {row.winner === 'right' && <span className="mr-1">✓</span>}
            {row.winner === 'both' && <span className="mr-1">✓</span>}
            {row.right}
          </div>
        </div>
      ))}
    </div>
  );
}
