// Intelligent moment detection for contextual recommendations
class MomentDetector {
  constructor(patternTracker) {
    this.patternTracker = patternTracker;
    this.momentHistory = this.loadMomentHistory();
    this.currentMoment = null;
    this.momentConfidence = 0;
  }

  // Main moment detection function
  detectCurrentMoment(context, userPatterns, recentActivity) {
    const candidates = [
      this.detectCommuteMode(context, userPatterns, recentActivity),
      this.detectQuickBreakMode(context, userPatterns, recentActivity),
      this.detectWindDownMode(context, userPatterns, recentActivity),
      this.detectWeekendMode(context, userPatterns, recentActivity),
      this.detectFocusMode(context, userPatterns, recentActivity),
      this.detectTriageMode(context, userPatterns, recentActivity),
      this.detectExploreMode(context, userPatterns, recentActivity)
    ];

    // Find the moment with highest confidence
    const bestMatch = candidates.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    if (bestMatch.confidence > 0.6) {
      this.currentMoment = bestMatch;
      this.momentConfidence = bestMatch.confidence;
      this.recordMoment(bestMatch);
    } else {
      this.currentMoment = { type: 'general', confidence: 0.5 };
    }

    return this.currentMoment;
  }

  detectCommuteMode(context, userPatterns, recentActivity) {
    let confidence = 0;
    const indicators = [];

    // Time-based indicators
    const commuteHours = [7, 8, 9, 17, 18, 19]; // Common commute times
    if (commuteHours.includes(context.hour)) {
      confidence += 0.3;
      indicators.push('commute-time');
    }

    // Historical pattern analysis
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][context.dayOfWeek];
    const historicalCommutes = this.findHistoricalPatterns('commute', dayName, context.hour);
    if (historicalCommutes.frequency > 0.6) {
      confidence += 0.4;
      indicators.push('historical-pattern');
    }

    // Session characteristics suggesting mobile/hands-free usage
    const sessionChar = this.patternTracker?.getSessionCharacteristics();
    if (sessionChar) {
      // Quick interactions suggest mobile usage
      if (sessionChar.interactionSpeed === 'fast' && sessionChar.mode === 'explore') {
        confidence += 0.2;
        indicators.push('mobile-usage-pattern');
      }

      // Short session length typical of commute checks
      if (sessionChar.sessionLength < 5 * 60 * 1000) { // Less than 5 minutes
        confidence += 0.1;
        indicators.push('brief-session');
      }
    }

    // Weekday preference for commutes
    if (context.dayType === 'weekday') {
      confidence += 0.1;
      indicators.push('weekday');
    }

