// Advanced pattern analysis for user behavior learning
class PatternTracker {
  constructor() {
    this.patterns = this.loadPatterns();
    this.sessionData = {
      startTime: Date.now(),
      interactions: [],
      currentStreak: this.getCurrentStreak()
    };
  }

  // Analyze user engagement patterns over time
  analyzeEngagementPatterns(behaviorHistory) {
    const patterns = {
      timePreferences: this.analyzeTimePreferences(behaviorHistory),
      contentTypeAffinity: this.analyzeContentAffinity(behaviorHistory),
      sessionLengths: this.analyzeSessionLengths(behaviorHistory),
      completionRates: this.analyzeCompletionRates(behaviorHistory),
      rejectionPatterns: this.analyzeRejectionPatterns(behaviorHistory),
      energyLevels: this.inferEnergyLevels(behaviorHistory)
    };

    this.patterns = { ...this.patterns, ...patterns };
    this.savePatterns();
    return patterns;
  }

  analyzeTimePreferences(history) {
    const preferences = {};
    const dayHourCombos = {};

    history.forEach(behavior => {
      if (!behavior.context) return;

      const { timeOfDay, dayOfWeek, hour } = behavior.context;
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
      const combo = `${dayName}_${timeOfDay}`;

      if (!preferences[timeOfDay]) preferences[timeOfDay] = { engagement: 0, total: 0 };
      if (!dayHourCombos[combo]) dayHourCombos[combo] = { engagement: 0, total: 0 };

      preferences[timeOfDay].total++;
      dayHourCombos[combo].total++;

      // Weight positive engagement higher
      if (['read', 'complete', 'engage'].includes(behavior.action)) {
        preferences[timeOfDay].engagement += 2;
        dayHourCombos[combo].engagement += 2;
      } else if (['open', 'start'].includes(behavior.action)) {
        preferences[timeOfDay].engagement += 1;
        dayHourCombos[combo].engagement += 1;
      }
    });

    // Calculate engagement rates
    Object.keys(preferences).forEach(time => {
      preferences[time].rate = preferences[time].engagement / preferences[time].total;
    });

    Object.keys(dayHourCombos).forEach(combo => {
      dayHourCombos[combo].rate = dayHourCombos[combo].engagement / dayHourCombos[combo].total;
    });

    return { timeOfDay: preferences, dayHourCombos };
  }

  analyzeContentAffinity(history) {
    const affinity = {};
    const sequencePattern = [];

    history.forEach((behavior, index) => {
      if (!behavior.item?.category) return;

      const category = behavior.item.category;
      if (!affinity[category]) affinity[category] = { positive: 0, negative: 0, total: 0 };

      affinity[category].total++;

      if (['read', 'complete', 'engage', 'save'].includes(behavior.action)) {
        affinity[category].positive++;
      } else if (['dismiss', 'archive', 'skip'].includes(behavior.action)) {
        affinity[category].negative++;
      }

      // Track content type sequences for variety analysis
      if (index > 0 && behavior.action === 'engage') {
        const prevCategory = history[index - 1].item?.category;
        if (prevCategory) {
          sequencePattern.push({ from: prevCategory, to: category });
        }
      }
    });

    // Calculate affinity scores (-1 to 1)
    Object.keys(affinity).forEach(category => {
      const data = affinity[category];
      data.score = (data.positive - data.negative) / data.total;
    });

    return { affinity, sequencePattern };
  }

  analyzeSessionLengths(history) {
    const sessions = this.groupIntoSessions(history);
    const lengths = sessions.map(session => session.duration);

    return {
      average: lengths.reduce((a, b) => a + b, 0) / lengths.length,
      median: this.getMedian(lengths),
      preferred: this.findPreferredSessionLength(sessions)
    };
  }

