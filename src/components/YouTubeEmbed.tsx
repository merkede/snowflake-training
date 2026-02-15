interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  description?: string;
}

export default function YouTubeEmbed({ videoId, title, description }: YouTubeEmbedProps) {
  return (
    <div className="my-8">
      {description && (
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-700">{description}</p>
        </div>
      )}
      <div className="relative w-full overflow-hidden rounded-lg shadow-lg" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs text-slate-500">
          📺 <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary"
          >
            Watch on YouTube
          </a>
        </p>
      </div>
    </div>
  );
}
