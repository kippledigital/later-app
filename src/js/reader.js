// Reader overlay for full-screen article reading
class ReaderManager {
  constructor() {
    this.currentItem = null;
    this.readerOverlay = null;
    this.contentContainer = null;
    this.progressBar = null;
    this.readingTime = 0;
    this.startTime = null;
    this.isReading = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.setupReaderElements();
    this.setupEventListeners();
    this.initialized = true;
  }

  setupReaderElements() {
    // Use existing HTML elements from index.html
    this.readerOverlay = document.getElementById('readerOverlay');
    this.contentContainer = document.getElementById('readerArticle');
    this.progressBar = document.getElementById('readerProgress');
    
    if (!this.readerOverlay) {
      console.error('Reader overlay element not found in HTML');
      return;
    }
    
    console.log('Reader elements found:', {
      overlay: !!this.readerOverlay,
      content: !!this.contentContainer,
      progress: !!this.progressBar
    });
  }

  setupEventListeners() {
    // Close reader
    document.getElementById('readerBack')?.addEventListener('click', () => this.closeReader());
    document.getElementById('readerClose')?.addEventListener('click', () => this.closeReader());
    
    // Reader controls
    document.getElementById('readerBookmark')?.addEventListener('click', () => this.toggleBookmark());
    document.getElementById('readerShare')?.addEventListener('click', () => this.shareArticle());
    document.getElementById('readerOriginal')?.addEventListener('click', () => this.openOriginal());
    
    // Reading settings
    document.getElementById('readerFontSize')?.addEventListener('click', () => this.toggleFontSize());
    document.getElementById('readerTheme')?.addEventListener('click', () => this.toggleTheme());
    
    // Retry button
    document.getElementById('readerRetry')?.addEventListener('click', () => {
      if (this.currentItem) {
        this.openReader(this.currentItem);
      }
    });
    
    // Scroll tracking for progress
    if (this.readerOverlay) {
      this.readerOverlay.addEventListener('scroll', () => this.updateReadingProgress());
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.isReading) return;
      
      if (e.key === 'Escape') {
        this.closeReader();
      } else if (e.key === 'b' && e.ctrlKey) {
        e.preventDefault();
        this.toggleBookmark();
      }
    });
  }

  async openReader(item) {
    if (!item || !item.url) {
      console.error('No item or URL provided to reader');
      return;
    }

    console.log('Opening reader for item:', item);

    this.currentItem = item;
    this.isReading = true;
    this.startTime = Date.now();
    
    // Show reader overlay
    this.readerOverlay.classList.remove('hidden');
    this.showLoadingState();
    
    // Update header with item info
    this.updateReaderHeader(item);
    
    try {
      // Load article content
      const content = await this.loadArticleContent(item.url);
      this.displayArticle(content, item);
      this.startReadingTimer();
    } catch (error) {
      console.error('Error loading article:', error);
      this.showErrorState();
    }
  }

  async loadArticleContent(url) {
    // For demo purposes, we'll create a proxy service
    // In a real app, you'd use a service like Mercury Parser or Readability
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    try {
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        return this.parseArticleContent(data.contents);
      } else {
        throw new Error('No content received');
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  }

  parseArticleContent(html) {
    // Simple HTML parsing - in a real app you'd use a proper parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Try to find the main content
    const article = doc.querySelector('article') || 
                   doc.querySelector('.post-content') || 
                   doc.querySelector('.entry-content') || 
                   doc.querySelector('main') || 
                   doc.querySelector('.content') ||
                   doc.body;
    
    // Clean up the content
    const content = article.cloneNode(true);
    
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 
      '.advertisement', '.ads', '.social-share', '.comments'
    ];
    
    unwantedSelectors.forEach(selector => {
      const elements = content.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    return content.innerHTML;
  }

  displayArticle(content, item) {
    this.hideLoadingState();
    this.hideErrorState();
    
    // Update content
    this.contentContainer.innerHTML = content;
    this.contentContainer.classList.remove('hidden');
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Update reading time estimate
    const readingTime = this.estimateReadingTime(content);
    const timeElement = document.getElementById('readerTime');
    if (timeElement) {
      timeElement.textContent = `${readingTime} min read`;
    }
    
    // Start progress tracking
    this.updateReadingProgress();
  }

  updateReaderHeader(item) {
    const titleElement = document.getElementById('readerTitle');
    const urlElement = document.getElementById('readerUrl');
    
    if (titleElement) {
      titleElement.textContent = item.title;
    }
    
    if (urlElement) {
      urlElement.textContent = new URL(item.url).hostname;
    }
  }

  showLoadingState() {
    const loading = document.getElementById('readerLoading');
    const error = document.getElementById('readerError');
    const article = document.getElementById('readerArticle');
    
    if (loading) loading.classList.remove('hidden');
    if (error) error.classList.add('hidden');
    if (article) article.classList.add('hidden');
  }

  hideLoadingState() {
    const loading = document.getElementById('readerLoading');
    if (loading) loading.classList.add('hidden');
  }

  showErrorState() {
    const loading = document.getElementById('readerLoading');
    const error = document.getElementById('readerError');
    const article = document.getElementById('readerArticle');
    
    if (loading) loading.classList.add('hidden');
    if (error) error.classList.remove('hidden');
    if (article) article.classList.add('hidden');
  }

  hideErrorState() {
    const error = document.getElementById('readerError');
    if (error) error.classList.add('hidden');
  }

  closeReader() {
    this.readerOverlay.classList.add('hidden');
    this.isReading = false;
    this.currentItem = null;
    this.startTime = null;
    
    // Reset progress
    if (this.progressBar) {
      this.progressBar.style.width = '0%';
    }
  }

  startReadingTimer() {
    this.startTime = Date.now();
  }

  updateReadingProgress() {
    if (!this.isReading || !this.progressBar) return;
    
    const scrollTop = this.readerOverlay.scrollTop;
    const scrollHeight = this.readerOverlay.scrollHeight;
    const clientHeight = this.readerOverlay.clientHeight;
    
    const progress = Math.min(100, (scrollTop / (scrollHeight - clientHeight)) * 100);
    this.progressBar.style.width = `${progress}%`;
    
    // Update progress text
    const progressText = document.getElementById('readerProgressText');
    if (progressText) {
      progressText.textContent = `${Math.round(progress)}% read`;
    }
  }

  estimateReadingTime(content) {
    // Simple word count estimation
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).length;
    const wordsPerMinute = 200;
    return Math.max(1, Math.round(words / wordsPerMinute));
  }

  toggleTheme() {
    // Toggle between dark and light theme
    const themeBtn = document.getElementById('readerTheme');
    const icon = themeBtn?.querySelector('i');
    
    if (this.readerOverlay.classList.contains('light-theme')) {
      this.readerOverlay.classList.remove('light-theme');
      if (icon) icon.setAttribute('data-lucide', 'sun');
    } else {
      this.readerOverlay.classList.add('light-theme');
      if (icon) icon.setAttribute('data-lucide', 'moon');
    }
    
    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  toggleFontSize() {
    // Cycle through font sizes
    const fontSizeBtn = document.getElementById('readerFontSize');
    const span = fontSizeBtn?.querySelector('span');
    
    const sizes = ['Small', 'Medium', 'Large'];
    const currentSize = span?.textContent || 'Medium';
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    const nextSize = sizes[nextIndex];
    
    if (span) span.textContent = nextSize;
    
    // Apply font size class
    this.contentContainer.className = this.contentContainer.className.replace(/text-(sm|base|lg)/, '');
    this.contentContainer.classList.add(`text-${nextSize.toLowerCase()}`);
  }

  toggleBookmark() {
    if (!this.currentItem) return;
    
    // Toggle bookmark state
    this.currentItem.bookmarked = !this.currentItem.bookmarked;
    
    // Update bookmark button
    const bookmarkBtn = document.getElementById('readerBookmark');
    const icon = bookmarkBtn?.querySelector('i');
    
    if (this.currentItem.bookmarked) {
      if (icon) icon.setAttribute('data-lucide', 'bookmark-check');
      this.showSuccessFeedback('Bookmarked!');
    } else {
      if (icon) icon.setAttribute('data-lucide', 'bookmark');
      this.showSuccessFeedback('Bookmark removed');
    }
    
    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Save to localStorage
    window.dataManager.updateItem(this.currentItem.id, { bookmarked: this.currentItem.bookmarked });
  }

  shareArticle() {
    if (!this.currentItem) return;
    
    if (navigator.share) {
      navigator.share({
        title: this.currentItem.title,
        text: this.currentItem.content,
        url: this.currentItem.url
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(this.currentItem.url).then(() => {
        this.showSuccessFeedback('Link copied to clipboard!');
      });
    }
  }

  openOriginal() {
    if (this.currentItem?.url) {
      window.open(this.currentItem.url, '_blank', 'noopener');
    }
  }

  showSuccessFeedback(message) {
    // Create a temporary toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[110] bg-slate-900 text-slate-100 px-4 py-2 rounded-lg ring-1 ring-white/10 backdrop-blur';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }
}

// Create global instance
const readerManager = new ReaderManager();