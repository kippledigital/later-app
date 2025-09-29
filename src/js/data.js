// Data model and localStorage management for Later App
class DataManager {
  constructor() {
    this.storageKey = 'laterAppData';
    this.items = this.loadItems();
  }

  // Load items from localStorage
  loadItems() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading items:', error);
      return [];
    }
  }

  // Save items to localStorage
  saveItems() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (error) {
      console.error('Error saving items:', error);
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Save a new item with enhanced metadata
  saveItem(itemData) {
    const baseItem = {
      id: this.generateId(),
      title: itemData.title || '',
      content: itemData.content || '',
      url: itemData.url || '',
      category: itemData.category || 'work',
      state: itemData.state || 'inbox',
      type: itemData.type || 'article', // article, email, event, task
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // Universal metadata
      progress: itemData.progress || 0,
      urgency: itemData.urgency || 'normal', // low, normal, high, urgent
      estimatedDuration: itemData.estimatedDuration || null, // in minutes
      estimatedEffort: itemData.estimatedEffort || 'medium', // low, medium, high
      lastInteraction: itemData.lastInteraction || null,
      tags: itemData.tags || [],

      // Reading/article specific
      summary: itemData.summary || null,
      hasSummary: itemData.hasSummary || false,
      readingTime: itemData.readingTime || null,
      bookmarked: itemData.bookmarked || false,
      imageUrl: itemData.imageUrl || null,
      favicon: itemData.favicon || null,

      // Type-specific data (stored in typeData object)
      typeData: this.createTypeSpecificData(itemData)
    };

    this.items.unshift(baseItem);
    this.saveItems();

    // Attempt remote sync
    if (window.supabaseManager) {
      window.supabaseManager.enqueueAndSync(baseItem);
    }

    // Track item creation for insights
    if (window.insightsTracker) {
      window.insightsTracker.trackItemAdded(baseItem);
    }

    // Dispatch event for background summary processing
    document.dispatchEvent(new CustomEvent('itemSaved', {
      detail: { item: baseItem }
    }));

    return baseItem;
  }

  // Create type-specific data structure
  createTypeSpecificData(itemData) {
    const type = itemData.type || 'article';

    switch (type) {
      case 'email':
        return {
          sender: itemData.sender || '',
          senderEmail: itemData.senderEmail || '',
          senderAvatar: itemData.senderAvatar || null,
          subject: itemData.subject || itemData.title || '',
          preview: itemData.preview || itemData.content?.substring(0, 150) || '',
          replyNeeded: itemData.replyNeeded || false,
          isThread: itemData.isThread || false,
          threadCount: itemData.threadCount || 1,
          hasAttachments: itemData.hasAttachments || false,
          isImportant: itemData.isImportant || false,
          receivedAt: itemData.receivedAt || new Date().toISOString(),
          labels: itemData.labels || []
        };

      case 'event':
        return {
          eventDate: itemData.eventDate || null, // ISO date string
          eventTime: itemData.eventTime || null, // ISO time string
          endTime: itemData.endTime || null,
          isAllDay: itemData.isAllDay || false,
          location: itemData.location || '',
          locationUrl: itemData.locationUrl || null,
          attendees: itemData.attendees || [],
          organizer: itemData.organizer || '',
          rsvpNeeded: itemData.rsvpNeeded || false,
          rsvpStatus: itemData.rsvpStatus || 'pending', // pending, accepted, declined, tentative
          meetingType: itemData.meetingType || 'meeting', // meeting, call, social, personal
          hasReminder: itemData.hasReminder || false,
          reminderTime: itemData.reminderTime || null,
          recurrence: itemData.recurrence || null
        };

      case 'task':
        return {
          dueDate: itemData.dueDate || null,
          dueTime: itemData.dueTime || null,
          priority: itemData.priority || 'medium', // low, medium, high
          project: itemData.project || '',
          assignee: itemData.assignee || '',
          subtasks: itemData.subtasks || [],
          completedSubtasks: itemData.completedSubtasks || 0,
          totalSubtasks: itemData.totalSubtasks || 0,
          dependencies: itemData.dependencies || [],
          timeBlocked: itemData.timeBlocked || false,
          estimatedPomodoros: itemData.estimatedPomodoros || null,
          actualTimeSpent: itemData.actualTimeSpent || 0,
          status: itemData.status || 'todo' // todo, in-progress, blocked, completed
        };

      default: // article and other types
        return {
          author: itemData.author || '',
          domain: itemData.domain || '',
          publishedAt: itemData.publishedAt || null,
          wordCount: itemData.wordCount || null,
          difficulty: itemData.difficulty || 'medium',
          topic: itemData.topic || '',
          source: itemData.source || 'manual'
        };
    }
  }

  // Get items with optional filtering
  getItems(state = null, category = null) {
    let filtered = [...this.items];

    if (state) {
      filtered = filtered.filter(item => item.state === state);
    }

    if (category && category !== 'all') {
      filtered = filtered.filter(item => item.category === category);
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Move item to new state
  moveItem(id, newState) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      const oldState = item.state;
      item.state = newState;
      this.saveItems();

      // Sync change
      if (window.supabaseManager) {
        window.supabaseManager.enqueueAndSync(item);
      }

      // Track state changes for insights
      if (window.insightsTracker) {
        window.insightsTracker.trackItemStateChange(item, oldState, newState);
      }

      return true;
    }
    return false;
  }

  // Update item category
  updateItemCategory(id, category) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      item.category = category;
      this.saveItems();
      if (window.supabaseManager) {
        window.supabaseManager.enqueueAndSync(item);
      }
      return true;
    }
    return false;
  }

  // Update item progress
  updateItemProgress(id, progress) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      const oldProgress = item.progress;
      item.progress = Math.max(0, Math.min(1, progress));
      this.saveItems();
      if (window.supabaseManager) {
        window.supabaseManager.enqueueAndSync(item);
      }

      // Track reading progress for insights
      if (window.insightsTracker) {
        window.insightsTracker.trackReadingProgress(item, oldProgress, progress);
      }

      return true;
    }
    return false;
  }

  // Delete item
  deleteItem(id) {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      const [removed] = this.items.splice(index, 1);
      this.saveItems();

      // Remote delete (best-effort)
      if (window.supabaseManager && removed) {
        window.supabaseManager.deleteRemote(removed.id);
      }
      return true;
    }
    return false;
  }

  // Get item by ID
  getItem(id) {
    return this.items.find(item => item.id === id);
  }

  // Get all items
  getAllItems() {
    return [...this.items];
  }

  // Update item (generic update method)
  updateItem(id, updates) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      Object.assign(item, updates);
      this.saveItems();
      if (window.supabaseManager) {
        window.supabaseManager.enqueueAndSync(item);
      }
      return true;
    }
    return false;
  }

  // Update item summary data
  updateItemSummary(id, summaryData) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      item.summary = summaryData.summary;
      item.hasSummary = !!summaryData.summary;
      item.readingTime = summaryData.readingTime;
      this.saveItems();
      if (window.supabaseManager) {
        window.supabaseManager.enqueueAndSync(item);
      }
      return true;
    }
    return false;
  }

  // Get items with summaries
  getItemsWithSummaries() {
    return this.items.filter(item => item.hasSummary);
  }

  // Get items by URL (for summary caching)
  getItemByUrl(url) {
    return this.items.find(item => item.url === url);
  }

  // Get items by type
  getItemsByType(type) {
    return this.items.filter(item => item.type === type);
  }

  // Get items by urgency
  getItemsByUrgency(urgency) {
    return this.items.filter(item => item.urgency === urgency);
  }

  // Get items needing attention (urgent, overdue, etc.)
  getItemsNeedingAttention() {
    const now = new Date();
    return this.items.filter(item => {
      // High urgency items
      if (item.urgency === 'urgent') return true;

      // Overdue tasks
      if (item.type === 'task' && item.typeData.dueDate) {
        const dueDate = new Date(item.typeData.dueDate);
        if (dueDate < now) return true;
      }

      // Events starting soon (within 2 hours)
      if (item.type === 'event' && item.typeData.eventDate) {
        const eventDate = new Date(item.typeData.eventDate + 'T' + (item.typeData.eventTime || '00:00'));
        const timeDiff = eventDate - now;
        if (timeDiff > 0 && timeDiff < 2 * 60 * 60 * 1000) return true;
      }

      // Emails needing reply (older than 24 hours)
      if (item.type === 'email' && item.typeData.replyNeeded) {
        const receivedDate = new Date(item.typeData.receivedAt);
        const hoursSince = (now - receivedDate) / (1000 * 60 * 60);
        if (hoursSince > 24) return true;
      }

      return false;
    });
  }

  // Get upcoming events (next 7 days)
  getUpcomingEvents(days = 7) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.items
      .filter(item => item.type === 'event' && item.typeData.eventDate)
      .filter(item => {
        const eventDate = new Date(item.typeData.eventDate);
        return eventDate >= now && eventDate <= future;
      })
      .sort((a, b) => new Date(a.typeData.eventDate) - new Date(b.typeData.eventDate));
  }

  // Get overdue tasks
  getOverdueTasks() {
    const now = new Date();
    return this.items
      .filter(item => item.type === 'task' && item.typeData.dueDate)
      .filter(item => {
        const dueDate = new Date(item.typeData.dueDate);
        return dueDate < now && item.typeData.status !== 'completed';
      });
  }

  // Get emails needing reply
  getEmailsNeedingReply() {
    return this.items.filter(item =>
      item.type === 'email' &&
      item.typeData.replyNeeded &&
      item.state !== 'completed'
    );
  }

  // Update item urgency
  updateItemUrgency(id, urgency) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      item.urgency = urgency;
      item.updatedAt = new Date().toISOString();
      this.saveItems();
      return true;
    }
    return false;
  }

  // Update type-specific data
  updateTypeData(id, typeDataUpdates) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      item.typeData = { ...item.typeData, ...typeDataUpdates };
      item.updatedAt = new Date().toISOString();
      this.saveItems();
      return true;
    }
    return false;
  }

  // Mark task as completed
  completeTask(id) {
    const item = this.items.find(item => item.id === id && item.type === 'task');
    if (item) {
      item.typeData.status = 'completed';
      item.progress = 1;
      item.state = 'library';
      item.updatedAt = new Date().toISOString();
      this.saveItems();
      if (window.supabaseManager) {
        window.supabaseManager.enqueueAndSync(item);
      }
      return true;
    }
    return false;
  }

  // RSVP to event
  updateEventRSVP(id, rsvpStatus) {
    const item = this.items.find(item => item.id === id && item.type === 'event');
    if (item) {
      item.typeData.rsvpStatus = rsvpStatus;
      item.typeData.rsvpNeeded = false;
      item.updatedAt = new Date().toISOString();
      this.saveItems();
      if (window.supabaseManager) {
        window.supabaseManager.enqueueAndSync(item);
      }
      return true;
    }
    return false;
  }

  // Mark email as replied
  markEmailReplied(id) {
    const item = this.items.find(item => item.id === id && item.type === 'email');
    if (item) {
      item.typeData.replyNeeded = false;
      item.state = 'library';
      item.updatedAt = new Date().toISOString();
      this.saveItems();
      if (window.supabaseManager) {
        window.supabaseManager.enqueueAndSync(item);
      }
      return true;
    }
    return false;
  }

  // Get stats for dashboard
  getStats() {
    const stats = {
      inbox: this.getItems('inbox').length,
      library: this.getItems('library').length,
      work: this.getItems('library', 'work').length,
      life: this.getItems('library', 'life').length,
      inspiration: this.getItems('library', 'inspiration').length,
      withSummaries: this.getItemsWithSummaries().length,

      // New type-based stats
      emails: this.getItemsByType('email').length,
      events: this.getItemsByType('event').length,
      tasks: this.getItemsByType('task').length,
      articles: this.getItemsByType('article').length,

      // Attention stats
      needingAttention: this.getItemsNeedingAttention().length,
      emailsNeedingReply: this.getEmailsNeedingReply().length,
      upcomingEvents: this.getUpcomingEvents(1).length, // Next 24 hours
      overdueTasks: this.getOverdueTasks().length,
      urgentItems: this.getItemsByUrgency('urgent').length
    };
    return stats;
  }
}

// Create global instance
const dataManager = new DataManager();