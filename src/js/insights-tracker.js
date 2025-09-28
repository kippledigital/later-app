// Gentle insights system - Understanding patterns without pressure
class InsightsTracker {
  constructor() {
    this.insights = this.loadInsights();
    this.sessionStart = Date.now();
    this.currentWeekStart = this.getWeekStart();
    this.patterns = {
      reading: new Map(),
      completion: new Map(),
      engagement: new Map(),
      timeOfDay: new Map(),
      dayOfWeek: new Map(),
      contentTypes: new Map(),
      processingSpeed: new Map()
    };

    this.init();
  }

  init() {
    this.startGentleTracking();
    this.analyzeExistingPatterns();
    this.setupPeriodicAnalysis();
  }

  // Gentle tracking - focuses on meaningful moments, not everything
  startGentleTracking() {
    // Track reading sessions (when someone actually engages)
    this.trackReadingSessions();

    // Track completion patterns (finishing what you start)
    this.trackCompletionPatterns();

    // Track inbox flow (how items move through the system)
    this.trackInboxFlow();

    // Track time investment (where attention goes)
    this.trackTimeInvestment();
  }

  trackReadingSessions() {
    let readingStart = null;
    let currentItem = null;

    // Listen for reader opens
    document.addEventListener('reader-opened', (e) => {
      readingStart = Date.now();
      currentItem = e.detail.item;
    });

    // Listen for meaningful reading time (30+ seconds)
    document.addEventListener('reader-engaged', (e) => {
      if (readingStart && currentItem) {
        const readingTime = Date.now() - readingStart;
        if (readingTime > 30000) { // 30 seconds minimum for "actual reading"
          this.recordReadingSession({
            item: currentItem,
            duration: readingTime,
            timestamp: readingStart,
            context: this.getCurrentContext()
          });
        }
      }
    });

    // Listen for reader closes
    document.addEventListener('reader-closed', (e) => {
      if (readingStart && currentItem) {
        const readingTime = Date.now() - readingStart;
        if (readingTime > 10000) { // 10 seconds minimum to count
          this.recordReadingSession({
            item: currentItem,
            duration: readingTime,
            timestamp: readingStart,
            context: this.getCurrentContext(),
            completed: e.detail.completed || false
          });
        }
      }
      readingStart = null;
      currentItem = null;
    });
  }

  trackCompletionPatterns() {
    // Track when items are marked as complete
    document.addEventListener('item-completed', (e) => {
      const item = e.detail.item;
      const timeToComplete = this.calculateTimeToComplete(item);

      this.recordCompletion({
        item,
        timeToComplete,
        timestamp: Date.now(),
        context: this.getCurrentContext()
      });
    });

    // Track partial engagement (starting but not finishing)
    document.addEventListener('item-started', (e) => {
      const item = e.detail.item;
      this.recordEngagement({
        item,
        type: 'started',
        timestamp: Date.now(),
        context: this.getCurrentContext()
      });
    });
  }

  trackInboxFlow() {
    let inboxStartTime = new Map();

    // Track when items enter inbox
    document.addEventListener('item-added', (e) => {
      const item = e.detail.item;
      if (item.state === 'inbox') {
        inboxStartTime.set(item.id, Date.now());
      }
    });

    // Track when items leave inbox
    document.addEventListener('item-moved', (e) => {
      const { item, fromState, toState } = e.detail;

      if (fromState === 'inbox') {
        const startTime = inboxStartTime.get(item.id);
        if (startTime) {
          const processingTime = Date.now() - startTime;
          this.recordInboxProcessing({
            item,
            processingTime,
            action: toState === 'library' ? 'categorized' : 'archived',
            timestamp: Date.now(),
            context: this.getCurrentContext()
          });
          inboxStartTime.delete(item.id);
        }
      }
    });
  }

