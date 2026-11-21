import React from 'react';

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, query, className = '' }) => {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const terms = query.trim().split(/\s+/).filter(Boolean);
  const regex = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        terms.some((term) => term.toLowerCase() === part.toLowerCase()) ? (
          <mark
            key={index}
            className="bg-sky-400/25 text-sky-100 px-0.5 rounded-sm font-semibold border border-sky-300/40"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};
