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

  // Save a new item
  saveItem(itemData) {
    const item = {
      id: this.generateId(),
      title: itemData.title || '',
      content: itemData.content || '',
      url: itemData.url || '',
      category: itemData.category || 'work',
      state: itemData.state || 'inbox',
      createdAt: new Date().toISOString(),
      progress: itemData.progress || 0
    };

    this.items.unshift(item);
    this.saveItems();
    return item;
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
      item.state = newState;
      this.saveItems();
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
      return true;
    }
    return false;
  }

  // Update item progress
  updateItemProgress(id, progress) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      item.progress = Math.max(0, Math.min(1, progress));
      this.saveItems();
      return true;
    }
    return false;
  }

  // Delete item
  deleteItem(id) {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.saveItems();
      return true;
    }
    return false;
  }

  // Get item by ID
  getItem(id) {
    return this.items.find(item => item.id === id);
  }

  // Get stats for dashboard
  getStats() {
    const stats = {
      inbox: this.getItems('inbox').length,
      library: this.getItems('library').length,
      work: this.getItems('library', 'work').length,
      life: this.getItems('library', 'life').length,
      inspiration: this.getItems('library', 'inspiration').length
    };
    return stats;
  }
}

// Create global instance
const dataManager = new DataManager();