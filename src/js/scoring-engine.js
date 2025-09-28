// Advanced scoring algorithm for intelligent content recommendations
class ScoringEngine {
  constructor(patternTracker) {
    this.patternTracker = patternTracker;
    this.lastSuggestedTypes = this.loadLastSuggested();
    this.recentRejections = this.loadRecentRejections();
  }

  // Main scoring function that combines all factors
  scoreItem(item, context, userPatterns) {
    const scores = {
      base: this.calculateBaseScore(item, context),
      staleness: this.calculateStalenessScore(item),
      progress: this.calculateProgressScore(item),
      variety: this.calculateVarietyScore(item),
      duration: this.calculateDurationScore(item, context),
      pattern: this.calculatePatternScore(item, context, userPatterns),
      rejection: this.calculateRejectionPenalty(item, context),
      energy: this.calculateEnergyMatch(item, context, userPatterns)
    };

    // Weighted combination
    const weights = this.getAdaptiveWeights(context, userPatterns);
    const finalScore = Object.keys(scores).reduce((total, factor) => {
      return total + (scores[factor] * weights[factor]);
    }, 0);

    return {
      score: Math.max(0, Math.min(1, finalScore)),
      breakdown: scores,
      weights: weights,
      reason: this.generateScoringReason(scores, weights)
    };
  }

  calculateBaseScore(item, context) {
    // Basic contextual relevance
    let score = 0.5; // neutral base

    // Category-time alignment
    const categoryTimeMatch = {
      work: {
        morning: 0.9,
        afternoon: 0.7,
        evening: 0.3,
        night: 0.1
      },
      life: {
        morning: 0.4,
        afternoon: 0.6,
        evening: 0.9,
        night: 0.7
      },
      inspiration: {
        morning: 0.6,
        afternoon: 0.8,
        evening: 0.8,
        night: 0.6
      }
    };

    const match = categoryTimeMatch[item.category]?.[context.timeOfDay];
    if (match) score *= match;

    // Weekend vs weekday adjustment
    if (context.dayType === 'weekend') {
      if (item.category === 'life' || item.category === 'inspiration') {
        score *= 1.2;
      } else if (item.category === 'work') {
        score *= 0.7;
      }
    }

    return Math.min(1, score);
  }

  calculateStalenessScore(item) {
    const ageInDays = this.calculateAge(item);

    // Sweet spot: 2-3 days old gets highest boost
    if (ageInDays >= 2 && ageInDays <= 3) {
      return 1.0; // Maximum staleness boost
    }

    // Fresh items (< 1 day) get moderate score
    if (ageInDays < 1) {
      return 0.6;
    }

    // Items 1-2 days old get slight boost
    if (ageInDays < 2) {
      return 0.8;
    }

    // Items 3-7 days old get declining boost
    if (ageInDays <= 7) {
      return Math.max(0.4, 1.0 - ((ageInDays - 3) / 4) * 0.6);
    }

    // Very old items get penalty (but not zero)
    return Math.max(0.1, 0.4 - ((ageInDays - 7) / 30) * 0.3);
  }

  calculateProgressScore(item) {
    const progress = item.progress || 0;

    // Prioritize items with 30-70% progress (the "sweet spot")
    if (progress >= 0.3 && progress <= 0.7) {
      return 1.0;
    }

    // Slight preference for started items over unstarted
    if (progress > 0 && progress < 0.3) {
      return 0.8;
    }

    // Nearly complete items get high priority (finish what you started)
    if (progress > 0.7 && progress < 1.0) {
      return 0.9;
    }

    // Unstarted items get neutral score
    if (progress === 0) {
      return 0.6;
    }

    // Completed items shouldn't be suggested
    return 0.0;
  }

  calculateVarietyScore(item) {
    const recentTypes = this.lastSuggestedTypes.slice(-3); // Last 3 suggestions

    // Penalize if same type suggested recently
    if (recentTypes.includes(item.category)) {
      const recentCount = recentTypes.filter(type => type === item.category).length;
      return Math.max(0.2, 1.0 - (recentCount * 0.3));
    }

    // Bonus for variety
    return 1.0;
  }

