'use client';

import { useState } from 'react';
import CopyButton from './CopyButton';

interface CodeExample {
  nodejs?: string;
  python?: string;
  cli?: string;
}

interface CodeExamplesPanelProps {
  examples: CodeExample;
  title?: string;
  defaultOpen?: boolean;
}

export default function CodeExamplesPanel({
  examples,
  title = 'Code Examples',
  defaultOpen = false
}: CodeExamplesPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<'nodejs' | 'python' | 'cli'>('nodejs');

  const tabs = [
    { id: 'nodejs' as const, label: 'Node.js', icon: '🟢' },
    { id: 'python' as const, label: 'Python', icon: '🐍' },
    { id: 'cli' as const, label: 'Redis CLI', icon: '⚡' },
  ];

  const getCurrentCode = () => {
    switch (activeTab) {
      case 'nodejs':
        return examples.nodejs || '// No example available';
      case 'python':
        return examples.python || '# No example available';
      case 'cli':
        return examples.cli || '# No example available';
    }
  };

  return (
    <div className="code-examples-panel">
      <button
        className="code-examples-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h3 className="code-examples-title">
          <span className="code-examples-icon">💻</span>
          {title}
        </h3>
        <span className={`code-examples-arrow ${isOpen ? 'open' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="code-examples-content">
          <div className="code-examples-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`code-examples-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="code-examples-body">
            <CopyButton text={getCurrentCode()} size="small" />
            <pre className="code-examples-pre">
              <code className={`language-${activeTab === 'cli' ? 'bash' : activeTab === 'nodejs' ? 'javascript' : 'python'}`}>
                {getCurrentCode()}
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
