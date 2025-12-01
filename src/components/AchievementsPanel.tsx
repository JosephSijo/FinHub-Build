import React from 'react';
import { Card } from './ui/card';
import { Trophy, Lock } from 'lucide-react';
import { ACHIEVEMENTS } from '../utils/achievements';

interface AchievementsPanelProps {
  unlockedAchievements: string[];
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({
  unlockedAchievements
}) => {
  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;
  const progress = (unlockedCount / totalCount) * 100;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-600" />
        <div className="flex-1">
          <h3>Achievements</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>
        <div className="text-2xl">{Math.round(progress)}%</div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-4 gap-3">
        {ACHIEVEMENTS.map(achievement => {
          const isUnlocked = unlockedAchievements.includes(achievement.id);
          
          return (
            <div
              key={achievement.id}
              className={`relative aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
                isUnlocked
                  ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
              }`}
              title={isUnlocked ? `${achievement.name}: ${achievement.description}` : '???'}
            >
              {isUnlocked ? (
                <div className="text-3xl">{achievement.icon}</div>
              ) : (
                <Lock className="w-6 h-6 text-gray-400" />
              )}
              
              {isUnlocked && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Achievement Details */}
      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
        {ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id)).map(achievement => (
          <div
            key={achievement.id}
            className="flex items-center gap-3 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg"
          >
            <div className="text-2xl">{achievement.icon}</div>
            <div className="flex-1">
              <p className="text-sm">{achievement.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{achievement.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
