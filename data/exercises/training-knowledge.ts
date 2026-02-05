/**
 * Training Knowledge - Education Content
 *
 * This file contains educational content about muscle building, fat loss,
 * and training principles. Used to build user mindset and understanding.
 */

// ============================================
// TRAINING PRINCIPLES
// ============================================

export interface TrainingPrinciple {
  id: string;
  name: string;
  shortDescription: string;
  fullExplanation: string;
  keyPoints: string[];
  practicalTips: string[];
  commonMistakes: string[];
  relatedPrinciples: string[];
}

export const TRAINING_PRINCIPLES: TrainingPrinciple[] = [
  {
    id: 'progressive-overload',
    name: 'Progressive Overload',
    shortDescription: 'Gradually increasing demands on your muscles over time',
    fullExplanation: `Progressive overload is the fundamental principle of muscle growth. Your body adapts to stress, so you must continually increase the challenge to keep making progress. This can be done by adding weight, increasing reps, adding sets, reducing rest time, or improving form/range of motion.`,
    keyPoints: [
      'Muscles grow in response to increasing demands',
      'Small, consistent increases beat big jumps',
      'Track your workouts to ensure progression',
      'Overload can be achieved multiple ways, not just weight',
    ],
    practicalTips: [
      'Add 2.5-5 lbs when you can complete all reps with good form',
      'If you can\'t add weight, add 1-2 reps per set',
      'Keep a workout log to track progress',
      'Aim to improve something every 1-2 weeks',
    ],
    commonMistakes: [
      'Increasing weight too fast and sacrificing form',
      'Not tracking workouts, so progress is unclear',
      'Only focusing on weight, ignoring other forms of overload',
      'Expecting linear progress forever (it slows over time)',
    ],
    relatedPrinciples: ['hypertrophy', 'volume', 'intensity'],
  },
  {
    id: 'hypertrophy',
    name: 'Hypertrophy (Muscle Growth)',
    shortDescription: 'The process of muscle fibers increasing in size',
    fullExplanation: `Hypertrophy is the scientific term for muscle growth. When you resistance train, you create microscopic tears in muscle fibers. Your body repairs these tears and builds the fibers slightly larger and stronger. This requires adequate training stimulus, nutrition (especially protein), and recovery/sleep.`,
    keyPoints: [
      'Muscle growth requires mechanical tension and metabolic stress',
      'Optimal rep range for hypertrophy is typically 6-12 reps',
      '10-20 sets per muscle group per week is generally optimal',
      'Protein intake of 0.7-1g per pound of bodyweight supports growth',
      'Sleep and recovery are when muscles actually grow',
    ],
    practicalTips: [
      'Focus on the 8-12 rep range for most exercises',
      'Use a tempo that creates time under tension (2-3 seconds down)',
      'Eat protein with every meal',
      'Get 7-9 hours of sleep',
      'Train each muscle group 2x per week for optimal growth',
    ],
    commonMistakes: [
      'Training too heavy with poor form',
      'Not eating enough protein',
      'Insufficient sleep and recovery',
      'Expecting results in days instead of months',
    ],
    relatedPrinciples: ['progressive-overload', 'rir', 'volume'],
  },
  {
    id: 'rir',
    name: 'RIR (Reps in Reserve)',
    shortDescription: 'How many more reps you could do before failure',
    fullExplanation: `RIR is a way to measure how hard you\'re working. If you do 10 reps and could have done 2 more, that\'s RIR 2 (or RPE 8). Training at RIR 1-3 is generally optimal for muscle growth - hard enough to stimulate growth, but not so hard you can\'t recover. Training to failure (RIR 0) every set leads to excessive fatigue without extra benefit.`,
    keyPoints: [
      'RIR 0 = complete failure, cannot do another rep',
      'RIR 1-2 = stopped 1-2 reps short of failure',
      'RIR 3-4 = moderately challenging, some reps left',
      'Most sets should be at RIR 1-3 for optimal growth',
      'Last set of an exercise can go to RIR 0-1',
    ],
    practicalTips: [
      'End most sets when you have 2-3 reps "in the tank"',
      'Save failure training for the last set of an exercise',
      'If form breaks down, you\'ve gone past your true RIR 0',
      'RIR takes practice to gauge accurately',
    ],
    commonMistakes: [
      'Training to failure every set (excessive fatigue)',
      'Stopping too early (RIR 5+) and not stimulating growth',
      'Confusing discomfort with being close to failure',
      'Not adjusting weight when RIR is too high/low',
    ],
    relatedPrinciples: ['progressive-overload', 'volume', 'recovery'],
  },
  {
    id: 'push-pull-legs',
    name: 'Push/Pull/Legs Split',
    shortDescription: 'Organizing workouts by movement patterns',
    fullExplanation: `Push/Pull/Legs (PPL) is a popular way to structure workouts. Push days work chest, shoulders, and triceps (pushing movements). Pull days work back and biceps (pulling movements). Leg days work quadriceps, hamstrings, glutes, and calves. This allows training each muscle group twice per week while giving adequate recovery.`,
    keyPoints: [
      'Push: chest press, shoulder press, tricep exercises',
      'Pull: rows, pull-ups, bicep curls',
      'Legs: squats, lunges, deadlifts, calf raises',
      'Muscles that work together train together',
      'Allows 48-72 hours recovery between similar workouts',
    ],
    practicalTips: [
      'Run as 6-day cycle: Push-Pull-Legs-Push-Pull-Legs-Rest',
      'Or 3-day per week: Push Monday, Pull Wednesday, Legs Friday',
      'Start with compound movements, finish with isolation',
      'Great for intermediate to advanced lifters',
    ],
    commonMistakes: [
      'Doing too much volume per session',
      'Neglecting legs (don\'t skip leg day!)',
      'Not balancing push and pull volume',
      'Overcomplicating with too many exercises',
    ],
    relatedPrinciples: ['volume', 'compound-vs-isolation', 'recovery'],
  },
  {
    id: 'compound-vs-isolation',
    name: 'Compound vs Isolation Exercises',
    shortDescription: 'Multi-joint vs single-joint movements',
    fullExplanation: `Compound exercises work multiple muscle groups and joints (squats, deadlifts, bench press, rows). Isolation exercises target one muscle group (bicep curls, leg extensions, lateral raises). Compounds are more time-efficient and build functional strength. Isolations are useful for targeting weak points or adding volume to specific muscles.`,
    keyPoints: [
      'Compound exercises should form the foundation of training',
      'Compounds: squats, deadlifts, presses, rows, pull-ups',
      'Isolation: curls, extensions, raises, flyes',
      'Compounds first when fresh, isolation exercises after',
      '70-80% of training should be compound movements',
    ],
    practicalTips: [
      'Start workouts with 2-3 compound exercises',
      'Add 1-2 isolation exercises to finish',
      'Use isolations for lagging body parts',
      'Compounds give more bang for your buck',
    ],
    commonMistakes: [
      'Spending too much time on isolation exercises',
      'Skipping compounds because they\'re harder',
      'Using isolation exercises as main strength builders',
      'Neglecting compound movement technique',
    ],
    relatedPrinciples: ['push-pull-legs', 'progressive-overload', 'volume'],
  },
  {
    id: 'volume',
    name: 'Training Volume',
    shortDescription: 'Total amount of work performed (sets × reps × weight)',
    fullExplanation: `Volume is the total amount of work you do. More volume generally leads to more muscle growth, up to a point. Research suggests 10-20 "hard" sets per muscle group per week is optimal for most people. Too little volume won\'t stimulate growth; too much leads to overtraining and injury.`,
    keyPoints: [
      'Volume = sets × reps × weight',
      'Beginners: 10-12 sets per muscle group per week',
      'Intermediate: 12-16 sets per muscle group per week',
      'Advanced: 16-20+ sets per muscle group per week',
      'More isn\'t always better - recovery matters',
    ],
    practicalTips: [
      'Start with lower volume and add over time',
      'Spread volume across 2+ sessions per muscle group',
      'Track total weekly sets per muscle group',
      'If not recovering, reduce volume',
    ],
    commonMistakes: [
      'Doing way too much volume (junk volume)',
      'Not doing enough volume to stimulate growth',
      'Counting easy warm-up sets as working sets',
      'Not increasing volume as you adapt',
    ],
    relatedPrinciples: ['progressive-overload', 'recovery', 'rir'],
  },
  {
    id: 'recovery',
    name: 'Recovery & Adaptation',
    shortDescription: 'Rest is when your muscles actually grow',
    fullExplanation: `You don\'t get stronger during workouts - you get stronger during recovery. Training creates the stimulus; sleep, nutrition, and rest provide the conditions for adaptation. Without adequate recovery, you\'ll plateau or regress. Most muscles need 48-72 hours before training again.`,
    keyPoints: [
      'Muscle protein synthesis is elevated for 24-48 hours post-workout',
      'Sleep is when growth hormone is released',
      '7-9 hours of sleep is optimal for recovery',
      'Stress, alcohol, and poor nutrition impair recovery',
      'Deload weeks help prevent overtraining',
    ],
    practicalTips: [
      'Prioritize 7-9 hours of sleep',
      'Take a deload week every 4-8 weeks',
      'Eat protein every 3-4 hours during waking hours',
      'Manage stress - it affects recovery',
      'Listen to your body - extra rest days are okay',
    ],
    commonMistakes: [
      'Training the same muscle too frequently',
      'Sacrificing sleep to train more',
      'Not taking deload weeks',
      'Ignoring signs of overtraining',
    ],
    relatedPrinciples: ['hypertrophy', 'volume', 'nutrition'],
  },
  {
    id: 'mind-muscle-connection',
    name: 'Mind-Muscle Connection',
    shortDescription: 'Focusing on the muscle you\'re training',
    fullExplanation: `Mind-muscle connection is the conscious focus on contracting a specific muscle during exercise. Research shows that focusing on the target muscle increases its activation. This is especially important for isolation exercises and can help "wake up" muscles that are hard to feel working.`,
    keyPoints: [
      'Focus on the muscle contracting, not just moving weight',
      'Slow down the movement to increase awareness',
      'Use lighter weight initially to develop connection',
      'More effective for isolation than compound exercises',
      'Takes practice to develop',
    ],
    practicalTips: [
      'Before lifting, contract the target muscle a few times',
      'Use a slow, controlled tempo',
      'Close your eyes to increase focus',
      'Touch the working muscle if possible',
      'Don\'t use weight so heavy you can\'t feel the muscle',
    ],
    commonMistakes: [
      'Going too heavy to feel anything',
      'Rushing through reps',
      'Focusing on the number, not the quality',
      'Getting frustrated if it takes time to develop',
    ],
    relatedPrinciples: ['hypertrophy', 'rir', 'compound-vs-isolation'],
  },
];