  calculateDurationScore(item, context) {
    const itemDuration = item.estimatedDuration || this.estimateDuration(item);
    const availableTime = this.estimateAvailableTime(context);

    if (!availableTime || !itemDuration) return 0.7; // neutral if unknown

    // Perfect match gets highest score
    const ratio = itemDuration / availableTime;

    if (ratio >= 0.8 && ratio <= 1.0) {
      return 1.0; // Perfect fit
    }

    if (ratio >= 0.5 && ratio < 0.8) {
      return 0.9; // Good fit, leaves some buffer
    }

    if (ratio > 1.0 && ratio <= 1.5) {
      return 0.6; // Slightly too long but manageable
    }

    if (ratio < 0.5) {
      return 0.7; // Much shorter, okay but not optimal
    }

    // Much too long
    return 0.2;
  }

  calculatePatternScore(item, context, userPatterns) {
    if (!userPatterns) return 0.5;

    let score = 0.5;

    // User's historical preferences for this time/day combo
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][context.dayOfWeek];
    const combo = `${dayName}_${context.timeOfDay}`;

    const timePrefs = userPatterns.timePreferences?.dayHourCombos?.[combo];
    if (timePrefs && timePrefs.rate > 0.6) {
      score *= 1.3; // Boost if user is typically active at this time
    }

    // Content affinity
    const affinity = userPatterns.contentTypeAffinity?.affinity?.[item.category];
    if (affinity) {
      score *= (1 + affinity.score * 0.5); // Adjust based on user's content preferences
    }

    // Energy level matching
    const energyData = userPatterns.energyLevels?.[context.timeOfDay];
    if (energyData) {
      const requiredEnergy = this.estimateRequiredEnergy(item);
      const userEnergy = energyData.energyScore;

      // Match energy levels
      if (Math.abs(requiredEnergy - userEnergy) < 0.3) {
        score *= 1.2;
      }
    }

