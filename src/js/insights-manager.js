// Gentle insights UI manager - Calm data presentation and interaction
class InsightsManager {
  constructor() {
    this.isOpen = false;
    this.visualizations = {};
    this.currentSuggestions = [];
  }

  init() {
    this.setupEventListeners();
    this.initializeComponents();
  }

  setupEventListeners() {
    // Insights button
    const insightsBtn = document.getElementById('insightsBtn');
    if (insightsBtn) {
      insightsBtn.addEventListener('click', () => this.openInsights());
    }

    // Close button
    const closeBtn = document.getElementById('insightsClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeInsights());
    }

    // Modal backdrop
    const modal = document.getElementById('insightsModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeInsights();
        }
      });
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeInsights();
      }
    });
  }

  initializeComponents() {
    // Initialize gentle visualizations
    if (window.gentleVisualizations) {
      this.createVisualizationContainers();
    }
  }

  async openInsights() {
    if (this.isOpen) return;

    // Track the interaction
    if (window.insightsTracker) {
      window.insightsTracker.trackInteraction('insights_opened');
    }

    this.isOpen = true;
    const modal = document.getElementById('insightsModal');
    const sheet = document.getElementById('insightsSheet');

    if (!modal || !sheet) return;

    // Show modal
    modal.classList.remove('hidden');

    // Trigger entrance animation
    requestAnimationFrame(() => {
      sheet.style.transform = 'translateY(0) scale(1)';
      sheet.style.opacity = '1';
    });

    // Load and display insights
    await this.loadInsightsData();
    this.renderNarrativeInsights();
    this.renderGentleVisualizations();
    this.renderGentleSuggestions();

    // Initialize lucide icons for new content
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  closeInsights() {
    if (!this.isOpen) return;

    this.isOpen = false;
    const modal = document.getElementById('insightsModal');
    const sheet = document.getElementById('insightsSheet');

    if (!modal || !sheet) return;

    // Trigger exit animation
    sheet.style.transform = 'translateY(24px) scale(0.98)';
    sheet.style.opacity = '0';

    // Hide modal after animation
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  }

  async loadInsightsData() {
    if (!window.insightsTracker) return;

    // Generate fresh insights
    this.insights = await window.insightsTracker.generateGentleInsights();
    this.narratives = window.insightsTracker.generateNarrativeInsights();
    this.suggestions = this.generateGentleSuggestions();
  }

  renderNarrativeInsights() {
    const container = document.getElementById('narrativeList');
    if (!container || !this.narratives) return;

    if (this.narratives.length === 0) {
      container.innerHTML = `
        <div class="flex items-start gap-3 p-4 rounded-lg bg-white/5 ring-1 ring-white/10">
          <div class="w-8 h-8 rounded-md bg-slate-700 flex items-center justify-center">
            <i data-lucide="clock" class="w-4 h-4 text-slate-400"></i>
          </div>
          <div class="flex-1">
            <h4 class="text-[14px] font-medium text-slate-300 mb-1">Getting to know you</h4>
            <p class="text-[13px] text-slate-400">Use Later for a few days and we'll start noticing gentle patterns in how you engage with content.</p>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = this.narratives.map(narrative => `
      <div class="flex items-start gap-3 p-4 rounded-lg bg-white/5 ring-1 ring-white/10">
        <div class="w-8 h-8 rounded-md bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
          <span class="text-[16px]">${narrative.icon}</span>
        </div>
        <div class="flex-1">
          <p class="text-[14px] text-slate-300 leading-relaxed">${narrative.message}</p>
          ${narrative.confidence === 'high' ? `
            <div class="mt-2 text-[12px] text-slate-500">High confidence</div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  renderGentleVisualizations() {
    if (!window.gentleVisualizations || !this.insights) return;

    // Time Flow Visualization
    this.renderTimeFlow();

    // Content Preferences Visualization
    this.renderContentPreferences();

    // Completion Flow Visualization
    this.renderCompletionFlow();
  }

  renderTimeFlow() {
    const container = document.getElementById('timeFlowViz');
    if (!container || !this.insights.readingPatterns) return;

    const timeData = this.insights.readingPatterns.favoriteTimeSlots || {};

    // Convert to normalized data
    const normalizedData = {
      morning: (timeData.morning || 0) / Math.max(1, Object.values(timeData).reduce((a, b) => a + b, 0)),
      afternoon: (timeData.afternoon || 0) / Math.max(1, Object.values(timeData).reduce((a, b) => a + b, 0)),
      evening: (timeData.evening || 0) / Math.max(1, Object.values(timeData).reduce((a, b) => a + b, 0)),
      night: (timeData.night || 0) / Math.max(1, Object.values(timeData).reduce((a, b) => a + b, 0))
    };

    this.visualizations.timeFlow = window.gentleVisualizations.createTimeFlow(
      container,
      normalizedData,
      { colorScheme: 'dusk', title: 'Reading Rhythm' }
    );
  }

  renderContentPreferences() {
    const container = document.getElementById('contentPrefViz');
    const labelsContainer = document.getElementById('contentPrefLabels');

    if (!container || !labelsContainer || !this.insights.contentPreferences) return;

    const preferences = this.insights.contentPreferences;

    // Create visualization
    this.visualizations.contentPref = window.gentleVisualizations.createContentPreference(
      container,
      preferences,
      { colorScheme: 'earth' }
    );

    // Create labels
    const total = Object.values(preferences).reduce((a, b) => a + b, 0);
    if (total > 0) {
      const sortedPrefs = Object.entries(preferences)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3); // Top 3 preferences

      labelsContainer.innerHTML = sortedPrefs.map(([type, count]) => {
        const percentage = Math.round((count / total) * 100);
        const icon = this.getContentTypeIcon(type);

        return `
          <div class="flex items-center justify-between text-[13px]">
            <div class="flex items-center gap-2">
              <i data-lucide="${icon}" class="w-3.5 h-3.5 text-slate-400"></i>
              <span class="text-slate-300 capitalize">${type}</span>
            </div>
            <span class="text-slate-400">${percentage}%</span>
          </div>
        `;
      }).join('');
    } else {
      labelsContainer.innerHTML = `
        <div class="text-[13px] text-slate-400 italic">
          Save a few items to see your preferences emerge
        </div>
      `;
    }
  }

  renderCompletionFlow() {
    const container = document.getElementById('completionFlowViz');
    if (!container || !this.insights.completionPatterns) return;

    const completions = this.insights.completionPatterns.recentCompletions || [];

    this.visualizations.completionFlow = window.gentleVisualizations.createCompletionFlow(
      container,
      completions,
      { colorScheme: 'dawn' }
    );
  }

  renderGentleSuggestions() {
    const container = document.getElementById('suggestionsList');
    if (!container) return;

    if (this.suggestions.length === 0) {
      container.innerHTML = `
        <div class="flex items-start gap-3 p-4 rounded-lg bg-white/5 ring-1 ring-white/10">
          <div class="w-8 h-8 rounded-md bg-slate-700 flex items-center justify-center">
            <i data-lucide="compass" class="w-4 h-4 text-slate-400"></i>
          </div>
          <div class="flex-1">
            <h4 class="text-[14px] font-medium text-slate-300 mb-1">Discovering your rhythm</h4>
            <p class="text-[13px] text-slate-400">As you use Later, we'll gently suggest ways to make your experience even more delightful.</p>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = this.suggestions.map(suggestion => `
      <div class="flex items-start gap-3 p-4 rounded-lg bg-white/5 ring-1 ring-white/10 hover:bg-white/[0.07] transition-colors">
        <div class="w-8 h-8 rounded-md bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 ring-1 ring-emerald-500/20 flex items-center justify-center">
          <i data-lucide="${suggestion.icon}" class="w-4 h-4 text-emerald-300"></i>
        </div>
        <div class="flex-1">
          <h4 class="text-[14px] font-medium text-slate-300 mb-1">${suggestion.title}</h4>
          <p class="text-[13px] text-slate-400 leading-relaxed">${suggestion.description}</p>
          ${suggestion.action ? `
            <button onclick="window.insightsManager.handleSuggestionAction('${suggestion.action}')" class="mt-2 inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/20 transition-colors">
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              ${suggestion.actionText || 'Try this'}
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  generateGentleSuggestions() {
    if (!this.insights) return [];

    const suggestions = [];
    const patterns = this.insights;

    // Reading time suggestions
    if (patterns.readingPatterns && patterns.readingPatterns.totalSessions > 0) {
      const avgSessionLength = patterns.readingPatterns.averageSessionLength;
      if (avgSessionLength < 5) {
        suggestions.push({
          icon: 'clock',
          title: 'Gentle reading moments',
          description: 'You tend to engage with content briefly. Consider setting aside 10-15 minutes for deeper reading when you feel ready.',
          action: 'set_reading_time',
          actionText: 'Set reminder'
        });
      }
    }

    // Content balance suggestions
    if (patterns.contentPreferences) {
      const types = Object.keys(patterns.contentPreferences);
      if (types.length === 1) {
        suggestions.push({
          icon: 'palette',
          title: 'Explore variety',
          description: 'You seem to enjoy one type of content. Maybe try exploring something different when curiosity strikes?',
          action: 'explore_categories',
          actionText: 'Browse library'
        });
      }
    }

    // Completion encouragement
    if (patterns.completionPatterns && patterns.completionPatterns.completionRate < 0.3) {
      suggestions.push({
        icon: 'heart',
        title: 'No pressure to finish',
        description: 'It\'s perfectly okay to sample content and move on. Save the pieces that truly resonate with you.',
        action: null
      });
    }

    // Positive reinforcement
    if (patterns.overallEngagement && patterns.overallEngagement > 0.7) {
      suggestions.push({
        icon: 'sparkles',
        title: 'You\'re building great habits',
        description: 'Your thoughtful engagement with saved content creates a wonderful personal library.',
        action: null
      });
    }

    return suggestions.slice(0, 3); // Limit to 3 gentle suggestions
  }

  handleSuggestionAction(action) {
    // Track the action
    if (window.insightsTracker) {
      window.insightsTracker.trackInteraction('suggestion_action', action);
    }

    switch (action) {
      case 'set_reading_time':
        // Could open a gentle time-setting modal
        this.showFeedback('Reading time suggestions noted 📚');
        break;
      case 'explore_categories':
        // Navigate to library
        this.closeInsights();
        if (window.navigationManager) {
          window.navigationManager.showScreen('library');
        }
        break;
      default:
        break;
    }
  }

  getContentTypeIcon(type) {
    const icons = {
      article: 'book-open',
      email: 'mail',
      task: 'check-square',
      event: 'calendar',
      work: 'briefcase',
      life: 'heart',
      inspiration: 'sparkles'
    };
    return icons[type] || 'bookmark';
  }

  showFeedback(message) {
    // Create a gentle toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-[110] px-4 py-2 rounded-lg text-sm bg-emerald-500/90 text-white backdrop-blur';
    toast.textContent = message;
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -10px)';

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transition = 'all 0.3s ease-out';
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%, 0)';
    });

    // Animate out
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -10px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2500);
  }

  createVisualizationContainers() {
    // Ensure all visualization containers are ready
    const containers = [
      'timeFlowViz',
      'contentPrefViz',
      'completionFlowViz'
    ];

    containers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = ''; // Clear any existing content
      }
    });
  }

  // Method to refresh insights (can be called when new data is added)
  async refreshInsights() {
    if (this.isOpen) {
      await this.loadInsightsData();
      this.renderNarrativeInsights();
      this.renderGentleVisualizations();
      this.renderGentleSuggestions();
    }
  }
}

// Create global instance
const insightsManager = new InsightsManager();