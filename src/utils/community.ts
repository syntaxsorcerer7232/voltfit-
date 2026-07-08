import { UserProfile, WorkoutHistoryItem } from '../types';

export const getPRsFromHistory = (history: WorkoutHistoryItem[]) => {
  let squat = 0;
  let bench = 0;
  let deadlift = 0;

  history.forEach(workout => {
    workout.exercises.forEach(ex => {
      const name = ex.name.toLowerCase();
      let maxWeight = 0;
      ex.sets.forEach(set => {
        if (set.completed && set.weight > maxWeight) maxWeight = set.weight;
      });

      if (name.includes('squat')) squat = Math.max(squat, maxWeight);
      if (name.includes('bench')) bench = Math.max(bench, maxWeight);
      if (name.includes('deadlift')) deadlift = Math.max(deadlift, maxWeight);
    });
  });

  return { squat, bench, deadlift };
};

export const getDynamicStrengthScore = (lifts?: { squat?: number; bench?: number; deadlift?: number }, history?: WorkoutHistoryItem[]): number => {
  const manualScore = getStrengthScore(lifts);
  if (!history || history.length === 0) return manualScore;
  
  const prs = getPRsFromHistory(history);
  const historyScore = prs.squat + prs.bench + prs.deadlift;
  
  return Math.max(manualScore, historyScore);
};

export const getStrengthScore = (lifts?: { squat?: number; bench?: number; deadlift?: number }): number => {
  if (!lifts) return 0;
  return (lifts.squat || 0) + (lifts.bench || 0) + (lifts.deadlift || 0);
};

export const getRank = (score: number): { name: string; required: number; next?: number } => {
  if (score >= 500) return { name: 'Legend', required: 500 };
  if (score >= 400) return { name: 'Beast', required: 400, next: 500 };
  if (score >= 300) return { name: 'Titan', required: 300, next: 400 };
  if (score >= 200) return { name: 'Warrior', required: 200, next: 300 };
  if (score >= 100) return { name: 'Novice', required: 100, next: 200 };
  return { name: 'Beginner', required: 0, next: 100 };
};

export const getReputationLevel = (points: number): string => {
  if (points >= 1000) return 'Master Advisor';
  if (points >= 500) return 'Expert Advisor';
  if (points >= 100) return 'Trusted Advisor';
  return 'New Advisor';
};

export const canBeAdvisor = (user: UserProfile, historyLength: number, accountAgeDays: number, history: WorkoutHistoryItem[]): boolean => {
  const manualLifts = user.lifts || { squat: 0, bench: 0, deadlift: 0 };
  const hasManualPRs = ((manualLifts.squat || 0) + (manualLifts.bench || 0) + (manualLifts.deadlift || 0)) >= 200;
  
  let hasHistoryPRs = false;
  if (history && history.length > 0) {
    const prs = getPRsFromHistory(history);
    hasHistoryPRs = (prs.squat + prs.bench + prs.deadlift) >= 200;
  }

  return hasManualPRs || hasHistoryPRs;
};
