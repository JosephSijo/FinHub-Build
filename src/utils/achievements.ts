import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  // Getting Started Achievements
  {
    id: 'first_transaction',
    name: 'Getting Started',
    description: 'Add your first transaction',
    icon: '🎯',
    condition: (data) => data.totalTransactions >= 1
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Log in for the first time today',
    icon: '🌅',
    condition: (data) => data.dailyLogin === true
  },
  {
    id: 'ten_transactions',
    name: 'Building Habits',
    description: 'Log 10 transactions',
    icon: '📊',
    condition: (data) => data.totalTransactions >= 10
  },
  {
    id: 'fifty_transactions',
    name: 'Momentum Builder',
    description: 'Log 50 transactions',
    icon: '⚡',
    condition: (data) => data.totalTransactions >= 50
  },
  {
    id: 'financial_guru',
    name: 'Financial Guru',
    description: 'Complete 100 transactions',
    icon: '🧙',
    condition: (data) => data.totalTransactions >= 100
  },

  // Consistency Achievements
  {
    id: 'three_day_streak',
    name: 'Streak Starter',
    description: 'Log in for 3 days in a row',
    icon: '🔥',
    condition: (data) => data.currentStreak >= 3
  },
  {
    id: 'consistent_tracker',
    name: 'Consistent Tracker',
    description: 'Log transactions for 7 days in a row',
    icon: '📅',
    condition: (data) => data.currentStreak >= 7
  },
  {
    id: 'habit_master',
    name: 'Habit Master',
    description: 'Maintain a 30-day streak',
    icon: '🏅',
    condition: (data) => data.currentStreak >= 30
  },
  {
    id: 'dedication_champion',
    name: 'Dedication Champion',
    description: 'Achieve a 100-day streak',
    icon: '👑',
    condition: (data) => data.currentStreak >= 100
  },

  // Goals Achievements
  {
    id: 'first_goal',
    name: 'Goal Setter',
    description: 'Create your first savings goal',
    icon: '🎯',
    condition: (data) => data.totalGoals >= 1
  },
  {
    id: 'goal_achiever',
    name: 'Goal Achiever',
    description: 'Complete your first savings goal',
    icon: '🏆',
    condition: (data) => data.completedGoals >= 1
  },
  {
    id: 'triple_winner',
    name: 'Triple Winner',
    description: 'Complete 3 savings goals',
    icon: '🎖️',
    condition: (data) => data.completedGoals >= 3
  },
  {
    id: 'goal_crusher',
    name: 'Goal Crusher',
    description: 'Complete 5 savings goals',
    icon: '💎',
    condition: (data) => data.completedGoals >= 5
  },

  // Debt Management Achievements
  {
    id: 'debt_aware',
    name: 'Debt Aware',
    description: 'Track your first debt',
    icon: '📝',
    condition: (data) => data.totalDebts >= 1
  },
  {
    id: 'debt_settler',
    name: 'Debt Settler',
    description: 'Settle your first debt',
    icon: '✅',
    condition: (data) => data.settledDebts >= 1
  },
  {
    id: 'debt_destroyer',
    name: 'Debt Destroyer',
    description: 'Settle 5 debts',
    icon: '💪',
    condition: (data) => data.settledDebts >= 5
  },
  {
    id: 'debt_free_hero',
    name: 'Debt-Free Hero',
    description: 'Maintain zero pending debts',
    icon: '🦸',
    condition: (data) => data.totalDebts > 0 && data.settledDebts === data.totalDebts
  },

  // Savings Achievements
  {
    id: 'first_saver',
    name: 'First Saver',
    description: 'Achieve 10%+ savings rate',
    icon: '🌱',
    condition: (data) => data.savingsRate >= 0.1
  },
  {
    id: 'super_saver',
    name: 'Super Saver',
    description: 'Maintain a 20%+ savings rate',
    icon: '💰',
    condition: (data) => data.savingsRate >= 0.2
  },
  {
    id: 'elite_saver',
    name: 'Elite Saver',
    description: 'Achieve 30%+ savings rate',
    icon: '💸',
    condition: (data) => data.savingsRate >= 0.3
  },
  {
    id: 'legendary_saver',
    name: 'Legendary Saver',
    description: 'Maintain 50%+ savings rate',
    icon: '🏰',
    condition: (data) => data.savingsRate >= 0.5
  },

  // Budget Management Achievements
  {
    id: 'budget_conscious',
    name: 'Budget Conscious',
    description: 'Keep spending under 80% of income',
    icon: '📊',
    condition: (data) => data.monthlySpendingRatio <= 0.8
  },
  {
    id: 'budget_master',
    name: 'Budget Master',
    description: 'Keep spending under 70% of income',
    icon: '👑',
    condition: (data) => data.monthlySpendingRatio <= 0.7
  },
  {
    id: 'frugal_champion',
    name: 'Frugal Champion',
    description: 'Keep spending under 50% of income',
    icon: '🌟',
    condition: (data) => data.monthlySpendingRatio <= 0.5
  },

  // Engagement Achievements
  {
    id: 'stay_notified',
    name: 'Stay Notified',
    description: 'Enable notifications',
    icon: '🔔',
    condition: (data) => data.notificationsEnabled === true
  },
  {
    id: 'ai_curious',
    name: 'AI Curious',
    description: 'Chat with AI Guru for the first time',
    icon: '🤖',
    condition: (data) => data.aiInteractions >= 1
  },
  {
    id: 'ai_enthusiast',
    name: 'AI Enthusiast',
    description: 'Chat with AI Guru 10 times',
    icon: '🧠',
    condition: (data) => data.aiInteractions >= 10
  },
  {
    id: 'profile_complete',
    name: 'Profile Complete',
    description: 'Add your name and photo',
    icon: '👤',
    condition: (data) => data.profileComplete === true
  },
  {
    id: 'account_organizer',
    name: 'Account Organizer',
    description: 'Create 3 or more accounts',
    icon: '🏦',
    condition: (data) => data.totalAccounts >= 3
  }
];

