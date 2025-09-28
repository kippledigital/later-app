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
  }

  // Create individual item element
  createItemElement(item, type) {
    const div = document.createElement('div');
    
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

  // Create inbox item HTML
  createInboxItemHTML(item) {
    const icon = this.getCategoryIcon(item.category);
    const timeAgo = this.getTimeAgo(item.createdAt);
    
    return `
      <div class="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
        <div class="flex items-center gap-2 opacity-0 group-[.swiping-right]:opacity-100 transition-opacity">
          <i data-lucide="tag" class="w-4 h-4 text-emerald-300"></i>
          <span class="text-[12px] text-emerald-300">Categorize</span>
        </div>
        <div class="flex items-center gap-2 opacity-0 group-[.swiping-left]:opacity-100 transition-opacity">
          <span class="text-[12px] text-rose-300">Archive</span>
          <i data-lucide="trash-2" class="w-4 h-4 text-rose-300"></i>
        </div>
      </div>
      <div class="card-content relative bg-white/5 ring-1 ring-white/10 p-3 transition-transform duration-300 ease-out cursor-pointer">
        <div class="flex items-start gap-3">
          <div class="shrink-0">
            <div class="w-8 h-8 rounded-md bg-slate-900 ring-1 ring-white/10 flex items-center justify-center">
              <i data-lucide="${icon}" class="w-4 h-4 text-slate-300"></i>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <button class="inbox-tag inline-flex items-center gap-1.5 text-[11px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300 ring-1 ring-white/10">
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