    return Math.min(1, score);
  }

  calculateRejectionPenalty(item, context) {
    const rejectionKey = `${item.category}_${context.timeOfDay}`;
    const recentRejections = this.recentRejections[rejectionKey] || 0;

    // Progressive penalty for repeated rejections of similar items
    if (recentRejections > 0) {
      return Math.max(0.1, 1.0 - (recentRejections * 0.2));
    }

    return 1.0; // No penalty
  }

  calculateEnergyMatch(item, context, userPatterns) {
    const sessionCharacteristics = this.patternTracker?.getSessionCharacteristics();
    if (!sessionCharacteristics) return 0.7;

    const userFocus = sessionCharacteristics.focusLevel;
    const itemComplexity = this.estimateComplexity(item);

    // Match complexity to focus level
    const focusScore = {
      high: { simple: 0.6, medium: 0.9, complex: 1.0 },
      medium: { simple: 0.8, medium: 1.0, complex: 0.7 },
      low: { simple: 1.0, medium: 0.6, complex: 0.3 }
    };

    return focusScore[userFocus]?.[itemComplexity] || 0.7;
  }

  // Adaptive weighting based on context and user patterns
  getAdaptiveWeights(context, userPatterns) {
    const baseWeights = {
      base: 0.20,
      staleness: 0.15,
      progress: 0.15,
      variety: 0.10,
      duration: 0.15,
      pattern: 0.15,
      rejection: 0.05,
      energy: 0.05
    };

    // Adjust weights based on time of day
    if (context.timeOfDay === 'morning') {
      baseWeights.staleness += 0.05; // Prioritize clearing old items
      baseWeights.energy += 0.05;    // Energy matching important in morning
    } else if (context.timeOfDay === 'evening') {
      baseWeights.pattern += 0.05;   // Rely more on learned preferences
      baseWeights.variety += 0.05;   // Encourage exploration
    }

    // Adjust based on user's historical behavior
    const sessionChar = this.patternTracker?.getSessionCharacteristics();
    if (sessionChar?.mode === 'triage') {
      baseWeights.duration += 0.10;  // Duration matching crucial for quick sessions
      baseWeights.staleness += 0.05; // Clear old items quickly
    } else if (sessionChar?.mode === 'deep-work') {
      baseWeights.progress += 0.10;  // Focus on continuing work
      baseWeights.pattern += 0.05;   // Trust user patterns for deep work
    }

    return baseWeights;
  }

  // Utility methods
  calculateAge(item) {
    if (!item.createdAt) return 0;
    return (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  }

  estimateDuration(item) {
    if (item.estimatedDuration) return item.estimatedDuration;

    // Estimate based on content type and length
    const contentLength = (item.content || item.title || '').length;

    if (item.type === 'article') {
      return Math.max(2, Math.min(30, contentLength / 200)); // ~200 chars per minute
    } else if (item.type === 'task') {
      return contentLength > 100 ? 10 : 5; // Short vs long tasks
    } else if (item.type === 'email') {
      return contentLength > 200 ? 5 : 2; // Quick vs detailed emails
    }

    return 5; // Default 5 minutes
  }

  estimateAvailableTime(context) {
    const sessionChar = this.patternTracker?.getSessionCharacteristics();

    // Use session characteristics to infer available time
    if (sessionChar?.mode === 'triage') {
      return 3; // Quick triage sessions
    } else if (sessionChar?.mode === 'deep-work') {
      return 20; // Focused work sessions
    }

    // Time-based defaults
    const timeDefaults = {
      morning: 10,   // Morning routine
      afternoon: 5,  // Quick break
      evening: 15,   // Wind-down time
      night: 5       // Brief late session
    };

    return timeDefaults[context.timeOfDay] || 10;
  }

  estimateRequiredEnergy(item) {
    const complexity = this.estimateComplexity(item);
    const energyMap = { simple: 0.3, medium: 0.6, complex: 0.9 };
    return energyMap[complexity] || 0.5;
  }

  estimateComplexity(item) {
    const contentLength = (item.content || item.title || '').length;
    const hasLinks = (item.url || item.content?.includes('http')) ? 1 : 0;

    if (item.category === 'work') {
      return contentLength > 200 ? 'complex' : 'medium';
    }

    if (contentLength < 100 && !hasLinks) return 'simple';
    if (contentLength > 500 || hasLinks) return 'complex';
    return 'medium';
  }

  generateScoringReason(scores, weights) {
    // Find the highest contributing factor
    const weightedScores = Object.keys(scores).map(factor => ({
      factor,
      contribution: scores[factor] * weights[factor]
    }));

    weightedScores.sort((a, b) => b.contribution - a.contribution);
    const top = weightedScores[0];

    const reasons = {
      staleness: 'Perfect timing - this has been waiting the right amount of time',
      progress: 'Great to continue - you\'ve already made good progress',
      duration: 'Perfect fit for your available time right now',
      pattern: 'Matches your usual preferences for this time',
      variety: 'Something different from your recent choices',
      energy: 'Matches your current focus level',
      base: 'Good match for this time of day'
    };

    return reasons[top.factor] || 'Recommended for you';
  }

  // Track suggestions for variety calculation
  recordSuggestion(item) {
    this.lastSuggestedTypes.push(item.category);

    // Keep only last 5 suggestions
    if (this.lastSuggestedTypes.length > 5) {
      this.lastSuggestedTypes.shift();
    }

    this.saveLastSuggested();
  }

  // Track rejections for learning
  recordRejection(item, context) {
    const rejectionKey = `${item.category}_${context.timeOfDay}`;
    this.recentRejections[rejectionKey] = (this.recentRejections[rejectionKey] || 0) + 1;

    // Decay rejection counts over time
    setTimeout(() => {
      if (this.recentRejections[rejectionKey] > 0) {
        this.recentRejections[rejectionKey]--;
      }
    }, 24 * 60 * 60 * 1000); // Decay after 24 hours

    this.saveRecentRejections();
  }

  // Data persistence
  loadLastSuggested() {
    try {
      const saved = localStorage.getItem('lastSuggestedTypes');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  }

  saveLastSuggested() {
    try {
      localStorage.setItem('lastSuggestedTypes', JSON.stringify(this.lastSuggestedTypes));
    } catch (error) {
      console.error('Error saving last suggested types:', error);
    }
  }

  loadRecentRejections() {
    try {
      const saved = localStorage.getItem('recentRejections');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      return {};
    }
  }

  saveRecentRejections() {
    try {
      localStorage.setItem('recentRejections', JSON.stringify(this.recentRejections));
    } catch (error) {
      console.error('Error saving recent rejections:', error);
    }
  }

  // Public API
  scoreItems(items, context, userPatterns) {
    return items.map(item => ({
      ...item,
      scoring: this.scoreItem(item, context, userPatterns)
    })).sort((a, b) => b.scoring.score - a.scoring.score);
  }
}