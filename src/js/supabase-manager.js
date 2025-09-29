// Supabase Manager - minimal client setup and sync hooks
class SupabaseManager {
  constructor() {
    this.client = null;
    this.enabled = false;
    this.queueKey = 'later_unsynced_queue';
    this.tableName = 'items';
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    this.loadConfig();

    // Listen for new items to sync
    document.addEventListener('itemSaved', (event) => {
      const item = event.detail?.item;
      if (item) {
        this.enqueueAndSync(item);
      }
    });

    // Try syncing any queued items when we come online
    window.addEventListener('online', () => {
      this.syncQueue();
    });

    // Attempt an initial sync shortly after startup
    setTimeout(() => this.syncQueue(), 1500);

    this.initialized = true;
  }

  loadConfig() {
    const url = window.SUPABASE_URL || localStorage.getItem('supabaseUrl') || '';
    const anonKey = window.SUPABASE_ANON_KEY || localStorage.getItem('supabaseAnonKey') || '';

    if (!url || !anonKey) {
      this.enabled = false;
      return;
    }

    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        this.client = window.supabase.createClient(url, anonKey, { auth: { persistSession: false } });
        this.enabled = true;
      } catch (e) {
        console.warn('[Supabase] Failed to create client:', e);
        this.enabled = false;
      }
    } else {
      console.warn('[Supabase] SDK not loaded. Ensure CDN script is included.');
      this.enabled = false;
    }
  }

  setConfig(url, anonKey) {
    if (url && anonKey) {
      localStorage.setItem('supabaseUrl', url);
      localStorage.setItem('supabaseAnonKey', anonKey);
      this.loadConfig();
    }
  }

  getQueue() {
    try {
      const raw = localStorage.getItem(this.queueKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  saveQueue(queue) {
    try {
      localStorage.setItem(this.queueKey, JSON.stringify(queue));
    } catch (e) {
      // ignore
    }
  }

  enqueueAndSync(item) {
    const queue = this.getQueue();
    queue.push(item);
    this.saveQueue(queue);
    this.syncQueue();
  }

  async syncQueue() {
    if (!this.enabled || !this.client) return;
    if (!navigator.onLine) return;

    let queue = this.getQueue();
    if (queue.length === 0) return;

    const remaining = [];
    for (const item of queue) {
      try {
        const ok = await this.syncItem(item);
        if (!ok) remaining.push(item);
      } catch (e) {
        remaining.push(item);
      }
    }
    this.saveQueue(remaining);
  }

  async syncItem(item) {
    try {
      const payload = this.mapItemToRow(item);
      const { error } = await this.client.from(this.tableName).upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn('[Supabase] Upsert error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] Sync failed:', e);
      return false;
    }
  }

  mapItemToRow(item) {
    return {
      id: item.id,
      title: item.title,
      content: item.content,
      url: item.url,
      category: item.category,
      state: item.state,
      type: item.type,
      created_at: item.createdAt,
      updated_at: item.updatedAt || item.createdAt,
      progress: item.progress,
      urgency: item.urgency,
      estimated_duration: item.estimatedDuration,
      estimated_effort: item.estimatedEffort,
      last_interaction: item.lastInteraction,
      tags: item.tags,
      has_summary: item.hasSummary,
      reading_time: item.readingTime,
      image_url: item.imageUrl,
      favicon: item.favicon
    };
  }

  getStatus() {
    return {
      enabled: this.enabled,
      queueLength: this.getQueue().length
    };
  }
}

// Create global instance
const supabaseManager = new SupabaseManager();