export function checkAchievements(data: any, unlockedAchievements: string[]): string[] {
  const newAchievements: string[] = [];

  ACHIEVEMENTS.forEach(achievement => {
    if (!unlockedAchievements.includes(achievement.id) && achievement.condition(data)) {
      newAchievements.push(achievement.id);
    }
  });

  return newAchievements;
}

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getUnlockedCount(unlockedAchievements: string[]): number {
  return unlockedAchievements.length;
}

export function getTotalCount(): number {
  return ACHIEVEMENTS.length;
}

export interface LevelInfo {
  level: number;
  title: string;
  nextLevelAt: number | null;
  progress: number;
}

export function getLevelInfo(unlockedCount: number): LevelInfo {
  const levels = [
    { threshold: 0, title: 'Seedling' },
    { threshold: 2, title: 'Sprout' },
    { threshold: 5, title: 'Sapling' },
    { threshold: 10, title: 'Budding Saver' },
    { threshold: 15, title: 'Thrifty Bloom' },
    { threshold: 20, title: 'Grown Guru' },
    { threshold: 25, title: 'Wealth Master' },
    { threshold: 30, title: 'Financial Legend' },
  ];

  let currentLevel = 0;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (unlockedCount >= levels[i].threshold) {
      currentLevel = i;
      break;
    }
  }

  const nextLevel = levels[currentLevel + 1];
  const currentThreshold = levels[currentLevel].threshold;

  let progress = 0;
  if (nextLevel) {
    const range = nextLevel.threshold - currentThreshold;
    const currentInRange = unlockedCount - currentThreshold;
    progress = Math.min(100, (currentInRange / range) * 100);
  } else {
    progress = 100;
  }

  return {
    level: currentLevel + 1,
    title: levels[currentLevel].title,
    nextLevelAt: nextLevel ? nextLevel.threshold : null,
    progress
  };
}

export function getAllAchievements(): Achievement[] {
  return ACHIEVEMENTS;
}
