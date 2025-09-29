// Knowledge exploration UI components using existing design patterns
class KnowledgeView {
  constructor() {
    this.currentView = 'overview'; // overview, connections, concepts, entities
    this.selectedItem = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.setupEventListeners();
    this.initialized = true;
  }

  setupEventListeners() {
    // Listen for knowledge exploration requests
    document.addEventListener('showKnowledgeConnections', (e) => {
      if (e.detail && e.detail.itemId) {
        this.showItemConnections(e.detail.itemId);
      }
    });

    // Listen for concept/entity exploration
    document.addEventListener('exploreKnowledge', (e) => {
      if (e.detail) {
        this.exploreKnowledge(e.detail.type, e.detail.name);
      }
    });
  }

  // Add knowledge exploration section to Library screen
  enhanceLibraryWithKnowledge() {
    const libraryScreen = document.getElementById('screen-library');
    if (!libraryScreen) return;

    // Find the library content area
    const libraryContent = libraryScreen.querySelector('.px-4.pt-5.pb-28');
    if (!libraryContent) return;

    // Add knowledge section after library header but before category filters
    const knowledgeSection = `
      <div id="knowledgeExploration" class="mb-5">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <i data-lucide="brain" class="w-4 h-4 text-cyan-300"></i>
            <h2 class="text-[16px] tracking-tight font-semibold text-slate-100">Knowledge Graph</h2>
          </div>
          <button id="knowledgeOverviewBtn" class="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-500/25 transition-colors">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            Explore
          </button>
        </div>

        <!-- Knowledge Stats -->
        <div id="knowledgeStats" class="grid grid-cols-3 gap-2 mb-3">
          <!-- Stats will be inserted here -->
        </div>

        <!-- Recent Connections -->
        <div id="recentConnections" class="hidden">
          <h3 class="text-[14px] font-medium text-slate-200 mb-2">Recent Connections</h3>
          <div id="connectionsList" class="space-y-2">
            <!-- Connections will be inserted here -->
          </div>
        </div>
      </div>
    `;

    // Insert after the header
    const headerEl = libraryContent.querySelector('h1');
    if (headerEl && headerEl.parentNode) {
      headerEl.parentNode.insertAdjacentHTML('afterend', knowledgeSection);
      this.renderKnowledgeStats();
      this.setupKnowledgeEventListeners();
    }
  }

