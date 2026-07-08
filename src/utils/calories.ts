import { UserProfile } from '../types';

export function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function calculateMacros(
  user: Partial<UserProfile>
): {
  maintainCalories: number;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  goals: {
    targetWeight?: number;
    dailyCalories?: number;
    dailySteps?: number;
  };
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
} {
  const age = calculateAge(user.dateOfBirth || '');
  const weight = user.weight || 0;
  const height = user.height || 0;
  
  if (!weight || !height || !age) {
      return { 
        maintainCalories: 0, calorieGoal: 0, proteinGoal: 0, carbsGoal: 0, fatsGoal: 0,
        goals: { ...user.goals },
        macros: { protein: 0, carbs: 0, fats: 0 }
      };
  }

  // BMR Calculation (Mifflin-St Jeor)
  let bmr = 0;
  if (user.gender === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else { // male or other default
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  }

  // TDEE
  let activityScale = 1.2; // Sedentary
  if (user.workoutFrequency === 'daily') activityScale = 1.725;
  else if (user.workoutFrequency === 'moderately') activityScale = 1.55;
  else if (user.workoutFrequency === 'low') activityScale = 1.375;

  const tdee = Math.round(bmr * activityScale);

  // Goal Adjustments
  let targetCalories = user.goals?.dailyCalories || user.calorieGoal || tdee;
  if (!user.goals?.dailyCalories && !user.calorieGoal) {
    if (user.goal === 'lose') {
      targetCalories = user.goalSpeed === 'fast' ? tdee * 0.8 : tdee * 0.9;
    } else if (user.goal === 'gain') {
      targetCalories = user.goalSpeed === 'fast' ? tdee * 1.2 : tdee * 1.1;
    }
  }

  targetCalories = Math.round(targetCalories);

  // Macros
  const proteinGoal = Math.round((targetCalories * 0.3) / 4);
  const carbsGoal = Math.round((targetCalories * 0.45) / 4);
  const fatsGoal = Math.round((targetCalories * 0.25) / 9);

  return {
    maintainCalories: tdee,
    calorieGoal: targetCalories,
    proteinGoal: user.macros?.protein || proteinGoal,
    carbsGoal: user.macros?.carbs || carbsGoal,
    fatsGoal: user.macros?.fats || fatsGoal,
    goals: {
        ...(user.goals || {}),
        dailyCalories: targetCalories
    },
    macros: {
      protein: user.macros?.protein || proteinGoal,
      carbs: user.macros?.carbs || carbsGoal,
      fats: user.macros?.fats || fatsGoal,
    }
  };
}
