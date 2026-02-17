interface CheatItem {
  label: string;
  value: string;
  note?: string;
}

interface CheatSection {
  title: string;
  icon?: string;
  items: CheatItem[];
}

interface CheatSheetProps {
  title: string;
  sections: CheatSection[];
}

export default function CheatSheet({ title, sections }: CheatSheetProps) {
  return (
    <div className="my-8 rounded-xl overflow-hidden border-2 shadow-md" style={{ borderColor: 'var(--color-snowflake-blue)' }}>
      {/* Header */}
      <div
        className="px-6 py-5 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, var(--color-snowflake-dark), var(--color-snowflake-navy))' }}
      >
        <span className="text-2xl">📋</span>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-0.5">Quick Reference</div>
          <h4 className="font-bold text-white text-xl" style={{ color: 'white' }}>{title}</h4>
        </div>
      </div>

      {/* Sections */}
      <div className="bg-white divide-y divide-slate-100">
        {sections.map((section, i) => (
          <div key={i} className="p-5">
            <div className="flex items-center gap-2 mb-4">
              {section.icon && <span className="text-lg">{section.icon}</span>}
              <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wide"
                style={{ color: 'var(--color-snowflake-dark)' }}>
                {section.title}
              </h5>
            </div>

            <div className="grid gap-2">
              {section.items.map((item, j) => (
                <div
                  key={j}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-slate-50)' }}
                >
                  <code
                    className="text-xs flex-shrink-0 px-2 py-1 rounded font-mono font-bold"
                    style={{
                      background: 'var(--color-snowflake-light)',
                      color: 'var(--color-snowflake-dark)',
                      minWidth: '2rem',
                      textAlign: 'center',
                    }}
                  >
                    {item.label}
                  </code>
                  <div className="flex-1">
                    <span className="text-sm text-slate-700 font-medium">{item.value}</span>
                    {item.note && (
                      <span className="text-xs text-slate-500 ml-2">— {item.note}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
