import { useState } from 'react';

interface UseCopyToClipboardReturn {
  copyToClipboard: (text: string) => Promise<boolean>;
  copied: boolean;
  error: Error | null;
}

export function useCopyToClipboard(): UseCopyToClipboardReturn {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      const err = new Error('Clipboard not supported');
      setError(err);
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError(null);

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);

      return true;
    } catch (err) {
      setError(err as Error);
      setCopied(false);
      return false;
    }
  };

  return {
    copyToClipboard,
    copied,
    error,
  };
}
