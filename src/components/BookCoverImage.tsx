import React, { useState } from 'react';
import { Book as BookIcon } from 'lucide-react';

interface BookCoverProps {
  src?: string;
  title: string;
  author?: string;
  category?: string;
  className?: string;
}

export const BookCoverImage: React.FC<BookCoverProps> = ({
  src,
  title,
  author,
  category,
  className = 'w-full h-full object-cover'
}) => {
  const [hasError, setHasError] = useState(false);

  // If no source is provided or image failed to load, show a sophisticated typographic book jacket
  if (!src || hasError) {
    // Generate deterministic pleasing hues based on title string
    const getGradient = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const palettes = [
        'from-slate-800 via-slate-900 to-indigo-950 text-slate-100',
        'from-emerald-900 via-teal-950 to-slate-950 text-emerald-100',
        'from-stone-800 via-amber-950 to-slate-900 text-amber-100',
        'from-sky-900 via-slate-900 to-blue-950 text-sky-100',
        'from-rose-950 via-slate-900 to-stone-900 text-rose-100'
      ];
      return palettes[Math.abs(hash) % palettes.length];
    };

    return (
      <div
        className={`relative flex flex-col justify-between p-3.5 bg-gradient-to-br ${getGradient(
          title
        )} rounded border border-white/10 shadow-sm overflow-hidden select-none ${className}`}
        style={{ minHeight: '130px' }}
      >
        {/* Subtle decorative spine stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/30 border-r border-white/10" />

        <div className="relative pl-1.5">
          {category && (
            <p className="text-[10px] font-medium tracking-wider uppercase opacity-75 truncate mb-1">
              {category}
            </p>
          )}
          <h4 className="text-xs font-semibold leading-tight line-clamp-3 text-white">
            {title}
          </h4>
        </div>

        <div className="relative pl-1.5 pt-2 flex items-center justify-between border-t border-white/10 mt-auto">
          <p className="text-[10px] opacity-80 truncate max-w-[80%]">
            {author || 'Library Book'}
          </p>
          <BookIcon className="w-3.5 h-3.5 opacity-60 shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${className} rounded shadow-sm`}
    />
  );
};