// ============================================
// FAT LOSS PRINCIPLES
// ============================================

export interface FatLossPrinciple {
  id: string;
  name: string;
  shortDescription: string;
  fullExplanation: string;
  keyPoints: string[];
  practicalTips: string[];
  myths: string[];
}

export const FAT_LOSS_PRINCIPLES: FatLossPrinciple[] = [
  {
    id: 'caloric-deficit',
    name: 'Caloric Deficit',
    shortDescription: 'Eating fewer calories than you burn',
    fullExplanation: `Fat loss requires a caloric deficit - consuming fewer calories than your body uses. Your body then uses stored fat for energy. A moderate deficit of 300-500 calories per day leads to sustainable fat loss of 0.5-1 lb per week. Extreme deficits can lead to muscle loss and metabolic adaptation.`,
    keyPoints: [
      'Deficit = calories burned - calories eaten',
      '3,500 calorie deficit ≈ 1 lb of fat loss',
      'Moderate deficit (300-500 cal) is sustainable',
      'Can be achieved through eating less or moving more',
      'Resistance training helps preserve muscle during deficit',
    ],
    practicalTips: [
      'Track food for a few weeks to understand intake',
      'Aim for 0.5-1% of bodyweight loss per week',
      'Keep protein high (0.7-1g per lb bodyweight)',
      'Include resistance training to preserve muscle',
      'Small deficit + patience beats aggressive dieting',
    ],
    myths: [
      'Certain foods are "fat burning" - only deficit matters',
      'You need to eat very few calories - moderate works better',
      'Cardio is required for fat loss - deficit is what matters',
      'You can\'t build muscle in a deficit - you can, slowly',
    ],
  },
  {
    id: 'body-recomposition',
    name: 'Body Recomposition',
    shortDescription: 'Building muscle while losing fat simultaneously',
    fullExplanation: `Body recomposition is the process of losing fat and gaining muscle at the same time. This is most achievable for beginners, those returning after a break, or those with higher body fat. It requires eating at maintenance or slight deficit, high protein, and consistent resistance training.`,
    keyPoints: [
      'Scale weight may not change much',
      'Focus on body measurements and how clothes fit',
      'Most effective for beginners or detrained individuals',
      'Requires patience - results take months to show',
      'High protein intake is essential',
    ],
    practicalTips: [
      'Eat at maintenance calories or slight deficit',
      'Protein at 1g per lb of bodyweight',
      'Progressive resistance training 3-4x per week',
      'Track measurements, not just scale weight',
      'Take progress photos monthly',
    ],
    myths: [
      'You must bulk then cut - recomp is real',
      'Scale not moving means no progress - measure other ways',
      'Only possible with steroids - slower but achievable naturally',
    ],
  },
  {
    id: 'neat',
    name: 'NEAT (Non-Exercise Activity)',
    shortDescription: 'Calories burned from daily movement outside workouts',
    fullExplanation: `NEAT stands for Non-Exercise Activity Thermogenesis - all the calories you burn from movement that isn\'t formal exercise. This includes walking, fidgeting, standing, taking stairs, etc. NEAT can account for 15-30% of daily calories and varies hugely between individuals. Increasing NEAT is often easier than adding exercise.`,
    keyPoints: [
      'Can account for 200-900+ calories per day',
      'Tends to decrease when dieting (body conserves energy)',
      'Easy to increase without feeling like "exercise"',
      'Highly variable between individuals',
      'Sustainable way to increase calorie burn',
    ],
    practicalTips: [
      'Aim for 8,000-10,000+ steps daily',
      'Take walking meetings or phone calls',
      'Park farther away, take stairs',
      'Stand or walk while watching TV',
      'Track steps to stay aware',
    ],
    myths: [
      'Only intense exercise burns calories - all movement counts',
      'NEAT is negligible - it can be hundreds of calories',
      'You can\'t control NEAT - you can consciously increase it',
    ],
  },
];

