'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Don't show header on login page
  if (pathname === '/login') {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        router.push('/login');
      } else {
        console.error('[Logout] Failed:', data.error);
        alert('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('[Logout] Error:', error);
      alert('An error occurred during logout.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="header">
      <div className="header-content">
        <div style={{ flex: 1 }}>
          <h1>Redis Feature Demos</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Explore different Redis features with interactive demonstrations
          </p>
        </div>
        <div className="header-actions">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="secondary"
            style={{
              fontSize: "0.9rem",
              padding: "0.5rem 1rem",
            }}
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}
