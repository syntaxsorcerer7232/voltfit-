export interface UserProfile {
  id?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  isDeleted?: boolean;

  name: string;
  email: string;
  points: number;
  badges: string[];
  gender: 'male' | 'female' | 'other' | '';
  dateOfBirth: string;
  mobile: string;
  height: number;
  weight: number;
  weightUnit?: 'kg' | 'lbs';
  bodyType: 'ectomorph' | 'mesomorph' | 'endomorph' | '';
  allergies: string[];
  dietPreference: 'vegetarian' | 'non-vegetarian' | 'eggitarian' | '';
  workoutPreference: 'gym' | 'home' | 'both' | '';
  workoutFrequency: 'daily' | 'moderately' | 'low' | '';
  goal: 'lose' | 'maintain' | 'gain' | '';
  goalSpeed: 'slow' | 'fast' | '';
  calorieGoal: number;
  maintainCalories: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  waterIntakeGoal: number;
  bio: string;
  profilePicture: string;
  streak?: number;
  lastCheckInDate?: string;
  lastStepsReset?: string;
  lifts?: {
    squat?: number;
    bench?: number;
    deadlift?: number;
    verified?: boolean;
  };
  strengthScore?: number;
  strengthRank?: string;
  unlockedRanks?: string[];
  macros?: {
    protein?: number;
    carbs?: number;
    fats?: number;
  };
  goals?: {
    targetWeight?: number;
    dailyCalories?: number;
    dailySteps?: number;
  };
  biometricEnabled?: boolean;
  theme?: 'light' | 'dark';
  supplements?: Supplement[];
  isNatural?: boolean;
  habits?: Habit[];
  customReminders?: {
    days: number[];
    time: string;
    enabled: boolean;
  };
  waterReminders?: {
    enabled: boolean;
    intervalMinutes: number;
    startTime: string;
    endTime: string;
  };
  customFoods?: CustomFood[];
}

export interface Habit {
  id: string;
  name: string;
  completedDates: string[]; // Store YYYY-MM-DD
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  type: string;
  time: string;
  date: string;
  mealTime: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  quantity: number;
  unit: string;
}

export interface Supplement {
  id: string;
  name: string;
  dosage: string;
  timing: string; // e.g. "Pre-workout", "Before bed", "Morning"
  frequency: string; // e.g. "Daily", "Weekly"
}

export interface SupplementLog {
  id: string;
  supplementId: string;
  name: string;
  dosage: string;
  time: string;
  date: string; // YYYY-MM-DD
}

export interface WaterLog {
  date: string; // YYYY-MM-DD
  amountMl: number;
}

export interface PlannedExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  muscleGroups: string[];
}

export interface WorkoutDay {
  weekday: number; // 0-6
  name: string;
  isRest: boolean;
  muscleGroups: string[];
  exercises: PlannedExercise[];
}

export interface WorkoutSchedule {
  mode: 'default' | 'custom';
  custom: WorkoutDay[];
}

export interface CompletedSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface LoggedExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: CompletedSet[];
}

export interface WorkoutHistoryItem {
  id: string;
  name: string;
  type: string;
  completed: boolean;
  date: string;
  exercises: LoggedExercise[];
  notes?: string;
}

export interface WorkoutDiaryItem {
  id: string;
  date: string;
  exercises: LoggedExercise[];
}

export interface SleepLog {
  time: string;
  action: 'sleep' | 'wake';
}

export interface CommunityTip {
  id: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  authorRank: string;
  authorBadges: string[];
  title: string;
  content: string;
  likes: {
    helpful: string[];
    science: string[];
    motivating: string[];
    bookmarks?: string[];
  };
  comments?: {
    id: string;
    authorId: string;
    authorName: string;
    authorImage: string;
    content: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export interface CommunityQuestion {
  id: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  title: string;
  category: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  answers: number;
  likes?: {
    upvotes: string[];
    bookmarks?: string[];
  };
}

export interface CommunityAnswer {
  id: string;
  questionId: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  authorRank: string;
  authorBadges: string[];
  content: string;
  createdAt: string;
  helpfulVotes: string[]; // array of userIds
  isPinned?: boolean;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export interface Chat {
  id?: string;
  participants: string[]; // [user1Id, user2Id]
  participantDetails: {
    [userId: string]: {
      name: string;
      image: string;
    };
  };
  lastMessage: string;
  lastMessageAt: any;
  unreadCount?: {
    [userId: string]: number;
  };
}

export interface DailyMission {
  id: string; // 'water', 'workout', 'protein'
  title: string;
  completed: boolean;
  rewardXP: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  type: string;
  goal: number;
  friends: { name: string; progress: number; userId: string }[];
  joinedUsers: string[];
  createdAt: string;
}

export interface MoodLog {
  status: 'Tired' | 'Normal' | 'Motivated' | '';
  time: string;
}

export interface CustomFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portion: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reply' | 'achievement' | 'system';
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AppState {
  user: UserProfile;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  disciplineMode: boolean;
  theme: 'light' | 'dark';
  streak: number;
  workoutSchedule: WorkoutSchedule;
  hasCheckedInToday?: boolean;
  workoutHistory: WorkoutHistoryItem[];
  workoutDiary: WorkoutDiaryItem[];
  isDataLoading: boolean;
  challenges: Challenge[];
  communityTips: CommunityTip[];
  communityQuestions: CommunityQuestion[];
  leaderboard: any[];
}

export interface DailyLogState {
  date: string;
  weight: number;
  waterAmountMl: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  workoutCompleted: boolean;
  xpEarned: number;
  missions: DailyMission[];
  mood?: MoodLog;
}