// ============================================
// HEART RATE ZONES
// ============================================

export interface HeartRateZone {
  zone: number;
  name: string;
  percentageOfMax: [number, number]; // [min, max]
  description: string;
  benefits: string[];
  feelDescription: string;
  exampleActivities: string[];
}

export const HEART_RATE_ZONES: HeartRateZone[] = [
  {
    zone: 1,
    name: 'Recovery / Very Light',
    percentageOfMax: [50, 60],
    description: 'Very easy effort, conversational pace',
    benefits: ['Active recovery', 'Improved blood flow', 'Mental health'],
    feelDescription: 'Can easily hold a full conversation, minimal exertion',
    exampleActivities: ['Leisurely walking', 'Light stretching', 'Easy yoga'],
  },
  {
    zone: 2,
    name: 'Fat Burn / Light',
    percentageOfMax: [60, 70],
    description: 'Light aerobic zone, sustainable for long periods',
    benefits: ['Fat burning', 'Endurance building', 'Aerobic base'],
    feelDescription: 'Can talk in sentences, breathing slightly elevated',
    exampleActivities: ['Brisk walking', 'Easy jogging', 'Light cycling'],
  },
  {
    zone: 3,
    name: 'Aerobic / Moderate',
    percentageOfMax: [70, 80],
    description: 'Moderate intensity, improving cardiovascular fitness',
    benefits: ['Improved cardiovascular efficiency', 'Increased stamina'],
    feelDescription: 'Can speak in short sentences, noticeable breathing',
    exampleActivities: ['Running', 'Swimming', 'Cycling', 'Dance cardio'],
  },
  {
    zone: 4,
    name: 'Threshold / Hard',
    percentageOfMax: [80, 90],
    description: 'Hard effort at anaerobic threshold',
    benefits: ['Increased speed', 'Improved lactate tolerance', 'Performance gains'],
    feelDescription: 'Difficult to talk, heavy breathing, challenging',
    exampleActivities: ['Interval training', 'Tempo runs', 'HIIT'],
  },
  {
    zone: 5,
    name: 'Maximum / All-Out',
    percentageOfMax: [90, 100],
    description: 'Maximum effort, only sustainable briefly',
    benefits: ['Peak power', 'Maximum speed', 'Anaerobic capacity'],
    feelDescription: 'Cannot talk, gasping, unsustainable beyond 1-2 minutes',
    exampleActivities: ['Sprints', 'Max effort intervals', 'Race finishes'],
  },
];

