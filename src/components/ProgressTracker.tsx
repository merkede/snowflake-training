import { useEffect, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import StreakTracker, { recordStudyDay } from './StreakTracker';

interface Module {
  id: string;
  title: string;
  slug: string;
}

interface ProgressTrackerProps {
  modules: Module[];
  currentModuleId?: string;
}

export default function ProgressTracker({ modules, currentModuleId }: ProgressTrackerProps) {
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    recordStudyDay(); // Record visiting a module as a study day
    // Load progress from localStorage
    const saved = localStorage.getItem('snowflake-training-progress');
    if (saved) {
      setCompletedModules(new Set(JSON.parse(saved)));
    }

    // Refresh when ReadingProgress auto-completes a module (same tab)
    const onProgressUpdate = () => {
      const latest = localStorage.getItem('snowflake-training-progress');
      setCompletedModules(new Set(latest ? JSON.parse(latest) : []));
    };
    window.addEventListener('snowflake:progress-update', onProgressUpdate);
    return () => window.removeEventListener('snowflake:progress-update', onProgressUpdate);
  }, []);

  const toggleModule = (moduleId: string) => {
    const newCompleted = new Set(completedModules);
    if (newCompleted.has(moduleId)) {
      newCompleted.delete(moduleId);
    } else {
      newCompleted.add(moduleId);
    }
    setCompletedModules(newCompleted);

    // Save to localStorage
    localStorage.setItem('snowflake-training-progress', JSON.stringify([...newCompleted]));
  };

  const completionPercentage = Math.round((completedModules.size / modules.length) * 100);

  if (!isClient) {
    return null; // Avoid hydration mismatch
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
      <h3 className="text-xl font-bold mb-4 text-slate-900">Your Progress</h3>

      {/* Streak badge */}
      <StreakTracker compact={true} />

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600">Course Completion</span>
          <span className="font-semibold" style={{ color: 'var(--color-snowflake-blue)' }}>
            {completionPercentage}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Module List */}
      <div className="space-y-2">
        {modules.map((module) => {
          const isCompleted = completedModules.has(module.id);
          const isCurrent = module.id === currentModuleId;

          return (
            <div
              key={module.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                isCurrent
                  ? 'bg-snowflake-light border border-primary'
                  : 'hover:bg-slate-50'
              }`}
            >
              <button
                onClick={() => toggleModule(module.id)}
                className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
                aria-label={isCompleted ? `Mark ${module.title} incomplete` : `Mark ${module.title} complete`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 animate-check-pop" style={{ color: 'var(--color-accent)' }} />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </button>
              <a
                href={`/${module.slug}`}
                className={`text-sm flex-1 ${
                  isCompleted ? 'text-slate-400' : 'text-slate-700'
                } hover:no-underline`}
              >
                {module.title}
              </a>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-900">{completedModules.size}</div>
            <div className="text-xs text-slate-500">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {modules.length - completedModules.size}
            </div>
            <div className="text-xs text-slate-500">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
}
