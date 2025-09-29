// Item rendering and management
class ItemManager {
  constructor() {
    this.categoryIcons = {
      work: 'briefcase',
      life: 'heart',
      inspiration: 'sparkles'
    };

    this.categoryColors = {
      work: 'cyan',
      life: 'emerald',
      inspiration: 'purple'
    };

    // Enhanced mode with card factory
    this.enhancedMode = false;
    this.cardFactory = null;
    this.initializeEnhancedCards();
  }

  // Initialize enhanced card system
  initializeEnhancedCards() {
    try {
      if (typeof CardFactory !== 'undefined') {
        this.cardFactory = new CardFactory();
        this.enhancedMode = true;
        console.log('Enhanced card rendering activated');
      }
    } catch (error) {
      console.warn('Enhanced cards not available, using basic rendering:', error.message);
      this.enhancedMode = false;
    }
  }

  // Initialize Lucide icons
  initializeLucideIcons() {
    try {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    } catch (error) {
      console.warn('Lucide icons initialization failed:', error);
    }
  }

  // Render items in a container
  renderItems(container, items, type = 'library') {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (items.length === 0) {
      this.renderEmptyState(container, type);
      return;
    }
    
    items.forEach(item => {
      const itemElement = this.createItemElement(item, type);
      container.appendChild(itemElement);
    });

    // Initialize Lucide icons for newly rendered content
    this.initializeLucideIcons();
  }

  // Create individual item element
  createItemElement(item, type) {
    const div = document.createElement('div');

    // Use enhanced cards if available
    if (this.enhancedMode && this.cardFactory) {
      return this.createEnhancedItemElement(item, type);
    }

    // Fallback to original rendering
    if (type === 'inbox') {
      div.className = 'swipe-item group relative rounded-xl overflow-hidden';
      div.dataset.id = item.id;
      div.innerHTML = this.createInboxItemHTML(item);
      this.setupSwipeGestures(div, item);
    } else {
      div.className = 'lib-item rounded-xl bg-white/5 ring-1 ring-white/10 p-3';
      div.dataset.id = item.id;
      div.dataset.cat = item.category;
      div.innerHTML = this.createLibraryItemHTML(item);
    }

    return div;
  }

  // Create enhanced item element using card factory
  createEnhancedItemElement(item, type) {
    const div = document.createElement('div');

    if (type === 'inbox') {
      // For inbox items, wrap the enhanced card in swipe container
      div.className = 'swipe-item group relative rounded-xl overflow-hidden';
      div.dataset.id = item.id;

      const enhancedCard = this.cardFactory.createCard(item, { containerType: 'inbox' });

      div.innerHTML = `
        <!-- Swipe indicators -->
        <div class="swipe-indicators absolute inset-0 flex items-center justify-between px-4 pointer-events-none z-10">
          <div class="flex items-center gap-2 opacity-0 group-[.swiping-right]:opacity-100 transition-all duration-200 transform group-[.swiping-right]:translate-x-2">
            <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <i data-lucide="tag" class="w-4 h-4 text-emerald-300"></i>
            </div>
            <span class="text-[12px] font-medium text-emerald-300">Categorize</span>
          </div>
          <div class="flex items-center gap-2 opacity-0 group-[.swiping-left]:opacity-100 transition-all duration-200 transform group-[.swiping-left]:-translate-x-2">
            <span class="text-[12px] font-medium text-rose-300">Archive</span>
            <div class="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
              <i data-lucide="trash-2" class="w-4 h-4 text-rose-300"></i>
            </div>
          </div>
        </div>

        <!-- Enhanced card content -->
        <div class="card-content relative">
          ${enhancedCard}
        </div>
      `;

      this.setupSwipeGestures(div, item);
    } else {
      // For library items, use enhanced card directly
      div.innerHTML = this.cardFactory.createCard(item, { containerType: 'library' });
      div.dataset.id = item.id;
      div.dataset.cat = item.category;
    }

    // Setup enhanced event listeners for new action buttons
    this.setupEnhancedEventListeners(div, item);

    return div;
  }

