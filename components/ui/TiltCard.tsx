'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, useReducedMotion } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glareOpacity?: number;
  onClick?: () => void;
}

export default function TiltCard({
  children,
  className = '',
  maxTilt = 12,
  glareOpacity = 0.15,
  onClick,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  // Respect the OS "reduce motion" setting: no tilt, no scale, no sheen.
  const reduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [maxTilt, -maxTilt]), {
    stiffness: 260,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-maxTilt, maxTilt]), {
    stiffness: 260,
    damping: 24,
  });

  const glareX = useTransform(mouseX, [0, 1], ['0%', '100%']);
  const glareY = useTransform(mouseY, [0, 1], ['0%', '100%']);
  const glareBackground = useMotionTemplate`radial-gradient(400px circle at ${glareX} ${glareY}, rgba(255,255,255,0.4), transparent 80%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || reduceMotion) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    if (reduceMotion) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <div style={{ perspective: 1000 }} className="h-full w-full flex flex-col">
      <motion.div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={reduceMotion ? undefined : { scale: 1.01 }}
        whileTap={onClick && !reduceMotion ? { scale: 0.99 } : undefined}
        className={`relative overflow-hidden rounded-lg border border-line bg-surface transition-shadow duration-300 hover:shadow-xl hover:border-line-strong h-full w-full flex-1 flex flex-col ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        {/* Subtle dynamic sheen on hover */}
        {isHovered && (
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-lg transition-opacity duration-300"
            style={{
              opacity: glareOpacity,
              background: glareBackground,
            }}
          />
        )}
        <div className="relative z-10 h-full w-full flex flex-col flex-1">{children}</div>
      </motion.div>
    </div>
  );
}