  renderKnowledgeStats() {
    if (!window.knowledgeProcessor) return;

    const stats = window.knowledgeProcessor.getKnowledgeStats();
    const statsContainer = document.getElementById('knowledgeStats');

    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="rounded-lg bg-white/5 ring-1 ring-white/10 p-3 text-center">
          <div class="text-[18px] font-semibold text-slate-100">${stats.totalItems}</div>
          <div class="text-[11px] text-slate-400">Items</div>
        </div>
        <div class="rounded-lg bg-white/5 ring-1 ring-white/10 p-3 text-center">
          <div class="text-[18px] font-semibold text-slate-100">${stats.totalConcepts}</div>
          <div class="text-[11px] text-slate-400">Concepts</div>
        </div>
        <div class="rounded-lg bg-white/5 ring-1 ring-white/10 p-3 text-center">
          <div class="text-[18px] font-semibold text-slate-100">${stats.totalConnections}</div>
          <div class="text-[11px] text-slate-400">Links</div>
        </div>
      `;
    }
  }

  setupKnowledgeEventListeners() {
    const overviewBtn = document.getElementById('knowledgeOverviewBtn');
    if (overviewBtn) {
      overviewBtn.addEventListener('click', () => {
        this.showKnowledgeOverlay();
      });
    }
  }

  showKnowledgeOverlay() {
    const overlay = this.createKnowledgeOverlay();
    document.body.appendChild(overlay);

    // Animate in
    setTimeout(() => {
      overlay.classList.remove('opacity-0');
      overlay.classList.add('opacity-100');
    }, 10);

    this.renderKnowledgeOverview();
  }

  createKnowledgeOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'knowledgeOverlay';
    overlay.className = 'fixed inset-0 bg-slate-950/90 backdrop-blur z-[90] opacity-0 transition-opacity duration-300';

    overlay.innerHTML = `
      <div class="flex items-center justify-center min-h-full p-4">
        <div class="w-full max-w-2xl bg-slate-900/95 backdrop-blur rounded-2xl ring-1 ring-white/10 shadow-2xl">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-white/10">
            <div class="flex items-center gap-2">
              <i data-lucide="brain" class="w-5 h-5 text-cyan-300"></i>
              <h2 class="text-[18px] font-semibold text-slate-100">Knowledge Graph</h2>
            </div>
            <button id="closeKnowledgeOverlay" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
              <i data-lucide="x" class="w-4 h-4 text-slate-300"></i>
            </button>
          </div>

          <!-- Navigation Tabs -->
          <div class="flex items-center border-b border-white/5">
            <button data-knowledge-tab="overview" class="knowledge-tab-btn flex-1 px-4 py-3 text-[13px] font-medium transition-colors bg-white/5 text-cyan-300">
              Overview
            </button>
            <button data-knowledge-tab="concepts" class="knowledge-tab-btn flex-1 px-4 py-3 text-[13px] font-medium transition-colors text-slate-400 hover:text-slate-300">
              Concepts
            </button>
            <button data-knowledge-tab="entities" class="knowledge-tab-btn flex-1 px-4 py-3 text-[13px] font-medium transition-colors text-slate-400 hover:text-slate-300">
              Entities
            </button>
            <button data-knowledge-tab="connections" class="knowledge-tab-btn flex-1 px-4 py-3 text-[13px] font-medium transition-colors text-slate-400 hover:text-slate-300">
              Connections
            </button>
          </div>

          <!-- Content Area -->
          <div class="p-4 max-h-[60vh] overflow-y-auto">
            <div id="knowledgeContent">
              <!-- Content will be rendered here -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Setup close functionality
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeKnowledgeOverlay();
      }
    });

    overlay.querySelector('#closeKnowledgeOverlay').addEventListener('click', () => {
      this.closeKnowledgeOverlay();
    });

    // Setup tab navigation
    overlay.querySelectorAll('[data-knowledge-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.knowledgeTab;
        this.switchKnowledgeTab(tab);
      });
    });

    return overlay;
  }

  closeKnowledgeOverlay() {
    const overlay = document.getElementById('knowledgeOverlay');
    if (overlay) {
      overlay.classList.remove('opacity-100');
      overlay.classList.add('opacity-0');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }
  }

  switchKnowledgeTab(tab) {
    // Update tab states
    document.querySelectorAll('.knowledge-tab-btn').forEach(btn => {
      if (btn.dataset.knowledgeTab === tab) {
        btn.classList.add('bg-white/5', 'text-cyan-300');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('bg-white/5', 'text-cyan-300');
        btn.classList.add('text-slate-400');
      }
    });

    // Render tab content
    this.currentView = tab;
    this.renderKnowledgeContent();
  }

  renderKnowledgeContent() {
    const contentEl = document.getElementById('knowledgeContent');
    if (!contentEl) return;

    switch (this.currentView) {
      case 'overview':
        this.renderKnowledgeOverview();
        break;
      case 'concepts':
        this.renderConceptsView();
        break;
      case 'entities':
        this.renderEntitiesView();
        break;
      case 'connections':
        this.renderConnectionsView();
        break;
    }
  }

  renderKnowledgeOverview() {
    const contentEl = document.getElementById('knowledgeContent');
    if (!contentEl || !window.knowledgeProcessor) return;

    const stats = window.knowledgeProcessor.getKnowledgeStats();

    contentEl.innerHTML = `
      <div class="space-y-4">
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
            <div class="flex items-center gap-2 mb-2">
              <i data-lucide="file-text" class="w-4 h-4 text-cyan-300"></i>
              <span class="text-[14px] font-medium text-slate-200">Items Processed</span>
            </div>
            <div class="text-[24px] font-semibold text-slate-100">${stats.totalItems}</div>
            <div class="text-[12px] text-slate-400">Connected in knowledge graph</div>
          </div>

          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
            <div class="flex items-center gap-2 mb-2">
              <i data-lucide="tag" class="w-4 h-4 text-purple-300"></i>
              <span class="text-[14px] font-medium text-slate-200">Concepts</span>
            </div>
            <div class="text-[24px] font-semibold text-slate-100">${stats.totalConcepts}</div>
            <div class="text-[12px] text-slate-400">Unique topics discovered</div>
          </div>

          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
            <div class="flex items-center gap-2 mb-2">
              <i data-lucide="users" class="w-4 h-4 text-green-300"></i>
              <span class="text-[14px] font-medium text-slate-200">Entities</span>
            </div>
            <div class="text-[24px] font-semibold text-slate-100">${stats.totalEntities}</div>
            <div class="text-[12px] text-slate-400">People, places, organizations</div>
          </div>

          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
            <div class="flex items-center gap-2 mb-2">
              <i data-lucide="link" class="w-4 h-4 text-orange-300"></i>
              <span class="text-[14px] font-medium text-slate-200">Connections</span>
            </div>
            <div class="text-[24px] font-semibold text-slate-100">${stats.totalConnections}</div>
            <div class="text-[12px] text-slate-400">Cross-references found</div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
          <div class="flex items-center gap-2 mb-3">
            <i data-lucide="activity" class="w-4 h-4 text-cyan-300"></i>
            <span class="text-[14px] font-medium text-slate-200">Recent Insights</span>
          </div>
          <div id="recentInsights" class="space-y-2">
            <!-- Recent insights will be inserted here -->
          </div>
        </div>
      </div>
    `;

    this.renderRecentInsights();
    this.initializeLucideIcons();
  }

  renderRecentInsights() {
    const container = document.getElementById('recentInsights');
    if (!container || !window.knowledgeProcessor) return;

    // Get some recent insights
    const insights = [
      {
        type: 'connection',
        text: 'Found connections between productivity articles',
        icon: 'link',
        color: 'cyan'
      },
      {
        type: 'concept',
        text: 'New concept discovered: "Digital Minimalism"',
        icon: 'lightbulb',
        color: 'yellow'
      },
      {
        type: 'entity',
        text: 'Author mentioned across multiple items',
        icon: 'user',
        color: 'green'
      }
    ];

    container.innerHTML = insights.map(insight => `
      <div class="flex items-center gap-2 text-[13px]">
        <i data-lucide="${insight.icon}" class="w-3.5 h-3.5 text-${insight.color}-300"></i>
        <span class="text-slate-300">${insight.text}</span>
      </div>
    `).join('');
  }

  renderConceptsView() {
    const contentEl = document.getElementById('knowledgeContent');
    if (!contentEl || !window.knowledgeProcessor) return;

    // Get top concepts
    const concepts = Array.from(window.knowledgeProcessor.conceptIndex.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 20);

    contentEl.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[16px] font-medium text-slate-200">Top Concepts</h3>
          <span class="text-[12px] text-slate-400">${concepts.length} discovered</span>
        </div>

        <div class="grid gap-2">
          ${concepts.map(([conceptName, items]) => this.createConceptCard(conceptName, items)).join('')}
        </div>
      </div>
    `;

    this.initializeLucideIcons();
  }

  createConceptCard(conceptName, items) {
    return `
      <button onclick="window.knowledgeView.exploreConceptDetails('${conceptName}')" class="w-full text-left rounded-lg bg-white/5 ring-1 ring-white/10 p-3 hover:bg-white/10 transition-colors">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <h4 class="text-[14px] font-medium text-slate-200 truncate">${this.capitalizeFirst(conceptName)}</h4>
            <p class="text-[12px] text-slate-400">${items.length} items</p>
          </div>
          <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
        </div>
      </button>
    `;
  }

  renderEntitiesView() {
    const contentEl = document.getElementById('knowledgeContent');
    if (!contentEl || !window.knowledgeProcessor) return;

    // Get top entities
    const entities = Array.from(window.knowledgeProcessor.entityIndex.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 20);

    contentEl.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[16px] font-medium text-slate-200">Key Entities</h3>
          <span class="text-[12px] text-slate-400">${entities.length} discovered</span>
        </div>

        <div class="grid gap-2">
          ${entities.map(([entityKey, items]) => this.createEntityCard(entityKey, items)).join('')}
        </div>
      </div>
    `;

    this.initializeLucideIcons();
  }

  createEntityCard(entityKey, items) {
    const [type, name] = entityKey.split(':');
    const icon = this.getEntityIcon(type);

    return `
      <button onclick="window.knowledgeView.exploreEntityDetails('${type}', '${name}')" class="w-full text-left rounded-lg bg-white/5 ring-1 ring-white/10 p-3 hover:bg-white/10 transition-colors">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <i data-lucide="${icon}" class="w-4 h-4 text-slate-300"></i>
            <div class="flex-1 min-w-0">
              <h4 class="text-[14px] font-medium text-slate-200 truncate">${this.capitalizeFirst(name)}</h4>
              <p class="text-[12px] text-slate-400">${this.capitalizeFirst(type)} • ${items.length} mentions</p>
            </div>
          </div>
          <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
        </div>
      </button>
    `;
  }

  renderConnectionsView() {
    const contentEl = document.getElementById('knowledgeContent');
    if (!contentEl || !window.knowledgeProcessor) return;

    // Get items with strong connections
    const strongConnections = [];
    window.knowledgeProcessor.knowledgeGraph.forEach((data, itemId) => {
      if (data.relationships && data.relationships.length > 0) {
        const item = window.dataManager.getItem(itemId);
        if (item) {
          strongConnections.push({
            item,
            connectionCount: data.relationships.length
          });
        }
      }
    });

    strongConnections.sort((a, b) => b.connectionCount - a.connectionCount);

    contentEl.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[16px] font-medium text-slate-200">Highly Connected Items</h3>
          <span class="text-[12px] text-slate-400">${strongConnections.length} items</span>
        </div>

        <div class="grid gap-2">
          ${strongConnections.slice(0, 10).map(conn => this.createConnectionCard(conn)).join('')}
        </div>
      </div>
    `;

    this.initializeLucideIcons();
  }

  createConnectionCard(connection) {
    const { item, connectionCount } = connection;
    const icon = window.itemManager ? window.itemManager.getCategoryIcon(item.category) : 'file-text';

    return `
      <button onclick="window.knowledgeView.showItemConnections('${item.id}')" class="w-full text-left rounded-lg bg-white/5 ring-1 ring-white/10 p-3 hover:bg-white/10 transition-colors">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <i data-lucide="${icon}" class="w-4 h-4 text-slate-300"></i>
            <div class="flex-1 min-w-0">
              <h4 class="text-[14px] font-medium text-slate-200 truncate">${item.title}</h4>
              <p class="text-[12px] text-slate-400">${connectionCount} connections</p>
            </div>
          </div>
          <i data-lucide="external-link" class="w-4 h-4 text-slate-400"></i>
        </div>
      </button>
    `;
  }

  // Show detailed connections for a specific item
  showItemConnections(itemId) {
    const item = window.dataManager.getItem(itemId);
    const relatedItems = window.knowledgeProcessor.getRelatedItems(itemId, 10);

    if (!item || relatedItems.length === 0) {
      console.log('No connections found for item:', itemId);
      return;
    }

    // Show knowledge overlay if not already open
    if (!document.getElementById('knowledgeOverlay')) {
      this.showKnowledgeOverlay();
    }

    // Switch to connections tab
    this.switchKnowledgeTab('connections');

    // Update overlay content to show item connections
    const contentEl = document.getElementById('knowledgeContent');
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="space-y-4">
          <!-- Header with back button -->
          <div class="flex items-center gap-3 mb-4">
            <button onclick="window.knowledgeView.switchKnowledgeTab('connections')" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
              <i data-lucide="arrow-left" class="w-4 h-4 text-slate-300"></i>
            </button>
            <div class="flex-1 min-w-0">
              <h3 class="text-[16px] font-medium text-slate-200 truncate">${item.title}</h3>
              <p class="text-[12px] text-slate-400">${relatedItems.length} connections found</p>
            </div>
          </div>

          <!-- Connected Items -->
          <div class="grid gap-2">
            ${relatedItems.map(({ item: relatedItem, relationship }) => this.createRelatedItemCard(relatedItem, relationship)).join('')}
          </div>
        </div>
      `;

      this.initializeLucideIcons();
    }
  }

  createRelatedItemCard(item, relationship) {
    const icon = window.itemManager ? window.itemManager.getCategoryIcon(item.category) : 'file-text';
    const strengthColor = relationship.strength > 0.7 ? 'green' : relationship.strength > 0.4 ? 'yellow' : 'slate';

    return `
      <div class="rounded-lg bg-white/5 ring-1 ring-white/10 p-3">
        <div class="flex items-start gap-3">
          <i data-lucide="${icon}" class="w-4 h-4 text-slate-300 mt-0.5"></i>
          <div class="flex-1 min-w-0">
            <h4 class="text-[14px] font-medium text-slate-200 truncate">${item.title}</h4>
            <p class="text-[12px] text-slate-400 line-clamp-2 mb-2">${item.content || 'No description'}</p>
            <div class="flex items-center gap-2">
              <span class="text-[11px] px-1.5 py-0.5 rounded bg-${strengthColor}-400/10 text-${strengthColor}-300 ring-1 ring-${strengthColor}-400/20">
                ${relationship.type}
              </span>
              <span class="text-[11px] text-slate-500">
                ${Math.round(relationship.strength * 100)}% match
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Utility methods
  getEntityIcon(type) {
    const iconMap = {
      'person': 'user',
      'organization': 'building',
      'location': 'map-pin',
      'date': 'calendar',
      'number': 'hash'
    };
    return iconMap[type] || 'tag';
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  initializeLucideIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Explore specific concept or entity
  exploreConceptDetails(conceptName) {
    console.log('Exploring concept:', conceptName);
    // Implementation for detailed concept exploration
  }

  exploreEntityDetails(type, name) {
    console.log('Exploring entity:', type, name);
    // Implementation for detailed entity exploration
  }
}

// Create global instance
const knowledgeView = new KnowledgeView();