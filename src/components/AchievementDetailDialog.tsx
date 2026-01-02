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
      setQuote(getRandomQuote());
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#3CB371']
      });
    }
  }, [isOpen, achievementId]);

  if (!achievementId) return null;

  const achievement = getAchievement(achievementId);
  if (!achievement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[270px] sm:w-full sm:max-w-md bg-slate-950 border-[#38383A] p-0 overflow-hidden rounded-[32px] shadow-2xl transition-all duration-500">
        {/* Global Ambient Blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-yellow-500 blur-[60px] sm:blur-[120px] opacity-10 -mr-16 -mt-16 sm:-mr-32 sm:-mt-32" />
        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-indigo-500 blur-[50px] sm:blur-[100px] opacity-5 -ml-12 -mb-12 sm:-ml-24 sm:-mb-24" />

        <DialogHeader className="px-6 sm:px-10 pt-8 sm:pt-12 pb-0 relative z-10">
          <DialogTitle className="text-center text-xl sm:text-3xl font-black text-white tracking-tight transition-all">
            Achievement Unlocked
          </DialogTitle>
          <DialogDescription className="text-center text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1 sm:mt-2 transition-all">
            Protocol Milestone Verified
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 sm:space-y-10 py-8 sm:py-12 px-6 sm:px-10 relative z-10">
          <div className="relative flex justify-center">
            {/* Icon Container Layer */}
            <motion.div
              className="relative z-10"
              initial={{ scale: 0, rotateY: 0 }}
              animate={{
                scale: 1,
                rotateY: [0, 1080],
                transition: {
                  scale: { duration: 0.8, ease: "backOut" },
                  rotateY: { duration: 4, ease: "easeInOut" }
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
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <div className="relative w-32 h-32 sm:w-44 sm:h-44 bg-gradient-to-br from-yellow-400 via-orange-500 to-yellow-600 rounded-[32px] sm:rounded-[48px] flex items-center justify-center shadow-[0_15px_40px_rgba(234,179,8,0.25)] border-4 border-white/20 transition-all">
                  <span className="text-5xl sm:text-7xl drop-shadow-2xl transition-all">{achievement.icon}</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-[28px] sm:rounded-[44px]" />
                </div>
              </div>
            </motion.div>

            {/* Graffiti Effect (Moved two layers up -> Forward in DOM + Pointer Events None) */}
            <div className="absolute inset-0 z-20 flex justify-center items-center pointer-events-none">
              <motion.div
                className="absolute w-32 h-32 sm:w-48 sm:h-48 bg-yellow-500/40 blur-[40px] sm:blur-[60px] rounded-full"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.4, opacity: 1 }}
                transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
              />
              <motion.div
                className="absolute w-24 h-24 sm:w-36 sm:h-36 bg-indigo-500/30 blur-[30px] sm:blur-[45px] rounded-full -ml-8 -mt-6 sm:-ml-12 sm:-mt-10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.8, opacity: 0.8 }}
                transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
              />
              <motion.div
                className="absolute w-20 h-20 sm:w-32 sm:h-32 bg-rose-500/30 blur-[25px] sm:blur-[40px] rounded-full ml-10 mt-8 sm:ml-16 sm:mt-12"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.6, opacity: 0.8 }}
                transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
              />
            </div>
          </div>

          <motion.div
            className="text-center space-y-2 sm:space-y-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-lg sm:text-3xl font-black bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-200 bg-clip-text text-transparent tracking-tight transition-all">
              {achievement.name}
            </h3>
            <p className="text-slate-400 font-bold text-[11px] sm:text-sm leading-relaxed max-w-[200px] sm:max-w-[280px] mx-auto transition-all">
              {achievement.description}
            </p>
          </motion.div>

          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-500/50 blur-[1px] animate-pulse" />
              <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
