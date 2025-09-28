// Main coordinator that orchestrates all suggestion intelligence
class SuggestionCoordinator {
  constructor() {
    this.patternTracker = new PatternTracker();
    this.scoringEngine = new ScoringEngine(this.patternTracker);
    this.momentDetector = new MomentDetector(this.patternTracker);
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
  }

  // Enhanced version of the original generateRecommendations
  generateIntelligentRecommendations(items, behaviorHistory = []) {
    // Get current context from existing system
    const context = window.contextDetectionManager?.getCurrentContext() || this.getBasicContext();

    // Analyze patterns from behavior history
    const userPatterns = this.patternTracker.analyzeEngagementPatterns(behaviorHistory);

    // Detect current moment/mode
    const currentMoment = this.momentDetector.detectCurrentMoment(context, userPatterns, behaviorHistory.slice(-10));

    // Filter items based on moment recommendations
    const appropriateItems = this.filterItemsByMoment(items, currentMoment);

    // Score all appropriate items
    const scoredItems = this.scoringEngine.scoreItems(appropriateItems, context, userPatterns);

    // Generate final recommendations structure
    return {
      forThisMoment: this.generateMomentSuggestion(scoredItems, currentMoment, context),
      mightNeedAttention: this.generateAttentionItems(scoredItems, context, currentMoment),
      continueReading: this.generateContinueReading(scoredItems, context),
      quickActions: this.generateQuickActions(context, currentMoment),
      meta: {
        moment: currentMoment,
        confidence: this.momentDetector.getMomentConfidence(),
        totalItems: items.length,
        scoredItems: scoredItems.length
      }
    };
  }

  filterItemsByMoment(items, currentMoment) {
    if (!currentMoment?.recommendations) return items;

    const recommendations = currentMoment.recommendations;

    return items.filter(item => {
      // Duration filtering
      const itemDuration = item.estimatedDuration || this.estimateDuration(item);
      if (recommendations.maxDuration && itemDuration > recommendations.maxDuration) {
        return false;
      }

      // Type filtering
      if (recommendations.preferredTypes?.length > 0) {
        const matchesPreferred = recommendations.preferredTypes.some(type =>
          item.category === type ||
          item.type === type ||
          (item.tags && item.tags.includes(type))
        );
        if (!matchesPreferred) return false;
      }

      // Avoid filtering
      if (recommendations.avoid?.length > 0) {
        const shouldAvoid = recommendations.avoid.some(avoid =>
          item.category === avoid ||
          item.type === avoid ||
          (item.tags && item.tags.includes(avoid))
        );
        if (shouldAvoid) return false;
      }

      return true;
    });
  }

  generateMomentSuggestion(scoredItems, currentMoment, context) {
    if (scoredItems.length === 0) return null;

    const topItem = scoredItems[0];

    // Enhanced suggestion with moment-aware messaging
    return {
      id: topItem.id,
      title: topItem.title,
      content: topItem.content,
      category: topItem.category,
      estimatedDuration: topItem.estimatedDuration || this.estimateDuration(topItem),
      progress: topItem.progress || 0,
      score: topItem.scoring.score,
      reason: this.generateMomentAwareReason(topItem, currentMoment, context),
      action: this.suggestOptimalAction(topItem, currentMoment),
      urgency: this.calculateUrgency(topItem, context),
      momеntMatch: {
        type: currentMoment.type,
        confidence: currentMoment.confidence,
        indicators: currentMoment.indicators
      }
    };
  }

  generateAttentionItems(scoredItems, context, currentMoment) {
    // Focus on items that need attention but filter by moment appropriateness
    const attentionItems = scoredItems
      .filter(item =>
        item.state === 'inbox' ||
        this.calculateStaleness(item) > 2 ||
        (item.progress > 0 && item.progress < 1)
      )
      .slice(0, 3);

    return attentionItems.map(item => ({
      ...item,
      reason: this.generateAttentionReason(item, context, currentMoment),
      urgency: this.calculateUrgency(item, context)
    }));
  }

