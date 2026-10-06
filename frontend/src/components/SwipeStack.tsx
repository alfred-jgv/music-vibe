import { useEffect, useRef, useState, type ReactNode } from 'react';

interface SwipeStackProps {
  children: ReactNode[];
  onSwipe?: (index: number, direction: 'left' | 'right') => void;
}

const SWIPE_THRESHOLD = 100;
const MAX_VISIBLE = 3;

export default function SwipeStack({ children, onSwipe }: SwipeStackProps) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const startRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
    setDrag({ x: 0, y: 0, active: false });
  }, [children.length]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.currentTarget !== cardRef.current) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.active) return;
    setDrag({
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y,
      active: true,
    });
  }

  function onPointerUp() {
    if (!drag.active) return;
    const { x, y } = drag;

    if (Math.abs(x) > SWIPE_THRESHOLD) {
      const dir = x > 0 ? 'right' : 'left';
      setDrag({ x: x > 0 ? 600 : -600, y, active: false });
      setTimeout(() => {
        onSwipe?.(index, dir);
        setIndex((i) => i + 1);
        setDrag({ x: 0, y: 0, active: false });
      }, 240);
    } else {
      setDrag({ x: 0, y: 0, active: false });
    }
  }

  const visible = children.slice(index, index + MAX_VISIBLE);

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <p className="font-serif text-2xl text-[#0d1117]">That's all for now.</p>
        <p className="text-sm text-[#7a8699] mt-2">Shuffle to see more tracks.</p>
      </div>
    );
  }

  return (
    <div className="card-stack w-full h-105 sm:h-120 max-w-md mx-auto relative">
      {visible.map((child, i) => {
        const isTop = i === 0;
        const offset = i * 12;
        const scale = 1 - i * 0.04;
        const rotate = isTop ? drag.x / 20 : 0;
        const opacity = 1 - i * 0.15;

        return (
          <div
            key={index + i}
            ref={isTop ? cardRef : undefined}
            className={`swipe-card ${isTop && drag.active ? 'dragging' : ''}`}
            style={{
              transform: `translate(${isTop ? drag.x : 0}px, ${
                isTop ? drag.y : offset
              }px) scale(${isTop ? 1 : scale}) rotate(${rotate}deg)`,
              opacity,
              zIndex: MAX_VISIBLE - i,
              cursor: isTop ? 'grab' : 'default',
              pointerEvents: isTop ? 'auto' : 'none',
            }}
            onPointerDown={isTop ? onPointerDown : undefined}
            onPointerMove={isTop ? onPointerMove : undefined}
            onPointerUp={isTop ? onPointerUp : undefined}
            onPointerCancel={isTop ? onPointerUp : undefined}
          >
            {child}
          </div>
        );
      })}

      {drag.active && Math.abs(drag.x) > 20 && (
        <div
          className="absolute top-6 px-3 py-1 rounded-full text-xs font-medium 
                     uppercase tracking-widest pointer-events-none"
          style={{
            [drag.x > 0 ? 'right' : 'left']: '1.5rem',
            backgroundColor: drag.x > 0 ? '#ff8a5c' : '#7a8699',
            color: '#fbf9f4',
            opacity: Math.min(Math.abs(drag.x) / 100, 1),
          }}
        >
          {drag.x > 0 ? 'Keep' : 'Skip'}
        </div>
      )}
    </div>
  );
}