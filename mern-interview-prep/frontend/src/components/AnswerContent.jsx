function formattedParts(text = '') {
  const tokens = String(text).split(/(<\/?mark>|<\/?u>)/gi);
  const state = { mark: false, underline: false };
  const parts = [];

  tokens.forEach((token) => {
    const lower = token.toLowerCase();
    if (lower === '<mark>') {
      state.mark = true;
      return;
    }
    if (lower === '</mark>') {
      state.mark = false;
      return;
    }
    if (lower === '<u>') {
      state.underline = true;
      return;
    }
    if (lower === '</u>') {
      state.underline = false;
      return;
    }
    if (!token) return;

    parts.push({
      text: token,
      mark: state.mark,
      underline: state.underline,
    });
  });

  return parts;
}

export default function AnswerContent({ children }) {
  const parts = formattedParts(children);

  return (
    <div className="whitespace-pre-wrap text-[15px] leading-7 text-ink-soft">
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