  generateContinueReading(scoredItems, context) {
    // Items with progress that match current context
    const inProgress = scoredItems
      .filter(item =>
        item.progress > 0 &&
        item.progress < 1 &&
        item.state === 'library'
      )
      .slice(0, 2);

    return inProgress.map(item => ({
      ...item,
      reason: `${Math.round(item.progress * 100)}% complete`,
      timeToFinish: this.estimateTimeToFinish(item)
    }));
  }

  generateQuickActions(context, currentMoment) {
    const actions = [];

    // Moment-specific actions
    if (currentMoment.type === 'commute') {
      actions.push({
        id: 'commute-audio',
        title: 'Find something to listen to',
        description: 'Audio content perfect for your commute',
        icon: 'headphones',
        action: 'library',
        filter: 'audio'
      });
    } else if (currentMoment.type === 'quick-break') {
      actions.push({
        id: 'quick-inspiration',
        title: 'Quick inspiration',
        description: '2-minute pick-me-up',
        icon: 'zap',
        action: 'capture',
        category: 'inspiration'
      });
    } else if (currentMoment.type === 'wind-down') {
      actions.push({
        id: 'calming-read',
        title: 'Something calming',
        description: 'Gentle reading to wind down',
        icon: 'moon',
        action: 'library',
        filter: 'calm'
      });
    } else if (currentMoment.type === 'triage') {
      actions.push({
        id: 'clear-inbox',
        title: 'Clear your inbox',
        description: 'Quick decisions to lighten the load',
        icon: 'inbox',
        action: 'inbox'
      });
    }

    // Time-based fallbacks from original system
    if (actions.length === 0) {
      switch (context.timeOfDay) {
        case 'morning':
          actions.push({
            id: 'morning-focus',
            title: 'Set today\'s intention',
            description: 'What matters most today?',
            icon: 'target',
            action: 'capture',
            category: 'work'
          });
          break;
        case 'evening':
          actions.push({
            id: 'evening-reflect',
            title: 'Reflect on the day',
            description: 'Capture thoughts and learnings',
            icon: 'pen-tool',
            action: 'capture',
            category: 'life'
          });
          break;
      }
    }

    return actions.slice(0, 2);
  }

  // Enhanced reason generation
  generateMomentAwareReason(item, currentMoment, context) {
    const scoring = item.scoring;

    // Moment-specific reasons
    const momentReasons = {
      'commute': 'Perfect for your commute',
      'quick-break': 'Quick refresh for your break',
      'wind-down': 'Calming choice to wind down',
      'weekend': 'Great for weekend exploration',
      'focus': 'Matches your focused energy',
      'triage': 'Quick decision needed',
      'explore': 'Interesting discovery'
    };

    const momentReason = momentReasons[currentMoment.type];
    if (momentReason && currentMoment.confidence > 0.7) {
      return momentReason;
    }

    // Fall back to scoring-based reasons
    return scoring.reason || 'Recommended for you';
  }

  generateAttentionReason(item, context, currentMoment) {
    const staleness = this.calculateStaleness(item);
    const progress = item.progress || 0;

    if (progress > 0.3 && progress < 0.8) {
      return `${Math.round(progress * 100)}% complete - good to finish`;
    }

    if (staleness >= 2 && staleness <= 3) {
      return 'Perfect timing - ready for attention';
    }

    if (staleness > 7) {
      return 'Been waiting a while';
    }

    if (item.state === 'inbox') {
      return 'Needs to be sorted';
    }

    return 'Might need your attention';
  }

  suggestOptimalAction(item, currentMoment) {
    const duration = item.estimatedDuration || this.estimateDuration(item);
    const progress = item.progress || 0;

    // Moment-based action suggestions
    if (currentMoment.type === 'commute' && item.type === 'article') {
      return 'Listen with text-to-speech';
    }

    if (currentMoment.type === 'quick-break' && duration > 5) {
      return 'Start reading';
    }

    if (currentMoment.type === 'triage') {
      return 'Quick decision';
    }

    // Progress-based suggestions
    if (progress > 0.7) {
      return 'Finish reading';
    }

    if (progress > 0) {
      return 'Continue';
    }

    // Default suggestions
    return duration > 10 ? 'Start when you have time' : 'Read now';
  }

