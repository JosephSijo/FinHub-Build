import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { motion } from 'framer-motion';
import { getAchievement } from '../utils/achievements';
import { getRandomQuote } from '../data/financial-quotes';
import confetti from 'canvas-confetti';

interface AchievementDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  achievementId: string | null;
}

const GRAFFITI_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E', '#FB8C00', '#FACC15', '#22C55E'];
const GRAFFITI_SHAPES = ['rect', 'triangle', 'splat'];

function GraffitiBurst({ side }: { side: 'left' | 'right' }) {
  const particles = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    color: GRAFFITI_COLORS[Math.floor(Math.random() * GRAFFITI_COLORS.length)],
    shape: GRAFFITI_SHAPES[Math.floor(Math.random() * GRAFFITI_SHAPES.length)],
    size: Math.random() * 12 + 8,
    delay: Math.random() * 0.5,
    duration: Math.random() * 1.5 + 2.5, // Slower (2.5s to 4s)
    angle: side === 'left' ? (Math.random() * 70 - 20) : (Math.random() * 70 + 130),
    distance: Math.random() * 350 + 250, // More travel
    rotation: Math.random() * 720, // More spinning
  }));

  return (
    <div className={`absolute bottom-0 ${side === 'left' ? 'left-0' : 'right-0'} pointer-events-none z-20`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            rotate: 0,
            opacity: 1
          }}
          animate={{
            x: Math.cos(p.angle * (Math.PI / 180)) * p.distance,
            y: -Math.sin(p.angle * (Math.PI / 180)) * p.distance,
            scale: [0, 1, 0.5, 0],
            rotate: p.rotation + 360,
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.23, 1, 0.32, 1], // Strong burst feel
          }}
        >
          {p.shape === 'rect' && (
            <div
              style={{
                width: p.size,
                height: p.size * 1.5,
                backgroundColor: p.color,
                borderRadius: '2px',
                transform: 'rotate(15deg)'
              }}
            />
          )}
          {p.shape === 'triangle' && (
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${p.size / 2}px solid transparent`,
                borderRight: `${p.size / 2}px solid transparent`,
                borderBottom: `${p.size}px solid ${p.color}`,
              }}
            />
          )}
          {p.shape === 'splat' && (
            <div
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: '50%',
                boxShadow: `0 0 10px ${p.color}44`,
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

export function AchievementDetailDialog({
  isOpen,
  onClose,
  achievementId
}: AchievementDetailDialogProps) {
  const [quote, setQuote] = useState(getRandomQuote());
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (isOpen && achievementId) {
      queueMicrotask(() => {
        setQuote(getRandomQuote());
      });
      setShowBurst(true);
      const timer = setTimeout(() => setShowBurst(false), 5000); // Stay longer (5s)

      // Keep the existing subtle paper confetti as a baseline
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 45, spread: 70, ticks: 60, zIndex: 100, colors: ['#FACC15', '#FB8C00', '#F43F5E'] };

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        confetti({ ...defaults, particleCount: 15, origin: { x: 0, y: 0.8 }, angle: 60 });
        confetti({ ...defaults, particleCount: 15, origin: { x: 1, y: 0.8 }, angle: 120 });
      }, 250);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isOpen, achievementId]);

  if (!achievementId) return null;

  const achievement = getAchievement(achievementId);
  if (!achievement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[320px] sm:w-[480px] bg-slate-950 border-[#38383A] p-0 overflow-hidden rounded-[40px] shadow-2xl transition-all duration-500">
        {/* Graffiti Burst Layers */}
        {showBurst && (
          <>
            <GraffitiBurst side="left" />
            <GraffitiBurst side="right" />
          </>
        )}

        {/* Subtle Ambient Blobs (Toned down) */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500 blur-[100px] opacity-10 -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500 blur-[80px] opacity-5 -ml-16 -mb-16" />

        <DialogHeader className="px-8 pt-12 pb-0 relative z-10 text-center">
          <DialogTitle className="text-center text-2xl sm:text-3xl font-black text-white tracking-tight transition-all">
            Achievement Unlocked
          </DialogTitle>
          <DialogDescription className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 transition-all">
            Milestone Reached
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-10 px-8 relative z-10">
          <div className="relative flex justify-center h-48 items-center">
            {/* Subtle Graffiti/Ambient Layer (Subtle as requested) */}
            <div className="absolute inset-0 z-0 flex justify-center items-center pointer-events-none">
              <motion.div
                className="absolute w-32 h-32 bg-yellow-400/20 blur-[40px] rounded-full"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                transition={{ delay: 0.2, duration: 1 }}
              />
              <motion.div
                className="absolute w-24 h-24 bg-indigo-500/15 blur-[35px] rounded-full -ml-12 -mt-10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 2, opacity: 1 }}
                transition={{ delay: 0.3, duration: 1.2 }}
              />
            </div>

            {/* Icon Container Layer */}
            <motion.div
              className="relative z-10"
              initial={{ scale: 0.4, opacity: 0, y: 20 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                rotateY: [0, 360],
                transition: {
                  opacity: { duration: 0.4 },
                  scale: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
                  rotateY: { duration: 1.5, ease: "easeInOut", delay: 0.1 }
                }
              }}
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-gradient-to-br from-yellow-300 via-orange-500 to-yellow-600 rounded-[32px] sm:rounded-[40px] flex items-center justify-center shadow-[0_20px_50px_rgba(234,179,8,0.3)] border-4 border-white/30 transition-all">
                  <span className="text-5xl sm:text-6xl drop-shadow-2xl transition-all">{achievement.icon}</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent pointer-events-none rounded-[28px] sm:rounded-[36px]" />
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="text-center space-y-4 pt-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-yellow-400 to-white bg-clip-text text-transparent tracking-tight transition-all">
              {achievement.name}
            </h3>
            <p className="text-slate-400 font-bold text-xs sm:text-sm leading-relaxed max-w-[240px] sm:max-w-[300px] mx-auto transition-all">
              {achievement.description}
            </p>
          </motion.div>

          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-4">
              <div className="h-px w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50 blur-[1px] animate-pulse" />
              <div className="h-px w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </motion.div>

          <motion.div
            className="p-4 sm:p-8 bg-white/5 rounded-2xl sm:rounded-[32px] border border-white/5 relative overflow-hidden transition-all"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="absolute top-0 left-0 w-12 h-12 bg-indigo-500 blur-2xl opacity-5" />
            <div className="flex items-start gap-3 sm:gap-6 relative z-10 text-left">
              <span className="text-xl sm:text-3xl pt-0 opacity-40">"</span>
              <div className="flex-1">
                <p className="text-[10px] sm:text-sm font-bold italic text-slate-300 leading-snug sm:leading-relaxed tracking-tight transition-all">
                  {quote.text}
                </p>
                <div className="flex items-center gap-2 sm:gap-4 mt-3 sm:mt-6 transition-all">
                  <div className="h-px flex-1 bg-white/5" />
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">
                    — {quote.author}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
