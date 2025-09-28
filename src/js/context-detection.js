// Context detection system for smart recommendations
class ContextDetectionManager {
  constructor() {
    this.userPreferences = this.loadUserPreferences();
    this.behaviorHistory = this.loadBehaviorHistory();
    this.currentContext = this.detectCurrentContext();
    this.initialized = false;

    // Initialize enhanced intelligence system
    this.suggestionCoordinator = null;
    this.enhancedMode = false;
  }

  init() {
    if (this.initialized) return;
    this.startContextTracking();
    this.initializeEnhancedIntelligence();
    this.initialized = true;
  }

  // Initialize the enhanced suggestion system
  initializeEnhancedIntelligence() {
    try {
      // Check if enhanced modules are available
      if (typeof SuggestionCoordinator !== 'undefined') {
        this.suggestionCoordinator = new SuggestionCoordinator();
        this.suggestionCoordinator.init();
        this.enhancedMode = true;
        console.log('Enhanced suggestion intelligence activated');
      }
    } catch (error) {
      console.warn('Enhanced intelligence not available, using basic recommendations:', error.message);
      this.enhancedMode = false;
    }
  }

  // Detect current context based on time, day, and patterns
  detectCurrentContext() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    return {
      timeOfDay: this.getTimeOfDay(hour),
      dayType: isWeekend ? 'weekend' : 'weekday',
      hour: hour,
      dayOfWeek: dayOfWeek,
      timestamp: now.toISOString(),
      season: this.getSeason(now),
      isFirstVisit: this.isFirstVisitToday()
    };
  }

  getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  getSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  isFirstVisitToday() {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('lastVisitDate');
    if (lastVisit !== today) {
      localStorage.setItem('lastVisitDate', today);
      return true;
    }
    return false;
  }

  // Generate smart recommendations based on context
  generateRecommendations(items) {
    const context = this.currentContext;

    // Use enhanced intelligence if available
    if (this.enhancedMode && this.suggestionCoordinator) {
      try {
        const enhancedRecs = this.suggestionCoordinator.generateIntelligentRecommendations(
          items,
          this.behaviorHistory
        );

        // Return enhanced structure with backward compatibility
        return {
          attention: enhancedRecs.mightNeedAttention || this.getAttentionItems(items, context),
          reading: enhancedRecs.continueReading || this.getReadingItems(items, context),
          explore: enhancedRecs.explore || this.getExploreItems(items, context),
          quickActions: enhancedRecs.quickActions || this.getQuickActions(context),
          // New enhanced features
          forThisMoment: enhancedRecs.forThisMoment,
          meta: enhancedRecs.meta
        };
      } catch (error) {
        console.warn('Enhanced recommendations failed, falling back to basic:', error.message);
        this.enhancedMode = false;
      }
    }

    // Fallback to original basic recommendations
    const recommendations = {
      attention: this.getAttentionItems(items, context),
      reading: this.getReadingItems(items, context),
      explore: this.getExploreItems(items, context),
      quickActions: this.getQuickActions(context)
    };

    return recommendations;
  }

  getAttentionItems(items, context) {
    const inboxItems = items.filter(item => item.state === 'inbox');

    // Get items needing urgent attention
    const urgentItems = dataManager.getItemsNeedingAttention();
    const urgentItemIds = new Set(urgentItems.map(item => item.id));

    // Prioritize by urgency and context
    return inboxItems
      .map(item => ({
        ...item,
        priority: this.calculatePriority(item, context),
        reason: this.getAttentionReason(item, context),
        isUrgent: urgentItemIds.has(item.id)
      }))
      .sort((a, b) => {
        // Urgent items first
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        return b.priority - a.priority;
      })
      .slice(0, 5); // Show top 5, including urgent items
  }

  getReadingItems(items, context) {
    const readingItems = items.filter(item => 
      item.state === 'library' && 
      item.category === 'inspiration' && 
      item.progress < 1
    );

    // Context-based reading suggestions
    const timeBasedSuggestions = this.getTimeBasedReadingSuggestions(readingItems, context);
    const progressBasedSuggestions = this.getProgressBasedSuggestions(readingItems);
    
    return [...timeBasedSuggestions, ...progressBasedSuggestions]
      .slice(0, 2); // Show top 2
  }

  getExploreItems(items, context) {
    const libraryItems = items.filter(item => item.state === 'library');
    
    // Mix of recent saves and contextual suggestions
    const recentItems = libraryItems
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 2);
    
    const contextualItems = this.getContextualSuggestions(libraryItems, context);
    
    return [...recentItems, ...contextualItems].slice(0, 2);
  }

  getQuickActions(context) {
    const actions = [];

    // Check for urgent items that need immediate attention
    const urgentEmails = dataManager.getEmailsNeedingReply();
    const upcomingEvents = dataManager.getUpcomingEvents(1); // Next 24 hours
    const overdueTasks = dataManager.getOverdueTasks();

    // Urgent email action
    if (urgentEmails.length > 0) {
      actions.push({
        id: 'urgent-emails',
        title: `${urgentEmails.length} email${urgentEmails.length !== 1 ? 's' : ''} need reply`,
        description: 'Quick responses to important emails',
        icon: 'mail',
        action: 'filter-emails',
        urgent: true
      });
    }

    // Upcoming events action
    if (upcomingEvents.length > 0 && context.timeOfDay === 'morning') {
      const nextEvent = upcomingEvents[0];
      const eventTime = nextEvent.typeData.eventTime || 'TBD';
      actions.push({
        id: 'upcoming-events',
        title: `Event today: ${nextEvent.title}`,
        description: `${eventTime} - Prepare or get directions`,
        icon: 'calendar',
        action: 'view-event',
        itemId: nextEvent.id
      });
    }

    // Overdue tasks action
    if (overdueTasks.length > 0) {
      actions.push({
        id: 'overdue-tasks',
        title: `${overdueTasks.length} overdue task${overdueTasks.length !== 1 ? 's' : ''}`,
        description: 'Catch up on important deadlines',
        icon: 'alert-triangle',
        action: 'filter-overdue',
        urgent: true
      });
    }

    // Time-based quick actions (if no urgent items)
    if (actions.length === 0) {
      switch (context.timeOfDay) {
        case 'morning':
          // Check for emails that came in overnight
          const recentEmails = dataManager.getItemsByType('email')
            .filter(email => {
              const receivedTime = new Date(email.typeData.receivedAt);
              const hoursSince = (Date.now() - receivedTime) / (1000 * 60 * 60);
              return hoursSince < 12; // Last 12 hours
            });

          if (recentEmails.length > 0) {
            actions.push({
              id: 'morning-emails',
              title: `${recentEmails.length} new email${recentEmails.length !== 1 ? 's' : ''}`,
              description: 'Review overnight messages',
              icon: 'mail',
              action: 'filter-recent-emails'
            });
          } else {
            actions.push({
              id: 'morning-focus',
              title: 'Set today\'s focus',
              description: 'Choose one thing to prioritize today',
              icon: 'target',
              action: 'capture',
              category: 'work'
            });
          }
          break;

        case 'afternoon':
          actions.push({
            id: 'afternoon-break',
            title: 'Take a mindful break',
            description: 'Save something inspiring for later',
            icon: 'heart',
            action: 'capture',
            category: 'life'
          });
          break;

        case 'evening':
          // Check for tomorrow's events
          const tomorrowEvents = dataManager.getUpcomingEvents(1).filter(event => {
            const eventDate = new Date(event.typeData.eventDate);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return eventDate.toDateString() === tomorrow.toDateString();
          });

          if (tomorrowEvents.length > 0) {
            actions.push({
              id: 'tomorrow-prep',
              title: 'Prepare for tomorrow',
              description: `${tomorrowEvents.length} event${tomorrowEvents.length !== 1 ? 's' : ''} scheduled`,
              icon: 'calendar-check',
              action: 'review-tomorrow'
            });
          } else {
            actions.push({
              id: 'evening-wind-down',
              title: 'Wind down reading',
              description: 'Find something calming to read',
              icon: 'book-open',
              action: 'library',
              filter: 'inspiration'
            });
          }
          break;
      }
    }

    // First visit of the day
    if (context.isFirstVisit && actions.length < 2) {
      actions.unshift({
        id: 'daily-check-in',
        title: 'Good morning!',
        description: 'Review what needs attention today',
        icon: 'sunrise',
        action: 'inbox'
      });
    }

    return actions.slice(0, 2);
  }

  calculatePriority(item, context) {
    let priority = 0;
    
    // Base priority by category
    const categoryWeights = {
      'work': context.timeOfDay === 'morning' ? 0.8 : 0.6,
      'life': context.timeOfDay === 'evening' ? 0.8 : 0.6,
      'inspiration': context.timeOfDay === 'afternoon' ? 0.7 : 0.5
    };
    
    priority += categoryWeights[item.category] || 0.5;
    
    // Age factor (newer items get higher priority)
    const ageInHours = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60);
    priority += Math.max(0, 1 - (ageInHours / 24)); // Decay over 24 hours
    
    // Weekend vs weekday preferences
    if (context.dayType === 'weekend' && item.category === 'life') {
      priority += 0.3;
    } else if (context.dayType === 'weekday' && item.category === 'work') {
      priority += 0.2;
    }
    
    return Math.min(1, priority);
  }

  getAttentionReason(item, context) {
    const reasons = [];
    
    if (item.category === 'work' && context.timeOfDay === 'morning') {
      reasons.push('Morning focus');
    } else if (item.category === 'life' && context.timeOfDay === 'evening') {
      reasons.push('Evening wind-down');
    } else if (this.isRecentItem(item)) {
      reasons.push('Recently added');
    } else {
      reasons.push('Needs attention');
    }
    
    return reasons[0];
  }

  getTimeBasedReadingSuggestions(items, context) {
    // Morning: motivational/inspirational content
    if (context.timeOfDay === 'morning') {
      return items.filter(item => 
        item.title.toLowerCase().includes('habit') ||
        item.title.toLowerCase().includes('focus') ||
        item.title.toLowerCase().includes('productivity')
      );
    }
    
    // Evening: calming/reflective content
    if (context.timeOfDay === 'evening') {
      return items.filter(item => 
        item.title.toLowerCase().includes('calm') ||
        item.title.toLowerCase().includes('mindful') ||
        item.title.toLowerCase().includes('design')
      );
    }
    
    // Afternoon: learning/creative content
    return items.filter(item => 
      item.title.toLowerCase().includes('learn') ||
      item.title.toLowerCase().includes('creative') ||
      item.title.toLowerCase().includes('inspiration')
    );
  }

  getProgressBasedSuggestions(items) {
    // Items with some progress (partially read)
    const inProgress = items.filter(item => item.progress > 0 && item.progress < 0.8);
    
    // Items that haven't been started
    const unread = items.filter(item => item.progress === 0);
    
    return [...inProgress, ...unread].slice(0, 2);
  }

  getContextualSuggestions(items, context) {
    // Season-based suggestions
    const seasonalKeywords = {
      'spring': ['growth', 'new', 'fresh', 'renewal'],
      'summer': ['energy', 'bright', 'active', 'outdoor'],
      'autumn': ['cozy', 'warm', 'comfort', 'reflection'],
      'winter': ['calm', 'quiet', 'peaceful', 'introspection']
    };
    
    const keywords = seasonalKeywords[context.season] || [];
    return items.filter(item => 
      keywords.some(keyword => 
        item.title.toLowerCase().includes(keyword) ||
        item.content.toLowerCase().includes(keyword)
      )
    ).slice(0, 1);
  }

  isRecentItem(item) {
    const ageInHours = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60);
    return ageInHours < 6; // Items added in last 6 hours
  }

  // Track user behavior for learning
  trackUserAction(action, itemId, context) {
    const behavior = {
      action,
      itemId,
      context: this.currentContext,
      timestamp: new Date().toISOString()
    };
    
    this.behaviorHistory.push(behavior);
    this.saveBehaviorHistory();
    
    // Update user preferences based on behavior
    this.updateUserPreferences(behavior);
  }

  updateUserPreferences(behavior) {
    // Learn from user actions
    if (behavior.action === 'read' && behavior.context.timeOfDay) {
      const timePref = this.userPreferences.favoriteReadingTimes || {};
      timePref[behavior.context.timeOfDay] = (timePref[behavior.context.timeOfDay] || 0) + 1;
      this.userPreferences.favoriteReadingTimes = timePref;
    }
    
    if (behavior.action === 'archive' && behavior.context.dayType) {
      const dayPref = this.userPreferences.activeDays || {};
      dayPref[behavior.context.dayType] = (dayPref[behavior.context.dayType] || 0) + 1;
      this.userPreferences.activeDays = dayPref;
    }
    
    this.saveUserPreferences();
  }

  // Get personalized greeting based on context
  getPersonalizedGreeting() {
    const context = this.currentContext;
    const name = this.userPreferences.name || '';
    
    const greetings = {
      morning: [
        `Good morning${name ? `, ${name}` : ''}`,
        `Rise and shine${name ? `, ${name}` : ''}`,
        `Morning, ${name || 'there'}`
      ],
      afternoon: [
        `Good afternoon${name ? `, ${name}` : ''}`,
        `Hope your day is going well${name ? `, ${name}` : ''}`,
        `Afternoon, ${name || 'there'}`
      ],
      evening: [
        `Good evening${name ? `, ${name}` : ''}`,
        `Hope you had a good day${name ? `, ${name}` : ''}`,
        `Evening, ${name || 'there'}`
      ],
      night: [
        `Still up${name ? `, ${name}` : ''}?`,
        `Late night session${name ? `, ${name}` : ''}`,
        `Night owl mode${name ? `, ${name}` : ''}`
      ]
    };
    
    const timeGreetings = greetings[context.timeOfDay] || greetings.morning;
    return timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
  }

  getContextualSubtitle() {
    const context = this.currentContext;
    
    const subtitles = {
      morning: [
        'Start your day with intention',
        'What matters most today?',
        'Set your focus for the day'
      ],
      afternoon: [
        'Find your focus',
        'Take a mindful break',
        'What needs your attention?'
      ],
      evening: [
        'Wind down gently',
        'Reflect on the day',
        'Find some quiet time'
      ],
      night: [
        'Late night thoughts',
        'Quiet time for reflection',
        'End the day peacefully'
      ]
    };
    
    const timeSubtitles = subtitles[context.timeOfDay] || subtitles.morning;
    return timeSubtitles[Math.floor(Math.random() * timeSubtitles.length)];
  }

  // Data persistence
  loadUserPreferences() {
    try {
      const saved = localStorage.getItem('userPreferences');
      return saved ? JSON.parse(saved) : {
        name: '',
        favoriteReadingTimes: {},
        activeDays: {},
        preferredCategories: {}
      };
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return {};
    }
  }

  saveUserPreferences() {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  loadBehaviorHistory() {
    try {
      const saved = localStorage.getItem('behaviorHistory');
      const history = saved ? JSON.parse(saved) : [];
      
      // Keep only last 100 actions to prevent storage bloat
      return history.slice(-100);
    } catch (error) {
      console.error('Error loading behavior history:', error);
      return [];
    }
  }

  saveBehaviorHistory() {
    try {
      // Keep only last 100 actions
      const trimmedHistory = this.behaviorHistory.slice(-100);
      localStorage.setItem('behaviorHistory', JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error saving behavior history:', error);
    }
  }

  startContextTracking() {
    // Update context every hour
    setInterval(() => {
      this.currentContext = this.detectCurrentContext();
    }, 60 * 60 * 1000);
  }

  // Public API
  getCurrentContext() {
    return this.currentContext;
  }

  getSmartRecommendations(items) {
    return this.generateRecommendations(items);
  }

  trackAction(action, itemId) {
    this.trackUserAction(action, itemId, this.currentContext);

    // Also track in enhanced system if available
    if (this.enhancedMode && this.suggestionCoordinator) {
      try {
        this.suggestionCoordinator.trackSuggestionInteraction(
          action,
          itemId,
          'general',
          this.currentContext
        );
      } catch (error) {
        console.warn('Enhanced tracking failed:', error.message);
      }
    }
  }

  // New methods to expose enhanced features
  getMomentInfo() {
    if (this.enhancedMode && this.suggestionCoordinator) {
      return this.suggestionCoordinator.getCurrentMomentInfo();
    }
    return null;
  }

  isEnhancedModeActive() {
    return this.enhancedMode;
  }
}

// Create global instance
const contextDetectionManager = new ContextDetectionManager();