  calculateUrgency(item, context) {
    let urgency = 0;

    // Staleness contributes to urgency
    const staleness = this.calculateStaleness(item);
    if (staleness > 7) urgency += 0.3;
    else if (staleness > 3) urgency += 0.2;

    // Inbox items are more urgent
    if (item.state === 'inbox') urgency += 0.3;

    // Nearly complete items are urgent
    if (item.progress > 0.7) urgency += 0.4;

    // Work items during work hours
    if (item.category === 'work' && context.timeOfDay === 'morning') {
      urgency += 0.2;
    }

    return Math.min(1, urgency);
  }

  // Track user interactions for learning
  trackSuggestionInteraction(action, itemId, suggestionType, context) {
    // Record in pattern tracker
    this.patternTracker.trackInteraction(action, { id: itemId }, context);

    // Record suggestion for variety tracking
    if (action === 'engage') {
      const item = this.findItemById(itemId);
      if (item) {
        this.scoringEngine.recordSuggestion(item);
      }
    }

    // Record rejection for learning
    if (['dismiss', 'skip', 'not-now'].includes(action)) {
      const item = this.findItemById(itemId);
      if (item) {
        this.scoringEngine.recordRejection(item, context);
      }
    }

    // Update behavior history in existing system
    if (window.contextDetectionManager) {
      window.contextDetectionManager.trackAction(action, itemId);
    }
  }

  // Utility methods
  getBasicContext() {
    const now = new Date();
    return {
      timeOfDay: this.getTimeOfDay(now.getHours()),
      dayType: (now.getDay() === 0 || now.getDay() === 6) ? 'weekend' : 'weekday',
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      timestamp: now.toISOString(),
      isFirstVisit: this.isFirstVisitToday()
    };
  }

  getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  isFirstVisitToday() {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('lastVisitDate');
    return lastVisit !== today;
  }

  calculateStaleness(item) {
    if (!item.createdAt) return 0;
    return (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  }

  estimateDuration(item) {
    if (item.estimatedDuration) return item.estimatedDuration;

    const contentLength = (item.content || item.title || '').length;

    if (item.type === 'article') {
      return Math.max(2, Math.min(30, contentLength / 200));
    } else if (item.type === 'task') {
      return contentLength > 100 ? 10 : 5;
    } else if (item.type === 'email') {
      return contentLength > 200 ? 5 : 2;
    }

    return 5;
  }

  estimateTimeToFinish(item) {
    const totalDuration = this.estimateDuration(item);
    const remaining = totalDuration * (1 - (item.progress || 0));
    return Math.max(1, Math.round(remaining));
  }

  findItemById(itemId) {
    // This would need to be provided by the main app
    // For now, return a basic structure
    return { id: itemId };
  }

  // Public API for integration with existing system
  enhanceExistingRecommendations(existingRecommendations, items, behaviorHistory) {
    const intelligentRecs = this.generateIntelligentRecommendations(items, behaviorHistory);

    // Merge with existing structure, enhancing where possible
    return {
      ...existingRecommendations,
      attention: intelligentRecs.mightNeedAttention,
      reading: intelligentRecs.continueReading,
      explore: existingRecommendations.explore || [],
      quickActions: intelligentRecs.quickActions,
      forThisMoment: intelligentRecs.forThisMoment,
      meta: intelligentRecs.meta
    };
  }

  getCurrentMomentInfo() {
    return {
      moment: this.momentDetector.getCurrentMoment(),
      confidence: this.momentDetector.getMomentConfidence(),
      recommendations: this.momentDetector.getMomentRecommendations()
    };
  }
}