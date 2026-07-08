import { WorkoutDiaryItem, SleepLog, SupplementLog } from '../types';

export interface RecoveryInsight {
  needsRestDay: boolean;
  score: number;
  status: 'Fatigued' | 'Moderate' | 'Fresh';
  recommendation: string;
  overusedMuscles: string[];
}

export function calculateRecovery(
  workoutDiary: WorkoutDiaryItem[], 
  sleepLogs?: SleepLog[], 
  supplementLogs?: SupplementLog[]
): RecoveryInsight {
  if (!workoutDiary || workoutDiary.length === 0) {
    return {
      needsRestDay: false,
      score: 100,
      status: 'Fresh',
      recommendation: "Ready for a full workout!",
      overusedMuscles: []
    };
  }

  // Sort chronological
  const sortedDiary = [...workoutDiary].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // 1. Rest Analysis (consecutive days)
  let consecutiveDays = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedDiary.length; i++) {
     const logDate = new Date(sortedDiary[i].date);
     logDate.setHours(0, 0, 0, 0);
     const diffDays = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
     
     if (diffDays === i || diffDays === i + 1) {
         consecutiveDays++;
     } else {
         break; // gap found
     }
  }

  const needsRestDay = consecutiveDays > 5;

  // 2. Recovery Status
  let score = 100 - (consecutiveDays * 8);

  // Sleep processing
  if (sleepLogs && sleepLogs.length > 0) {
     const recentSleepLogs = sleepLogs.filter(log => {
         const diffHours = (new Date().getTime() - new Date(log.time).getTime()) / (1000 * 60 * 60);
         return diffHours <= 24;
     });
     if (recentSleepLogs.length > 0) {
        // Boost recovery score if sleep events are tracked within the last 24 hours
        score += 15;
     }
  }

  // 3. Supplement Processing
  if (supplementLogs && supplementLogs.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const todaysSupps = supplementLogs.filter(log => log.date === today);
    
    if (todaysSupps.length > 0) {
      // Basic boost for any supplement logged
      score += 5;

      // Specific boosts for key recovery supplements
      const hasProtein = todaysSupps.some(s => s.name.toLowerCase().includes('protein'));
      const hasCreatine = todaysSupps.some(s => s.name.toLowerCase().includes('creatine'));
      const hasCasein = todaysSupps.some(s => s.name.toLowerCase().includes('casein'));

      if (hasProtein) score += 5;
      if (hasCreatine) score += 3;
      if (hasCasein) score += 4;
    }
  }

  score = Math.max(0, Math.min(100, score));

  let status: 'Fatigued' | 'Moderate' | 'Fresh' = 'Fresh';
  let recommendation = "Ready for a full workout!";

  if (score < 40) {
    status = 'Fatigued';
    recommendation = "Take a rest day today";
  } else if (score < 70) {
    status = 'Moderate';
    recommendation = "Consider light active recovery";
  }

  return {
    needsRestDay,
    score,
    status,
    recommendation,
    overusedMuscles: []
  };
}
