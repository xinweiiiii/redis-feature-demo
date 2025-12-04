'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

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
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid #e0e0e0'
    }}>
      <h1 style={{ margin: 0 }}>Redis Feature Demos</h1>
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="secondary"
        style={{
          fontSize: '0.9rem',
          padding: '0.5rem 1rem'
        }}
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}