    return {
      type: 'commute',
      confidence: Math.min(1, confidence),
      indicators,
      recommendations: this.getCommuteRecommendations()
    };
  }

  detectQuickBreakMode(context, userPatterns, recentActivity) {
    let confidence = 0;
    const indicators = [];

    // Time window: 10am-3pm on weekdays
    if (context.dayType === 'weekday' && context.hour >= 10 && context.hour <= 15) {
      confidence += 0.4;
      indicators.push('work-hours');
    }

    // Session characteristics
    const sessionChar = this.patternTracker?.getSessionCharacteristics();
    if (sessionChar) {
      // Short, focused sessions
      if (sessionChar.sessionLength < 10 * 60 * 1000 && sessionChar.focusLevel === 'medium') {
        confidence += 0.3;
        indicators.push('quick-session');
      }

      // Fast interaction pattern suggests limited time
      if (sessionChar.interactionSpeed === 'fast') {
        confidence += 0.2;
        indicators.push('time-pressure');
      }
    }

    // Recent rejection of longer content
    if (recentActivity && this.hasRecentLongContentRejections(recentActivity)) {
      confidence += 0.2;
      indicators.push('rejected-long-content');
    }

    // Not the first visit of the day (breaks happen after starting work)
    if (!context.isFirstVisit) {
      confidence += 0.1;
      indicators.push('mid-day-check');
    }

    return {
      type: 'quick-break',
      confidence: Math.min(1, confidence),
      indicators,
      recommendations: this.getQuickBreakRecommendations()
    };
  }

  detectWindDownMode(context, userPatterns, recentActivity) {
    let confidence = 0;
    const indicators = [];

    // Time-based: after 8pm or late evening
    if (context.hour >= 20 || context.timeOfDay === 'evening') {
      confidence += 0.4;
      indicators.push('evening-time');
    }

    // Night time
    if (context.timeOfDay === 'night') {
      confidence += 0.5;
      indicators.push('night-time');
    }

    // Historical patterns
    const windDownHistory = this.findHistoricalPatterns('wind-down',
      ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][context.dayOfWeek],
      context.hour
    );
    if (windDownHistory.frequency > 0.5) {
      confidence += 0.3;
      indicators.push('historical-wind-down');
    }

    // Session characteristics suggesting leisurely browsing
    const sessionChar = this.patternTracker?.getSessionCharacteristics();
    if (sessionChar) {
      if (sessionChar.interactionSpeed === 'slow' && sessionChar.focusLevel !== 'high') {
        confidence += 0.2;
        indicators.push('leisurely-pace');
      }

      if (sessionChar.mode === 'explore') {
        confidence += 0.2;
        indicators.push('exploration-mode');
      }
    }

    // User energy patterns
    const energyData = userPatterns?.energyLevels?.[context.timeOfDay];
    if (energyData && energyData.energyScore < 0.5) {
      confidence += 0.2;
      indicators.push('low-energy');
    }

    return {
      type: 'wind-down',
      confidence: Math.min(1, confidence),
      indicators,
      recommendations: this.getWindDownRecommendations()
    };
  }

  detectWeekendMode(context, userPatterns, recentActivity) {
    let confidence = 0;
    const indicators = [];

    if (context.dayType === 'weekend') {
      confidence += 0.6;
      indicators.push('weekend');

      // Saturday vs Sunday differences
      if (context.dayOfWeek === 0) { // Sunday
        confidence += 0.1;
        indicators.push('sunday-reflection');
      } else { // Saturday
        confidence += 0.1;
        indicators.push('saturday-exploration');
      }

      // Weekend morning vs afternoon
      if (context.timeOfDay === 'morning' && context.hour > 8) {
        confidence += 0.2;
        indicators.push('leisurely-morning');
      }

      // Historical weekend engagement
      const weekendActivity = userPatterns?.timePreferences?.dayHourCombos;
      if (weekendActivity) {
        const weekendKeys = Object.keys(weekendActivity).filter(key =>
          key.startsWith('Saturday') || key.startsWith('Sunday')
        );
        const avgWeekendEngagement = weekendKeys.reduce((sum, key) =>
          sum + weekendActivity[key].rate, 0) / weekendKeys.length;

        if (avgWeekendEngagement > 0.5) {
          confidence += 0.2;
          indicators.push('active-weekender');
        }
      }
    }

    return {
      type: 'weekend',
      confidence: Math.min(1, confidence),
      indicators,
      recommendations: this.getWeekendRecommendations()
    };
  }

  detectFocusMode(context, userPatterns, recentActivity) {
    let confidence = 0;
    const indicators = [];

    const sessionChar = this.patternTracker?.getSessionCharacteristics();
    if (sessionChar) {
      // High focus level and longer session
      if (sessionChar.focusLevel === 'high' && sessionChar.sessionLength > 10 * 60 * 1000) {
        confidence += 0.4;
        indicators.push('sustained-focus');
      }

      // Deep work mode
      if (sessionChar.mode === 'deep-work') {
        confidence += 0.3;
        indicators.push('deep-work-mode');
      }

      // Slow, deliberate interactions
      if (sessionChar.interactionSpeed === 'slow') {
        confidence += 0.2;
        indicators.push('deliberate-interaction');
      }
    }

    // Work hours on weekdays
    if (context.dayType === 'weekday' && context.hour >= 9 && context.hour <= 17) {
      confidence += 0.2;
      indicators.push('work-hours');
    }

    // Recent engagement with work content
    if (recentActivity && this.hasRecentWorkEngagement(recentActivity)) {
      confidence += 0.3;
      indicators.push('work-engagement');
    }

    return {
      type: 'focus',
      confidence: Math.min(1, confidence),
      indicators,
      recommendations: this.getFocusRecommendations()
    };
  }

  detectTriageMode(context, userPatterns, recentActivity) {
    let confidence = 0;
    const indicators = [];

    const sessionChar = this.patternTracker?.getSessionCharacteristics();
    if (sessionChar) {
      // Fast interactions in triage mode
      if (sessionChar.mode === 'triage') {
        confidence += 0.5;
        indicators.push('triage-pattern');
      }

      if (sessionChar.interactionSpeed === 'fast' && sessionChar.focusLevel === 'medium') {
        confidence += 0.3;
        indicators.push('rapid-processing');
      }
    }

    // Morning triage sessions
    if (context.timeOfDay === 'morning' && context.isFirstVisit) {
      confidence += 0.3;
      indicators.push('morning-review');
    }

    // High inbox count suggests need for triage
    if (recentActivity && this.hasHighInboxCount(recentActivity)) {
      confidence += 0.2;
      indicators.push('inbox-overload');
    }

    return {
      type: 'triage',
      confidence: Math.min(1, confidence),
      indicators,
      recommendations: this.getTriageRecommendations()
    };
  }

  detectExploreMode(context, userPatterns, recentActivity) {
    let confidence = 0;
    const indicators = [];

    const sessionChar = this.patternTracker?.getSessionCharacteristics();
    if (sessionChar) {
      if (sessionChar.mode === 'explore') {
        confidence += 0.4;
        indicators.push('exploration-behavior');
      }

      // Medium-paced, varied interactions
      if (sessionChar.interactionSpeed === 'medium' && sessionChar.focusLevel !== 'low') {
        confidence += 0.2;
        indicators.push('browsing-pace');
      }
    }

    // Afternoon exploration
    if (context.timeOfDay === 'afternoon') {
      confidence += 0.2;
      indicators.push('afternoon-discovery');
    }

    // Weekend exploration
    if (context.dayType === 'weekend') {
      confidence += 0.3;
      indicators.push('weekend-discovery');
    }

    return {
      type: 'explore',
      confidence: Math.min(1, confidence),
      indicators,
      recommendations: this.getExploreRecommendations()
    };
  }

  // Recommendation generators for each moment type
  getCommuteRecommendations() {
    return {
      preferredTypes: ['audio', 'podcast', 'brief-read'],
      maxDuration: 25, // Typical commute length
      characteristics: ['hands-free', 'audio-friendly', 'easily-pausible'],
      avoid: ['complex-work', 'detailed-reading', 'interactive-content']
    };
  }

  getQuickBreakRecommendations() {
    return {
      preferredTypes: ['inspiration', 'quick-task', 'brief-article'],
      maxDuration: 5,
      characteristics: ['refreshing', 'positive', 'easily-digestible'],
      avoid: ['work-tasks', 'long-content', 'heavy-topics']
    };
  }

  getWindDownRecommendations() {
    return {
      preferredTypes: ['inspiration', 'life', 'creative', 'calm-reading'],
      maxDuration: 20,
      characteristics: ['calming', 'reflective', 'non-stimulating'],
      avoid: ['work', 'urgent-tasks', 'exciting-content', 'blue-light-heavy']
    };
  }

  getWeekendRecommendations() {
    return {
      preferredTypes: ['life', 'inspiration', 'creative', 'personal-projects'],
      maxDuration: 60,
      characteristics: ['exploratory', 'personal-growth', 'relaxed-pace'],
      avoid: ['urgent-work', 'deadline-pressure']
    };
  }

  getFocusRecommendations() {
    return {
      preferredTypes: ['work', 'learning', 'complex-tasks'],
      maxDuration: 45,
      characteristics: ['challenging', 'productive', 'skill-building'],
      avoid: ['distracting', 'shallow-content', 'social-media']
    };
  }

  getTriageRecommendations() {
    return {
      preferredTypes: ['quick-decisions', 'emails', 'admin-tasks'],
      maxDuration: 3,
      characteristics: ['actionable', 'clear-next-steps', 'binary-decisions'],
      avoid: ['deep-thinking', 'creative-work', 'complex-analysis']
    };
  }

  getExploreRecommendations() {
    return {
      preferredTypes: ['articles', 'discovery', 'varied-content'],
      maxDuration: 15,
      characteristics: ['diverse', 'interesting', 'serendipitous'],
      avoid: ['repetitive-content', 'urgent-tasks']
    };
  }

  // Helper methods
  findHistoricalPatterns(momentType, dayName, hour) {
    const key = `${momentType}_${dayName}_${hour}`;
    const pattern = this.momentHistory[key];

    return {
      frequency: pattern ? pattern.count / (pattern.total || 1) : 0,
      confidence: pattern ? Math.min(pattern.count / 10, 1) : 0 // Build confidence over time
    };
  }

  hasRecentLongContentRejections(recentActivity) {
    return recentActivity.some(activity =>
      ['dismiss', 'skip'].includes(activity.action) &&
      activity.item?.estimatedDuration > 10
    );
  }

  hasRecentWorkEngagement(recentActivity) {
    return recentActivity.some(activity =>
      ['read', 'engage', 'complete'].includes(activity.action) &&
      activity.item?.category === 'work'
    );
  }

  hasHighInboxCount(recentActivity) {
    // This would need to be passed from the main app
    // For now, assume high count if user hasn't processed many items recently
    const processingActions = recentActivity.filter(a =>
      ['archive', 'complete', 'categorize'].includes(a.action)
    );
    return processingActions.length < 3; // Low processing suggests backlog
  }

  recordMoment(moment) {
    const context = moment.context || this.patternTracker?.getSessionCharacteristics()?.context;
    if (!context) return;

    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][context.dayOfWeek];
    const key = `${moment.type}_${dayName}_${context.hour}`;

    if (!this.momentHistory[key]) {
      this.momentHistory[key] = { count: 0, total: 0 };
    }

    this.momentHistory[key].total++;
    if (moment.confidence > 0.7) {
      this.momentHistory[key].count++;
    }

    this.saveMomentHistory();
  }

  // Data persistence
  loadMomentHistory() {
    try {
      const saved = localStorage.getItem('momentHistory');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading moment history:', error);
      return {};
    }
  }

  saveMomentHistory() {
    try {
      localStorage.setItem('momentHistory', JSON.stringify(this.momentHistory));
    } catch (error) {
      console.error('Error saving moment history:', error);
    }
  }

  // Public API
  getCurrentMoment() {
    return this.currentMoment;
  }

  getMomentRecommendations() {
    return this.currentMoment?.recommendations || this.getExploreRecommendations();
  }

  getMomentConfidence() {
    return this.momentConfidence;
  }
}