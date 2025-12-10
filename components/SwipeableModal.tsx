'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useSwipeToClose } from '@/hooks/useSwipeToClose';

interface SwipeableModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}

export default function SwipeableModal({
  isOpen,
  onClose,
  children,
  className = '',
  maxWidth = '900px'
}: SwipeableModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const { onTouchStart, onTouchMove, onTouchEnd, isDragging, translateY } = useSwipeToClose({
    onClose,
    threshold: 100,
    velocityThreshold: 0.3,
  });

  useEffect(() => {
    const modalContent = modalContentRef.current;
    if (!modalContent) return;

    modalContent.addEventListener('touchstart', onTouchStart);
    modalContent.addEventListener('touchmove', onTouchMove);
    modalContent.addEventListener('touchend', onTouchEnd);

    return () => {
      modalContent.removeEventListener('touchstart', onTouchStart);
      modalContent.removeEventListener('touchmove', onTouchMove);
      modalContent.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalContentRef}
        className={`modal-content ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth,
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          opacity: isDragging ? Math.max(0.5, 1 - translateY / 500) : 1,
        }}
      >
        {/* Swipe indicator for mobile */}
        <div className="swipe-indicator" />
        {children}
      </div>
    </div>
  );
}
