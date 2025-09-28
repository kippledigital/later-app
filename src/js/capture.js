// Quick Capture modal management
class CaptureManager {
  constructor() {
    this.modal = null;
    this.form = null;
    this.backdrop = null;
    this.sheet = null;
    this.closeBtn = null;
    this.cancelBtn = null;
    this.fabBtn = null;
    this.selectedTag = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    // Get DOM elements
    this.modal = document.getElementById('captureModal');
    this.form = document.getElementById('captureForm');
    this.backdrop = document.getElementById('captureBackdrop');
    this.sheet = document.getElementById('captureSheet');
    this.closeBtn = document.getElementById('captureClose');
    this.cancelBtn = document.getElementById('capCancel');
    this.fabBtn = document.getElementById('fabCapture');
    
    this.setupEventListeners();
    this.setupTagSelection();
    this.initialized = true;
  }

  setupEventListeners() {
    // Open modal
    this.fabBtn?.addEventListener('click', () => this.openModal());
    
    // Close modal
    this.closeBtn?.addEventListener('click', () => this.closeModal());
    this.cancelBtn?.addEventListener('click', () => this.closeModal());
    this.backdrop?.addEventListener('click', () => this.closeModal());
    
    // Form submission
    this.form?.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.closeModal();
      }
    });
  }

  setupTagSelection() {
    const tagButtons = document.querySelectorAll('#capTagGroup button[data-tag]');
    tagButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove selection from all buttons
        tagButtons.forEach(b => {
          b.setAttribute('aria-checked', 'false');
          b.classList.remove('bg-cyan-500/15', 'text-cyan-300', 'ring-cyan-500/25');
          b.classList.add('text-slate-300');
        });
        
        // Select clicked button
        btn.setAttribute('aria-checked', 'true');
        btn.classList.add('bg-cyan-500/15', 'text-cyan-300', 'ring-cyan-500/25');
        btn.classList.remove('text-slate-300');
        
        this.selectedTag = btn.dataset.tag;
      });
    });
  }

  openModal() {
    if (!this.modal) return;
    
    this.modal.classList.remove('hidden');
    this.modal.setAttribute('aria-expanded', 'true');
    
    // Reset form
    this.resetForm();
    
    // Animate in
    requestAnimationFrame(() => {
      this.backdrop.classList.remove('opacity-0');
      this.backdrop.classList.add('opacity-100');
      this.sheet.classList.remove('translate-y-6', 'sm:translate-y-0', 'sm:scale-[0.98]', 'opacity-0');
      this.sheet.classList.add('translate-y-0', 'sm:scale-100', 'opacity-100');
    });
    
    // Focus first input
    const titleInput = document.getElementById('capTitle');
    if (titleInput) {
      setTimeout(() => titleInput.focus(), 100);
    }
  }

  closeModal() {
    if (!this.modal || this.modal.classList.contains('hidden')) return;
    
    // Animate out
    this.backdrop.classList.remove('opacity-100');
    this.backdrop.classList.add('opacity-0');
    this.sheet.classList.remove('translate-y-0', 'sm:scale-100', 'opacity-100');
    this.sheet.classList.add('translate-y-6', 'sm:translate-y-0', 'sm:scale-[0.98]', 'opacity-0');
    
    setTimeout(() => {
      this.modal.classList.add('hidden');
      this.modal.setAttribute('aria-expanded', 'false');
    }, 200);
  }

  resetForm() {
    if (!this.form) return;
    
    this.form.reset();
    this.selectedTag = null;
    
    // Reset tag selection
    const tagButtons = document.querySelectorAll('#capTagGroup button[data-tag]');
    tagButtons.forEach(btn => {
      btn.setAttribute('aria-checked', 'false');
      btn.classList.remove('bg-cyan-500/15', 'text-cyan-300', 'ring-cyan-500/25');
      btn.classList.add('text-slate-300');
    });
    
    // Clear errors
    const errorElements = document.querySelectorAll('[id$="Err"]');
    errorElements.forEach(el => {
      el.classList.add('hidden');
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(this.form);
    const title = formData.get('title')?.trim();
    const notes = formData.get('notes')?.trim();
    const url = formData.get('url')?.trim();
    
    // Validate title
    if (!title) {
      this.showError('capTitleErr', 'Please enter a title.');
      return;
    }
    
    // Create item
    const itemData = {
      title,
      content: notes,
      url,
      category: this.selectedTag || 'work',
      state: 'inbox'
    };
    
    // Save item
    if (window.dataManager) {
      const savedItem = window.dataManager.saveItem(itemData);
      
      // Close modal
      this.closeModal();
      
      // Refresh current screen
      if (window.navigationManager) {
        const currentScreen = window.navigationManager.getCurrentScreen();
        window.navigationManager.onScreenChange(currentScreen);
      }
      
      // Show success feedback
      this.showSuccessFeedback();
    }
  }

  showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  showSuccessFeedback() {
    // Simple success feedback - could be enhanced with toast notifications
    console.log('Item saved successfully!');
  }

  isOpen() {
    return this.modal && !this.modal.classList.contains('hidden');
  }
}

// Create global instance
const captureManager = new CaptureManager();
