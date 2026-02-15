interface DiagramProps {
  title: string;
  description: string;
  imagePath?: string;
  altText: string;
}

export default function Diagram({ title, description, imagePath, altText }: DiagramProps) {
  return (
    <div className="my-8 card bg-gradient-to-br from-slate-50 to-white">
      <div className="mb-4">
        <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" style={{ color: 'var(--color-snowflake-blue)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2m0-8V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {title}
        </h4>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      {imagePath ? (
        <div className="rounded-lg overflow-hidden border-2 border-slate-200">
          <img
            src={imagePath}
            alt={altText}
            className="w-full h-auto"
          />
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium text-slate-600 mb-1">Diagram: {altText}</p>
          <p className="text-xs text-slate-500">Add image to: <code className="text-xs">public/images/diagrams/</code></p>
        </div>
      )}
    </div>
  );
}
