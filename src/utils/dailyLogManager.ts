import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { AppState } from '../types';
import { AppLogsState } from '../context/AppContext';

export const archiveDailyData = async (
  userId: string,
  dateStr: string,
  logsState: AppLogsState,
  workoutHistory: any[],
  workoutDiary: any[],
  userHabits: any[] = []
) => {
  if (!userId || !dateStr) return;
  
  try {
    const archiveRef = doc(db, `users/${userId}/daily_logs`, dateStr);
    const archiveDoc = await getDoc(archiveRef);
    
    // Only archive if it doesn't already exist for that date
    if (!archiveDoc.exists()) {
      const dailyMeals = logsState.meals.filter(m => m.date === dateStr);
      const dailyWater = logsState.waterIntake.filter(w => w.date === dateStr);
      const dailySleep = logsState.sleepLogs.filter(s => s.time.startsWith(dateStr)); // Approximate
      const dailyMoods = logsState.moods.filter(m => m.date === dateStr);
      const dailyWorkouts = workoutHistory.filter(w => w.date.startsWith(dateStr));
      const dailyDiary = workoutDiary.filter(w => w.date === dateStr);
      
      const dailyHabits = userHabits.filter(h => h.completedDates?.includes(dateStr)).map(h => ({
         id: h.id,
         name: h.name,
         completed: true
      }));

      await setDoc(archiveRef, {
        date: dateStr,
        meals: dailyMeals,
        waterIntake: dailyWater,
        sleepLogs: dailySleep,
        moods: dailyMoods,
        dailySteps: logsState.dailySteps,
        workouts: dailyWorkouts,
        diary: dailyDiary,
        habits: dailyHabits,
        archivedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log(`[DailyLogManager] Successfully archived data for ${dateStr}`);
    }
  } catch (error) {
    console.error(`[DailyLogManager] Failed to archive data for ${dateStr}:`, error);
  }
};