  analyzeCompletionRates(history) {
    const completionData = {};

    history.forEach(behavior => {
      if (!behavior.item?.category || !behavior.item?.estimatedDuration) return;

      const category = behavior.item.category;
      const duration = behavior.item.estimatedDuration;
      const durationBucket = this.getDurationBucket(duration);

      if (!completionData[category]) completionData[category] = {};
      if (!completionData[category][durationBucket]) {
        completionData[category][durationBucket] = { started: 0, completed: 0 };
      }

      if (['start', 'open', 'read'].includes(behavior.action)) {
        completionData[category][durationBucket].started++;
      }
      if (['complete', 'finish'].includes(behavior.action)) {
        completionData[category][durationBucket].completed++;
      }
    });

    // Calculate completion rates
    Object.keys(completionData).forEach(category => {
      Object.keys(completionData[category]).forEach(duration => {
        const data = completionData[category][duration];
        data.rate = data.started > 0 ? data.completed / data.started : 0;
      });
    });

    return completionData;
  }

  analyzeRejectionPatterns(history) {
    const rejections = history.filter(b => ['dismiss', 'skip', 'archive'].includes(b.action));
    const patterns = {
      timeOfDay: {},
      contentType: {},
      staleness: {},
      consecutive: this.findConsecutiveRejections(history)
    };

    rejections.forEach(rejection => {
      const { timeOfDay } = rejection.context || {};
      const category = rejection.item?.category;
      const staleness = this.calculateStaleness(rejection.item);

      if (timeOfDay) {
        patterns.timeOfDay[timeOfDay] = (patterns.timeOfDay[timeOfDay] || 0) + 1;
      }
      if (category) {
        patterns.contentType[category] = (patterns.contentType[category] || 0) + 1;
      }
      if (staleness) {
        const bucket = this.getStalenessB ucket(staleness);
        patterns.staleness[bucket] = (patterns.staleness[bucket] || 0) + 1;
      }
    });

    return patterns;
  }

  inferEnergyLevels(history) {
    const energyIndicators = {};

    history.forEach(behavior => {
      if (!behavior.context?.timeOfDay) return;

      const timeOfDay = behavior.context.timeOfDay;
      if (!energyIndicators[timeOfDay]) {
        energyIndicators[timeOfDay] = {
          quickActions: 0,
          deepWork: 0,
          totalActions: 0,
          avgSessionLength: 0
        };
      }

      energyIndicators[timeOfDay].totalActions++;

      // Quick actions suggest lower energy/focus
      if (['dismiss', 'skip', 'quick-archive'].includes(behavior.action)) {
        energyIndicators[timeOfDay].quickActions++;
      }

      // Deep engagement suggests higher energy
      if (['read', 'complete', 'engage', 'deep-read'].includes(behavior.action)) {
        energyIndicators[timeOfDay].deepWork++;
      }
    });

    // Calculate energy scores (0-1, where 1 is high energy)
    Object.keys(energyIndicators).forEach(timeOfDay => {
      const data = energyIndicators[timeOfDay];
      const deepRatio = data.deepWork / data.totalActions;
      const quickRatio = data.quickActions / data.totalActions;
      data.energyScore = Math.max(0, deepRatio - (quickRatio * 0.5));
    });

    return energyIndicators;
  }

  // Detect current session characteristics
  detectSessionCharacteristics() {
    const currentSession = this.sessionData;
    const recentActions = currentSession.interactions.slice(-5);

    return {
      sessionLength: Date.now() - currentSession.startTime,
      interactionSpeed: this.calculateInteractionSpeed(recentActions),
      focusLevel: this.inferCurrentFocus(recentActions),
      mode: this.detectSessionMode(recentActions)
    };
  }

