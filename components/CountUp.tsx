import React, { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({ value, duration = 1000, formatter, className }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const startValue = useRef(0);
  const finalValue = useRef(value);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (value === finalValue.current && displayValue === value) return;
    
    startValue.current = displayValue;
    finalValue.current = value;
    startTime.current = null;
    
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = timestamp - startTime.current;
      const percent = Math.min(progress / duration, 1);
      
      // Ease out expo
      const ease = percent === 1 ? 1 : 1 - Math.pow(2, -10 * percent);
      
      const current = startValue.current + (finalValue.current - startValue.current) * ease;
      setDisplayValue(current);

      if (progress < duration) {
        rafId.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(finalValue.current);
      }
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {formatter ? formatter(displayValue) : displayValue.toFixed(2)}
    </span>
  );
};