/**
 * Calculate max heart rate (simple formula)
 */
export function calculateMaxHeartRate(age: number): number {
  return 220 - age;
}

/**
 * Calculate heart rate zone ranges for an individual
 */
export function calculateZoneRanges(age: number): Array<{ zone: number; min: number; max: number }> {
  const maxHR = calculateMaxHeartRate(age);
  return HEART_RATE_ZONES.map(zone => ({
    zone: zone.zone,
    min: Math.round(maxHR * (zone.percentageOfMax[0] / 100)),
    max: Math.round(maxHR * (zone.percentageOfMax[1] / 100)),
  }));
}

// ============================================
// WORKOUT STRUCTURE TEMPLATES
// ============================================

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  targetHeartRateZones: number[];
  structure: Array<{
    phase: string;
    durationMinutes: number;
    intensity: 'low' | 'moderate' | 'high' | 'very_high';
    description: string;
  }>;
  benefits: string[];
  bestFor: string[];
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'hiit',
    name: 'HIIT (High Intensity Interval Training)',
    description: 'Alternating periods of intense effort and recovery',
    targetHeartRateZones: [4, 5],
    structure: [
      { phase: 'Warmup', durationMinutes: 5, intensity: 'low', description: 'Light movement to prepare body' },
      { phase: 'Work Interval', durationMinutes: 0.5, intensity: 'very_high', description: 'All-out effort' },
      { phase: 'Rest Interval', durationMinutes: 0.5, intensity: 'low', description: 'Active recovery' },
      { phase: 'Repeat', durationMinutes: 15, intensity: 'high', description: '15-20 rounds of work/rest' },
      { phase: 'Cooldown', durationMinutes: 5, intensity: 'low', description: 'Light movement and stretching' },
    ],
    benefits: ['Time efficient', 'Burns calories', 'Improves conditioning', 'Boosts metabolism'],
    bestFor: ['Fat loss', 'Improving fitness', 'Time-crunched individuals'],
  },
  {
    id: 'strength',
    name: 'Strength Training',
    description: 'Focused resistance training for muscle building',
    targetHeartRateZones: [2, 3],
    structure: [
      { phase: 'Warmup', durationMinutes: 5, intensity: 'low', description: 'Light cardio and dynamic stretching' },
      { phase: 'Activation', durationMinutes: 5, intensity: 'moderate', description: 'Light sets of main exercises' },
      { phase: 'Working Sets', durationMinutes: 35, intensity: 'moderate', description: 'Main strength exercises with rest' },
      { phase: 'Accessory Work', durationMinutes: 10, intensity: 'moderate', description: 'Isolation exercises' },
      { phase: 'Cooldown', durationMinutes: 5, intensity: 'low', description: 'Static stretching' },
    ],
    benefits: ['Builds muscle', 'Increases strength', 'Boosts metabolism', 'Improves bone density'],
    bestFor: ['Muscle building', 'Strength gains', 'Body recomposition'],
  },
  {
    id: 'liss',
    name: 'LISS (Low Intensity Steady State)',
    description: 'Sustained low-intensity cardio',
    targetHeartRateZones: [1, 2],
    structure: [
      { phase: 'Main Activity', durationMinutes: 30, intensity: 'low', description: 'Steady pace throughout' },
    ],
    benefits: ['Easy recovery', 'Improves aerobic base', 'Low stress on body', 'Sustainable long-term'],
    bestFor: ['Active recovery', 'Beginners', 'Fat burning', 'Stress relief'],
  },
];
