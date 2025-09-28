// Collections view and UI management
class CollectionsView {
  constructor() {
    this.currentView = 'grid'; // grid, list, timeline
    this.currentCollection = null;
    this.dragState = {
      isDragging: false,
      draggedItem: null,
      targetCollection: null
    };
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  setupEventListeners() {
    // View switching
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-view-mode]')) {
        this.switchView(e.target.dataset.viewMode);
      }

      if (e.target.matches('[data-collection-id]')) {
        this.openCollection(e.target.dataset.collectionId);
      }

      if (e.target.id === 'createCollectionBtn') {
        this.showCreateCollectionModal();
      }

      if (e.target.id === 'shareCollectionBtn') {
        this.shareCurrentCollection();
      }
    });

    // Collection management
    document.addEventListener('collection-updated', () => {
      this.refreshCollectionsView();
    });
  }

  setupDragAndDrop() {
    // Enable drag and drop for items
    document.addEventListener('dragstart', (e) => {
      if (e.target.closest('[data-id]') && e.target.draggable) {
        const itemElement = e.target.closest('[data-id]');
        this.dragState.isDragging = true;
        this.dragState.draggedItem = itemElement.dataset.id;

        // Add visual feedback
        itemElement.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    document.addEventListener('dragend', (e) => {
      if (this.dragState.isDragging) {
        e.target.style.opacity = '';
        this.dragState.isDragging = false;
        this.dragState.draggedItem = null;
        this.clearDropTargets();
      }
    });

    document.addEventListener('dragover', (e) => {
      if (this.dragState.isDragging) {
        e.preventDefault();
        const dropTarget = e.target.closest('[data-collection-drop]');
        if (dropTarget) {
          e.dataTransfer.dropEffect = 'move';
          this.highlightDropTarget(dropTarget);
        }
      }
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      const dropTarget = e.target.closest('[data-collection-drop]');
      if (dropTarget && this.dragState.draggedItem) {
        const collectionId = dropTarget.dataset.collectionDrop;
        this.addItemToCollection(this.dragState.draggedItem, collectionId);
      }
    });
  }

  // View rendering methods
  renderCollectionsScreen() {
    const collectionsScreen = document.getElementById('screen-collections');
    if (!collectionsScreen) return;

    const collections = window.collectionsManager.collections;
    const smartLists = Object.values(window.collectionsManager.smartLists);

    collectionsScreen.innerHTML = `
      <div class="px-4 pt-5 pb-28">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-[20px] tracking-tight font-semibold text-slate-100">Collections</h1>
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-white/5 ring-1 ring-white/10 rounded-lg p-1">
              <button data-view-mode="grid" class="view-btn inline-flex items-center justify-center w-8 h-8 rounded-md ${this.currentView === 'grid' ? 'bg-white/10 text-slate-200' : 'text-slate-400'}">
                <i data-lucide="grid-3x3" class="w-4 h-4"></i>
              </button>
              <button data-view-mode="list" class="view-btn inline-flex items-center justify-center w-8 h-8 rounded-md ${this.currentView === 'list' ? 'bg-white/10 text-slate-200' : 'text-slate-400'}">
                <i data-lucide="list" class="w-4 h-4"></i>
              </button>
            </div>
            <button id="createCollectionBtn" class="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-md bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 ring-1 ring-purple-500/25 transition-colors">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              Create
            </button>
          </div>
        </div>

        <!-- Smart Lists Section -->
        <div class="mb-6">
          <h2 class="text-[16px] font-medium text-slate-200 mb-3 flex items-center gap-2">
            <i data-lucide="zap" class="w-4 h-4 text-cyan-300"></i>
            Smart Lists
          </h2>
          <div class="${this.currentView === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}">
            ${smartLists.map(smartList => this.renderSmartListCard(smartList)).join('')}
          </div>
        </div>

        <!-- Collections Section -->
        <div>
          <h2 class="text-[16px] font-medium text-slate-200 mb-3 flex items-center gap-2">
            <i data-lucide="folder" class="w-4 h-4 text-purple-300"></i>
            My Collections
          </h2>
          ${collections.length === 0 ? this.renderEmptyCollections() : this.renderCollectionsList(collections)}
        </div>
      </div>
    `;

    // Initialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  renderSmartListCard(smartList) {
    const progress = smartList.progress || { completed: 0, total: 0, percentage: 0 };
    const estimatedTime = smartList.estimatedTime || 0;

    if (this.currentView === 'grid') {
      return `
        <div data-collection-id="${smartList.id}" data-collection-drop="${smartList.id}" class="collection-card p-4 rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/[0.07] transition-all duration-200 cursor-pointer">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg bg-${smartList.color}-500/10 ring-1 ring-${smartList.color}-500/20 flex items-center justify-center">
              <i data-lucide="${smartList.icon}" class="w-5 h-5 text-${smartList.color}-300"></i>
            </div>
            <div class="text-right">
              <div class="text-[11px] text-slate-400">${progress.total} items</div>
              ${estimatedTime > 0 ? `<div class="text-[11px] text-slate-500">${this.formatTime(estimatedTime)}</div>` : ''}
            </div>
          </div>
          <h3 class="text-[14px] font-medium text-slate-200 mb-1">${smartList.name}</h3>
          <p class="text-[12px] text-slate-400 line-clamp-2 mb-3">${smartList.description}</p>
          ${progress.total > 0 ? this.renderProgressRing(progress.percentage, 24) : ''}
        </div>
      `;
    } else {
      return `
        <div data-collection-id="${smartList.id}" class="collection-item flex items-center gap-3 p-3 rounded-lg bg-white/5 ring-1 ring-white/10 hover:bg-white/[0.07] transition-colors cursor-pointer">
          <div class="w-8 h-8 rounded-md bg-${smartList.color}-500/10 ring-1 ring-${smartList.color}-500/20 flex items-center justify-center">
            <i data-lucide="${smartList.icon}" class="w-4 h-4 text-${smartList.color}-300"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-[14px] font-medium text-slate-200">${smartList.name}</h3>
            <p class="text-[12px] text-slate-400">${progress.total} items${estimatedTime > 0 ? ` • ${this.formatTime(estimatedTime)}` : ''}</p>
          </div>
          ${progress.total > 0 ? this.renderProgressRing(progress.percentage, 20) : ''}
        </div>
      `;
    }
  }

  renderCollectionsList(collections) {
    return `
      <div class="${this.currentView === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}">
        ${collections.map(collection => this.renderCollectionCard(collection)).join('')}
      </div>
    `;
  }

  renderCollectionCard(collection) {
    const progress = collection.progress || { completed: 0, total: 0, percentage: 0 };
    const estimatedTime = collection.estimatedTime || 0;

    if (this.currentView === 'grid') {
      return `
        <div data-collection-id="${collection.id}" data-collection-drop="${collection.id}" class="collection-card p-4 rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/[0.07] transition-all duration-200 cursor-pointer">
          ${collection.coverImage ? `
            <div class="w-full h-20 rounded-lg bg-cover bg-center mb-3 ring-1 ring-white/10" style="background-image: url('${collection.coverImage}')"></div>
          ` : `
            <div class="w-full h-20 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 ring-1 ring-purple-500/20 flex items-center justify-center mb-3">
              <i data-lucide="folder" class="w-8 h-8 text-purple-300"></i>
            </div>
          `}
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1 min-w-0">
              <h3 class="text-[14px] font-medium text-slate-200 truncate">${collection.name}</h3>
              <p class="text-[12px] text-slate-400">${progress.total} items</p>
            </div>
            ${estimatedTime > 0 ? `<div class="text-[11px] text-slate-500">${this.formatTime(estimatedTime)}</div>` : ''}
          </div>
          ${progress.total > 0 ? this.renderProgressRing(progress.percentage, 24) : ''}
        </div>
      `;
    } else {
      return `
        <div data-collection-id="${collection.id}" class="collection-item flex items-center gap-3 p-3 rounded-lg bg-white/5 ring-1 ring-white/10 hover:bg-white/[0.07] transition-colors cursor-pointer">
          ${collection.coverImage ? `
            <img src="${collection.coverImage}" alt="${collection.name}" class="w-10 h-10 rounded-md object-cover ring-1 ring-white/10">
          ` : `
            <div class="w-10 h-10 rounded-md bg-gradient-to-br from-purple-500/20 to-purple-600/10 ring-1 ring-purple-500/20 flex items-center justify-center">
              <i data-lucide="folder" class="w-5 h-5 text-purple-300"></i>
            </div>
          `}
          <div class="flex-1 min-w-0">
            <h3 class="text-[14px] font-medium text-slate-200">${collection.name}</h3>
            <p class="text-[12px] text-slate-400">${progress.total} items${estimatedTime > 0 ? ` • ${this.formatTime(estimatedTime)}` : ''}</p>
          </div>
          ${progress.total > 0 ? this.renderProgressRing(progress.percentage, 20) : ''}
        </div>
      `;
    }
  }

  renderEmptyCollections() {
    return `
      <div class="text-center py-12">
        <div class="w-16 h-16 rounded-lg bg-purple-500/10 ring-1 ring-purple-500/20 flex items-center justify-center mx-auto mb-4">
          <i data-lucide="folder-plus" class="w-8 h-8 text-purple-300"></i>
        </div>
        <h3 class="text-[16px] font-medium text-slate-200 mb-2">No collections yet</h3>
        <p class="text-[14px] text-slate-400 mb-4 max-w-sm mx-auto">Group related items together to stay organized and focused</p>
        <button id="createCollectionBtn" class="inline-flex items-center gap-1.5 text-[13px] px-3 py-2 rounded-md bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 ring-1 ring-purple-500/25 transition-colors">
          <i data-lucide="plus" class="w-4 h-4"></i>
          Create your first collection
        </button>
      </div>
    `;
  }

  renderProgressRing(percentage, size) {
    const radius = (size - 4) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return `
      <div class="relative" style="width: ${size}px; height: ${size}px;">
        <svg class="transform -rotate-90" width="${size}" height="${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="rgb(148 163 184 / 0.2)" stroke-width="2"/>
          <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="rgb(6 182 212)" stroke-width="2" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" class="transition-all duration-300"/>
        </svg>
        <div class="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-slate-300">
          ${Math.round(percentage)}%
        </div>
      </div>
    `;
  }

  // Collection detail view
  renderCollectionDetail(collectionId) {
    const collection = window.collectionsManager.collections.find(c => c.id === collectionId) ||
                     window.collectionsManager.getSmartList(collectionId);

    if (!collection) return;

    let items;
    if (collection.auto) {
      // Smart list
      items = window.collectionsManager.getSmartListItems(collectionId);
    } else {
      // Regular collection
      items = collection.items.map(id => window.dataManager.getItem(id)).filter(Boolean);
    }

    const collectionsScreen = document.getElementById('screen-collections');
    collectionsScreen.innerHTML = `
      <div class="px-4 pt-5 pb-28">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-4">
          <button id="backToCollections" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
            <i data-lucide="arrow-left" class="w-4 h-4 text-slate-300"></i>
          </button>
          <div class="flex-1 min-w-0">
            <h1 class="text-[20px] tracking-tight font-semibold text-slate-100">${collection.name}</h1>
            <p class="text-[13px] text-slate-400">${items.length} items${collection.estimatedTime ? ` • ${this.formatTime(collection.estimatedTime)}` : ''}</p>
          </div>
          ${!collection.auto ? `
            <button id="shareCollectionBtn" class="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10 transition-colors">
              <i data-lucide="share" class="w-3.5 h-3.5"></i>
              Share
            </button>
          ` : ''}
        </div>

        ${collection.progress && collection.progress.total > 0 ? `
          <!-- Progress Section -->
          <div class="mb-6 p-4 rounded-xl bg-white/5 ring-1 ring-white/10">
            <div class="flex items-center justify-between mb-3">
              <span class="text-[14px] font-medium text-slate-200">Progress</span>
              <span class="text-[12px] text-slate-400">${collection.progress.completed} of ${collection.progress.total} complete</span>
            </div>
            <div class="w-full bg-slate-700 rounded-full h-2 mb-2">
              <div class="bg-gradient-to-r from-cyan-400 to-blue-400 h-2 rounded-full transition-all duration-300" style="width: ${collection.progress.percentage}%"></div>
            </div>
            <div class="text-[12px] text-slate-500">
              ${collection.estimatedTime > 0 ? `Estimated ${this.formatTime(collection.estimatedTime)} remaining` : 'Great progress!'}
            </div>
          </div>
        ` : ''}

        <!-- Items -->
        <div class="space-y-2">
          ${items.length === 0 ? this.renderEmptyCollection() : items.map(item => this.renderCollectionItem(item)).join('')}
        </div>
      </div>
    `;

    // Setup back button
    document.getElementById('backToCollections')?.addEventListener('click', () => {
      this.renderCollectionsScreen();
    });

    // Initialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  renderCollectionItem(item) {
    const progress = Math.round(item.progress * 100);
    const timeAgo = window.itemManager?.getTimeAgo(item.createdAt) || 'Recently';

    return `
      <div data-id="${item.id}" draggable="true" class="collection-item p-3 rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/[0.07] transition-colors cursor-pointer">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-md bg-slate-900 ring-1 ring-white/10 flex items-center justify-center shrink-0">
            <i data-lucide="${window.itemManager?.getCategoryIcon(item.category) || 'bookmark'}" class="w-4 h-4 text-slate-300"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">${item.category}</span>
              <span class="text-[11px] text-slate-400">${timeAgo}</span>
              ${progress > 0 ? `<span class="text-[11px] text-slate-500">${progress}%</span>` : ''}
            </div>
            <h3 class="text-[14px] font-medium text-slate-200 line-clamp-1 mb-1">${item.title}</h3>
            <p class="text-[12px] text-slate-400 line-clamp-2">${item.content || 'No description'}</p>
          </div>
          ${progress > 0 ? `
            <div class="w-6 h-6">
              <svg class="transform -rotate-90" width="24" height="24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="rgb(148 163 184 / 0.2)" stroke-width="2"/>
                <circle cx="12" cy="12" r="10" fill="none" stroke="rgb(6 182 212)" stroke-width="2" stroke-linecap="round" stroke-dasharray="62.8" stroke-dashoffset="${62.8 - (progress / 100) * 62.8}"/>
              </svg>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderEmptyCollection() {
    return `
      <div class="text-center py-12">
        <div class="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center mx-auto mb-3">
          <i data-lucide="inbox" class="w-6 h-6 text-slate-400"></i>
        </div>
        <h3 class="text-[14px] font-medium text-slate-300 mb-1">Empty collection</h3>
        <p class="text-[12px] text-slate-400">Drag items here to add them to this collection</p>
      </div>
    `;
  }

  // View switching
  switchView(viewMode) {
    this.currentView = viewMode;
    this.renderCollectionsScreen();
  }

  // Collection operations
  openCollection(collectionId) {
    this.currentCollection = collectionId;
    this.renderCollectionDetail(collectionId);
  }

  addItemToCollection(itemId, collectionId) {
    const success = window.collectionsManager.addItemToCollection(collectionId, itemId);
    if (success) {
      this.showFeedback('Item added to collection', 'success');
      this.refreshCollectionsView();
    }
  }

  showCreateCollectionModal() {
    // Create collection modal will be implemented
    const modalHTML = `
      <div id="createCollectionModal" class="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-slate-900 rounded-2xl ring-1 ring-white/10 shadow-2xl">
          <div class="p-6">
            <h2 class="text-[18px] font-semibold text-slate-100 mb-4">Create Collection</h2>
            <form id="createCollectionForm">
              <div class="space-y-4">
                <div>
                  <label class="block text-[12px] text-slate-400 mb-1">Name</label>
                  <input type="text" id="collectionName" required class="w-full px-3 py-2 bg-white/5 ring-1 ring-white/10 rounded-md text-slate-200 placeholder-slate-500 focus:ring-cyan-400/30 focus:outline-none" placeholder="Enter collection name">
                </div>
                <div>
                  <label class="block text-[12px] text-slate-400 mb-1">Description</label>
                  <textarea id="collectionDescription" rows="3" class="w-full px-3 py-2 bg-white/5 ring-1 ring-white/10 rounded-md text-slate-200 placeholder-slate-500 focus:ring-cyan-400/30 focus:outline-none" placeholder="Optional description"></textarea>
                </div>
              </div>
              <div class="flex items-center gap-2 mt-6">
                <button type="button" id="cancelCreateCollection" class="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 ring-1 ring-white/10 rounded-md text-slate-300 transition-colors">
                  Cancel
                </button>
                <button type="submit" class="flex-1 py-2 px-4 bg-purple-500/15 hover:bg-purple-500/25 ring-1 ring-purple-500/25 rounded-md text-purple-300 transition-colors">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Setup modal events
    document.getElementById('cancelCreateCollection').addEventListener('click', () => {
      document.getElementById('createCollectionModal').remove();
    });

    document.getElementById('createCollectionForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('collectionName').value;
      const description = document.getElementById('collectionDescription').value;

      window.collectionsManager.createCollection({
        name,
        description,
        items: []
      });

      document.getElementById('createCollectionModal').remove();
      this.refreshCollectionsView();
      this.showFeedback('Collection created', 'success');
    });
  }

  shareCurrentCollection() {
    if (!this.currentCollection) return;

    const collection = window.collectionsManager.collections.find(c => c.id === this.currentCollection);
    if (!collection) return;

    // Generate shareable link (simplified)
    const shareData = {
      name: collection.name,
      items: collection.items.map(id => {
        const item = window.dataManager.getItem(id);
        return { title: item.title, url: item.url };
      })
    };

    const shareUrl = `${window.location.origin}/shared/${btoa(JSON.stringify(shareData))}`;

    if (navigator.share) {
      navigator.share({
        title: collection.name,
        text: `Check out my "${collection.name}" collection`,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showFeedback('Collection link copied to clipboard', 'success');
      });
    }
  }

  // Utility methods
  formatTime(minutes) {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  }

  highlightDropTarget(target) {
    target.classList.add('drop-highlight');
  }

  clearDropTargets() {
    document.querySelectorAll('.drop-highlight').forEach(el => {
      el.classList.remove('drop-highlight');
    });
  }

  refreshCollectionsView() {
    if (this.currentCollection) {
      this.renderCollectionDetail(this.currentCollection);
    } else {
      this.renderCollectionsScreen();
    }
  }

  showFeedback(message, type = 'info') {
    if (window.appManager && window.appManager.showFeedback) {
      window.appManager.showFeedback(message, type);
    }
  }
}

// Create global instance
const collectionsView = new CollectionsView();