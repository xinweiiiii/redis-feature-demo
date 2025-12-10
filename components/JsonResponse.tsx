'use client';

import CopyButton from './CopyButton';

interface JsonResponseProps {
  data: any;
  title?: string;
}

export default function JsonResponse({ data, title = 'Response:' }: JsonResponseProps) {
  if (!data) return null;

  const jsonString = typeof data === 'string'
    ? data
    : JSON.stringify(data, null, 2);

  return (
    <div className="json-response-wrapper">
      {title && <strong style={{ display: 'block', marginBottom: '0.5rem' }}>{title}</strong>}
      <CopyButton text={jsonString} size="small" />
      <div className="json-response">
        <pre>{jsonString}</pre>
      </div>
    </div>
  );
}
