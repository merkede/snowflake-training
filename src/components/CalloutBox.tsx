interface CalloutBoxProps {
  type: 'tip' | 'warning' | 'info' | 'exam' | 'important' | 'note';
  title?: string;
  children: React.ReactNode;
}

const config = {
  tip: {
    icon: '💡',
    label: 'Pro Tip',
    bg: '#f0fdf4',
    border: '#16a34a',
    title: '#15803d',
    text: '#166534',
  },
  warning: {
    icon: '⚠️',
    label: 'Warning',
    bg: '#fffbeb',
    border: '#d97706',
    title: '#b45309',
    text: '#92400e',
  },
  info: {
    icon: 'ℹ️',
    label: 'Info',
    bg: '#eff6ff',
    border: '#3b82f6',
    title: '#1d4ed8',
    text: '#1e3a8a',
  },
  exam: {
    icon: '🎯',
    label: 'Exam Focus',
    bg: '#fdf4ff',
    border: '#a855f7',
    title: '#7e22ce',
    text: '#6b21a8',
  },
  important: {
    icon: '🔑',
    label: 'Key Point',
    bg: '#fff7ed',
    border: '#29b5e8',
    title: '#164365',
    text: '#0e3655',
  },
  note: {
    icon: '📝',
    label: 'Note',
    bg: '#f8fafc',
    border: '#64748b',
    title: '#334155',
    text: '#475569',
  },
};

export default function CalloutBox({ type, title, children }: CalloutBoxProps) {
  const c = config[type];

  return (
    <div
      className="my-6 rounded-lg p-5"
      style={{
        backgroundColor: c.bg,
        borderLeft: `4px solid ${c.border}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{c.icon}</span>
        <span className="font-bold text-sm uppercase tracking-wide" style={{ color: c.title }}>
          {title || c.label}
        </span>
      </div>
      <div className="text-sm leading-relaxed" style={{ color: c.text }}>
        {children}
      </div>
    </div>
  );
}
