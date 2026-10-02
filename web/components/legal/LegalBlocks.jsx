import Link from 'next/link';

export function LegalInlineParts({ parts }) {
  return parts.map((part, index) => {
    const key = `${index}-${part.text?.slice(0, 12) || 'x'}`;
    if (part.code) {
      return (
        <code key={key} className="legal-inline-code">
          {part.text}
        </code>
      );
    }
    if (part.strong) {
      return <strong key={key}>{part.text}</strong>;
    }
    if (part.href) {
      if (part.external) {
        return (
          <a key={key} href={part.href} target="_blank" rel="noopener noreferrer">
            {part.text}
          </a>
        );
      }
      if (part.href.startsWith('mailto:')) {
        return (
          <a key={key} href={part.href}>
            {part.text}
          </a>
        );
      }
      return (
        <Link key={key} href={part.href}>
          {part.text}
        </Link>
      );
    }
    return <span key={key}>{part.text}</span>;
  });
}

export function LegalBlocks({ blocks }) {
  return blocks.map((block, index) => {
    const key = `${block.type}-${index}`;
    if (block.type === 'p') {
      return (
        <p key={key}>
          <LegalInlineParts parts={block.parts} />
        </p>
      );
    }
    if (block.type === 'ul') {
      return (
        <ul key={key}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>
              {Array.isArray(item) ? <LegalInlineParts parts={item} /> : item}
            </li>
          ))}
        </ul>
      );
    }
    if (block.type === 'callout') {
      return (
        <div key={key} className="legal-callout" role="note">
          <p className="legal-calloutTitle">
            <strong>{block.title}</strong>
          </p>
          <p>
            <LegalInlineParts parts={block.body} />
          </p>
        </div>
      );
    }
    return null;
  });
}
