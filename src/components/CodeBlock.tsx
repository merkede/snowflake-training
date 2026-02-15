import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}

export default function CodeBlock({
  code,
  language = 'sql',
  title,
  showLineNumbers = true
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  return (
    <div className="code-block my-6">
      {/* Header */}
      <div className="code-block-header">
        <div className="flex items-center gap-2">
          {title && <span className="font-medium">{title}</span>}
          {!title && <span className="text-xs uppercase tracking-wide">{language}</span>}
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 hover:bg-slate-700 px-3 py-1 rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="!mt-0 !rounded-t-none">
        <code>
          {showLineNumbers ? (
            <div>
              {lines.map((line, index) => (
                <div key={index} className="table-row">
                  <span className="table-cell text-right pr-4 text-slate-500 select-none">
                    {index + 1}
                  </span>
                  <span className="table-cell">{line}</span>
                </div>
              ))}
            </div>
          ) : (
            code
          )}
        </code>
      </pre>
    </div>
  );
}