  calculateInteractionSpeed(actions) {
    if (actions.length < 2) return 'unknown';

    const intervals = [];
    for (let i = 1; i < actions.length; i++) {
      intervals.push(actions[i].timestamp - actions[i-1].timestamp);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    if (avgInterval < 3000) return 'fast';      // < 3 seconds
    if (avgInterval < 10000) return 'medium';   // 3-10 seconds
    return 'slow';                              // > 10 seconds
  }

  inferCurrentFocus(recentActions) {
    const engagementActions = recentActions.filter(a =>
      ['read', 'engage', 'deep-read'].includes(a.action)
    ).length;

    const dismissalActions = recentActions.filter(a =>
      ['dismiss', 'skip', 'archive'].includes(a.action)
    ).length;

    if (engagementActions > dismissalActions) return 'high';
    if (dismissalActions > engagementActions * 2) return 'low';
    return 'medium';
  }

  detectSessionMode(recentActions) {
    const actionTypes = recentActions.map(a => a.action);

    // Rapid triage mode
    if (actionTypes.filter(a => ['archive', 'dismiss', 'quick-action'].includes(a)).length >= 3) {
      return 'triage';
    }

    // Deep engagement mode
    if (actionTypes.filter(a => ['read', 'engage', 'complete'].includes(a)).length >= 2) {
      return 'deep-work';
    }

    // Browsing/exploration mode
    if (actionTypes.filter(a => ['open', 'preview', 'browse'].includes(a)).length >= 2) {
      return 'explore';
    }

    return 'mixed';
  }

  // Utility methods
  groupIntoSessions(history, maxGapMinutes = 30) {
    const sessions = [];
    let currentSession = null;

    history.forEach(behavior => {
      const timestamp = new Date(behavior.timestamp).getTime();

      if (!currentSession || (timestamp - currentSession.endTime) > (maxGapMinutes * 60 * 1000)) {
        currentSession = {
          startTime: timestamp,
          endTime: timestamp,
          actions: [behavior],
          duration: 0
        };
        sessions.push(currentSession);
      } else {
        currentSession.actions.push(behavior);
        currentSession.endTime = timestamp;
        currentSession.duration = currentSession.endTime - currentSession.startTime;
      }
    });

    return sessions;
  }

  getDurationBucket(minutes) {
    if (minutes <= 2) return 'quick';
    if (minutes <= 5) return 'short';
    if (minutes <= 15) return 'medium';
    if (minutes <= 30) return 'long';
    return 'extended';
  }

  getStalenessB ucket(days) {
    if (days < 1) return 'fresh';
    if (days < 3) return 'recent';
    if (days < 7) return 'week-old';
    if (days < 30) return 'month-old';
    return 'stale';
  }

  calculateStaleness(item) {
    if (!item?.createdAt) return 0;
    return (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  }

  getMedian(numbers) {
    const sorted = numbers.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  findPreferredSessionLength(sessions) {
    const buckets = { short: 0, medium: 0, long: 0 };
    sessions.forEach(session => {
      if (session.duration < 5 * 60 * 1000) buckets.short++;
      else if (session.duration < 20 * 60 * 1000) buckets.medium++;
      else buckets.long++;
    });

    return Object.keys(buckets).reduce((a, b) => buckets[a] > buckets[b] ? a : b);
  }

  findConsecutiveRejections(history) {
    let maxStreak = 0;
    let currentStreak = 0;

    history.forEach(behavior => {
      if (['dismiss', 'skip', 'archive'].includes(behavior.action)) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (['engage', 'read', 'complete'].includes(behavior.action)) {
        currentStreak = 0;
      }
    });

    return { max: maxStreak, current: currentStreak };
  }

  getCurrentStreak() {
    const today = new Date().toDateString();
    const streakData = JSON.parse(localStorage.getItem('engagementStreak') || '{}');

    if (streakData.lastDate === today) {
      return streakData.count || 0;
    }
    return 0;
  }

  updateStreak(engaged = true) {
    const today = new Date().toDateString();
    const streakData = JSON.parse(localStorage.getItem('engagementStreak') || '{}');

    if (engaged) {
      if (streakData.lastDate === today) {
        streakData.count = (streakData.count || 0) + 1;
      } else {
        streakData.count = 1;
      }
      streakData.lastDate = today;
    } else {
      streakData.count = 0;
    }

    localStorage.setItem('engagementStreak', JSON.stringify(streakData));
    this.sessionData.currentStreak = streakData.count;
  }

  // Data persistence
  loadPatterns() {
    try {
      const saved = localStorage.getItem('userPatterns');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading patterns:', error);
      return {};
    }
  }

  savePatterns() {
    try {
      localStorage.setItem('userPatterns', JSON.stringify(this.patterns));
    } catch (error) {
      console.error('Error saving patterns:', error);
    }
  }

  // Public API
  trackInteraction(action, item, context) {
    this.sessionData.interactions.push({
      action,
      item,
      context,
      timestamp: Date.now()
    });

    // Update streak
    if (['read', 'complete', 'engage'].includes(action)) {
      this.updateStreak(true);
    }
  }

  getPatterns() {
    return this.patterns;
  }

  getSessionCharacteristics() {
    return this.detectSessionCharacteristics();
  }
}