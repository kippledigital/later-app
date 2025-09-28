// Intelligent bulk actions manager - Effortless multi-item processing
class BulkActionsManager {
  constructor() {
    this.isMultiSelectMode = false;
    this.selectedItems = new Set();
    this.lastAction = null;
    this.undoTimeout = null;
    this.gestureState = {
      isLongPressing: false,
      longPressTimer: null,
      dragStartItem: null,
      isDragging: false
    };
  }

  init() {
    this.setupEventListeners();
    this.setupGestureHandlers();
    this.initializeUI();
    this.startCleanupMonitoring();
  }

  setupEventListeners() {
    // Smart select buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-smart-select]')) {
        this.handleSmartSelect(e.target.dataset.smartSelect);
      }

      if (e.target.matches('[data-batch-action]')) {
        this.handleBatchAction(e.target.dataset.batchAction);
      }

      if (e.target.id === 'exitMultiSelect') {
        this.exitMultiSelectMode();
      }

      if (e.target.id === 'selectAll') {
        this.selectAllVisibleItems();
      }

      if (e.target.id === 'undoLastAction') {
        this.undoLastAction();
      }
    });

    // Item selection in multi-select mode
    document.addEventListener('click', (e) => {
      if (this.isMultiSelectMode && e.target.closest('[data-id]')) {
        e.preventDefault();
        e.stopPropagation();
        const itemElement = e.target.closest('[data-id]');
        this.toggleItemSelection(itemElement.dataset.id, itemElement);
      }
    });

    // Escape key to exit multi-select
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMultiSelectMode) {
        this.exitMultiSelectMode();
      }
    });
  }

  setupGestureHandlers() {
    let touchStartTime = 0;
    let touchStartElement = null;

    // Long press to enter multi-select
    document.addEventListener('touchstart', (e) => {
      if (e.target.closest('[data-id]') && !this.isMultiSelectMode) {
        touchStartTime = Date.now();
        touchStartElement = e.target.closest('[data-id]');

        this.gestureState.longPressTimer = setTimeout(() => {
          this.enterMultiSelectMode();
          this.toggleItemSelection(touchStartElement.dataset.id, touchStartElement);

          // Haptic feedback
          if (window.pwaManager) {
            window.pwaManager.triggerHapticFeedback('selection');
          }
        }, 500); // 500ms long press
      }
    });

    document.addEventListener('touchend', (e) => {
      if (this.gestureState.longPressTimer) {
        clearTimeout(this.gestureState.longPressTimer);
        this.gestureState.longPressTimer = null;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (this.gestureState.longPressTimer) {
        clearTimeout(this.gestureState.longPressTimer);
        this.gestureState.longPressTimer = null;
      }

      // Drag to select multiple items in multi-select mode
      if (this.isMultiSelectMode && e.touches.length === 1) {
        const touch = e.touches[0];
        const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
        const itemElement = elementUnderTouch?.closest('[data-id]');

        if (itemElement && !this.selectedItems.has(itemElement.dataset.id)) {
          this.toggleItemSelection(itemElement.dataset.id, itemElement);
        }
      }
    });

    // Two-finger swipe for batch actions
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2 && this.selectedItems.size > 0) {
        this.gestureState.twoFingerStart = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
      }
    });

    document.addEventListener('touchend', (e) => {
      if (this.gestureState.twoFingerStart && e.changedTouches.length === 2) {
        const endX = (e.changedTouches[0].clientX + e.changedTouches[1].clientX) / 2;
        const deltaX = endX - this.gestureState.twoFingerStart.x;

        if (Math.abs(deltaX) > 100) { // Minimum swipe distance
          if (deltaX > 0) {
            this.showBatchActionsMenu('right');
          } else {
            this.showBatchActionsMenu('left');
          }
        }

        this.gestureState.twoFingerStart = null;
      }
    });
  }

  initializeUI() {
    this.createMultiSelectUI();
    this.createBatchActionsMenu();
    this.createUndoToast();
  }

  // Smart selection methods
  handleSmartSelect(type) {
    if (!this.isMultiSelectMode) {
      this.enterMultiSelectMode();
    }

    this.clearSelection();

    const currentScreen = window.navigationManager.getCurrentScreen();
    const items = this.getVisibleItems(currentScreen);
    let selectedItems = [];

    switch (type) {
      case 'work-items':
        selectedItems = items.filter(item => item.category === 'work');
        break;
      case 'today-items':
        const today = new Date().toDateString();
        selectedItems = items.filter(item =>
          new Date(item.createdAt).toDateString() === today
        );
        break;
      case 'quick-tasks':
        selectedItems = items.filter(item =>
          item.estimatedDuration && item.estimatedDuration <= 5
        );
        break;
      case 'unread-articles':
        selectedItems = items.filter(item =>
          item.type === 'article' && item.progress < 0.1
        );
        break;
      case 'old-items':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        selectedItems = items.filter(item =>
          new Date(item.createdAt) < weekAgo
        );
        break;
    }

    selectedItems.forEach(item => {
      this.selectedItems.add(item.id);
      this.updateItemVisualState(item.id, true);
    });

    this.updateSelectionCount();
    this.showSmartSelectionFeedback(type, selectedItems.length);
  }

  // Intelligent batch actions
  handleBatchAction(action) {
    if (this.selectedItems.size === 0) return;

    const selectedItemsArray = Array.from(this.selectedItems).map(id =>
      window.dataManager.getItem(id)
    );

    let actionDescription = '';
    let undoData = [];

    switch (action) {
      case 'move-to-library':
        selectedItemsArray.forEach(item => {
          if (item && item.state !== 'library') {
            undoData.push({ id: item.id, oldState: item.state, newState: 'library' });
            window.dataManager.moveItem(item.id, 'library');
          }
        });
        actionDescription = `Moved ${undoData.length} items to Library`;
        break;

      case 'archive-all':
        selectedItemsArray.forEach(item => {
          if (item && item.state !== 'archived') {
            undoData.push({ id: item.id, oldState: item.state, newState: 'archived' });
            window.dataManager.moveItem(item.id, 'archived');
          }
        });
        actionDescription = `Archived ${undoData.length} items`;
        break;

      case 'tag-as-inspiration':
        selectedItemsArray.forEach(item => {
          if (item && item.category !== 'inspiration') {
            undoData.push({ id: item.id, oldCategory: item.category, newCategory: 'inspiration' });
            window.dataManager.updateItemCategory(item.id, 'inspiration');
          }
        });
        actionDescription = `Tagged ${undoData.length} items as Inspiration`;
        break;

      case 'mark-as-read':
        selectedItemsArray.forEach(item => {
          if (item && item.progress < 1) {
            undoData.push({ id: item.id, oldProgress: item.progress, newProgress: 1 });
            window.dataManager.updateItemProgress(item.id, 1);
          }
        });
        actionDescription = `Marked ${undoData.length} items as read`;
        break;

      case 'smart-scheduling':
        this.handleSmartScheduling(selectedItemsArray);
        actionDescription = `Scheduled ${selectedItemsArray.length} items intelligently`;
        break;
    }

    if (undoData.length > 0) {
      this.saveUndoAction(action, undoData, actionDescription);
      this.showUndoToast(actionDescription);
    }

    this.exitMultiSelectMode();
    this.refreshCurrentScreen();
  }

  handleSmartScheduling(items) {
    const now = new Date();
    const workHours = this.getNextWorkHours();
    const readingTime = this.getNextReadingTime();

    items.forEach(item => {
      let scheduledTime = null;

      if (item.category === 'work' && item.estimatedDuration <= 30) {
        scheduledTime = workHours;
      } else if (item.type === 'article') {
        scheduledTime = readingTime;
      } else {
        // Default to next available slot
        scheduledTime = this.getNextAvailableSlot();
      }

      if (scheduledTime) {
        window.dataManager.updateItemMetadata(item.id, {
          scheduledFor: scheduledTime.toISOString()
        });
      }
    });
  }

  // Smart cleanup suggestions
  generateCleanupSuggestions() {
    const allItems = window.dataManager.getAllItems();
    const suggestions = [];

    // Old articles suggestion
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oldArticles = allItems.filter(item =>
      item.type === 'article' &&
      item.state === 'inbox' &&
      new Date(item.createdAt) < weekAgo &&
      item.progress < 0.1
    );

    if (oldArticles.length >= 3) {
      suggestions.push({
        id: 'archive-old-articles',
        title: `Archive ${oldArticles.length} old articles?`,
        description: 'These articles have been in your inbox for over a week',
        items: oldArticles,
        action: 'archive-all',
        icon: 'archive',
        confidence: 'high'
      });
    }

    // Duplicate or similar content
    const groupedBySite = this.groupItemsBySite(allItems);
    Object.entries(groupedBySite).forEach(([site, items]) => {
      if (items.length >= 3) {
        suggestions.push({
          id: `collection-${site}`,
          title: `Create collection for ${site}?`,
          description: `You have ${items.length} items from the same source`,
          items: items,
          action: 'create-collection',
          icon: 'folder',
          confidence: 'medium'
        });
      }
    });

    // Completed items in inbox
    const completedInInbox = allItems.filter(item =>
      item.state === 'inbox' && item.progress >= 1
    );

    if (completedInInbox.length >= 2) {
      suggestions.push({
        id: 'move-completed',
        title: `Move ${completedInInbox.length} completed items to Library?`,
        description: 'These items are done and ready to be organized',
        items: completedInInbox,
        action: 'move-to-library',
        icon: 'check-circle',
        confidence: 'high'
      });
    }

    return suggestions;
  }

  showCleanupSuggestions() {
    const suggestions = this.generateCleanupSuggestions();

    if (suggestions.length === 0) return;

    // Show suggestion in a gentle notification
    const suggestionHTML = this.createCleanupSuggestionUI(suggestions[0]);
    this.displayCleanupSuggestion(suggestionHTML);
  }

  createCleanupSuggestionUI(suggestion) {
    const suggestionHTML = `
      <div id="cleanupSuggestion" class="fixed top-4 left-4 right-4 z-[60] bg-slate-900/95 backdrop-blur rounded-xl ring-1 ring-white/10 p-4 shadow-2xl opacity-0 translate-y-[-10px] transition-all duration-300">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20 flex items-center justify-center shrink-0">
            <i data-lucide="${suggestion.icon}" class="w-5 h-5 text-cyan-300"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-[15px] font-medium text-slate-100 mb-1">${suggestion.title}</h3>
            <p class="text-[13px] text-slate-400 leading-relaxed mb-3">${suggestion.description}</p>
            <div class="flex items-center gap-2">
              <button onclick="window.bulkActionsManager.acceptCleanupSuggestion('${suggestion.id}')" class="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-500/25 transition-colors">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                Yes, do it
              </button>
              <button onclick="window.bulkActionsManager.dismissCleanupSuggestion()" class="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10 transition-colors">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                Not now
              </button>
            </div>
          </div>
          <button onclick="window.bulkActionsManager.dismissCleanupSuggestion()" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
            <i data-lucide="x" class="w-4 h-4 text-slate-300"></i>
          </button>
        </div>
      </div>
    `;

    return suggestionHTML;
  }

  displayCleanupSuggestion(suggestionHTML) {
    // Remove any existing suggestion
    const existing = document.getElementById('cleanupSuggestion');
    if (existing) {
      existing.remove();
    }

    // Add new suggestion
    document.body.insertAdjacentHTML('beforeend', suggestionHTML);

    // Animate in
    requestAnimationFrame(() => {
      const suggestion = document.getElementById('cleanupSuggestion');
      if (suggestion) {
        suggestion.style.opacity = '1';
        suggestion.style.transform = 'translateY(0)';

        // Initialize icons
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    });
  }

  acceptCleanupSuggestion(suggestionId) {
    const suggestions = this.generateCleanupSuggestions();
    const suggestion = suggestions.find(s => s.id === suggestionId);

    if (!suggestion) {
      this.dismissCleanupSuggestion();
      return;
    }

    // Perform the suggested action
    this.selectedItems.clear();
    suggestion.items.forEach(item => {
      this.selectedItems.add(item.id);
    });

    this.handleBatchAction(suggestion.action);
    this.dismissCleanupSuggestion();

    // Track the acceptance
    if (window.insightsTracker) {
      window.insightsTracker.trackInteraction('cleanup_suggestion_accepted', suggestionId);
    }
  }

  dismissCleanupSuggestion() {
    const suggestion = document.getElementById('cleanupSuggestion');
    if (suggestion) {
      suggestion.style.opacity = '0';
      suggestion.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (suggestion.parentNode) {
          suggestion.parentNode.removeChild(suggestion);
        }
      }, 300);
    }

    // Track dismissal
    if (window.insightsTracker) {
      window.insightsTracker.trackInteraction('cleanup_suggestion_dismissed');
    }
  }

  // Method to periodically check for cleanup suggestions
  startCleanupMonitoring() {
    // Check for cleanup suggestions every 5 minutes
    setInterval(() => {
      this.checkAndShowCleanupSuggestions();
    }, 5 * 60 * 1000);

    // Also check when new items are added
    document.addEventListener('itemSaved', () => {
      setTimeout(() => {
        this.checkAndShowCleanupSuggestions();
      }, 2000); // Delay to allow for processing
    });
  }

  checkAndShowCleanupSuggestions() {
    // Don't show suggestions if already in multi-select mode or if there's already a suggestion
    if (this.isMultiSelectMode || document.getElementById('cleanupSuggestion')) {
      return;
    }

    const suggestions = this.generateCleanupSuggestions();
    if (suggestions.length > 0) {
      // Show the highest confidence suggestion
      const topSuggestion = suggestions.sort((a, b) => {
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      })[0];

      const suggestionHTML = this.createCleanupSuggestionUI(topSuggestion);
      this.displayCleanupSuggestion(suggestionHTML);
    }
  }

  // Multi-select mode management
  enterMultiSelectMode() {
    if (this.isMultiSelectMode) return;

    this.isMultiSelectMode = true;
    document.body.classList.add('multi-select-mode');

    // Show multi-select UI
    const multiSelectBar = document.getElementById('multiSelectBar');
    if (multiSelectBar) {
      multiSelectBar.classList.remove('hidden');
      multiSelectBar.style.transform = 'translateY(0)';
    }

    // Update navigation to show smart select options
    this.showSmartSelectOptions();

    // Track interaction
    if (window.insightsTracker) {
      window.insightsTracker.trackInteraction('multi_select_entered');
    }
  }

  exitMultiSelectMode() {
    if (!this.isMultiSelectMode) return;

    this.isMultiSelectMode = false;
    this.clearSelection();
    document.body.classList.remove('multi-select-mode');

    // Hide multi-select UI
    const multiSelectBar = document.getElementById('multiSelectBar');
    if (multiSelectBar) {
      multiSelectBar.style.transform = 'translateY(100%)';
      setTimeout(() => multiSelectBar.classList.add('hidden'), 300);
    }

    this.hideSmartSelectOptions();
  }

  toggleItemSelection(itemId, itemElement) {
    if (this.selectedItems.has(itemId)) {
      this.selectedItems.delete(itemId);
      this.updateItemVisualState(itemId, false);
    } else {
      this.selectedItems.add(itemId);
      this.updateItemVisualState(itemId, true);
    }

    this.updateSelectionCount();
    this.updateBatchActionsAvailability();
  }

  updateItemVisualState(itemId, selected) {
    const itemElement = document.querySelector(`[data-id="${itemId}"]`);
    if (!itemElement) return;

    if (selected) {
      itemElement.classList.add('selected');
      // Add selection indicator
      if (!itemElement.querySelector('.selection-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'selection-indicator absolute top-2 right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center ring-2 ring-white transition-all duration-200';
        indicator.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-white"></i>';
        itemElement.style.position = 'relative';
        itemElement.appendChild(indicator);

        // Initialize icon
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    } else {
      itemElement.classList.remove('selected');
      const indicator = itemElement.querySelector('.selection-indicator');
      if (indicator) {
        indicator.remove();
      }
    }
  }

  clearSelection() {
    this.selectedItems.forEach(itemId => {
      this.updateItemVisualState(itemId, false);
    });
    this.selectedItems.clear();
    this.updateSelectionCount();
  }

  updateSelectionCount() {
    const countElement = document.getElementById('selectionCount');
    if (countElement) {
      countElement.textContent = this.selectedItems.size;
    }
  }

  // Undo system
  saveUndoAction(actionType, data, description) {
    this.lastAction = {
      type: actionType,
      data: data,
      description: description,
      timestamp: Date.now()
    };
  }

  undoLastAction() {
    if (!this.lastAction) return;

    const { type, data } = this.lastAction;

    data.forEach(change => {
      switch (type) {
        case 'move-to-library':
        case 'archive-all':
          window.dataManager.moveItem(change.id, change.oldState);
          break;
        case 'tag-as-inspiration':
          window.dataManager.updateItemCategory(change.id, change.oldCategory);
          break;
        case 'mark-as-read':
          window.dataManager.updateItemProgress(change.id, change.oldProgress);
          break;
      }
    });

    this.hideUndoToast();
    this.lastAction = null;
    this.refreshCurrentScreen();

    this.showFeedback('Action undone', 'success');
  }

  showUndoToast(message) {
    const toast = document.getElementById('undoToast');
    const messageEl = document.getElementById('undoMessage');

    if (toast && messageEl) {
      messageEl.textContent = message;
      toast.classList.remove('hidden');
      toast.style.transform = 'translateY(0)';

      // Auto-hide after 5 seconds
      this.undoTimeout = setTimeout(() => {
        this.hideUndoToast();
      }, 5000);
    }
  }

  hideUndoToast() {
    const toast = document.getElementById('undoToast');
    if (toast) {
      toast.style.transform = 'translateY(100%)';
      setTimeout(() => toast.classList.add('hidden'), 300);
    }

    if (this.undoTimeout) {
      clearTimeout(this.undoTimeout);
      this.undoTimeout = null;
    }
  }

  // UI Creation methods
  createMultiSelectUI() {
    if (document.getElementById('multiSelectBar')) return;

    const multiSelectHTML = `
      <div id="multiSelectBar" class="hidden fixed bottom-20 left-4 right-4 z-40 bg-slate-900/95 backdrop-blur rounded-2xl ring-1 ring-white/10 p-4 transform translate-y-full transition-transform duration-300">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20 flex items-center justify-center">
              <span id="selectionCount" class="text-[14px] font-medium text-cyan-300">0</span>
            </div>
            <span class="text-[15px] font-medium text-slate-200">items selected</span>
          </div>
          <button id="exitMultiSelect" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
            <i data-lucide="x" class="w-4 h-4 text-slate-300"></i>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button data-batch-action="move-to-library" class="inline-flex items-center justify-center gap-2 text-[13px] px-3 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-500/25 transition-colors">
            <i data-lucide="bookmark" class="w-4 h-4"></i>
            To Library
          </button>
          <button data-batch-action="archive-all" class="inline-flex items-center justify-center gap-2 text-[13px] px-3 py-2 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 ring-1 ring-orange-500/25 transition-colors">
            <i data-lucide="archive" class="w-4 h-4"></i>
            Archive
          </button>
          <button data-batch-action="tag-as-inspiration" class="inline-flex items-center justify-center gap-2 text-[13px] px-3 py-2 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 ring-1 ring-purple-500/25 transition-colors">
            <i data-lucide="sparkles" class="w-4 h-4"></i>
            Inspiration
          </button>
          <button data-batch-action="mark-as-read" class="inline-flex items-center justify-center gap-2 text-[13px] px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/25 transition-colors">
            <i data-lucide="check" class="w-4 h-4"></i>
            Mark Read
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', multiSelectHTML);
  }

  createUndoToast() {
    if (document.getElementById('undoToast')) return;

    const undoHTML = `
      <div id="undoToast" class="hidden fixed bottom-4 left-4 right-4 z-50 bg-slate-800/95 backdrop-blur rounded-xl ring-1 ring-white/10 p-4 transform translate-y-full transition-transform duration-300">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center">
              <i data-lucide="check" class="w-4 h-4 text-emerald-300"></i>
            </div>
            <span id="undoMessage" class="text-[14px] text-slate-200">Action completed</span>
          </div>
          <button id="undoLastAction" class="inline-flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-500/25 transition-colors">
            <i data-lucide="undo" class="w-3.5 h-3.5"></i>
            Undo
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', undoHTML);
  }

  // Helper methods
  getVisibleItems(screen) {
    switch (screen) {
      case 'inbox':
        return window.dataManager.getItems('inbox');
      case 'library':
        return window.dataManager.getItems('library');
      default:
        return window.dataManager.getAllItems();
    }
  }

  groupItemsBySite(items) {
    const groups = {};
    items.forEach(item => {
      if (item.url) {
        try {
          const domain = new URL(item.url).hostname.replace('www.', '');
          if (!groups[domain]) groups[domain] = [];
          groups[domain].push(item);
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });
    return groups;
  }

  refreshCurrentScreen() {
    const currentScreen = window.navigationManager.getCurrentScreen();
    window.navigationManager.onScreenChange(currentScreen);
  }

  showFeedback(message, type = 'info') {
    if (window.appManager && window.appManager.showFeedback) {
      window.appManager.showFeedback(message, type);
    }
  }

  getNextWorkHours() {
    const now = new Date();
    const nextWorkDay = new Date(now);

    // If it's weekend, move to Monday
    if (now.getDay() === 0 || now.getDay() === 6) {
      nextWorkDay.setDate(now.getDate() + (1 + (7 - now.getDay())) % 7);
    }

    nextWorkDay.setHours(9, 0, 0, 0); // 9 AM
    return nextWorkDay;
  }

  getNextReadingTime() {
    const now = new Date();
    const tonight = new Date(now);
    tonight.setHours(20, 0, 0, 0); // 8 PM reading time

    if (now > tonight) {
      tonight.setDate(tonight.getDate() + 1);
    }

    return tonight;
  }

  getNextAvailableSlot() {
    const now = new Date();
    const nextSlot = new Date(now);
    nextSlot.setHours(now.getHours() + 1, 0, 0, 0);
    return nextSlot;
  }

  showSmartSelectionFeedback(type, count) {
    const messages = {
      'work-items': `Selected ${count} work items`,
      'today-items': `Selected ${count} items from today`,
      'quick-tasks': `Selected ${count} quick tasks`,
      'unread-articles': `Selected ${count} unread articles`,
      'old-items': `Selected ${count} items older than a week`
    };

    this.showFeedback(messages[type] || `Selected ${count} items`, 'success');
  }

  showSmartSelectOptions() {
    // This would show context-appropriate smart select options
    // Implementation depends on current screen UI structure
  }

  hideSmartSelectOptions() {
    // Hide smart select options when exiting multi-select mode
  }

  updateBatchActionsAvailability() {
    // Enable/disable batch actions based on selection
    const batchButtons = document.querySelectorAll('[data-batch-action]');
    const hasSelection = this.selectedItems.size > 0;

    batchButtons.forEach(button => {
      button.disabled = !hasSelection;
      if (hasSelection) {
        button.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        button.classList.add('opacity-50', 'cursor-not-allowed');
      }
    });
  }
}

// Create global instance
const bulkActionsManager = new BulkActionsManager();