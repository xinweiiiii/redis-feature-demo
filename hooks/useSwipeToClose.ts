import { useEffect, useRef, useState, RefObject } from 'react';

interface UseSwipeToCloseOptions {
  onClose: () => void;
  threshold?: number; // Minimum distance to trigger close (in pixels)
  velocityThreshold?: number; // Minimum velocity to trigger close
}

interface UseSwipeToCloseReturn {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
  isDragging: boolean;
  translateY: number;
  modalContentRef: RefObject<HTMLDivElement>;
  modalProps: {
    ref: RefObject<HTMLDivElement>;
    style: {
      transform: string;
      transition: string;
      opacity: number;
    };
  };
}

export function useSwipeToClose({
  onClose,
  threshold = 100,
  velocityThreshold = 0.5
}: UseSwipeToCloseOptions): UseSwipeToCloseReturn {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const touchStartTime = useRef<number>(0);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = threshold;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
    touchStartTime.current = Date.now();
    setIsDragging(true);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (touchStart === null) return;

    const currentTouch = e.targetTouches[0].clientY;
    const diff = currentTouch - touchStart;

    // Only allow downward swipes
    if (diff > 0) {
      setTranslateY(diff);
      setTouchEnd(currentTouch);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      resetSwipe();
      return;
    }

    const distance = touchEnd - touchStart;
    const duration = Date.now() - touchStartTime.current;
    const velocity = Math.abs(distance / duration);

    const isSwipeDown = distance > minSwipeDistance;
    const isFastSwipe = velocity > velocityThreshold;

    if (isSwipeDown || isFastSwipe) {
      onClose();
    }

    resetSwipe();
  };

  const resetSwipe = () => {
    setIsDragging(false);
    setTranslateY(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

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

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isDragging,
    translateY,
    modalContentRef,
    modalProps: {
      ref: modalContentRef,
      style: {
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease',
        opacity: isDragging ? Math.max(0.5, 1 - translateY / 500) : 1,
      },
    },
  };
}
