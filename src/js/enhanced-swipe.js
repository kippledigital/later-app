// Enhanced swipe gestures with better UX
class EnhancedSwipeManager {
  constructor() {
    this.swipeThreshold = 80;
    this.confirmationThreshold = 120;
    this.animationDuration = 300;
    this.categoryMenu = null;
    this.confirmationDialog = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.createCategoryMenu();
    this.createConfirmationDialog();
    this.initialized = true;
  }

  // Create category selection menu
  createCategoryMenu() {
    this.categoryMenu = document.createElement('div');
    this.categoryMenu.id = 'categoryMenu';
    this.categoryMenu.className = 'hidden fixed z-[90] min-w-[180px] rounded-lg bg-slate-900/95 backdrop-blur ring-1 ring-white/10 p-1 shadow-2xl';
    this.categoryMenu.innerHTML = `
      <div class="px-2 py-1">
        <p class="text-[11px] text-slate-400">Move to</p>
      </div>
      <button data-cat-option="work" class="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-white/5 text-[13px] text-slate-200">
        <span class="inline-flex w-6 h-6 items-center justify-center rounded bg-cyan-400/10 ring-1 ring-cyan-400/20">
          <i data-lucide="briefcase" class="w-3.5 h-3.5 text-cyan-300"></i>
        </span>
        Work
      </button>
      <button data-cat-option="life" class="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-white/5 text-[13px] text-slate-200">
        <span class="inline-flex w-6 h-6 items-center justify-center rounded bg-emerald-400/10 ring-1 ring-emerald-400/20">
          <i data-lucide="heart" class="w-3.5 h-3.5 text-emerald-300"></i>
        </span>
        Life
      </button>
      <button data-cat-option="inspiration" class="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-white/5 text-[13px] text-slate-200">
        <span class="inline-flex w-6 h-6 items-center justify-center rounded bg-purple-400/10 ring-1 ring-purple-400/20">
          <i data-lucide="sparkles" class="w-3.5 h-3.5 text-purple-300"></i>
        </span>
        Inspiration
      </button>
    `;
    document.body.appendChild(this.categoryMenu);
    this.setupCategoryMenuEvents();
  }