  trackTimeInvestment() {
    // Track time spent in different areas of the app
    let screenStartTime = Date.now();
    let currentScreen = 'now';

    document.addEventListener('screen-changed', (e) => {
      const timeSpent = Date.now() - screenStartTime;
      if (timeSpent > 5000) { // 5 seconds minimum
        this.recordTimeInvestment({
          screen: currentScreen,
          duration: timeSpent,
          timestamp: screenStartTime,
          context: this.getCurrentContext()
        });
      }

      currentScreen = e.detail.screen;
      screenStartTime = Date.now();
    });
  }

  // Recording methods
  recordReadingSession(session) {
    const day = this.getDateKey(session.timestamp);
    const timeSlot = this.getTimeSlot(session.timestamp);

    if (!this.insights.reading) this.insights.reading = {};
    if (!this.insights.reading[day]) this.insights.reading[day] = [];

    this.insights.reading[day].push({
      ...session,
      timeSlot,
      dayOfWeek: new Date(session.timestamp).getDay()
    });

    this.saveInsights();
  }

  recordCompletion(completion) {
    const day = this.getDateKey(completion.timestamp);

    if (!this.insights.completions) this.insights.completions = {};
    if (!this.insights.completions[day]) this.insights.completions[day] = [];

    this.insights.completions[day].push(completion);
    this.saveInsights();
  }

  recordEngagement(engagement) {
    const day = this.getDateKey(engagement.timestamp);

    if (!this.insights.engagements) this.insights.engagements = {};
    if (!this.insights.engagements[day]) this.insights.engagements[day] = [];

    this.insights.engagements[day].push(engagement);
    this.saveInsights();
  }

  recordInboxProcessing(processing) {
    const day = this.getDateKey(processing.timestamp);

    if (!this.insights.inboxFlow) this.insights.inboxFlow = {};
    if (!this.insights.inboxFlow[day]) this.insights.inboxFlow[day] = [];

    this.insights.inboxFlow[day].push(processing);
    this.saveInsights();
  }

  recordTimeInvestment(investment) {
    const day = this.getDateKey(investment.timestamp);

    if (!this.insights.timeInvestment) this.insights.timeInvestment = {};
    if (!this.insights.timeInvestment[day]) this.insights.timeInvestment[day] = [];

    this.insights.timeInvestment[day].push(investment);
    this.saveInsights();
  }

  // Analysis methods - gentle pattern recognition
  analyzeExistingPatterns() {
    this.analyzeReadingPatterns();
    this.analyzeCompletionRates();
    this.analyzeTimePatterns();
    this.analyzeContentPreferences();
    this.analyzeInboxHealth();
  }

  analyzeReadingPatterns() {
    const readings = this.insights.reading || {};
    const patterns = {
      favoriteTimeSlots: {},
      favoriteDays: {},
      averageSessionLength: 0,
      consistency: 0,
      totalSessions: 0
    };

    let totalDuration = 0;
    let sessionCount = 0;
    const dayCount = new Map();

    Object.values(readings).flat().forEach(session => {
      patterns.favoriteTimeSlots[session.timeSlot] =
        (patterns.favoriteTimeSlots[session.timeSlot] || 0) + 1;

      patterns.favoriteDays[session.dayOfWeek] =
        (patterns.favoriteDays[session.dayOfWeek] || 0) + 1;

      totalDuration += session.duration;
      sessionCount++;

      const day = this.getDateKey(session.timestamp);
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
    });

    patterns.averageSessionLength = sessionCount > 0 ? totalDuration / sessionCount : 0;
    patterns.totalSessions = sessionCount;
    patterns.consistency = this.calculateConsistency(dayCount);

    this.patterns.reading = patterns;
  }

