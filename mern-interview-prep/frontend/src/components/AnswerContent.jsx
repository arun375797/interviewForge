import { getFormattedAnswerParts } from '../utils/answerFormatting';

export default function AnswerContent({ children }) {
  const parts = getFormattedAnswerParts(children);

  return (
    <div className="overflow-anywhere whitespace-pre-wrap text-[15px] leading-7 text-ink-soft">
      {parts.map((part, index) => {
        const className = [
          part.mark ? 'rounded bg-amber-200/70 px-0.5 text-ink' : '',
          part.underline ? 'underline decoration-accent decoration-2 underline-offset-4' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return className ? (
          <span key={`${index}-${part.text}`} className={className}>
            {part.text}
          </span>
        ) : (
          <span key={`${index}-${part.text}`}>{part.text}</span>
        );
      })}
    </div>
  );
}
