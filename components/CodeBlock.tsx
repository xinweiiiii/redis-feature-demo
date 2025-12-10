'use client';

import CopyButton from './CopyButton';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  singleLine?: boolean;
}

export default function CodeBlock({
  code,
  language = 'javascript',
  title,
  singleLine = false
}: CodeBlockProps) {
  if (!code) return null;

  return (
    <div className="code-block-wrapper">
      {title && <strong style={{ display: 'block', marginBottom: '0.5rem' }}>{title}</strong>}
      <CopyButton text={code} size="small" />
      <div className={`code-block ${singleLine ? 'single-line' : ''}`}>
        <code className={`language-${language}`}>{code}</code>
      </div>
    </div>
  );
}
