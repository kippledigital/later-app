// Real search functionality with intelligent filtering
class SearchManager {
  constructor() {
    this.searchOverlay = null;
    this.searchInput = null;
    this.searchResults = null;
    this.searchHistory = this.loadSearchHistory();
    this.currentQuery = '';
    this.currentFilters = {
      category: 'all',
      state: 'all',
      dateRange: 'all'
    };
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.createSearchOverlay();
    this.setupEventListeners();
    this.initialized = true;
  }

  createSearchOverlay() {
    this.searchOverlay = document.createElement('div');
    this.searchOverlay.id = 'searchOverlay';
    this.searchOverlay.className = 'hidden fixed inset-0 z-[100] bg-slate-950';
    this.searchOverlay.innerHTML = `
      <!-- Search Header -->
      <div class="search-header fixed top-0 left-0 right-0 z-10 bg-slate-950/95 backdrop-blur border-b border-white/10">
        <div class="flex items-center gap-3 px-4 py-3">
          <button id="searchBack" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
            <i data-lucide="arrow-left" class="w-4 h-4 text-slate-300"></i>
          </button>
          <div class="flex-1 relative">
            <input id="searchInput" type="text" placeholder="Search your items..." 
                   class="w-full text-[16px] px-4 py-2 rounded-lg bg-white/5 ring-1 ring-white/10 focus:ring-cyan-400/30 focus:outline-none placeholder:text-slate-500 text-slate-200">
            <button id="clearSearch" class="absolute right-3 top-1/2 transform -translate-y-1/2 hidden">
              <i data-lucide="x" class="w-4 h-4 text-slate-400"></i>
            </button>
          </div>
          <button id="searchClose" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
            <i data-lucide="x" class="w-4 h-4 text-slate-300"></i>
          </button>
        </div>
        
        <!-- Search Filters -->
        <div class="px-4 pb-3">
          <div class="flex items-center gap-2 overflow-x-auto">
            <select id="categoryFilter" class="text-[12px] px-2.5 py-1.5 rounded-md bg-white/5 text-slate-300 ring-1 ring-white/10 focus:ring-cyan-400/30 focus:outline-none">
              <option value="all">All Categories</option>
              <option value="work">Work</option>
              <option value="life">Life</option>
              <option value="inspiration">Inspiration</option>
            </select>
            
            <select id="stateFilter" class="text-[12px] px-2.5 py-1.5 rounded-md bg-white/5 text-slate-300 ring-1 ring-white/10 focus:ring-cyan-400/30 focus:outline-none">
              <option value="all">All States</option>
              <option value="inbox">Inbox</option>
              <option value="library">Library</option>
              <option value="archived">Archived</option>
            </select>
            
            <select id="dateFilter" class="text-[12px] px-2.5 py-1.5 rounded-md bg-white/5 text-slate-300 ring-1 ring-white/10 focus:ring-cyan-400/30 focus:outline-none">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Search Content -->
      <div class="search-content pt-24 pb-8">
        <div class="px-4">
          <!-- Search Suggestions -->
          <div id="searchSuggestions" class="mb-6">
            <div class="flex items-center gap-2 mb-3">
              <i data-lucide="lightbulb" class="w-4 h-4 text-cyan-300"></i>
              <h3 class="text-[14px] font-medium text-slate-200">Suggestions</h3>
            </div>
            <div id="suggestionsList" class="flex flex-wrap gap-2">
              <!-- Suggestions will be populated here -->
            </div>
          </div>

          <!-- Search Results -->
          <div id="searchResults" class="space-y-3">
            <!-- Results will be populated here -->
          </div>

          <!-- Empty State -->
          <div id="searchEmpty" class="hidden flex flex-col items-center justify-center py-20">
            <div class="w-12 h-12 rounded-lg bg-slate-900 ring-1 ring-white/10 flex items-center justify-center mb-4">
              <i data-lucide="search" class="w-6 h-6 text-slate-400"></i>
            </div>
            <h3 class="text-[16px] font-medium text-slate-100 mb-2">No results found</h3>
            <p class="text-[14px] text-slate-400 text-center">Try different keywords or adjust your filters</p>
          </div>

          <!-- Loading State -->
          <div id="searchLoading" class="hidden flex flex-col items-center justify-center py-20">
            <div class="w-12 h-12 rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20 flex items-center justify-center mb-4">
              <i data-lucide="search" class="w-6 h-6 text-cyan-300 animate-pulse"></i>
            </div>
            <h3 class="text-[16px] font-medium text-slate-100 mb-2">Searching...</h3>
            <p class="text-[14px] text-slate-400 text-center">Finding your items</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.searchOverlay);
    this.searchInput = document.getElementById('searchInput');
    this.searchResults = document.getElementById('searchResults');
  }

  setupEventListeners() {
    // Open/close search
    document.getElementById('searchBack')?.addEventListener('click', () => this.closeSearch());
    document.getElementById('searchClose')?.addEventListener('click', () => this.closeSearch());
    
    // Search input
    this.searchInput?.addEventListener('input', (e) => this.handleSearchInput(e.target.value));
    this.searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSearch();
      }
    });
    
    // Clear search
    document.getElementById('clearSearch')?.addEventListener('click', () => {
      this.searchInput.value = '';
      this.handleSearchInput('');
    });
    
    // Filter changes
    document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
      this.currentFilters.category = e.target.value;
      this.performSearch();
    });
    
    document.getElementById('stateFilter')?.addEventListener('change', (e) => {
      this.currentFilters.state = e.target.value;
      this.performSearch();
    });
    
    document.getElementById('dateFilter')?.addEventListener('change', (e) => {
      this.currentFilters.dateRange = e.target.value;
      this.performSearch();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        if (activeElement !== this.searchInput) {
          e.preventDefault();
          this.openSearch();
        }
      }
    });
  }

  openSearch() {
    this.searchOverlay.classList.remove('hidden');
    this.searchInput.focus();
    this.loadSuggestions();
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  closeSearch() {
    this.searchOverlay.classList.add('hidden');
    this.searchInput.value = '';
    this.currentQuery = '';
    this.clearResults();
  }

  handleSearchInput(query) {
    this.currentQuery = query.trim();
    
    // Show/hide clear button
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
      clearBtn.classList.toggle('hidden', !this.currentQuery);
    }
    
    // Perform search with debounce
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.performSearch();
    }, 300);
  }

  performSearch() {
    if (!this.currentQuery) {
      this.clearResults();
      this.loadSuggestions();
      return;
    }
    
    this.showLoadingState();
    
    // Simulate search delay for better UX
    setTimeout(() => {
      const results = this.searchItems(this.currentQuery);
      this.displayResults(results);
      this.addToSearchHistory(this.currentQuery);
    }, 150);
  }

  searchItems(query) {
    const allItems = window.dataManager.getAllItems();
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return allItems
      .filter(item => this.matchesQuery(item, searchTerms))
      .filter(item => this.matchesFilters(item))
      .sort((a, b) => this.calculateRelevanceScore(b, searchTerms) - this.calculateRelevanceScore(a, searchTerms));
  }

  matchesQuery(item, searchTerms) {
    const searchableText = [
      item.title,
      item.content,
      item.category,
      item.url
    ].join(' ').toLowerCase();
    
    return searchTerms.every(term => searchableText.includes(term));
  }

  matchesFilters(item) {
    // Category filter
    if (this.currentFilters.category !== 'all' && item.category !== this.currentFilters.category) {
      return false;
    }
    
    // State filter
    if (this.currentFilters.state !== 'all' && item.state !== this.currentFilters.state) {
      return false;
    }
    
    // Date filter
    if (this.currentFilters.dateRange !== 'all') {
      const itemDate = new Date(item.createdAt);
      const now = new Date();
      
      switch (this.currentFilters.dateRange) {
        case 'today':
          if (itemDate.toDateString() !== now.toDateString()) return false;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (itemDate < monthAgo) return false;
          break;
      }
    }
    
    return true;
  }

  calculateRelevanceScore(item, searchTerms) {
    let score = 0;
    const title = item.title.toLowerCase();
    const content = item.content.toLowerCase();
    
    searchTerms.forEach(term => {
      // Title matches get higher score
      if (title.includes(term)) {
        score += 10;
        // Exact title match gets even higher score
        if (title === term) score += 20;
      }
      
      // Content matches
      if (content.includes(term)) {
        score += 5;
      }
      
      // Category matches
      if (item.category.toLowerCase().includes(term)) {
        score += 3;
      }
    });
    
    // Boost recent items
    const ageInHours = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 5 - (ageInHours / 24));
    
    return score;
  }

  displayResults(results) {
    this.hideLoadingState();
    
    if (results.length === 0) {
      this.showEmptyState();
      return;
    }
    
    this.hideEmptyState();
    this.searchResults.innerHTML = results.map(item => this.createSearchResultCard(item)).join('');
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  createSearchResultCard(item) {
    const icon = this.getCategoryIcon(item.category);
    const timeAgo = this.getTimeAgo(item.createdAt);
    const stateLabel = this.getStateLabel(item.state);
    
    return `
      <div class="search-result rounded-xl bg-white/5 ring-1 ring-white/10 p-3 transition-all duration-300 hover:bg-white/[0.08] cursor-pointer" data-item-id="${item.id}">
        <div class="flex items-start gap-3">
          <div class="shrink-0">
            <div class="w-8 h-8 rounded-md bg-slate-900 ring-1 ring-white/10 flex items-center justify-center">
              <i data-lucide="${icon}" class="w-4 h-4 text-slate-300"></i>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">${this.capitalizeFirst(item.category)}</span>
              <span class="text-[11px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20">${stateLabel}</span>
              <span class="text-[11px] text-slate-400 flex items-center gap-1">
                <i data-lucide="clock" class="w-3.5 h-3.5"></i>${timeAgo}
              </span>
            </div>
            <h3 class="text-[15px] font-medium tracking-tight text-slate-100 truncate">${this.escapeHtml(item.title)}</h3>
            <p class="text-[13px] text-slate-400 line-clamp-2">${this.escapeHtml(item.content || 'No description')}</p>
            ${item.url ? `
              <div class="mt-2">
                <span class="text-[12px] text-slate-500 flex items-center gap-1">
                  <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                  ${new URL(item.url).hostname}
                </span>
              </div>
            ` : ''}
          </div>
          <div class="shrink-0">
            <button onclick="window.searchManager.openItem('${item.id}')" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
              <i data-lucide="arrow-right" class="w-4 h-4 text-slate-300"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  loadSuggestions() {
    const suggestions = this.generateSuggestions();
    const suggestionsList = document.getElementById('suggestionsList');
    
    if (suggestions.length === 0) {
      document.getElementById('searchSuggestions').style.display = 'none';
      return;
    }
    
    document.getElementById('searchSuggestions').style.display = 'block';
    suggestionsList.innerHTML = suggestions.map(suggestion => `
      <button onclick="window.searchManager.searchSuggestion('${suggestion}')" 
              class="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10 transition-colors">
        <i data-lucide="${this.getSuggestionIcon(suggestion)}" class="w-3.5 h-3.5"></i>
        ${suggestion}
      </button>
    `).join('');
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  generateSuggestions() {
    const suggestions = [];
    const allItems = window.dataManager.getAllItems();
    
    // Recent search history
    suggestions.push(...this.searchHistory.slice(0, 3));
    
    // Popular categories
    const categories = [...new Set(allItems.map(item => item.category))];
    suggestions.push(...categories.map(cat => `${cat} items`));
    
    // Recent items
    const recentItems = allItems
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 2);
    suggestions.push(...recentItems.map(item => item.title));
    
    return [...new Set(suggestions)].slice(0, 6);
  }

  getSuggestionIcon(suggestion) {
    if (suggestion.includes('work')) return 'briefcase';
    if (suggestion.includes('life')) return 'heart';
    if (suggestion.includes('inspiration')) return 'sparkles';
    if (suggestion.includes('items')) return 'folder';
    return 'search';
  }

  searchSuggestion(suggestion) {
    this.searchInput.value = suggestion;
    this.handleSearchInput(suggestion);
  }

  openItem(itemId) {
    const item = window.dataManager.getItem(itemId);
    if (item) {
      this.closeSearch();
      
      // Track search action
      if (window.contextDetectionManager) {
        window.contextDetectionManager.trackAction('search_open', itemId);
      }
      
      // Open item based on its state
      if (item.url && window.readerManager) {
        window.readerManager.openReader(item);
      } else if (window.navigationManager) {
        // Navigate to appropriate screen
        if (item.state === 'inbox') {
          window.navigationManager.showScreen('inbox');
        } else if (item.state === 'library') {
          window.navigationManager.showScreen('library');
        }
      }
    }
  }

  clearResults() {
    this.searchResults.innerHTML = '';
    this.hideEmptyState();
    this.hideLoadingState();
  }

  showLoadingState() {
    document.getElementById('searchLoading').classList.remove('hidden');
    document.getElementById('searchEmpty').classList.add('hidden');
  }

  hideLoadingState() {
    document.getElementById('searchLoading').classList.add('hidden');
  }

  showEmptyState() {
    document.getElementById('searchEmpty').classList.remove('hidden');
  }

  hideEmptyState() {
    document.getElementById('searchEmpty').classList.add('hidden');
  }

  // Search history management
  addToSearchHistory(query) {
    if (!query || query.length < 2) return;
    
    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(item => item !== query);
    
    // Add to beginning
    this.searchHistory.unshift(query);
    
    // Keep only last 10 searches
    this.searchHistory = this.searchHistory.slice(0, 10);
    
    this.saveSearchHistory();
  }

  loadSearchHistory() {
    try {
      const saved = localStorage.getItem('searchHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  }

  saveSearchHistory() {
    try {
      localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  // Utility functions
  getCategoryIcon(category) {
    const icons = {
      work: 'briefcase',
      life: 'heart',
      inspiration: 'sparkles'
    };
    return icons[category] || 'file-text';
  }

  getStateLabel(state) {
    const labels = {
      inbox: 'Inbox',
      library: 'Library',
      archived: 'Archived'
    };
    return labels[state] || state;
  }

  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create global instance
const searchManager = new SearchManager();
