// Main application controller
class AppManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeLucideIcons();
    this.checkForFirstLaunch();
    this.renderAllScreens();
    this.setupGreeting();

    // Ensure icons are initialized after initial render
    setTimeout(() => {
      this.ensureLucideIcons();
    }, 100);
  }

  setupEventListeners() {
    // Demo button
    const addDemoBtn = document.getElementById('addDemoBtn');
    if (addDemoBtn) {
      addDemoBtn.addEventListener('click', () => this.addDemoItem());
    }

    // Add temporary clear and demo button (for debugging)
    const demoBtn = document.getElementById('addDemoBtn');
    if (demoBtn) {
      // Add shift+click to clear and add fresh demo items
      demoBtn.addEventListener('click', (e) => {
        if (e.shiftKey) {
          this.clearAndAddDemoItems();
        }
      });
    }

    // Enhanced demo button for new item types
    const addEnhancedDemoBtn = document.getElementById('addEnhancedDemoBtn');
    if (addEnhancedDemoBtn) {
      console.log('Setting up Demo+ button listener');
      addEnhancedDemoBtn.addEventListener('click', (e) => {
        console.log('Demo+ button clicked');
        e.preventDefault();
        this.addEnhancedDemoItems();
      });
    } else {
      console.warn('Demo+ button not found in DOM');
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

    // Smart select button
    const smartSelectBtn = document.getElementById('smartSelectBtn');
    if (smartSelectBtn) {
      smartSelectBtn.addEventListener('click', () => this.toggleSmartSelectMode());
    }

    // Quick capture button on Now page
    const quickCaptureBtn = document.getElementById('quickCaptureBtn');
    if (quickCaptureBtn) {
      quickCaptureBtn.addEventListener('click', () => {
        if (window.captureManager) {
          window.captureManager.openModal();
        }
      });
    }
  }

  setupEmptyStateButtons() {
    // Now page empty state buttons
    const emptyNowPrimary = document.getElementById('emptyNowPrimary');
    if (emptyNowPrimary) {
      emptyNowPrimary.addEventListener('click', () => {
        if (window.captureManager) {
          window.captureManager.openModal();
        }
      });
    }

    const emptyNowSecondary = document.getElementById('emptyNowSecondary');
    if (emptyNowSecondary) {
      emptyNowSecondary.addEventListener('click', () => {
        if (window.navigationManager) {
          window.navigationManager.showScreen('inbox');
        }
      });
    }

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

  checkForFirstLaunch() {
    // Check if this is the first time loading the app
    const hasBeenLaunched = localStorage.getItem('laterApp_hasLaunched');
    const hasItems = window.dataManager.getAllItems().length > 0;

    console.log('First launch check:', {
      hasBeenLaunched: !!hasBeenLaunched,
      hasItems,
      totalItems: window.dataManager.getAllItems().length
    });

    if (!hasBeenLaunched && !hasItems) {
      console.log('First launch detected, adding sample content...');
      this.addSampleContent();
      localStorage.setItem('laterApp_hasLaunched', 'true');
    } else {
      console.log('Not first launch or has items already');
    }
  }

  addSampleContent() {
    // Add a few sample items to get users started
    const sampleItems = [
      {
        title: 'Welcome to Later',
        content: 'A calm space for everything you want to come back to. Save articles, ideas, and moments for when you\'re ready.',
        category: 'inspiration',
        state: 'inbox',
        type: 'article',
        createdAt: new Date().toISOString()
      },
      {
        title: 'Building Better Digital Habits',
        content: 'Small changes in how we interact with technology can lead to more mindful and intentional living.',
        url: 'http://localhost:8080/test-article.html',
        category: 'life',
        state: 'library',
        type: 'article',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    ];

    sampleItems.forEach(item => {
      window.dataManager.saveItem(item);
    });

    console.log('Added', sampleItems.length, 'sample items');
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

    // Force icon initialization after all screens are rendered
    setTimeout(() => {
      this.ensureLucideIcons();
    }, 50);
  }

  renderNowScreen() {
    // Get all items for smart recommendations
    const allItems = window.dataManager.getAllItems();
    console.log('Rendering Now screen with', allItems.length, 'total items');

    // Get smart recommendations if context detection is available
    let recommendations;
    if (window.contextDetectionManager) {
      recommendations = window.contextDetectionManager.getSmartRecommendations(allItems);
    } else {
      // Fallback to basic recommendations
      const inboxItems = window.dataManager.getItems('inbox');
      const libraryItems = window.dataManager.getItems('library');
      console.log('Inbox items:', inboxItems.length, 'Library items:', libraryItems.length);

      recommendations = {
        attention: inboxItems.slice(0, 2),
        reading: libraryItems.filter(item => item.category === 'inspiration').slice(0, 2),
        explore: libraryItems.slice(0, 2),
        quickActions: []
      };
    }

    console.log('Recommendations:', {
      attention: recommendations.attention.length,
      reading: recommendations.reading.length,
      explore: recommendations.explore.length
    });

    // Show main empty state if everything is empty
    const hasAnyContent = recommendations.attention.length > 0 ||
                         recommendations.reading.length > 0 ||
                         recommendations.explore.length > 0;

    this.toggleEmptyState('emptyNow', !hasAnyContent);

    // Update sections with smart recommendations
    this.updateAttentionSection(recommendations.attention);
    this.updateReadingSection(recommendations.reading);
    this.updateExploreSection(recommendations.explore);
    this.updateQuickActions(recommendations.quickActions);

    // Ensure icons are rendered
    this.ensureLucideIcons();
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

    // Enhance library with knowledge exploration
    if (window.knowledgeView) {
      window.knowledgeView.enhanceLibraryWithKnowledge();
    }
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
      readingCards.innerHTML = '<!-- No reading items -->';
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
      exploreCards.innerHTML = '<!-- No explore items -->';
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
  // Clear storage and add fresh demo items
  clearAndAddDemoItems() {
    localStorage.clear();
    console.log('Cleared localStorage');

    // Add multiple demo items with images
    const demoItems = [
      {
        title: 'The Art of Calm Technology',
        content: 'How to design interfaces that respect attention and blend into daily life',
        url: 'http://localhost:8080/test-article.html',
        category: 'inspiration',
        state: 'library',
        type: 'article',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
        favicon: 'https://www.calmtech.com/favicon.ico'
      },
      {
        title: 'Building Sustainable Digital Habits',
        content: 'Practical strategies for creating a healthier relationship with technology in our always-connected world',
        url: 'http://localhost:8080/test-article-2.html',
        category: 'life',
        state: 'inbox',
        type: 'article',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop',
        favicon: 'https://example.com/favicon.ico'
      }
    ];

    // Add all demo items
    demoItems.forEach(item => {
      console.log('Adding demo item with image:', item.title, item.imageUrl);
      window.dataManager.saveItem(item);
    });

    // Add some related items to showcase knowledge connections
    const knowledgeItems = [
      {
        title: 'The Philosophy of Calm Computing',
        content: 'Exploring principles of technology design that prioritize human wellbeing over engagement metrics',
        url: 'http://localhost:8080/test-article-3.html',
        category: 'inspiration',
        state: 'library',
        type: 'article',
        imageUrl: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=250&fit=crop'
      },
      {
        title: 'Mindful Design Patterns',
        content: 'Interface design techniques that support focused attention and reduce cognitive load',
        url: 'http://localhost:8080/test-article-4.html',
        category: 'work',
        state: 'library',
        type: 'article',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop'
      },
      {
        title: 'Digital Wellness Research',
        content: 'Recent studies on the impact of technology design on mental health and productivity',
        url: 'http://localhost:8080/test-article-5.html',
        category: 'inspiration',
        state: 'inbox',
        type: 'article',
        imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop'
      }
    ];

    knowledgeItems.forEach(item => {
      window.dataManager.saveItem(item);
    });

    // Process all items for knowledge connections after a short delay
    if (window.knowledgeProcessor) {
      setTimeout(() => {
        [...demoItems, ...knowledgeItems].forEach(item => {
          window.knowledgeProcessor.processItem(item);
        });
      }, 500);
    }

    // Refresh current screen
    const currentScreen = window.navigationManager.getCurrentScreen();
    window.navigationManager.onScreenChange(currentScreen);

    this.showFeedback('Added fresh demo items with images!', 'success');
  }

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
        url: 'http://localhost:8080/test-article.html',
        category: 'inspiration',
        state: 'library',
        type: 'article',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
        favicon: 'https://www.calmtech.com/favicon.ico'
      },
      {
        title: 'Building Sustainable Digital Habits',
        content: 'Practical strategies for creating a healthier relationship with technology in our always-connected world',
        url: 'http://localhost:8080/test-article-2.html',
        category: 'life',
        state: 'inbox',
        type: 'article',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop',
        favicon: 'https://example.com/favicon.ico'
      },
      {
        title: 'Building Better Habits',
        content: 'A gentle guide to creating routines that stick without guilt or pressure',
        url: 'https://jamesclear.com/atomic-habits',
        category: 'inspiration',
        state: 'library',
        type: 'article',
        imageUrl: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&h=250&fit=crop',
        favicon: 'https://jamesclear.com/favicon.ico'
      },
      {
        title: 'Minimalist Design Principles',
        content: 'Creating beautiful, functional interfaces with less',
        url: 'https://www.interaction-design.org/literature/article/minimalism-in-design',
        category: 'work',
        state: 'library',
        type: 'article',
        imageUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=250&fit=crop',
        favicon: 'https://www.interaction-design.org/favicon.ico'
      }
    ];
    
    const randomItem = demoItems[Math.floor(Math.random() * demoItems.length)];
    window.dataManager.saveItem(randomItem);

    // Process the item for knowledge connections if knowledge processor is available
    if (window.knowledgeProcessor) {
      setTimeout(() => {
        window.knowledgeProcessor.processItem(randomItem);
      }, 100);
    }

    // Refresh current screen
    const currentScreen = window.navigationManager.getCurrentScreen();
    window.navigationManager.onScreenChange(currentScreen);
  }

  // Add enhanced demo items (emails, events, tasks)
  addEnhancedDemoItems() {
    console.log('addEnhancedDemoItems called');
    try {
      // Clear all data and add fresh sample content
      console.log('About to clear localStorage...');
      localStorage.clear();
      console.log('Cleared localStorage for fresh demo');

      // Reset the launch flag
      localStorage.removeItem('laterApp_hasLaunched');

      // Add sample content
      console.log('Adding sample content...');
      this.addSampleContent();

      // Add enhanced demo items if available
      if (window.mockDataGenerator) {
        console.log('Adding mock data...');
        const mockItems = window.mockDataGenerator.addMockDataToStorage();
        this.showFeedback(`Added fresh sample content + ${mockItems.length} demo items!`, 'success');
      } else {
        console.log('Mock data generator not available');
        this.showFeedback('Added fresh sample content!', 'success');
      }

      // Refresh all screens
      console.log('Refreshing screens...');
      this.renderAllScreens();

      // Ensure icons are rendered
      setTimeout(() => {
        console.log('Ensuring icons...');
        this.ensureLucideIcons();
      }, 100);

      console.log('Demo+ completed successfully');

    } catch (error) {
      console.error('Error in addEnhancedDemoItems:', error);
      console.error('Stack trace:', error.stack);
      this.showFeedback('Error adding demo items: ' + error.message, 'error');
    }
  }

  showFeedback(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      type === 'success' ? 'bg-green-500/90 text-white' :
      type === 'error' ? 'bg-red-500/90 text-white' :
      'bg-slate-800/90 text-slate-200'
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
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

      // Track reading session for insights
      if (window.insightsTracker) {
        window.insightsTracker.trackReadingSession(item);
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

  toggleSmartSelectMode() {
    const smartSelectOptions = document.getElementById('smartSelectOptions');
    const smartSelectBtn = document.getElementById('smartSelectBtn');

    if (!smartSelectOptions || !smartSelectBtn) return;

    if (smartSelectOptions.classList.contains('hidden')) {
      // Show smart select options
      smartSelectOptions.classList.remove('hidden');
      smartSelectBtn.innerHTML = `
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
        Cancel
      `;

      // Enter multi-select mode
      if (window.bulkActionsManager) {
        window.bulkActionsManager.enterMultiSelectMode();
      }
    } else {
      // Hide smart select options
      smartSelectOptions.classList.add('hidden');
      smartSelectBtn.innerHTML = `
        <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
        Select
      `;

      // Exit multi-select mode
      if (window.bulkActionsManager) {
        window.bulkActionsManager.exitMultiSelectMode();
      }
    }

    // Reinitialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Robust Lucide icon initialization
  ensureLucideIcons() {
    let attempts = 0;
    const maxAttempts = 10;

    const initIcons = () => {
      attempts++;

      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        try {
          lucide.createIcons();
          console.log('Lucide icons initialized successfully on attempt', attempts);

          // Double-check by counting icons
          const iconCount = document.querySelectorAll('[data-lucide]').length;
          console.log(`Found ${iconCount} icon elements`);

          if (iconCount > 0) {
            // Force re-render for any remaining unrendered icons
            setTimeout(() => {
              lucide.createIcons();
            }, 100);
          }

          return true;
        } catch (error) {
          console.warn('Lucide createIcons failed:', error);
        }
      }

      if (attempts < maxAttempts) {
        console.log(`Lucide not ready, retrying... (attempt ${attempts}/${maxAttempts})`);
        setTimeout(initIcons, 100);
      } else {
        console.error('Failed to initialize Lucide icons after', maxAttempts, 'attempts');
      }
    };

    // Start immediately and also after DOM is fully loaded
    initIcons();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initIcons);
    }

    // Also try after window load
    window.addEventListener('load', () => {
      setTimeout(initIcons, 200);
    });
  }
}

