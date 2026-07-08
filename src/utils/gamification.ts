export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsReward: number;
}

export const BADGES: Record<string, BadgeDef> = {
  'first_workout': {
    id: 'first_workout',
    title: 'First Blood',
    description: 'Completed your very first workout',
    icon: '🏆',
    pointsReward: 50
  },
  'streak_master': {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Maintained a 7-day workout and goal streak',
    icon: '🔥',
    pointsReward: 100
  },
  'steps_10k': {
    id: 'steps_10k',
    title: '10k Steps',
    description: 'Walked 10,000 steps in a single day',
    icon: '👟',
    pointsReward: 30
  },
  'early_bird': {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Completed a workout before 7:00 AM',
    icon: '🌅',
    pointsReward: 50
  }
};

export const checkMilestones = (
    currentBadges: string[], 
    stats: { workoutsCompleted: number, currentStreak: number, currentSteps: number, earlyWorkouts?: number }
): string[] => {
    const newBadges: string[] = [];

    if (stats.workoutsCompleted >= 1 && !currentBadges.includes('first_workout')) {
        newBadges.push('first_workout');
    }

    if (stats.currentStreak >= 7 && !currentBadges.includes('streak_master')) {
        newBadges.push('streak_master');
    }

    if (stats.currentSteps >= 10000 && !currentBadges.includes('steps_10k')) {
        newBadges.push('steps_10k');
    }
    
    if ((stats.earlyWorkouts || 0) >= 1 && !currentBadges.includes('early_bird')) {
        newBadges.push('early_bird');
    }

    return newBadges;
};