  // Setup event listeners for enhanced card actions
  setupEnhancedEventListeners(element, item) {
    // Task completion checkbox
    const taskCompleteBtn = element.querySelector('.task-complete-btn');
    if (taskCompleteBtn) {
      taskCompleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleTaskComplete(item.id);
      });
    }

    // Action buttons
    const actionButtons = element.querySelectorAll('[data-action]');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = button.getAttribute('data-action');
        const itemId = button.getAttribute('data-item-id');
        this.handleEnhancedAction(action, itemId, item);
      });
    });

    // Card click to open/read
    const cardElement = element.querySelector('.card-item');
    if (cardElement) {
      cardElement.addEventListener('click', () => {
        this.handleItemClick(item);
      });
    }
  }

  // Handle enhanced action buttons
  handleEnhancedAction(action, itemId, item) {
    console.log(`Enhanced action: ${action} for item ${itemId}`);

    switch (action) {
      case 'read':
        this.openReader(item);
        break;
      case 'reply':
        this.handleEmailReply(itemId);
        break;
      case 'archive':
        this.archiveItem(itemId);
        break;
      case 'rsvp-yes':
        this.handleEventRSVP(itemId, 'accepted');
        break;
      case 'rsvp-maybe':
        this.handleEventRSVP(itemId, 'tentative');
        break;
      case 'add-calendar':
        this.addEventToCalendar(itemId);
        break;
      case 'directions':
        this.getDirections(item);
        break;
      case 'start-task':
        this.startTask(itemId);
        break;
      case 'schedule-task':
        this.scheduleTask(itemId);
        break;
      case 'bookmark':
        this.toggleBookmark(itemId);
        break;
      case 'open-email':
        this.openEmailExternal(item);
        break;
      case 'show-connections':
        this.showKnowledgeConnections(itemId);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }

    // Track action for analytics
    if (window.contextDetectionManager) {
      window.contextDetectionManager.trackAction(action, itemId);
    }
  }

  // Enhanced action handlers
  handleTaskComplete(itemId) {
    if (dataManager.completeTask(itemId)) {
      this.showFeedback('Task completed!', 'success');
      this.refreshCurrentView();
    }
  }

  handleEmailReply(itemId) {
    if (dataManager.markEmailReplied(itemId)) {
      this.showFeedback('Marked as replied', 'success');
      this.refreshCurrentView();
    }
  }

  handleEventRSVP(itemId, status) {
    if (dataManager.updateEventRSVP(itemId, status)) {
      this.showFeedback(`RSVP: ${status}`, 'success');
      this.refreshCurrentView();
    }
  }

  addEventToCalendar(itemId) {
    const item = dataManager.getItem(itemId);
    if (item && item.type === 'event') {
      // Create calendar event URL (Google Calendar format)
      const eventDate = item.typeData.eventDate;
      const eventTime = item.typeData.eventTime || '00:00';
      const endTime = item.typeData.endTime || '01:00';

      const startDateTime = `${eventDate}T${eventTime}:00`;
      const endDateTime = `${eventDate}T${endTime}:00`;

      const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.title)}&dates=${startDateTime.replace(/[-:]/g, '')}/${endDateTime.replace(/[-:]/g, '')}&location=${encodeURIComponent(item.typeData.location || '')}&details=${encodeURIComponent(item.content || '')}`;

      window.open(calendarUrl, '_blank');
      this.showFeedback('Opening calendar...', 'info');
    }
  }

  getDirections(item) {
    if (item.typeData?.location) {
      const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(item.typeData.location)}`;
      window.open(mapsUrl, '_blank');
      this.showFeedback('Opening directions...', 'info');
    }
  }

  startTask(itemId) {
    dataManager.updateTypeData(itemId, { status: 'in-progress' });
    this.showFeedback('Task started!', 'success');
    this.refreshCurrentView();
  }

  scheduleTask(itemId) {
    // For now, just show a message. In the future, integrate with calendar
    this.showFeedback('Task scheduling coming soon!', 'info');
  }

  openEmailExternal(item) {
    if (item.typeData?.senderEmail) {
      const mailtoUrl = `mailto:${item.typeData.senderEmail}?subject=Re: ${encodeURIComponent(item.typeData.subject)}`;
      window.location.href = mailtoUrl;
    }
  }

  showKnowledgeConnections(itemId) {
    if (window.knowledgeView) {
      // Dispatch event to show knowledge connections
      document.dispatchEvent(new CustomEvent('showKnowledgeConnections', {
        detail: { itemId }
      }));
    } else {
      console.warn('Knowledge view not available');
    }
  }

  archiveItem(itemId) {
    if (dataManager.moveItem(itemId, 'library')) {
      this.showFeedback('Item archived', 'success');
      this.refreshCurrentView();
    }
  }

  toggleBookmark(itemId) {
    const item = dataManager.getItem(itemId);
    if (item) {
      dataManager.updateItem(itemId, { bookmarked: !item.bookmarked });
      this.showFeedback(item.bookmarked ? 'Bookmark removed' : 'Bookmarked!', 'success');
    }
  }

  handleItemClick(item) {
    if (item.type === 'article' && item.url) {
      this.openReader(item);
    } else if (item.type === 'email') {
      this.openEmailExternal(item);
    } else if (item.type === 'event') {
      this.addEventToCalendar(item.id);
    } else if (item.type === 'task') {
      this.startTask(item.id);
    }
  }

  openReader(item) {
    if (window.readerManager) {
      window.readerManager.openArticle(item.url, item.title);
    }
  }

  showFeedback(message, type = 'info') {
    // Create and show a feedback toast
    const toast = document.createElement('div');
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      type === 'success' ? 'bg-green-500/90 text-white' :
      type === 'error' ? 'bg-red-500/90 text-white' :
      'bg-slate-800/90 text-slate-200'
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  refreshCurrentView() {
    // Trigger a refresh of the current view
    if (window.navigationManager) {
      window.navigationManager.refreshCurrentScreen();
    }
  }

  // Create inbox item HTML
  createInboxItemHTML(item) {
    const icon = this.getCategoryIcon(item.category);
    const timeAgo = this.getTimeAgo(item.createdAt);
    
    return `
      <!-- Swipe indicators with enhanced visuals -->
      <div class="swipe-indicators absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
        <div class="flex items-center gap-2 opacity-0 group-[.swiping-right]:opacity-100 transition-all duration-200 transform group-[.swiping-right]:translate-x-2">
          <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <i data-lucide="tag" class="w-4 h-4 text-emerald-300"></i>
          </div>
          <span class="text-[12px] font-medium text-emerald-300">Categorize</span>
        </div>
        <div class="flex items-center gap-2 opacity-0 group-[.swiping-left]:opacity-100 transition-all duration-200 transform group-[.swiping-left]:-translate-x-2">
          <span class="text-[12px] font-medium text-rose-300">Archive</span>
          <div class="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
            <i data-lucide="trash-2" class="w-4 h-4 text-rose-300"></i>
          </div>
        </div>
      </div>
      
      <!-- Card content with enhanced styling -->
      <div class="card-content relative bg-white/5 ring-1 ring-white/10 p-3 transition-all duration-200 ease-out cursor-pointer hover:bg-white/[0.08] hover:ring-white/20">
        <div class="flex items-start gap-3">
          <div class="shrink-0">
            <div class="w-8 h-8 rounded-md bg-slate-900 ring-1 ring-white/10 flex items-center justify-center">
              <i data-lucide="${icon}" class="w-4 h-4 text-slate-300"></i>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <button class="inbox-tag inline-flex items-center gap-1.5 text-[11px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10 transition-colors">
                <i data-lucide="tag" class="w-3.5 h-3.5"></i> ${this.capitalizeFirst(item.category)}
              </button>
              <span class="text-[11px] text-slate-400 flex items-center gap-1">
                <i data-lucide="clock" class="w-3.5 h-3.5"></i>${timeAgo}
              </span>
            </div>
            <h3 class="text-[15px] font-medium tracking-tight text-slate-100 truncate">${this.escapeHtml(item.title)}</h3>
            <p class="text-[13px] text-slate-400 line-clamp-2">${this.escapeHtml(item.content || 'No description')}</p>
          </div>
        </div>
      </div>
    `;
  }

  // Create library item HTML
  createLibraryItemHTML(item) {
    const icon = this.getCategoryIcon(item.category);
    const timeAgo = this.getTimeAgo(item.createdAt);
    const progress = Math.round(item.progress * 100);
    
    return `
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-md bg-slate-900 ring-1 ring-white/10 flex items-center justify-center">
          <i data-lucide="${icon}" class="w-4 h-4 text-slate-300"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[11px] px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">${this.capitalizeFirst(item.category)}</span>
            <span class="text-[11px] text-slate-400">${timeAgo}</span>
            ${item.progress > 0 ? `<span class="text-[11px] text-slate-500">${progress}% through</span>` : ''}
          </div>
          <h3 class="text-[15px] font-medium tracking-tight text-slate-100 truncate">${this.escapeHtml(item.title)}</h3>
          <p class="text-[13px] text-slate-400 line-clamp-2">${this.escapeHtml(item.content || 'No description')}</p>
          ${item.url ? `
            <div class="mt-2">
              <a href="${item.url}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-[12px] text-cyan-300 hover:text-cyan-200">
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                Open link
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Setup swipe gestures for inbox items
  setupSwipeGestures(element, item) {
    // Use enhanced swipe manager if available
    if (window.enhancedSwipeManager) {
      window.enhancedSwipeManager.setupEnhancedSwipeGestures(element, item);
    } else {
      // Fallback to basic swipe
      this.setupBasicSwipeGestures(element, item);
    }
  }

  // Basic swipe gestures fallback
  setupBasicSwipeGestures(element, item) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let startTime = 0;
    
    const cardContent = element.querySelector('.card-content');
    
    element.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startTime = Date.now();
      isDragging = true;
      element.classList.add('swiping');
    });
    
    element.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      currentX = e.touches[0].clientX - startX;
      const threshold = 100;
      
      if (Math.abs(currentX) > threshold) {
        if (currentX > 0) {
          element.classList.add('swiping-right');
          element.classList.remove('swiping-left');
        } else {
          element.classList.add('swiping-left');
          element.classList.remove('swiping-right');
        }
      } else {
        element.classList.remove('swiping-right', 'swiping-left');
      }
      
      cardContent.style.transform = `translateX(${currentX * 0.3}px)`;
    });
    
    element.addEventListener('touchend', () => {
      if (!isDragging) return;
      
      isDragging = false;
      element.classList.remove('swiping');
      
      const threshold = 100;
      const duration = Date.now() - startTime;
      
      if (Math.abs(currentX) > threshold && duration < 500) {
        if (currentX > 0) {
          // Swipe right - categorize
          this.showCategoryMenu(element, item);
        } else {
          // Swipe left - archive
          this.archiveItem(item.id);
        }
      }
      
      // Reset
      element.classList.remove('swiping-right', 'swiping-left');
      cardContent.style.transform = '';
      currentX = 0;
    });
  }

  // Show category selection menu
  showCategoryMenu(element, item) {
    // Implementation for category menu would go here
    // For now, just move to library
    if (window.dataManager) {
      window.dataManager.moveItem(item.id, 'library');
      if (window.navigationManager) {
        window.navigationManager.onScreenChange('inbox');
      }
    }
  }

  // Archive item
  archiveItem(id) {
    if (window.dataManager) {
      window.dataManager.moveItem(id, 'archived');
      if (window.navigationManager) {
        window.navigationManager.onScreenChange('inbox');
      }
    }
  }

  // Render empty state
  renderEmptyState(container, type) {
    const emptyStateId = type === 'inbox' ? 'inboxEmpty' : 'libraryEmpty';
    const emptyState = document.getElementById(emptyStateId);
    
    if (emptyState) {
      emptyState.classList.remove('hidden');
    }
  }

  // Utility functions
  getCategoryIcon(category) {
    return this.categoryIcons[category] || 'file-text';
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
const itemManager = new ItemManager();