  analyzeCompletionRates() {
    const completions = this.insights.completions || {};
    const engagements = this.insights.engagements || {};

    const patterns = {
      byContentType: {},
      byTimeOfDay: {},
      averageTimeToComplete: 0,
      completionRate: 0
    };

    const completionsList = Object.values(completions).flat();
    const engagementsList = Object.values(engagements).flat();

    // Calculate completion rates by content type
    const startedByType = {};
    const completedByType = {};

    engagementsList.forEach(engagement => {
      const type = engagement.item.type || 'unknown';
      startedByType[type] = (startedByType[type] || 0) + 1;
    });

    completionsList.forEach(completion => {
      const type = completion.item.type || 'unknown';
      completedByType[type] = (completedByType[type] || 0) + 1;
    });

    Object.keys(startedByType).forEach(type => {
      const started = startedByType[type];
      const completed = completedByType[type] || 0;
      patterns.byContentType[type] = {
        rate: started > 0 ? completed / started : 0,
        started,
        completed
      };
    });

    patterns.completionRate = engagementsList.length > 0 ?
      completionsList.length / engagementsList.length : 0;

    this.patterns.completion = patterns;
  }

  analyzeTimePatterns() {
    const timeInvestments = this.insights.timeInvestment || {};
    const patterns = {
      screenTime: {},
      peakHours: {},
      totalTime: 0,
      averageSessionTime: 0
    };

    let totalTime = 0;
    let sessionCount = 0;

    Object.values(timeInvestments).flat().forEach(investment => {
      patterns.screenTime[investment.screen] =
        (patterns.screenTime[investment.screen] || 0) + investment.duration;

      const hour = new Date(investment.timestamp).getHours();
      patterns.peakHours[hour] =
        (patterns.peakHours[hour] || 0) + investment.duration;

      totalTime += investment.duration;
      sessionCount++;
    });

    patterns.totalTime = totalTime;
    patterns.averageSessionTime = sessionCount > 0 ? totalTime / sessionCount : 0;

    this.patterns.timeOfDay = patterns;
  }

  analyzeContentPreferences() {
    const readings = this.insights.reading || {};
    const patterns = {
      preferredTypes: {},
      preferredCategories: {},
      preferredLengths: {},
      dropOffPoints: {}
    };

    Object.values(readings).flat().forEach(session => {
      const type = session.item.type || 'unknown';
      const category = session.item.category || 'unknown';
      const duration = session.duration;

      patterns.preferredTypes[type] =
        (patterns.preferredTypes[type] || 0) + 1;

      patterns.preferredCategories[category] =
        (patterns.preferredCategories[category] || 0) + 1;

      // Categorize reading lengths
      let lengthCategory;
      if (duration < 120000) lengthCategory = 'quick'; // < 2 min
      else if (duration < 600000) lengthCategory = 'medium'; // 2-10 min
      else lengthCategory = 'deep'; // > 10 min

      patterns.preferredLengths[lengthCategory] =
        (patterns.preferredLengths[lengthCategory] || 0) + 1;
    });

    this.patterns.contentTypes = patterns;
  }

  analyzeInboxHealth() {
    const inboxFlow = this.insights.inboxFlow || {};
    const patterns = {
      averageProcessingTime: 0,
      processingEfficiency: 0,
      daysWithClearedInbox: 0,
      weeklyPattern: {}
    };

    const processings = Object.values(inboxFlow).flat();

    if (processings.length > 0) {
      const totalTime = processings.reduce((sum, p) => sum + p.processingTime, 0);
      patterns.averageProcessingTime = totalTime / processings.length;

      // Count days with inbox activity
      const activeDays = Object.keys(inboxFlow).length;
      patterns.daysWithClearedInbox = activeDays;

      // Weekly processing pattern
      Object.keys(inboxFlow).forEach(day => {
        const dayOfWeek = new Date(day).getDay();
        const processingsCount = inboxFlow[day].length;
        patterns.weeklyPattern[dayOfWeek] =
          (patterns.weeklyPattern[dayOfWeek] || 0) + processingsCount;
      });
    }

    this.patterns.processingSpeed = patterns;
  }

  // Gentle insight generation
  generateGentleInsights() {
    const insights = {
      narrative: this.generateNarrativeInsights(),
      patterns: this.generatePatternInsights(),
      suggestions: this.generateGentleSuggestions(),
      celebrations: this.generateCelebrations(),
      reflections: this.generateReflectionPrompts()
    };

    return insights;
  }

