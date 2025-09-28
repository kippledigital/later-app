// Intelligent content grouping and collections manager
class CollectionsManager {
  constructor() {
    this.collections = this.loadCollections();
    this.smartLists = this.initializeSmartLists();
    this.autoGroupingRules = this.initializeAutoGrouping();
    this.topicAnalyzer = new ContentTopicAnalyzer();
  }

  init() {
    this.setupEventListeners();
    this.startAutoGroupingMonitor();
    this.updateSmartLists();
  }

  // Load collections from storage
  loadCollections() {
    try {
      const saved = localStorage.getItem('laterApp_collections');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading collections:', error);
      return [];
    }
  }

  // Save collections to storage
  saveCollections() {
    try {
      localStorage.setItem('laterApp_collections', JSON.stringify(this.collections));
    } catch (error) {
      console.error('Error saving collections:', error);
    }
  }

  // Initialize smart lists
  initializeSmartLists() {
    return {
      'morning-focus': {
        id: 'morning-focus',
        name: 'Morning Focus',
        description: 'Items perfect for deep work and concentration',
        icon: 'sunrise',
        color: 'orange',
        auto: true,
        criteria: this.getMorningFocusCriteria(),
        estimatedTime: null
      },
      'commute-queue': {
        id: 'commute-queue',
        name: 'Commute Queue',
        description: 'Audio content and quick reads for on-the-go',
        icon: 'headphones',
        color: 'blue',
        auto: true,
        criteria: this.getCommuteQueueCriteria(),
        estimatedTime: null
      },
      'quick-wins': {
        id: 'quick-wins',
        name: 'Quick Wins',
        description: '5 minutes or less - perfect for micro-moments',
        icon: 'zap',
        color: 'emerald',
        auto: true,
        criteria: this.getQuickWinsCriteria(),
        estimatedTime: null
      },
      'weekend-reading': {
        id: 'weekend-reading',
        name: 'Weekend Reading',
        description: 'Longer content for relaxed, leisurely reading',
        icon: 'book',
        color: 'purple',
        auto: true,
        criteria: this.getWeekendReadingCriteria(),
        estimatedTime: null
      }
    };
  }

  // Smart list criteria functions
  getMorningFocusCriteria() {
    return (item) => {
      return (
        (item.category === 'work' && item.estimatedDuration >= 15) ||
        (item.type === 'article' && this.topicAnalyzer.isDeepWorkContent(item)) ||
        (item.urgency === 'high' && item.estimatedEffort === 'high')
      );
    };
  }

  getCommuteQueueCriteria() {
    return (item) => {
      return (
        item.type === 'podcast' ||
        item.type === 'audio' ||
        (item.type === 'article' && item.estimatedDuration <= 10) ||
        (item.content && item.content.includes('podcast')) ||
        (item.title && (item.title.includes('listen') || item.title.includes('audio')))
      );
    };
  }

  getQuickWinsCriteria() {
    return (item) => {
      return (
        (item.estimatedDuration && item.estimatedDuration <= 5) ||
        (item.type === 'task' && item.estimatedEffort === 'low') ||
        (item.type === 'email' && !item.typeData?.replyNeeded)
      );
    };
  }

  getWeekendReadingCriteria() {
    return (item) => {
      return (
        (item.type === 'article' && item.estimatedDuration >= 15) ||
        (item.category === 'inspiration' && item.type === 'article') ||
        (item.type === 'book' || item.type === 'longform')
      );
    };
  }

  // Auto-grouping rules
  initializeAutoGrouping() {
    return {
      source: {
        enabled: true,
        minItems: 3,
        check: this.checkSourceGrouping.bind(this)
      },
      topic: {
        enabled: true,
        minItems: 3,
        confidence: 0.7,
        check: this.checkTopicGrouping.bind(this)
      },
      project: {
        enabled: true,
        minItems: 2,
        check: this.checkProjectGrouping.bind(this)
      },
      timePeriod: {
        enabled: true,
        minItems: 5,
        check: this.checkTimePeriodGrouping.bind(this)
      }
    };
  }

