
export interface Exercise {
  id: string;
  name: string;
  focus: string[];
  equipment: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  bodyweight?: boolean;
  videoUrl?: string;
  instructions?: string[];
  tips?: string[];
}

export const EXERCISE_LIBRARY: Exercise[] = [
  // User Requested: Chest
  {
    id: 'chest-cable-fly',
    name: 'Cable Chest Fly',
    focus: ['Chest'],
    equipment: 'Cable',
    difficulty: 'Intermediate',
    instructions: [
      'Stand in the middle of the cable machine with feet shoulder-width apart.',
      'Grasp handles with palms facing forward and arms slightly bent.',
      'Bring your hands together in a wide arc in front of your chest.',
      'Squeeze your chest at the peak, then slowly return to the start.'
    ],
    tips: [
      'Keep a slight bend in your elbows throughout.',
      'Do not let the weight pull your arms past your shoulders.',
      'Focus on the stretch and contraction of the pectoral muscles.'
    ]
  },
  {
    id: 'chest-cable-press',
    name: 'Cable Chest Press',
    focus: ['Chest'],
    equipment: 'Cable',
    difficulty: 'Beginner'
  },
  {
    id: 'chest-cable-crossover',
    name: 'Cable Crossover',
    focus: ['Chest'],
    equipment: 'Cable',
    difficulty: 'Intermediate'
  },
  // User Requested: Back
  {
    id: 'back-lat-pulldown',
    name: 'Lat Pulldown',
    focus: ['Back'],
    equipment: 'Machine',
    difficulty: 'Beginner'
  },
  {
    id: 'back-seated-cable-row',
    name: 'Seated Cable Row',
    focus: ['Back'],
    equipment: 'Cable',
    difficulty: 'Beginner'
  },
  {
    id: 'back-straight-arm-pulldown',
    name: 'Straight Arm Lat Pulldown',
    focus: ['Back'],
    equipment: 'Cable',
    difficulty: 'Intermediate'
  },
  // User Requested: Shoulders
  {
    id: 'shoulders-cable-lateral-raise',
    name: 'Cable Lateral Raise',
    focus: ['Shoulders'],
    equipment: 'Cable',
    difficulty: 'Beginner'
  },
  {
    id: 'shoulders-cable-front-raise',
    name: 'Cable Front Raise',
    focus: ['Shoulders'],
    equipment: 'Cable',
    difficulty: 'Beginner'
  },
  {
    id: 'shoulders-cable-upright-row',
    name: 'Cable Upright Row',
    focus: ['Shoulders'],
    equipment: 'Cable',
    difficulty: 'Intermediate'
  },
  {
    id: 'shoulders-face-pull',
    name: 'Face Pull',
    focus: ['Shoulders'],
    equipment: 'Cable',
    difficulty: 'Intermediate'
  },
  // User Requested: Arms
  {
    id: 'arms-cable-bicep-curl',
    name: 'Cable Biceps Curl',
    focus: ['Biceps'],
    equipment: 'Cable',
    difficulty: 'Beginner'
  },
  {
    id: 'arms-dual-cable-curl',
    name: 'Dual Cable Curl',
    focus: ['Biceps'],
    equipment: 'Cable',
    difficulty: 'Intermediate'
  },
  // Common Exercises to fill gaps
  { id: 'bp-1', name: 'Bench Press', focus: ['Chest'], equipment: 'Barbell', difficulty: 'Beginner' },
  { id: 'sq-1', name: 'Squats', focus: ['Legs'], equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: 'dl-1', name: 'Deadlift', focus: ['Back', 'Legs'], equipment: 'Barbell', difficulty: 'Advanced' },
  { id: 'ohp-1', name: 'Overhead Press', focus: ['Shoulders'], equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: 'pu-1', name: 'Pull Ups', focus: ['Back'], equipment: 'Bodyweight', difficulty: 'Intermediate', bodyweight: true },
  { id: 'ps-1', name: 'Push Ups', focus: ['Chest'], equipment: 'Bodyweight', difficulty: 'Beginner', bodyweight: true },
  { id: 'ld-1', name: 'Leg Press', focus: ['Legs'], equipment: 'Machine', difficulty: 'Beginner' },
  { id: 'tc-1', name: 'Tricep Pushdown', focus: ['Triceps'], equipment: 'Cable', difficulty: 'Beginner' }
];