  generateNarrativeInsights() {
    const narratives = [];

    // Reading rhythm insights
    const readingPattern = this.patterns.reading;
    if (readingPattern && readingPattern.totalSessions > 5) {
      const favoriteTime = this.getMostFrequent(readingPattern.favoriteTimeSlots);
      if (favoriteTime) {
        narratives.push({
          type: 'rhythm',
          message: `You find your reading rhythm in the ${this.timeSlotToHuman(favoriteTime)}`,
          confidence: 'high',
          icon: '🌅'
        });
      }

      if (readingPattern.consistency > 0.6) {
        narratives.push({
          type: 'consistency',
          message: 'You\'re developing a lovely reading routine',
          confidence: 'medium',
          icon: '🎯'
        });
      }
    }

    // Content preference insights
    const contentPattern = this.patterns.contentTypes;
    if (contentPattern) {
      const preferredLength = this.getMostFrequent(contentPattern.preferredLengths);
      if (preferredLength) {
        const lengthMessages = {
          quick: 'You prefer bite-sized content that fits into life\'s moments',
          medium: 'You enjoy substantial reads that don\'t overwhelm',
          deep: 'You love immersive, thoughtful content'
        };
        narratives.push({
          type: 'preference',
          message: lengthMessages[preferredLength],
          confidence: 'high',
          icon: '📖'
        });
      }
    }

    // Inbox flow insights
    const processingPattern = this.patterns.processingSpeed;
    if (processingPattern && processingPattern.daysWithClearedInbox > 3) {
      narratives.push({
        type: 'organization',
        message: `You've been mindfully organizing your inbox ${processingPattern.daysWithClearedInbox} times this week`,
        confidence: 'high',
        icon: '✨'
      });
    }

    return narratives;
  }

  generatePatternInsights() {
    return {
      reading: this.patterns.reading,
      completion: this.patterns.completion,
      timeOfDay: this.patterns.timeOfDay,
      contentTypes: this.patterns.contentTypes,
      processingSpeed: this.patterns.processingSpeed
    };
  }

  generateGentleSuggestions() {
    const suggestions = [];

    // Content length suggestions
    const contentPattern = this.patterns.contentTypes;
    if (contentPattern && contentPattern.preferredLengths) {
      const preferred = this.getMostFrequent(contentPattern.preferredLengths);
      if (preferred === 'quick') {
        suggestions.push({
          type: 'content',
          message: 'Consider curating more podcast episodes for when you want something longer',
          action: 'Explore audio content',
          confidence: 'medium'
        });
      } else if (preferred === 'deep') {
        suggestions.push({
          type: 'content',
          message: 'You might enjoy saving articles for weekend deep reading sessions',
          action: 'Schedule reading time',
          confidence: 'medium'
        });
      }
    }

    // Time-based suggestions
    const readingPattern = this.patterns.reading;
    if (readingPattern && readingPattern.favoriteTimeSlots) {
      const favoriteTime = this.getMostFrequent(readingPattern.favoriteTimeSlots);
      if (favoriteTime === 'evening') {
        suggestions.push({
          type: 'timing',
          message: 'Your evening reading time seems special - consider protecting it',
          action: 'Set reading reminders',
          confidence: 'high'
        });
      }
    }

    return suggestions;
  }

  generateCelebrations() {
    const celebrations = [];
    const thisWeek = this.getThisWeekData();

    // Celebrate consistency
    if (thisWeek.readingDays >= 3) {
      celebrations.push({
        type: 'consistency',
        message: `${thisWeek.readingDays} days of reading this week`,
        icon: '🌟'
      });
    }

    // Celebrate completion
    if (thisWeek.completions >= 2) {
      celebrations.push({
        type: 'completion',
        message: `${thisWeek.completions} items completed this week`,
        icon: '✅'
      });
    }

    // Celebrate organization
    if (thisWeek.inboxClearing >= 2) {
      celebrations.push({
        type: 'organization',
        message: 'Your inbox is flowing smoothly',
        icon: '🌊'
      });
    }

    return celebrations;
  }