  // Auto-grouping detection methods
  checkSourceGrouping() {
    const allItems = window.dataManager.getAllItems();
    const sourcesMap = {};

    allItems.forEach(item => {
      if (item.url) {
        try {
          const domain = new URL(item.url).hostname.replace('www.', '');
          if (!sourcesMap[domain]) {
            sourcesMap[domain] = [];
          }
          sourcesMap[domain].push(item);
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    const suggestions = [];
    Object.entries(sourcesMap).forEach(([domain, items]) => {
      if (items.length >= this.autoGroupingRules.source.minItems) {
        const existingCollection = this.findCollectionByItems(items);
        if (!existingCollection) {
          suggestions.push({
            type: 'source',
            title: `${this.formatDomainName(domain)} Collection`,
            description: `Group ${items.length} items from ${domain}`,
            items: items,
            metadata: { source: domain },
            confidence: 'high'
          });
        }
      }
    });

    return suggestions;
  }

  checkTopicGrouping() {
    const allItems = window.dataManager.getAllItems();
    const topicGroups = this.topicAnalyzer.groupByTopic(allItems);
    const suggestions = [];

    topicGroups.forEach(group => {
      if (group.items.length >= this.autoGroupingRules.topic.minItems &&
          group.confidence >= this.autoGroupingRules.topic.confidence) {

        const existingCollection = this.findCollectionByItems(group.items);
        if (!existingCollection) {
          suggestions.push({
            type: 'topic',
            title: `${group.topic} Collection`,
            description: `${group.items.length} items about ${group.topic.toLowerCase()}`,
            items: group.items,
            metadata: { topic: group.topic, confidence: group.confidence },
            confidence: group.confidence > 0.8 ? 'high' : 'medium'
          });
        }
      }
    });

    return suggestions;
  }

  checkProjectGrouping() {
    const allItems = window.dataManager.getAllItems();
    const projectItems = allItems.filter(item =>
      item.category === 'work' &&
      (item.title.includes('project') || item.content.includes('project'))
    );

    // Group by common keywords in work items
    const projectGroups = this.groupByCommonKeywords(projectItems);
    const suggestions = [];

    projectGroups.forEach(group => {
      if (group.items.length >= this.autoGroupingRules.project.minItems) {
        const existingCollection = this.findCollectionByItems(group.items);
        if (!existingCollection) {
          suggestions.push({
            type: 'project',
            title: `${group.keyword} Project`,
            description: `${group.items.length} work items related to ${group.keyword}`,
            items: group.items,
            metadata: { project: group.keyword },
            confidence: 'medium'
          });
        }
      }
    });

    return suggestions;
  }

  checkTimePeriodGrouping() {
    const allItems = window.dataManager.getAllItems();
    const thisWeek = this.getThisWeekItems(allItems);
    const suggestions = [];

    if (thisWeek.length >= this.autoGroupingRules.timePeriod.minItems) {
      const existingCollection = this.collections.find(c => c.metadata?.timePeriod === 'thisWeek');
      if (!existingCollection) {
        suggestions.push({
          type: 'timePeriod',
          title: 'This Week\'s Reading',
          description: `${thisWeek.length} items saved this week`,
          items: thisWeek,
          metadata: { timePeriod: 'thisWeek' },
          confidence: 'medium'
        });
      }
    }

    return suggestions;
  }

  // Auto-grouping monitoring
  startAutoGroupingMonitor() {
    // Check for auto-grouping opportunities every 10 minutes
    setInterval(() => {
      this.checkForAutoGroupingOpportunities();
    }, 10 * 60 * 1000);

    // Also check when new items are added
    document.addEventListener('itemSaved', () => {
      setTimeout(() => {
        this.checkForAutoGroupingOpportunities();
      }, 3000);
    });
  }

  checkForAutoGroupingOpportunities() {
    if (document.getElementById('collectionSuggestion')) {
      return; // Already showing a suggestion
    }

    const allSuggestions = [
      ...this.autoGroupingRules.source.check(),
      ...this.autoGroupingRules.topic.check(),
      ...this.autoGroupingRules.project.check(),
      ...this.autoGroupingRules.timePeriod.check()
    ];

    if (allSuggestions.length > 0) {
      // Show the highest confidence suggestion
      const topSuggestion = allSuggestions.sort((a, b) => {
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      })[0];

      this.showCollectionSuggestion(topSuggestion);
    }
  }

  // Collection suggestion UI
  showCollectionSuggestion(suggestion) {
    const suggestionHTML = `
      <div id="collectionSuggestion" class="fixed top-4 left-4 right-4 z-[70] bg-slate-900/95 backdrop-blur rounded-xl ring-1 ring-white/10 p-4 shadow-2xl opacity-0 translate-y-[-10px] transition-all duration-300">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-500/10 ring-1 ring-purple-500/20 flex items-center justify-center shrink-0">
            <i data-lucide="folder-plus" class="w-5 h-5 text-purple-300"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-[15px] font-medium text-slate-100 mb-1">Create "${suggestion.title}"?</h3>
            <p class="text-[13px] text-slate-400 leading-relaxed mb-3">${suggestion.description}</p>
            <div class="flex items-center gap-2">
              <button onclick="window.collectionsManager.acceptCollectionSuggestion('${btoa(JSON.stringify(suggestion))}')" class="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 ring-1 ring-purple-500/25 transition-colors">
                <i data-lucide="folder-plus" class="w-3.5 h-3.5"></i>
                Create collection
              </button>
              <button onclick="window.collectionsManager.dismissCollectionSuggestion()" class="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10 transition-colors">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                Not now
              </button>
            </div>
          </div>
          <button onclick="window.collectionsManager.dismissCollectionSuggestion()" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
            <i data-lucide="x" class="w-4 h-4 text-slate-300"></i>
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', suggestionHTML);

    // Animate in
    requestAnimationFrame(() => {
      const element = document.getElementById('collectionSuggestion');
      if (element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';

        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    });
  }

  acceptCollectionSuggestion(encodedSuggestion) {
    try {
      const suggestion = JSON.parse(atob(encodedSuggestion));
      this.createCollection({
        name: suggestion.title,
        description: suggestion.description,
        items: suggestion.items.map(item => item.id),
        metadata: suggestion.metadata,
        auto: false,
        coverImage: this.generateCoverImage(suggestion.items[0])
      });

      this.dismissCollectionSuggestion();
      this.showFeedback(`Created "${suggestion.title}" collection`, 'success');

      // Track the acceptance
      if (window.insightsTracker) {
        window.insightsTracker.trackInteraction('collection_suggestion_accepted', suggestion.type);
      }
    } catch (error) {
      console.error('Error accepting collection suggestion:', error);
      this.dismissCollectionSuggestion();
    }
  }

  dismissCollectionSuggestion() {
    const suggestion = document.getElementById('collectionSuggestion');
    if (suggestion) {
      suggestion.style.opacity = '0';
      suggestion.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (suggestion.parentNode) {
          suggestion.parentNode.removeChild(suggestion);
        }
      }, 300);
    }
  }

  // Collection management
  createCollection(collectionData) {
    const collection = {
      id: this.generateId(),
      name: collectionData.name,
      description: collectionData.description || '',
      items: collectionData.items || [],
      metadata: collectionData.metadata || {},
      auto: collectionData.auto || false,
      coverImage: collectionData.coverImage || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: this.calculateProgress(collectionData.items || []),
      estimatedTime: this.calculateEstimatedTime(collectionData.items || [])
    };

    this.collections.push(collection);
    this.saveCollections();
    return collection;
  }

  updateCollection(id, updates) {
    const collection = this.collections.find(c => c.id === id);
    if (collection) {
      Object.assign(collection, updates);
      collection.updatedAt = new Date().toISOString();
      collection.progress = this.calculateProgress(collection.items);
      collection.estimatedTime = this.calculateEstimatedTime(collection.items);
      this.saveCollections();
      return collection;
    }
    return null;
  }

  deleteCollection(id) {
    const index = this.collections.findIndex(c => c.id === id);
    if (index !== -1) {
      this.collections.splice(index, 1);
      this.saveCollections();
      return true;
    }
    return false;
  }

  addItemToCollection(collectionId, itemId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection && !collection.items.includes(itemId)) {
      collection.items.push(itemId);
      this.updateCollection(collectionId, { items: collection.items });
      return true;
    }
    return false;
  }

  removeItemFromCollection(collectionId, itemId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection) {
      const index = collection.items.indexOf(itemId);
      if (index !== -1) {
        collection.items.splice(index, 1);
        this.updateCollection(collectionId, { items: collection.items });
        return true;
      }
    }
    return false;
  }

  // Smart lists management
  updateSmartLists() {
    const allItems = window.dataManager.getAllItems();

    Object.values(this.smartLists).forEach(smartList => {
      const matchingItems = allItems.filter(smartList.criteria);
      smartList.items = matchingItems.map(item => item.id);
      smartList.progress = this.calculateProgress(smartList.items);
      smartList.estimatedTime = this.calculateEstimatedTime(smartList.items);
    });
  }

  getSmartList(id) {
    return this.smartLists[id];
  }

  getSmartListItems(id) {
    const smartList = this.smartLists[id];
    if (!smartList) return [];

    return smartList.items.map(itemId =>
      window.dataManager.getItem(itemId)
    ).filter(Boolean);
  }

  // Progress and time calculations
  calculateProgress(itemIds) {
    if (!itemIds || itemIds.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const items = itemIds.map(id => window.dataManager.getItem(id)).filter(Boolean);
    const completed = items.filter(item => item.progress >= 1).length;
    const total = items.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  }

  calculateEstimatedTime(itemIds) {
    if (!itemIds || itemIds.length === 0) return 0;

    const items = itemIds.map(id => window.dataManager.getItem(id)).filter(Boolean);
    return items.reduce((total, item) => {
      const remaining = item.estimatedDuration * (1 - item.progress);
      return total + (remaining || 5); // Default 5 minutes if no estimate
    }, 0);
  }

  // Utility methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatDomainName(domain) {
    return domain.split('.')[0]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  findCollectionByItems(items) {
    const itemIds = items.map(item => item.id).sort();
    return this.collections.find(collection => {
      const collectionIds = collection.items.sort();
      return itemIds.length === collectionIds.length &&
             itemIds.every((id, index) => id === collectionIds[index]);
    });
  }

  groupByCommonKeywords(items) {
    const keywordGroups = {};

    items.forEach(item => {
      const keywords = this.extractKeywords(item.title + ' ' + item.content);
      keywords.forEach(keyword => {
        if (!keywordGroups[keyword]) {
          keywordGroups[keyword] = [];
        }
        keywordGroups[keyword].push(item);
      });
    });

    return Object.entries(keywordGroups)
      .filter(([keyword, items]) => items.length >= 2)
      .map(([keyword, items]) => ({ keyword, items }));
  }

  extractKeywords(text) {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 10); // Top 10 keywords
  }

  getThisWeekItems(items) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return items.filter(item => new Date(item.createdAt) > weekAgo);
  }

  generateCoverImage(item) {
    // Generate a cover image URL based on item content
    if (item.url) {
      try {
        const domain = new URL(item.url).hostname;
        return `https://logo.clearbit.com/${domain}`;
      } catch (e) {
        // Fallback to a generic image
      }
    }

    // Fallback based on category
    const categoryImages = {
      work: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400',
      life: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400',
      inspiration: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400'
    };

    return categoryImages[item.category] || categoryImages.inspiration;
  }

  setupEventListeners() {
    // Collection-related event listeners will be added here
  }

  showFeedback(message, type = 'info') {
    if (window.appManager && window.appManager.showFeedback) {
      window.appManager.showFeedback(message, type);
    }
  }
}

// Content topic analyzer for intelligent grouping
class ContentTopicAnalyzer {
  constructor() {
    this.topicKeywords = {
      'Technology': ['tech', 'ai', 'machine learning', 'software', 'programming', 'coding', 'development', 'app', 'web', 'digital'],
      'Business': ['business', 'startup', 'entrepreneur', 'marketing', 'strategy', 'management', 'leadership', 'finance'],
      'Design': ['design', 'ui', 'ux', 'visual', 'creative', 'branding', 'typography', 'color', 'layout'],
      'Health': ['health', 'fitness', 'nutrition', 'wellness', 'medical', 'exercise', 'diet', 'mental health'],
      'Science': ['science', 'research', 'study', 'discovery', 'experiment', 'data', 'analysis', 'climate'],
      'Personal Growth': ['productivity', 'habits', 'mindfulness', 'learning', 'self-improvement', 'goals', 'motivation'],
      'News': ['news', 'politics', 'world', 'economy', 'government', 'society', 'current events']
    };
  }

  groupByTopic(items) {
    const topicGroups = {};

    items.forEach(item => {
      const topics = this.analyzeItemTopics(item);
      topics.forEach(({ topic, confidence }) => {
        if (confidence >= 0.6) {
          if (!topicGroups[topic]) {
            topicGroups[topic] = { topic, items: [], confidence: 0 };
          }
          topicGroups[topic].items.push(item);
          topicGroups[topic].confidence = Math.max(topicGroups[topic].confidence, confidence);
        }
      });
    });

    return Object.values(topicGroups);
  }

  analyzeItemTopics(item) {
    const text = (item.title + ' ' + (item.content || '')).toLowerCase();
    const topics = [];

    Object.entries(this.topicKeywords).forEach(([topic, keywords]) => {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      const confidence = Math.min(matches / keywords.length * 2, 1); // Boost confidence

      if (confidence > 0) {
        topics.push({ topic, confidence });
      }
    });

    return topics.sort((a, b) => b.confidence - a.confidence);
  }

  isDeepWorkContent(item) {
    const deepWorkKeywords = ['focus', 'deep work', 'concentration', 'productivity', 'strategy', 'analysis', 'research'];
    const text = (item.title + ' ' + (item.content || '')).toLowerCase();
    return deepWorkKeywords.some(keyword => text.includes(keyword));
  }
}

// Create global instance
const collectionsManager = new CollectionsManager();