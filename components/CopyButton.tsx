'use client';

import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'button';
  label?: string;
}

export default function CopyButton({
  text,
  className = '',
  size = 'small',
  variant = 'icon',
  label = 'Copy'
}: CopyButtonProps) {
  const { copyToClipboard, copied } = useCopyToClipboard();

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    copyToClipboard(text);
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleCopy}
        className={`copy-button copy-button-${size} ${className}`}
        title={copied ? 'Copied!' : label}
      >
        {copied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.5 4.5L6 12L2.5 8.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Copied!</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect
                x="5.5"
                y="5.5"
                width="8"
                height="8"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M3.5 10.5H2.5C1.94772 10.5 1.5 10.0523 1.5 9.5V2.5C1.5 1.94772 1.94772 1.5 2.5 1.5H9.5C10.0523 1.5 10.5 1.94772 10.5 2.5V3.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className={`copy-icon-button copy-icon-button-${size} ${className}`}
      title={copied ? 'Copied!' : label}
      aria-label={copied ? 'Copied!' : label}
    >
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M13.5 4.5L6 12L2.5 8.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect
            x="5.5"
            y="5.5"
            width="8"
            height="8"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M3.5 10.5H2.5C1.94772 10.5 1.5 10.0523 1.5 9.5V2.5C1.5 1.94772 1.94772 1.5 2.5 1.5H9.5C10.0523 1.5 10.5 1.94772 10.5 2.5V3.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </button>
  );
}