// Failsafe initialization function
function initializeApp() {
  console.log('Attempting to initialize app...');

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
    window.insightsTracker = insightsTracker;
    window.insightsManager = insightsManager;
    window.backgroundSummaryManager = backgroundSummaryManager;
    window.bulkActionsManager = bulkActionsManager;
    window.collectionsManager = collectionsManager;
    window.collectionsView = collectionsView;
    window.knowledgeProcessor = knowledgeProcessor;
    window.knowledgeView = knowledgeView;
    
    console.log('Managers created, initializing...');
    
    // Initialize managers
    window.navigationManager.init();
    window.captureManager.init();
    window.enhancedSwipeManager.init();
    window.readerManager.init();
    window.contextDetectionManager.init();
    window.searchManager.init();
    window.insightsTracker.init();
    window.insightsManager.init();
    window.backgroundSummaryManager.init();
    window.bulkActionsManager.init();
    window.collectionsManager.init();
    window.collectionsView.init();
    window.knowledgeProcessor.init();
    window.knowledgeView.init();

    console.log('Managers initialized, creating app...');
    
    // Then initialize the app
    window.appManager = new AppManager();
    
    console.log('App initialized successfully!');

    // Force icon initialization with multiple attempts
    window.appManager.ensureLucideIcons();
  } catch (error) {
    console.error('Error initializing app:', error);
    console.error('Stack:', error.stack);
  }
}

// Try multiple initialization strategies
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded event fired');
  initializeApp();
});

// Also try on window load
window.addEventListener('load', () => {
  console.log('Window load event fired');
  if (!window.appManager) {
    console.log('App not initialized yet, trying again...');
    initializeApp();
  }
});

// Fallback: Try after a delay if still not initialized
setTimeout(() => {
  if (!window.appManager) {
    console.log('App still not initialized after 2s, forcing initialization...');
    initializeApp();
  }
}, 2000);

// Global test function for debugging
window.testApp = function() {
  console.log('Testing app status...');
  console.log('- appManager exists:', !!window.appManager);
  console.log('- dataManager exists:', !!window.dataManager);
  console.log('- lucide exists:', !!window.lucide);

  if (window.lucide) {
    console.log('Forcing icon creation...');
    lucide.createIcons();
  }

  if (window.appManager) {
    console.log('Adding demo content...');
    window.appManager.addEnhancedDemoItems();
  } else {
    console.log('App not initialized!');
  }

  return 'Test complete - check console for details';
};
