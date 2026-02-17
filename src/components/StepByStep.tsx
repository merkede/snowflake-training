interface Step {
  title: string;
  description: string;
  code?: string;
  tip?: string;
}

interface StepByStepProps {
  title?: string;
  steps: Step[];
}

export default function StepByStep({ title, steps }: StepByStepProps) {
  return (
    <div className="my-8">
      {title && (
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-snowflake-blue), var(--color-snowflake-sky))' }}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h4 className="font-bold text-slate-900 text-lg">{title}</h4>
        </div>
      )}

      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-4">
            {/* Step number + connector */}
            <div className="flex flex-col items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md"
                style={{ background: 'linear-gradient(135deg, var(--color-snowflake-blue), var(--color-snowflake-sky))' }}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className="w-0.5 flex-1 my-2" style={{ backgroundColor: 'var(--color-snowflake-light)', minHeight: '24px' }} />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 ${i < steps.length - 1 ? 'pb-6' : ''}`}>
              <h5 className="font-bold text-slate-900 mb-1">{step.title}</h5>
              <p className="text-slate-600 text-sm leading-relaxed mb-2">{step.description}</p>

              {step.code && (
                <div className="rounded-lg overflow-hidden mt-3 mb-2">
                  <div className="bg-slate-800 px-4 py-2 text-xs text-slate-400">SQL</div>
                  <pre className="bg-slate-900 text-slate-100 p-4 text-sm overflow-x-auto !mt-0 !rounded-t-none">
                    <code>{step.code}</code>
                  </pre>
                </div>
              )}

              {step.tip && (
                <div className="mt-2 flex items-start gap-2 text-sm p-3 rounded-lg" style={{ background: 'var(--color-snowflake-light)', color: 'var(--color-snowflake-dark)' }}>
                  <span className="flex-shrink-0">💡</span>
                  <span>{step.tip}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
