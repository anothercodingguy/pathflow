'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface NumberAnimationProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}

export default function NumberAnimation({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  duration = 1.2,
}: NumberAnimationProps) {
  const spring = useSpring(0, {
    stiffness: 75,
    damping: 18,
    mass: 0.8,
  });

  const [displayValue, setDisplayValue] = useState<string>(
    `${prefix}${(0).toFixed(decimals)}${suffix}`
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(`${prefix}${latest.toFixed(decimals)}${suffix}`);
    });
    return () => unsubscribe();
  }, [spring, prefix, suffix, decimals]);

  return (
    <motion.span
      className={`tabular-nums font-mono font-bold tracking-tight inline-block ${className}`}
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {displayValue}
    </motion.span>
  );
}
