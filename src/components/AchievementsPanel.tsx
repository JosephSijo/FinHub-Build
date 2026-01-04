/* eslint-disable react/forbid-component-props, react/forbid-dom-props */
import React from 'react';
import { Card } from './ui/card';
import { Label } from './ui/label';
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
  const progressStyle = { '--progress-width': `${progress}%` } as React.CSSProperties;

  return (
    <Card className="p-8 bg-black border-white/5 sq-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500 blur-[80px] opacity-5 -mr-16 -mt-16 group-hover:opacity-10 transition-opacity" />

      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="w-12 h-12 sq-md bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 shadow-inner">
          <Trophy className="w-6 h-6 text-yellow-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-black text-slate-100 tracking-tight">Achievements</h3>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
            Protocol Milestone Progress
          </p>
        </div>
        <div className="text-3xl font-black text-slate-100 tabular-nums">
          {Math.round(progress)}<span className="text-sm text-slate-600 ml-1">%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2.5 bg-white/5 sq-full mb-10 overflow-hidden relative z-10 border border-white/5">
        {(() => {
          const barProps = { style: progressStyle };
          return (
            <div
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 bg-[length:200%_100%] animate-[gradient-shift_3s_linear_infinite] transition-all duration-700 shadow-[0_0_15px_rgba(234,179,8,0.3)] w-[var(--progress-width)]"
              {...barProps}
            />
          );
        })()}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-4 gap-4 relative z-10">
        {ACHIEVEMENTS.map(achievement => {
          const isUnlocked = unlockedAchievements.includes(achievement.id);

          return (
            <div
              key={achievement.id}
              className={`relative aspect-square sq-md border transition-all duration-500 flex items-center justify-center group/item cursor-help ${isUnlocked
                ? 'border-yellow-500/30 bg-yellow-500/5 shadow-[0_10px_30px_rgba(234,179,8,0.1)] hover:border-yellow-500/50'
                : 'border-white/5 bg-white/2'
                }`}
              title={isUnlocked ? `${achievement.name}: ${achievement.description}` : 'Protocol Locked'}
            >
              {isUnlocked ? (
                <div className="text-3xl transform group-hover/item:scale-125 transition-transform duration-500">{achievement.icon}</div>
              ) : (
                <Lock className="w-5 h-5 text-slate-700 group-hover/item:text-slate-500 transition-colors" />
              )}

              {isUnlocked && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 sq-full flex items-center justify-center border-2 border-slate-950 shadow-lg">
                  <span className="text-white text-[10px] font-black">✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Achievement Details (Recent Unlocks) */}
      {unlockedCount > 0 && (
        <div className="mt-10 space-y-3 relative z-10">
          <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 block mb-4">Verification Records</Label>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id)).reverse().map(achievement => (
              <div
                key={achievement.id}
                className="flex items-center gap-4 p-4 bg-white/2 border border-white/5 sq-md hover:bg-white/5 transition-colors group/record"
              >
                <div className="text-2xl group-hover/record:scale-110 transition-transform">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-200 tracking-tight">{achievement.name}</p>
                  <p className="text-[11px] text-slate-500 font-bold leading-tight mt-1">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
