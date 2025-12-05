import React from 'react';

interface MarkdownTextProps {
  content: string;
  className?: string;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Simple parser for Bold (**text**) and basic formatting
  const parse = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-indigo-600 dark:text-indigo-400">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Split by newlines to handle paragraphs
  const lines = content.split('\n');

  return (
    <div className={`text-sm leading-relaxed space-y-1 ${className}`}>
      {lines.map((line, i) => {
        // Handle bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-1">
              <span className="text-indigo-500">•</span>
              <span>{parse(line.trim().substring(2))}</span>
            </div>
          );
        }
        // Handle empty lines as spacers
        if (!line.trim()) return <div key={i} className="h-2" />;
        
        return <p key={i}>{parse(line)}</p>;
      })}
    </div>
  );
};