  // Create confirmation dialog
  createConfirmationDialog() {
    this.confirmationDialog = document.createElement('div');
    this.confirmationDialog.id = 'confirmationDialog';
    this.confirmationDialog.className = 'hidden fixed inset-0 z-[100] flex items-center justify-center p-4';
    this.confirmationDialog.innerHTML = `
      <div class="bg-slate-900/95 backdrop-blur rounded-xl ring-1 ring-white/10 p-4 max-w-sm w-full">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-rose-500/10 ring-1 ring-rose-500/20 flex items-center justify-center">
            <i data-lucide="trash-2" class="w-5 h-5 text-rose-300"></i>
          </div>
          <div>
            <h3 class="text-[15px] font-medium text-slate-100">Archive Item</h3>
            <p class="text-[13px] text-slate-400">This will move the item to archived.</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button id="confirmArchive" class="flex-1 inline-flex items-center justify-center gap-1.5 text-[13px] px-3 py-2 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 ring-1 ring-rose-500/25">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
            Archive
          </button>
          <button id="cancelArchive" class="flex-1 inline-flex items-center justify-center gap-1.5 text-[13px] px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10">
            <i data-lucide="x" class="w-4 h-4"></i>
            Cancel
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(this.confirmationDialog);
    this.setupConfirmationEvents();
  }

  setupCategoryMenuEvents() {
    this.categoryMenu.querySelectorAll('[data-cat-option]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.catOption;
        this.handleCategorySelection(category);
      });
    });
  }

  setupConfirmationEvents() {
    document.getElementById('confirmArchive')?.addEventListener('click', () => {
      this.handleArchiveConfirmation();
    });
    
    document.getElementById('cancelArchive')?.addEventListener('click', () => {
      this.hideConfirmationDialog();
    });
    
    this.confirmationDialog.addEventListener('click', (e) => {
      if (e.target === this.confirmationDialog) {
        this.hideConfirmationDialog();
      }
    });
  }

  // Enhanced swipe setup for inbox items
  setupEnhancedSwipeGestures(element, item) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let startTime = 0;
    let hasTriggeredAction = false;
    
    const cardContent = element.querySelector('.card-content');
    const swipeIndicators = element.querySelector('.swipe-indicators');
    
    // Touch events
    element.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startTime = Date.now();
      isDragging = true;
      hasTriggeredAction = false;
      element.classList.add('swiping');
      
      // Add haptic feedback simulation
      this.simulateHapticFeedback('light');
    }, { passive: true });
    
    element.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      currentX = e.touches[0].clientX - startX;
      const progress = Math.min(Math.abs(currentX) / this.swipeThreshold, 1);
      
      // Update visual feedback
      this.updateSwipeVisuals(element, currentX, progress);
      
      // Show appropriate indicators
      if (Math.abs(currentX) > 20) {
        if (currentX > 0) {
          element.classList.add('swiping-right');
          element.classList.remove('swiping-left');
        } else {
          element.classList.add('swiping-left');
          element.classList.remove('swiping-right');
        }
      }
      
    }, { passive: true });
    
    element.addEventListener('touchend', () => {
      if (!isDragging) return;
      
      isDragging = false;
      element.classList.remove('swiping');
      
      const duration = Date.now() - startTime;
      const velocity = Math.abs(currentX) / duration;
      
      // Determine action based on distance and velocity
      if (Math.abs(currentX) > this.confirmationThreshold || velocity > 0.5) {
        if (currentX > 0) {
          // Swipe right - show category menu
          this.showCategoryMenu(element, item);
        } else {
          // Swipe left - show confirmation dialog
          this.showConfirmationDialog(element, item);
        }
        hasTriggeredAction = true;
      }
      
      // Reset visuals
      this.resetSwipeVisuals(element);
      
    }, { passive: true });
    
    // Mouse events for desktop testing
    element.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      startTime = Date.now();
      isDragging = true;
      hasTriggeredAction = false;
      element.classList.add('swiping');
    });
    
    element.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      currentX = e.clientX - startX;
      const progress = Math.min(Math.abs(currentX) / this.swipeThreshold, 1);
      
      this.updateSwipeVisuals(element, currentX, progress);
      
      if (Math.abs(currentX) > 20) {
        if (currentX > 0) {
          element.classList.add('swiping-right');
          element.classList.remove('swiping-left');
        } else {
          element.classList.add('swiping-left');
          element.classList.remove('swiping-right');
        }
      }
    });
    
    element.addEventListener('mouseup', () => {
      if (!isDragging) return;
      
      isDragging = false;
      element.classList.remove('swiping');
      
      const duration = Date.now() - startTime;
      const velocity = Math.abs(currentX) / duration;
      
      if (Math.abs(currentX) > this.confirmationThreshold || velocity > 0.5) {
        if (currentX > 0) {
          this.showCategoryMenu(element, item);
        } else {
          this.showConfirmationDialog(element, item);
        }
        hasTriggeredAction = true;
      }
      
      this.resetSwipeVisuals(element);
    });
    
    // Prevent default drag behavior
    element.addEventListener('dragstart', (e) => e.preventDefault());
  }

  updateSwipeVisuals(element, currentX, progress) {
    const cardContent = element.querySelector('.card-content');
    if (!cardContent) return;
    
    // Apply transform with easing
    const easedProgress = this.easeOutCubic(progress);
    const translateX = currentX * 0.3 * easedProgress;
    const scale = 1 - (progress * 0.02);
    const opacity = 1 - (progress * 0.1);
    
    cardContent.style.transform = `translateX(${translateX}px) scale(${scale})`;
    cardContent.style.opacity = opacity;
    
    // Update background indicators
    const indicators = element.querySelector('.swipe-indicators');
    if (indicators) {
      indicators.style.opacity = Math.min(progress * 2, 1);
    }
  }

  resetSwipeVisuals(element) {
    const cardContent = element.querySelector('.card-content');
    if (cardContent) {
      cardContent.style.transform = '';
      cardContent.style.opacity = '';
    }
    
    element.classList.remove('swiping-right', 'swiping-left');
    
    const indicators = element.querySelector('.swipe-indicators');
    if (indicators) {
      indicators.style.opacity = '';
    }
  }

  showCategoryMenu(element, item) {
    const rect = element.getBoundingClientRect();
    this.categoryMenu.style.left = `${rect.left + rect.width - 200}px`;
    this.categoryMenu.style.top = `${rect.top}px`;
    this.categoryMenu.classList.remove('hidden');
    
    // Store current item for category selection
    this.categoryMenu.dataset.itemId = item.id;
    
    // Add backdrop
    this.addBackdrop();
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  showConfirmationDialog(element, item) {
    this.confirmationDialog.classList.remove('hidden');
    this.confirmationDialog.dataset.itemId = item.id;
    this.addBackdrop();
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  hideCategoryMenu() {
    this.categoryMenu.classList.add('hidden');
    this.removeBackdrop();
  }

  hideConfirmationDialog() {
    this.confirmationDialog.classList.add('hidden');
    this.removeBackdrop();
  }

  addBackdrop() {
    if (document.getElementById('swipeBackdrop')) return;
    
    const backdrop = document.createElement('div');
    backdrop.id = 'swipeBackdrop';
    backdrop.className = 'fixed inset-0 z-[85] bg-slate-950/20';
    backdrop.addEventListener('click', () => {
      this.hideCategoryMenu();
      this.hideConfirmationDialog();
    });
    document.body.appendChild(backdrop);
  }

  removeBackdrop() {
    const backdrop = document.getElementById('swipeBackdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  handleCategorySelection(category) {
    const itemId = this.categoryMenu.dataset.itemId;
    if (itemId && window.dataManager) {
      // Update category and move to library
      window.dataManager.updateItemCategory(itemId, category);
      window.dataManager.moveItem(itemId, 'library');
      
      // Refresh screens
      if (window.navigationManager) {
        window.navigationManager.onScreenChange('inbox');
        window.navigationManager.onScreenChange('now');
      }
      
      // Show success feedback
      this.showSuccessFeedback('Moved to Library');
    }
    
    this.hideCategoryMenu();
  }

  handleArchiveConfirmation() {
    const itemId = this.confirmationDialog.dataset.itemId;
    if (itemId && window.dataManager) {
      window.dataManager.moveItem(itemId, 'archived');
      
      // Refresh screens
      if (window.navigationManager) {
        window.navigationManager.onScreenChange('inbox');
        window.navigationManager.onScreenChange('now');
      }
      
      // Show success feedback
      this.showSuccessFeedback('Archived');
    }
    
    this.hideConfirmationDialog();
  }

  showSuccessFeedback(message) {
    // Create temporary success message
    const feedback = document.createElement('div');
    feedback.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-[110] bg-emerald-500/90 text-white px-4 py-2 rounded-lg text-sm font-medium';
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    // Animate in
    requestAnimationFrame(() => {
      feedback.style.transform = 'translate(-50%, 0)';
      feedback.style.opacity = '1';
    });
    
    // Remove after delay
    setTimeout(() => {
      feedback.style.transform = 'translate(-50%, -20px)';
      feedback.style.opacity = '0';
      setTimeout(() => feedback.remove(), 200);
    }, 2000);
  }

  simulateHapticFeedback(type) {
    // Visual feedback simulation since we can't access real haptics
    if (type === 'light') {
      // Subtle visual pulse
      document.body.style.transform = 'scale(0.999)';
      setTimeout(() => {
        document.body.style.transform = '';
      }, 50);
    }
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
}

// Create global instance
const enhancedSwipeManager = new EnhancedSwipeManager();
