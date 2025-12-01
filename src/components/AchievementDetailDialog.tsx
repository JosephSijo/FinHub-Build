import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { motion } from 'motion/react';
import { getAchievement } from '../utils/achievements';
import { getRandomQuote } from '../data/financial-quotes';
import { Sparkles } from 'lucide-react';
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
      // Trigger confetti when dialog opens
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Achievement Unlocked!</DialogTitle>
          <DialogDescription className="text-center">
            Congratulations! You've earned a new achievement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 3D Rotating Badge Animation - 3× rotation */}
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0, rotateY: 0 }}
            animate={{ 
              scale: 1, 
              rotateY: [0, 1080], // 3× rotation (360 * 3)
              transition: {
                scale: { duration: 0.5, ease: "backOut" },
                rotateY: { duration: 3, ease: "easeInOut" }
              }
            }}
          >
            <div className="relative">
              {/* Glowing effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Badge */}
              <div className="relative w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-800">
                <span className="text-6xl">{achievement.icon}</span>
              </div>
            </div>
          </motion.div>

          {/* Achievement Details */}
          <motion.div
            className="text-center space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-2xl bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              {achievement.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {achievement.description}
            </p>
          </motion.div>

          {/* Sparkle Divider */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-yellow-500" />
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-yellow-500" />
            </div>
          </motion.div>

          {/* Motivational Quote */}
          <motion.div
            className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-start gap-2">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="text-sm italic text-gray-700 dark:text-gray-300">
                  "{quote.text}"
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  — {quote.author}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Celebration Particles */}
          <motion.div
            className="relative h-20 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: `hsl(${i * 30}, 70%, 60%)`,
                  left: `${Math.random() * 100}%`,
                  top: '100%'
                }}
                animate={{
                  y: [-100, -200],
                  x: [0, (Math.random() - 0.5) * 100],
                  opacity: [1, 0],
                  scale: [1, 0.5]
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