  generateReflectionPrompts() {
    const prompts = [];

    // Based on patterns, suggest gentle reflection
    const readingPattern = this.patterns.reading;
    if (readingPattern && readingPattern.totalSessions > 0) {
      prompts.push({
        question: 'What made your recent reading sessions especially satisfying?',
        category: 'reflection'
      });
    }

    const contentPattern = this.patterns.contentTypes;
    if (contentPattern && Object.keys(contentPattern.preferredCategories).length > 1) {
      prompts.push({
        question: 'Notice how different types of content affect your mood and energy',
        category: 'awareness'
      });
    }

    return prompts;
  }

  // Utility methods
  getCurrentContext() {
    const now = new Date();
    return {
      timeOfDay: this.getTimeSlot(now.getTime()),
      dayOfWeek: now.getDay(),
      hour: now.getHours(),
      date: this.getDateKey(now.getTime())
    };
  }

  getTimeSlot(timestamp) {
    const hour = new Date(timestamp).getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  timeSlotToHuman(timeSlot) {
    const slots = {
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'quiet night hours'
    };
    return slots[timeSlot] || timeSlot;
  }

  getDateKey(timestamp) {
    return new Date(timestamp).toISOString().split('T')[0];
  }

  getWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  getThisWeekData() {
    const weekStart = this.getWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekData = {
      readingDays: 0,
      completions: 0,
      inboxClearing: 0
    };

    // Count reading days
    Object.keys(this.insights.reading || {}).forEach(day => {
      const date = new Date(day);
      if (date >= weekStart && date < weekEnd) {
        weekData.readingDays++;
      }
    });

    // Count completions
    Object.values(this.insights.completions || {}).forEach(dayCompletions => {
      weekData.completions += dayCompletions.length;
    });

    // Count inbox clearing days
    Object.keys(this.insights.inboxFlow || {}).forEach(day => {
      const date = new Date(day);
      if (date >= weekStart && date < weekEnd) {
        weekData.inboxClearing++;
      }
    });

    return weekData;
  }

  getMostFrequent(obj) {
    if (!obj || Object.keys(obj).length === 0) return null;
    return Object.keys(obj).reduce((a, b) => obj[a] > obj[b] ? a : b);
  }

  calculateConsistency(dayCount) {
    if (dayCount.size === 0) return 0;
    const totalDays = dayCount.size;
    const averageSessionsPerDay = Array.from(dayCount.values()).reduce((a, b) => a + b, 0) / totalDays;

    // Consistency is higher when sessions are spread across more days
    return Math.min(1, totalDays / 7); // Max consistency when active all 7 days
  }

  calculateTimeToComplete(item) {
    // Calculate time from creation/start to completion
    const now = Date.now();
    const created = new Date(item.createdAt).getTime();
    return now - created;
  }

  setupPeriodicAnalysis() {
    // Re-analyze patterns periodically (every hour)
    setInterval(() => {
      this.analyzeExistingPatterns();
    }, 60 * 60 * 1000);
  }

  // Data persistence
  loadInsights() {
    try {
      const saved = localStorage.getItem('gentleInsights');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading insights:', error);
      return {};
    }
  }

  saveInsights() {
    try {
      localStorage.setItem('gentleInsights', JSON.stringify(this.insights));
    } catch (error) {
      console.error('Error saving insights:', error);
    }
  }

  // Public API
  getInsights() {
    return this.generateGentleInsights();
  }

  getPatterns() {
    return this.patterns;
  }

  triggerAnalysis() {
    this.analyzeExistingPatterns();
    return this.generateGentleInsights();
  }
}

// Create global instance
const insightsTracker = new InsightsTracker();