'use client';

import CopyButton from './CopyButton';

interface RedisCommandProps {
  command: string;
  label?: string;
}

export default function RedisCommand({ command, label = 'Redis Command:' }: RedisCommandProps) {
  if (!command) return null;

  return (
    <div className="redis-command">
      <strong>{label}</strong>
      <code>{command}</code>
      <CopyButton text={command} size="small" />
    </div>
  );
}
