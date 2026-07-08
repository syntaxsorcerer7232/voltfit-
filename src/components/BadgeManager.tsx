import React, { useEffect, useRef } from 'react';
import { useAppContext, useAppLogs } from '../context/AppContext';
import { checkMilestones, BADGES, BadgeDef } from '../utils/gamification';

export default function BadgeManager() {
  const { user, workoutHistory, streak, updateUser, awardPoints, triggerBadgeCelebration, showToast } = useAppContext();
  const { dailySteps } = useAppLogs();
  
  // Track previous stats to ensure we only check on changes
  const prevStats = useRef({
     workoutsCompleted: workoutHistory?.length || 0,
     currentStreak: streak || 0,
     currentSteps: dailySteps || 0,
  });

  useEffect(() => {
    if (!user) return;
    
    const currentBadges = user.badges || [];
    const stats = {
      workoutsCompleted: workoutHistory?.length || 0,
      currentStreak: streak || 0,
      currentSteps: dailySteps || 0,
    };
    
    // Only check if stats actually increased
    if (
        stats.workoutsCompleted > prevStats.current.workoutsCompleted ||
        stats.currentStreak > prevStats.current.currentStreak ||
        stats.currentSteps > prevStats.current.currentSteps
    ) {
       prevStats.current = stats;
       
       const earned = checkMilestones(currentBadges, stats);
       if (earned.length > 0) {
          const newBadges = [...currentBadges, ...earned];
          let extraPoints = 0;
          const earnedBadgeDefs: BadgeDef[] = [];
          
          earned.forEach(bId => {
              if (BADGES[bId]) {
                 earnedBadgeDefs.push(BADGES[bId]);
                 extraPoints += BADGES[bId].pointsReward;
              }
          });
          
          if (earnedBadgeDefs.length > 0) {
             // Update user profile with new badges
             updateUser({
                badges: newBadges
             });
             if (extraPoints > 0) {
                awardPoints(extraPoints);
             }
             
             // Trigger visual pop-up animation natively in the app
             triggerBadgeCelebration(earnedBadgeDefs);
             showToast(`Achievement Unlocked: ${earnedBadgeDefs.map(b => b.title).join(', ')}!`, "success");
          }
       }
    }
  }, [user, workoutHistory?.length, streak, dailySteps, updateUser, awardPoints, triggerBadgeCelebration]);

  // This is a headless utility component
  return null;
}
