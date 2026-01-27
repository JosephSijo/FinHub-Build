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

export function AchievementDetailDialog({
  isOpen,
  onClose,
  achievementId
}: AchievementDetailDialogProps) {
  const [quote, setQuote] = useState(getRandomQuote());

  useEffect(() => {
    if (isOpen && achievementId) {
      queueMicrotask(() => {
        setQuote(getRandomQuote());
      });

      // Paper pieces throwing from both sides (Confetti Canon)
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  }, [isOpen, achievementId]);

  if (!achievementId) return null;

  const achievement = getAchievement(achievementId);
  if (!achievement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[320px] sm:w-[480px] bg-slate-950 border-[#38383A] p-0 overflow-hidden rounded-[40px] shadow-2xl transition-all duration-500">
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
