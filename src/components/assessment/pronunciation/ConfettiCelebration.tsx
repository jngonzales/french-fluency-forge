/**
 * Confetti Celebration Component
 * Shows sparkle/confetti animation for high scores
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiCelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

const sparkles = ['✨', '🌟', '⭐', '💫', '🎉', '🎊'];

export function ConfettiCelebration({ show, onComplete }: ConfettiCelebrationProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    emoji: string;
    x: number;
    delay: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    if (show) {
      // Generate random particles
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        emoji: sparkles[Math.floor(Math.random() * sparkles.length)],
        x: Math.random() * 100, // percentage across screen
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1,
      }));
      setParticles(newParticles);

      // Clear after animation
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute text-2xl"
              style={{ left: `${particle.x}%` }}
              initial={{ 
                top: '-10%', 
                opacity: 1, 
                scale: 0.5,
                rotate: 0 
              }}
              animate={{ 
                top: '110%', 
                opacity: [1, 1, 0.5, 0],
                scale: [0.5, 1.2, 1, 0.8],
                rotate: [0, 180, 360, 540]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut'
              }}
            >
              {particle.emoji}
            </motion.div>
          ))}
          
          {/* Central celebration burst */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.5, 1],
              opacity: [0, 1, 0]
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            ✨
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
