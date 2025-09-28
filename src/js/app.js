// Main application controller
class AppManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeLucideIcons();
    this.renderAllScreens();
    this.setupGreeting();
  }

  setupEventListeners() {
    // Demo button
    const addDemoBtn = document.getElementById('addDemoBtn');
    if (addDemoBtn) {
      addDemoBtn.addEventListener('click', () => this.addDemoItem());
    }

    // Search button
    const openSearchBtn = document.getElementById('openSearchBtn');
    if (openSearchBtn) {
      openSearchBtn.addEventListener('click', () => {
        if (window.searchManager) {
          window.searchManager.openSearch();
        }
      });
    }

    // Library category filters
    document.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.cat;
        this.filterLibraryByCategory(category);
      });
    });

    // Empty state buttons
    this.setupEmptyStateButtons();
  }

  setupEmptyStateButtons() {
    // Inbox empty state
    const inboxGetStarted = document.getElementById('inboxGetStarted');
    if (inboxGetStarted) {
      inboxGetStarted.addEventListener('click', () => {
        if (window.captureManager) {
          window.captureManager.openModal();
        }
      });
    }

    const inboxBrowseLibrary = document.getElementById('inboxBrowseLibrary');
    if (inboxBrowseLibrary) {
      inboxBrowseLibrary.addEventListener('click', () => {
        if (window.navigationManager) {
          window.navigationManager.showScreen('library');
        }
      });
    }

    // Library empty state
    const libraryGetStarted = document.getElementById('libraryGetStarted');
    if (libraryGetStarted) {
      libraryGetStarted.addEventListener('click', () => {
        if (window.captureManager) {
          window.captureManager.openModal();
        }
      });
    }

    const libraryCaptureIdea = document.getElementById('libraryCaptureIdea');
    if (libraryCaptureIdea) {
      libraryCaptureIdea.addEventListener('click', () => {
        if (window.captureManager) {
          window.captureManager.openModal();
        }
      });
    }
  }

  initializeLucideIcons() {
    // Initialize Lucide icons if available
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  setupGreeting() {
    const greetingEl = document.getElementById('greeting');
    const contextSubEl = document.getElementById('contextSub');
    
    if (greetingEl && contextSubEl && window.contextDetectionManager) {
      const greeting = window.contextDetectionManager.getPersonalizedGreeting();
      const subtitle = window.contextDetectionManager.getContextualSubtitle();
      
      greetingEl.textContent = greeting;
      contextSubEl.textContent = subtitle;
    } else {
      // Fallback to basic greeting
      const hour = new Date().getHours();
      let greeting, context;
      
      if (hour < 12) {
        greeting = 'Good morning';
        context = 'Start your day with intention';
      } else if (hour < 17) {
        greeting = 'Good afternoon';
        context = 'Find your focus';
      } else {
        greeting = 'Good evening';
        context = 'Wind down gently';
      }
      
      greetingEl.textContent = greeting;
      contextSubEl.textContent = context;
    }
  }

  renderAllScreens() {
    this.renderNowScreen();
    this.renderInboxScreen();
    this.renderLibraryScreen();
  }

  renderNowScreen() {
    // Get all items for smart recommendations
    const allItems = window.dataManager.getAllItems();
    
    // Get smart recommendations if context detection is available
    let recommendations;
    if (window.contextDetectionManager) {
      recommendations = window.contextDetectionManager.getSmartRecommendations(allItems);
    } else {
      // Fallback to basic recommendations
      const inboxItems = window.dataManager.getItems('inbox');
      const libraryItems = window.dataManager.getItems('library');
      recommendations = {
        attention: inboxItems.slice(0, 2),
        reading: libraryItems.filter(item => item.category === 'inspiration').slice(0, 2),
        explore: libraryItems.slice(0, 2),
        quickActions: []
      };
    }
    
    // Show/hide empty states
    this.toggleEmptyState('emptyNow', recommendations.attention.length === 0);
    
    // Update sections with smart recommendations
    this.updateAttentionSection(recommendations.attention);
    this.updateReadingSection(recommendations.reading);
    this.updateExploreSection(recommendations.explore);
    this.updateQuickActions(recommendations.quickActions);
  }

  renderInboxScreen() {
    const inboxItems = window.dataManager.getItems('inbox');
    const inboxList = document.getElementById('inboxList');
    
    if (inboxList) {
      window.itemManager.renderItems(inboxList, inboxItems, 'inbox');
    }
    
    // Show/hide empty state
    this.toggleEmptyState('inboxEmpty', inboxItems.length === 0);
  }

  renderLibraryScreen() {
    const libraryItems = window.dataManager.getItems('library');
    const libraryGrid = document.getElementById('libraryGrid');
    
    if (libraryGrid) {
      window.itemManager.renderItems(libraryGrid, libraryItems, 'library');
    }
    
    // Show/hide empty state
    this.toggleEmptyState('libraryEmpty', libraryItems.length === 0);
  }

  updateAttentionSection(items) {
    const attentionCards = document.getElementById('attentionCards');
    if (!attentionCards) return;
    
    if (items.length === 0) {
      attentionCards.innerHTML = `
        <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
          <div class="flex items-center gap-2 mb-1.5">
            <i data-lucide="check-circle" class="w-4 h-4 text-cyan-300"></i>
            <span class="text-sm font-medium text-slate-200">All caught up — nothing needs attention right now.</span>
          </div>
          <p class="text-sm text-slate-400">Your inbox is clear. Add something new when you're ready.</p>
        </div>
      `;
    } else {
      attentionCards.innerHTML = items.map(item => this.createAttentionCard(item)).join('');
    }
    
    this.initializeLucideIcons();
  }

  updateReadingSection(items) {
    const readingCards = document.getElementById('readingCards');
    if (!readingCards) return;
    
    if (items.length === 0) {
      document.getElementById('emptyReading')?.classList.remove('hidden');
    } else {
      document.getElementById('emptyReading')?.classList.add('hidden');
      readingCards.innerHTML = items.map(item => this.createReadingCard(item)).join('');
    }
    
    this.initializeLucideIcons();
  }

  updateExploreSection(items) {
    const exploreCards = document.getElementById('exploreCards');
    if (!exploreCards) return;
    
    if (items.length === 0) {
      document.getElementById('emptyExplore')?.classList.remove('hidden');
    } else {
      document.getElementById('emptyExplore')?.classList.add('hidden');
      exploreCards.innerHTML = items.map(item => this.createExploreCard(item)).join('');
    }
    
    this.initializeLucideIcons();
  }

  updateQuickActions(actions) {
    // Find or create quick actions container
    let quickActionsContainer = document.getElementById('quickActions');
    if (!quickActionsContainer) {
      // Create quick actions section if it doesn't exist
      const nowSection = document.querySelector('#screen-now .px-4.pt-5.pb-28');
      if (nowSection && actions.length > 0) {
        const quickActionsHTML = `
          <div id="quickActions" class="mb-7">
            <div class="flex items-center gap-2 mb-3">
              <i data-lucide="zap" class="w-4 h-4 text-cyan-300"></i>
              <h2 class="text-[18px] tracking-tight font-semibold text-slate-100">Quick Actions</h2>
            </div>
            <div class="grid grid-cols-1 gap-3" id="quickActionsList">
              <!-- Quick actions will be inserted here -->
            </div>
          </div>
        `;
        
        // Insert after the greeting section
        const greetingSection = nowSection.querySelector('.mb-5');
        if (greetingSection) {
          greetingSection.insertAdjacentHTML('afterend', quickActionsHTML);
        }
      }
      quickActionsContainer = document.getElementById('quickActions');
    }
    
    if (!quickActionsContainer || actions.length === 0) {
      if (quickActionsContainer) {
        quickActionsContainer.style.display = 'none';
      }
      return;
    }
    
    quickActionsContainer.style.display = 'block';
    const actionsList = document.getElementById('quickActionsList');
    if (actionsList) {
      actionsList.innerHTML = actions.map(action => this.createQuickActionCard(action)).join('');
    }
    
    this.initializeLucideIcons();
  }

  createQuickActionCard(action) {
    return `
      <button onclick="window.appManager.handleQuickAction('${action.id}')" class="w-full text-left rounded-xl bg-gradient-to-br from-white/5 to-white/[0.03] ring-1 ring-white/10 p-3 transition-all duration-300 hover:from-white/[0.08] hover:to-white/[0.05]">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-md bg-slate-900 ring-1 ring-white/10 flex items-center justify-center">
            <i data-lucide="${action.icon}" class="w-4 h-4 text-cyan-300"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-[15px] font-medium tracking-tight text-slate-100 truncate">${action.title}</h3>
            <p class="text-[13px] text-slate-400 line-clamp-2">${action.description}</p>
          </div>
        </div>
      </button>
    `;
  }

  createAttentionCard(item) {
    const icon = window.itemManager.getCategoryIcon(item.category);
    const timeAgo = window.itemManager.getTimeAgo(item.createdAt);
    const reason = item.reason || 'Action';
    
    return `
      <article class="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 transition-all duration-300">
        <div class="flex items-start gap-3">
          <div class="shrink-0 mt-0.5">
            <div class="w-8 h-8 rounded-md bg-slate-900 ring-1 ring-white/10 flex items-center justify-center">
              <i data-lucide="${icon}" class="w-4 h-4 text-slate-300"></i>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">${reason}</span>
              <span class="text-[11px] text-slate-400 flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i>${timeAgo}</span>
            </div>
            <h3 class="text-[15px] font-medium tracking-tight text-slate-100 truncate">${window.itemManager.escapeHtml(item.title)}</h3>
            <p class="text-[13px] text-slate-400 line-clamp-2">${window.itemManager.escapeHtml(item.content || 'No description')}</p>
            <div class="mt-3 flex items-center gap-2">
              <button onclick="window.appManager.moveToLibrary('${item.id}')" class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-500/25 transition-colors">
                <i data-lucide="check" class="w-4 h-4"></i>
                Move to Library
              </button>
              <button onclick="window.appManager.archiveItem('${item.id}')" class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10 transition-colors">
                <i data-lucide="archive" class="w-4 h-4"></i>
                Archive
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  createReadingCard(item) {
    const progress = Math.round(item.progress * 100);
    const timeAgo = window.itemManager.getTimeAgo(item.createdAt);
    
    return `
      <article class="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 transition-all duration-300">
        <div class="flex items-start gap-3">
          <div class="w-14 h-14 rounded-md bg-slate-900 ring-1 ring-white/10 flex items-center justify-center">
            <i data-lucide="book-open" class="w-5 h-5 text-slate-300"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">Read Later</span>
              <span class="text-[11px] text-slate-400 flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i>5 min read</span>
              ${item.progress > 0 ? `<span class="text-[11px] text-slate-500">${progress}% through</span>` : ''}
            </div>
            <h3 class="text-[15px] font-medium tracking-tight text-slate-100 truncate">${window.itemManager.escapeHtml(item.title)}</h3>
            <p class="text-[13px] text-slate-400 line-clamp-2">${window.itemManager.escapeHtml(item.content || 'No description')}</p>
            <div class="mt-3 flex items-center gap-2">
              <button onclick="window.appManager.openItem('${item.id}')" class="read-btn inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-500/25 transition-colors">
                <i data-lucide="book-open" class="w-4 h-4"></i>
                Read
              </button>
              <button onclick="window.appManager.updateProgress('${item.id}', 0.4)" class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10 transition-colors">
                <i data-lucide="bookmark" class="w-4 h-4"></i>
                Save
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  createExploreCard(item) {
    const icon = window.itemManager.getCategoryIcon(item.category);
    const timeAgo = window.itemManager.getTimeAgo(item.createdAt);
    
    return `
      <article class="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 transition-all duration-300">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-md bg-slate-900 ring-1 ring-white/10 flex items-center justify-center">
            <i data-lucide="${icon}" class="w-4 h-4 text-slate-300"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">${window.itemManager.capitalizeFirst(item.category)}</span>
              <span class="text-[11px] text-slate-400">${timeAgo}</span>
            </div>
            <h3 class="text-[15px] font-medium tracking-tight text-slate-100 truncate">${window.itemManager.escapeHtml(item.title)}</h3>
            <p class="text-[13px] text-slate-400 line-clamp-2">${window.itemManager.escapeHtml(item.content || 'No description')}</p>
            <div class="mt-3">
              <button onclick="window.appManager.openItem('${item.id}')" class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10 transition-colors">
                <i data-lucide="eye" class="w-4 h-4"></i>
                Open
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  filterLibraryByCategory(category) {
    const libraryItems = window.dataManager.getItems('library', category);
    const libraryGrid = document.getElementById('libraryGrid');
    
    if (libraryGrid) {
      window.itemManager.renderItems(libraryGrid, libraryItems, 'library');
    }
    
    // Update filter buttons
    document.querySelectorAll('.cat-pill').forEach(btn => {
      if (btn.dataset.cat === category) {
        btn.classList.add('bg-white/10', 'text-slate-200');
        btn.classList.remove('bg-white/5', 'text-slate-300');
      } else {
        btn.classList.remove('bg-white/10', 'text-slate-200');
        btn.classList.add('bg-white/5', 'text-slate-300');
      }
    });
    
    // Show/hide filtered empty state
    this.toggleEmptyState('libraryFilteredEmpty', libraryItems.length === 0);
    this.toggleEmptyState('libraryEmpty', false);
  }

  toggleEmptyState(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
      if (show) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    }
  }

  // Action methods
  addDemoItem() {
    const demoItems = [
      {
        title: 'Review quarterly goals',
        content: 'Check progress on Q4 objectives and plan next steps',
        category: 'work',
        state: 'inbox'
      },
      {
        title: 'Plan weekend hike',
        content: 'Research trails and pack essentials for Saturday adventure',
        category: 'life',
        state: 'inbox'
      },
      {
        title: 'The Art of Calm Technology',
        content: 'How to design interfaces that respect attention and blend into daily life',
        url: 'https://medium.com/@ambercase/calm-technology-7be4818e62f5',
        category: 'inspiration',
        state: 'library'
      },
      {
        title: 'Building Better Habits',
        content: 'A gentle guide to creating routines that stick without guilt or pressure',
        url: 'https://jamesclear.com/atomic-habits',
        category: 'inspiration',
        state: 'library'
      },
      {
        title: 'Minimalist Design Principles',
        content: 'Creating beautiful, functional interfaces with less',
        url: 'https://www.interaction-design.org/literature/article/minimalism-in-design',
        category: 'work',
        state: 'library'
      }
    ];
    
    const randomItem = demoItems[Math.floor(Math.random() * demoItems.length)];
    window.dataManager.saveItem(randomItem);
    
    // Refresh current screen
    const currentScreen = window.navigationManager.getCurrentScreen();
    window.navigationManager.onScreenChange(currentScreen);
  }

  handleQuickAction(actionId) {
    // Track the quick action
    if (window.contextDetectionManager) {
      window.contextDetectionManager.trackAction('quick_action', actionId);
    }
    
    switch (actionId) {
      case 'morning-focus':
      case 'afternoon-break':
        // Open capture modal
        if (window.captureManager) {
          window.captureManager.openModal();
        }
        break;
      case 'evening-wind-down':
        // Navigate to library with inspiration filter
        if (window.navigationManager) {
          window.navigationManager.showScreen('library');
          // Could add filter logic here
        }
        break;
      case 'daily-check-in':
        // Navigate to inbox
        if (window.navigationManager) {
          window.navigationManager.showScreen('inbox');
        }
        break;
    }
  }

  moveToLibrary(id) {
    // Track the action
    if (window.contextDetectionManager) {
      window.contextDetectionManager.trackAction('move_to_library', id);
    }
    
    window.dataManager.moveItem(id, 'library');
    this.renderNowScreen();
  }

  archiveItem(id) {
    // Track the action
    if (window.contextDetectionManager) {
      window.contextDetectionManager.trackAction('archive', id);
    }
    
    window.dataManager.moveItem(id, 'archived');
    this.renderNowScreen();
  }

  openItem(id) {
    console.log('openItem called with id:', id);
    const item = window.dataManager.getItem(id);
    console.log('Found item:', item);
    
    if (item && item.url) {
      console.log('Item has URL, opening reader...');
      // Track the action
      if (window.contextDetectionManager) {
        window.contextDetectionManager.trackAction('read', id);
      }
      
      // Open in reader overlay
      if (window.readerManager) {
        console.log('Reader manager found, opening reader...');
        window.readerManager.openReader(item);
      } else {
        console.log('Reader manager not found, opening in new tab...');
        // Fallback to new tab
        window.open(item.url, '_blank', 'noopener');
      }
    } else {
      console.log('Item not found or has no URL:', item);
    }
  }

  updateProgress(id, progress) {
    // Track the action
    if (window.contextDetectionManager) {
      window.contextDetectionManager.trackAction('update_progress', id);
    }
    
    window.dataManager.updateItemProgress(id, progress);
    this.renderNowScreen();
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...');
  
  try {
    // Make managers globally available
    window.dataManager = dataManager;
    window.navigationManager = navigationManager;
    window.captureManager = captureManager;
    window.itemManager = itemManager;
    window.enhancedSwipeManager = enhancedSwipeManager;
    window.readerManager = readerManager;
    window.contextDetectionManager = contextDetectionManager;
    window.searchManager = searchManager;
    
    console.log('Managers created, initializing...');
    
    // Initialize managers
    window.navigationManager.init();
    window.captureManager.init();
    window.enhancedSwipeManager.init();
    window.readerManager.init();
    window.contextDetectionManager.init();
    window.searchManager.init();
    
    console.log('Managers initialized, creating app...');
    
    // Then initialize the app
    window.appManager = new AppManager();
    
    console.log('App initialized successfully!');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
});
