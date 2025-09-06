/**
 * Study Algorithm Utilities
 * 
 * This algorithm manages word difficulty progression based on user knowledge.
 * - Internal scoring: 0.5 - 5.5 (fractional precision)
 * - Display scoring: 1 - 5 (integer levels)
 * - Dynamic difficulty adjustment with consecutive bonus system
 */

export interface StudyResponse {
  wordId: number;
  isKnown: boolean;
  timestamp: number;
  responseTime: number; // Time taken to respond in milliseconds
  previousScore: number;
  newScore: number;
  consecutiveCorrect: number;
  consecutiveCorrectForWord: number; // Consecutive correct for this specific word
}

export interface StudySession {
  sessionId: string;
  startTime: number;
  responses: StudyResponse[];
  totalWords: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

// Advanced Algorithm parameters
const ALGORITHM_CONFIG = {
  MIN_SCORE: 0.5,
  MAX_SCORE: 5.5,
  SCORE_PRECISION: 0.1,
  
  // Adaptive difficulty adjustment
  EASY_THRESHOLD: 2.0,        // Below this is considered "easy"
  HARD_THRESHOLD: 4.0,        // Above this is considered "hard"
  
  // Correct answer rewards (more aggressive for better learning)
  EASY_CORRECT_DECREMENT: 0.8,    // Big reward for getting easy words right
  MEDIUM_CORRECT_DECREMENT: 0.6,  // Good reward for medium words
  HARD_CORRECT_DECREMENT: 0.4,    // Moderate reward for hard words
  
  // Consecutive correct bonuses (exponential growth)
  CONSECUTIVE_BASE_MULTIPLIER: 1.5,  // Base multiplier for consecutive correct
  CONSECUTIVE_MAX_MULTIPLIER: 4.0,   // Maximum consecutive bonus
  CONSECUTIVE_DECAY_FACTOR: 0.8,     // How quickly consecutive bonus decays
  
  // Incorrect answer penalties (adaptive based on difficulty)
  EASY_INCORRECT_INCREMENT: 1.2,     // Big penalty for getting easy words wrong
  MEDIUM_INCORRECT_INCREMENT: 0.8,   // Moderate penalty for medium words
  HARD_INCORRECT_INCREMENT: 0.4,     // Small penalty for hard words
  
  // Time-based learning (spaced repetition)
  TIME_DECAY_HOURS: 24,              // Hours for full time decay
  TIME_DECAY_FACTOR: 0.3,            // How much time affects learning
  
  // Mastery system
  MASTERY_THRESHOLD: 1.0,            // Below this score = mastered
  MASTERY_BONUS: 0.2,                // Extra reward for mastering words
  
  // Difficulty-based learning rates
  LEARNING_RATE_EASY: 1.2,           // Learn easy words faster
  LEARNING_RATE_MEDIUM: 1.0,         // Normal learning rate
  LEARNING_RATE_HARD: 0.8,           // Learn hard words slower
};

/**
 * Advanced difficulty calculation with adaptive learning
 */
export function calculateNewScore(
  currentScore: number,
  isKnown: boolean,
  consecutiveCorrect: number = 0,
  lastStudiedTime?: number,
  recentResponses: StudyResponse[] = [],
  responseTime?: number,
  averageResponseTime?: number,
  consecutiveCorrectForWord: number = 0
): { newScore: number; algorithmDetails: any } {
  let newScore: number;
  
  // Determine difficulty category
  const isEasy = currentScore <= ALGORITHM_CONFIG.EASY_THRESHOLD;
  const isHard = currentScore >= ALGORITHM_CONFIG.HARD_THRESHOLD;
  const isMedium = !isEasy && !isHard;
  
  // Calculate time-based learning factor
  let timeFactor = 1.0;
  let hoursSinceStudied = 0;
  if (lastStudiedTime) {
    hoursSinceStudied = (Date.now() - lastStudiedTime) / (1000 * 60 * 60);
    const timeDecay = Math.min(hoursSinceStudied / ALGORITHM_CONFIG.TIME_DECAY_HOURS, 1);
    timeFactor = 1.0 + (ALGORITHM_CONFIG.TIME_DECAY_FACTOR * timeDecay);
  }
  
  // Calculate learning rate based on difficulty
  let learningRate = ALGORITHM_CONFIG.LEARNING_RATE_MEDIUM;
  if (isEasy) learningRate = ALGORITHM_CONFIG.LEARNING_RATE_EASY;
  else if (isHard) learningRate = ALGORITHM_CONFIG.LEARNING_RATE_HARD;
  
  // Calculate advanced timing bonus/penalty system
  let timingFactor = 1.0;
  let timingBonus = 0;
  let timingPenalty = 0;
  
  if (responseTime && averageResponseTime) {
    const timeRatio = responseTime / averageResponseTime;
    
    // Detect if user might have left the page using smart detection
    const recentResponseTimes = recentResponses.map(r => r.responseTime).filter(t => t > 0);
    const isLikelyAway = isLikelyAwayResponse(responseTime, averageResponseTime || 5000, recentResponseTimes);
    
    if (isKnown) {
      // DYNAMIC SPEED BONUS SYSTEM - More nuanced than fixed percentages
      if (timeRatio < 0.5) {
        // Lightning fast - exponential bonus
        timingBonus = 0.5 + (0.5 - timeRatio) * 0.8; // 50% to 90% bonus
      } else if (timeRatio < 0.7) {
        // Very fast - strong bonus
        timingBonus = 0.3 + (0.7 - timeRatio) * 0.5; // 30% to 40% bonus
      } else if (timeRatio < 0.9) {
        // Fast - moderate bonus
        timingBonus = 0.15 + (0.9 - timeRatio) * 0.75; // 15% to 30% bonus
      } else if (timeRatio < 1.1) {
        // Normal speed - small bonus
        timingBonus = 0.05; // 5% bonus for normal speed
      } else if (timeRatio < 1.5) {
        // Slow - no bonus, no penalty
        timingBonus = 0;
      } else if (!isLikelyAway) {
        // Very slow but not away - penalty
        timingPenalty = Math.min((timeRatio - 1.5) * 0.2, 0.3); // Up to 30% penalty
      }
      // If likely away, no penalty for correct answers
    } else {
      // INCORRECT ANSWER PENALTIES
      if (timeRatio < 0.5) {
        // Very fast but wrong - might be guessing, small penalty
        timingPenalty = 0.1;
      } else if (timeRatio < 0.8) {
        // Fast but wrong - moderate penalty
        timingPenalty = 0.15;
      } else if (timeRatio < 1.2) {
        // Normal speed but wrong - standard penalty
        timingPenalty = 0.2;
      } else if (timeRatio < 2.0) {
        // Slow and wrong - higher penalty
        timingPenalty = 0.25 + (timeRatio - 1.2) * 0.1; // 25% to 33% penalty
      } else if (!isLikelyAway) {
        // Very slow and wrong - maximum penalty
        timingPenalty = 0.4;
      }
      // If likely away, reduced penalty for incorrect answers
      if (isLikelyAway) {
        timingPenalty *= 0.5; // Reduce penalty by half if user was likely away
      }
    }
    
    // Apply difficulty-based timing adjustments
    if (isEasy) {
      // Easy words should be answered quickly
      if (isKnown && timeRatio > 1.2) {
        timingBonus *= 0.7; // Reduce bonus for slow easy words
      }
    } else if (isHard) {
      // Hard words can take more time
      if (isKnown && timeRatio < 0.8) {
        timingBonus *= 1.2; // Increase bonus for fast hard words
      }
    }
    
    // Apply consecutive correct bonus to timing
    if (isKnown && consecutiveCorrect > 0) {
      const consecutiveTimingMultiplier = 1 + (consecutiveCorrect * 0.05); // 5% per consecutive correct
      timingBonus *= consecutiveTimingMultiplier;
    }
    
    timingFactor = 1.0 + timingBonus - timingPenalty;
    
    console.log(`⏱️ Advanced timing calculation:`, {
      responseTime: responseTime,
      averageResponseTime: averageResponseTime,
      timeRatio: timeRatio.toFixed(2),
      isLikelyAway,
      timingBonus: timingBonus.toFixed(3),
      timingPenalty: timingPenalty.toFixed(3),
      timingFactor: timingFactor.toFixed(3),
      isKnown,
      isEasy,
      isMedium,
      isHard,
      consecutiveCorrect
    });
  }
  
  // Calculate consecutive word bonus (exponential growth for same word)
  let consecutiveWordBonus = 1.0;
  if (isKnown && consecutiveCorrectForWord > 0) {
    consecutiveWordBonus = Math.min(
      Math.pow(1.8, consecutiveCorrectForWord), // Exponential growth
      5.0 // Max 5x bonus
    );
  }
  
  // Initialize algorithm details
  const algorithmDetails: any = {
    isEasy,
    isMedium: !isEasy && !isHard,
    isHard,
    timeFactor,
    learningRate,
    hoursSinceStudied,
    responseTime,
    averageResponseTime,
    timeRatio: responseTime && averageResponseTime ? responseTime / averageResponseTime : null,
    timingFactor,
    timingBonus,
    timingPenalty,
    consecutiveCorrectForWord,
    consecutiveWordBonus,
    isLikelyAway: responseTime && averageResponseTime ? 
      isLikelyAwayResponse(responseTime, averageResponseTime, recentResponses.map(r => r.responseTime).filter(t => t > 0)) : false,
    consecutiveTimingMultiplier: isKnown && consecutiveCorrect > 0 ? 
      (1 + (consecutiveCorrect * 0.05)) : 1.0
  };
  
  if (isKnown) {
    // CORRECT ANSWER - Calculate adaptive reward
    let baseDecrement: number;
    
    if (isEasy) {
      baseDecrement = ALGORITHM_CONFIG.EASY_CORRECT_DECREMENT;
    } else if (isMedium) {
      baseDecrement = ALGORITHM_CONFIG.MEDIUM_CORRECT_DECREMENT;
    } else {
      baseDecrement = ALGORITHM_CONFIG.HARD_CORRECT_DECREMENT;
    }
    
    // Calculate consecutive bonus (exponential with decay)
    // No consecutive bonus for random words - only for same word
    const consecutiveBonus = 1.0;
    const decayedBonus = 1.0;
    
    // Mastery bonus for very low scores
    const masteryBonus = currentScore <= ALGORITHM_CONFIG.MASTERY_THRESHOLD 
      ? ALGORITHM_CONFIG.MASTERY_BONUS 
      : 0;
    
    // Calculate final decrement with timing and consecutive word bonuses
    const totalDecrement = (baseDecrement + masteryBonus) * decayedBonus * learningRate * timeFactor * timingFactor * consecutiveWordBonus;
    newScore = currentScore - totalDecrement;
    
    // Update algorithm details
    algorithmDetails.baseDecrement = baseDecrement;
    algorithmDetails.consecutiveBonus = decayedBonus;
    algorithmDetails.masteryBonus = masteryBonus;
    algorithmDetails.totalDecrement = totalDecrement;
    
    console.log(`🎯 Correct answer calculation:`, {
      currentScore: currentScore.toFixed(2),
      isEasy,
      isMedium,
      isHard,
      baseDecrement: baseDecrement.toFixed(2),
      consecutiveCorrect,
      consecutiveBonus: decayedBonus.toFixed(2),
      masteryBonus: masteryBonus.toFixed(2),
      learningRate: learningRate.toFixed(2),
      timeFactor: timeFactor.toFixed(2),
      totalDecrement: totalDecrement.toFixed(2),
      newScore: newScore.toFixed(2)
    });
    
  } else {
    // INCORRECT ANSWER - Calculate adaptive penalty
    let baseIncrement: number;
    
    if (isEasy) {
      baseIncrement = ALGORITHM_CONFIG.EASY_INCORRECT_INCREMENT;
    } else if (isMedium) {
      baseIncrement = ALGORITHM_CONFIG.MEDIUM_INCORRECT_INCREMENT;
    } else {
      baseIncrement = ALGORITHM_CONFIG.HARD_INCORRECT_INCREMENT;
    }
    
    // Recent failure penalty (if failed recently, increase penalty)
    const recentFailures = recentResponses.filter(r => !r.isKnown).length;
    const failurePenalty = Math.min(recentFailures * 0.2, 1.0);
    
    // Calculate final increment with timing penalties
    const totalIncrement = baseIncrement * (1 + failurePenalty) * learningRate * timeFactor * timingFactor;
    newScore = currentScore + totalIncrement;
    
    // Update algorithm details
    algorithmDetails.baseIncrement = baseIncrement;
    algorithmDetails.failurePenalty = failurePenalty;
    algorithmDetails.recentFailures = recentFailures;
    algorithmDetails.totalIncrement = totalIncrement;
    
    console.log(`❌ Incorrect answer calculation:`, {
      currentScore: currentScore.toFixed(2),
      isEasy,
      isMedium,
      isHard,
      baseIncrement: baseIncrement.toFixed(2),
      recentFailures,
      failurePenalty: failurePenalty.toFixed(2),
      learningRate: learningRate.toFixed(2),
      timeFactor: timeFactor.toFixed(2),
      totalIncrement: totalIncrement.toFixed(2),
      newScore: newScore.toFixed(2)
    });
  }

  // Clamp to valid range
  newScore = Math.max(ALGORITHM_CONFIG.MIN_SCORE, newScore);
  newScore = Math.min(ALGORITHM_CONFIG.MAX_SCORE, newScore);

  // Round to precision
  const finalScore = Math.round(newScore / ALGORITHM_CONFIG.SCORE_PRECISION) * ALGORITHM_CONFIG.SCORE_PRECISION;
  
  console.log(`📊 Final score calculation:`, {
    beforeClamp: newScore.toFixed(2),
    afterClamp: finalScore.toFixed(2),
    change: (finalScore - currentScore).toFixed(2)
  });
  
  return { newScore: finalScore, algorithmDetails };
}

/**
 * Calculate smart average response time that filters out outliers and away time
 */
export function calculateSmartAverageResponseTime(
  responseTimes: number[],
  currentResponseTime: number,
  previousAverage?: number
): number {
  if (responseTimes.length === 0) {
    return currentResponseTime;
  }

  // Filter out obvious outliers (away time detection)
  const filteredTimes = responseTimes.filter(time => {
    // Remove times that are likely "away" responses
    const isAway = time > 30000; // 30+ seconds
    const isExtremeOutlier = time > (previousAverage || 5000) * 4; // 4x previous average
    return !isAway && !isExtremeOutlier;
  });

  // If we have valid times, use them; otherwise use current response
  const validTimes = filteredTimes.length > 0 ? filteredTimes : [currentResponseTime];
  
  // Calculate median instead of mean for better outlier resistance
  const sortedTimes = [...validTimes].sort((a, b) => a - b);
  const median = sortedTimes.length % 2 === 0
    ? (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2
    : sortedTimes[Math.floor(sortedTimes.length / 2)];

  // Use exponential moving average with adaptive alpha
  if (previousAverage) {
    // Adaptive alpha based on how different current response is
    const difference = Math.abs(currentResponseTime - previousAverage) / previousAverage;
    let alpha = 0.3; // Default learning rate
    
    if (difference > 2) {
      // Very different response - slow learning to avoid outliers
      alpha = 0.1;
    } else if (difference > 1) {
      // Moderately different - normal learning
      alpha = 0.2;
    } else {
      // Similar response - faster learning
      alpha = 0.4;
    }
    
    // Apply exponential moving average
    return previousAverage * (1 - alpha) + currentResponseTime * alpha;
  }

  return median;
}

/**
 * Detect if response time indicates user was away
 */
export function isLikelyAwayResponse(
  responseTime: number,
  averageResponseTime: number,
  recentResponseTimes: number[]
): boolean {
  // Multiple criteria for away detection
  const isVeryLong = responseTime > 30000; // 30+ seconds
  const isMuchLongerThanAverage = responseTime > averageResponseTime * 3;
  const isOutlier = recentResponseTimes.length > 0 && 
    responseTime > Math.max(...recentResponseTimes) * 2;
  
  return isVeryLong || (isMuchLongerThanAverage && isOutlier);
}

/**
 * Convert internal score (0.5-5.5) to display level (1-5)
 */
export function scoreToDisplayLevel(score: number): 1 | 2 | 3 | 4 | 5 {
  // Map 0.5-5.5 to 1-5
  const normalized = (score - ALGORITHM_CONFIG.MIN_SCORE) / 
                    (ALGORITHM_CONFIG.MAX_SCORE - ALGORITHM_CONFIG.MIN_SCORE);
  const level = Math.round(normalized * 4) + 1;
  const clampedLevel = Math.max(1, Math.min(5, level));
  return clampedLevel as 1 | 2 | 3 | 4 | 5;
}

/**
 * Convert display level (1-5) to internal score (0.5-5.5)
 */
export function displayLevelToScore(level: number): number {
  // Map 1-5 to 0.5-5.5
  const normalized = (level - 1) / 4;
  return ALGORITHM_CONFIG.MIN_SCORE + 
         (normalized * (ALGORITHM_CONFIG.MAX_SCORE - ALGORITHM_CONFIG.MIN_SCORE));
}

/**
 * Get difficulty label for display level
 */
export function getDifficultyLabel(level: number): string {
  switch (level) {
    case 1: return 'Very Easy';
    case 2: return 'Easy';
    case 3: return 'Medium';
    case 4: return 'Hard';
    case 5: return 'Very Hard';
    default: return 'Unknown';
  }
}

/**
 * Get difficulty color for level
 */
export function getDifficultyColor(level: number): string {
  switch (level) {
    case 1: return 'emerald';
    case 2: return 'blue';
    case 3: return 'amber';
    case 4: return 'orange';
    case 5: return 'red';
    default: return 'gray';
  }
}

/**
 * Calculate study session statistics
 */
export function calculateSessionStats(responses: StudyResponse[]) {
  const total = responses.length;
  const correct = responses.filter(r => r.isKnown).length;
  const incorrect = total - correct;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;

  // Calculate average score change
  const scoreChanges = responses.map(r => r.newScore - r.previousScore);
  const avgScoreChange = scoreChanges.length > 0 
    ? scoreChanges.reduce((sum, change) => sum + change, 0) / scoreChanges.length 
    : 0;

  // Find longest streak
  let currentStreak = 0;
  let maxStreak = 0;
  
  responses.forEach(response => {
    if (response.isKnown) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  return {
    totalWords: total,
    correctAnswers: correct,
    incorrectAnswers: incorrect,
    accuracy: Math.round(accuracy * 10) / 10,
    avgScoreChange: Math.round(avgScoreChange * 100) / 100,
    longestStreak: maxStreak,
    currentStreak: responses.length > 0 && responses[responses.length - 1].isKnown ? currentStreak : 0
  };
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `study_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Determine if a word should be prioritized based on its recent performance
 */
export function calculateWordPriority(
  score: number,
  recentResponses: StudyResponse[],
  lastStudiedTime?: number
): number {
  let priority = score; // Base priority on difficulty

  // Boost priority for recently failed words
  const recentFailures = recentResponses.filter(r => !r.isKnown).length;
  priority += recentFailures * 0.5;

  // Reduce priority for recently studied words (time decay)
  if (lastStudiedTime) {
    const hoursSinceStudied = (Date.now() - lastStudiedTime) / (1000 * 60 * 60);
    const timeDecay = Math.min(hoursSinceStudied / 24, 1); // Full decay after 24 hours
    priority *= (0.5 + 0.5 * timeDecay); // Min 50% priority, max 100%
  }

  return priority;
}
