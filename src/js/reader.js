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
    this.createReaderOverlay();
    this.setupEventListeners();
    this.initialized = true;
  }

  createReaderOverlay() {
    this.readerOverlay = document.createElement('div');
    this.readerOverlay.id = 'readerOverlay';
    this.readerOverlay.className = 'hidden fixed inset-0 z-[100] bg-slate-950';
    this.readerOverlay.innerHTML = `
      <!-- Reader Header -->
      <div class="reader-header fixed top-0 left-0 right-0 z-10 bg-slate-950/95 backdrop-blur border-b border-white/10">
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-3">
            <button id="readerBack" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
              <i data-lucide="arrow-left" class="w-4 h-4 text-slate-300"></i>
            </button>
            <div class="flex-1 min-w-0">
              <h1 id="readerTitle" class="text-[15px] font-medium text-slate-100 truncate">Loading...</h1>
              <p id="readerMeta" class="text-[12px] text-slate-400">Preparing article</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="readerBookmark" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
              <i data-lucide="bookmark" class="w-4 h-4 text-slate-300"></i>
            </button>
            <button id="readerShare" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
              <i data-lucide="share" class="w-4 h-4 text-slate-300"></i>
            </button>
            <button id="readerClose" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
              <i data-lucide="x" class="w-4 h-4 text-slate-300"></i>
            </button>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="h-1 bg-white/5">
          <div id="readerProgress" class="h-full bg-cyan-400 transition-all duration-300 ease-out" style="width: 0%"></div>
        </div>
      </div>

      <!-- Reader Content -->
      <div class="reader-content pt-16 pb-8">
        <div class="max-w-3xl mx-auto px-4">
          <!-- Loading State -->
          <div id="readerLoading" class="flex flex-col items-center justify-center py-20">
            <div class="w-12 h-12 rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20 flex items-center justify-center mb-4">
              <i data-lucide="book-open" class="w-6 h-6 text-cyan-300 animate-pulse"></i>
            </div>
            <h3 class="text-[16px] font-medium text-slate-100 mb-2">Loading Article</h3>
            <p class="text-[14px] text-slate-400 text-center">Fetching content and preparing for reading...</p>
            <div class="mt-4 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <div class="h-full bg-cyan-400 rounded-full animate-pulse" style="width: 60%"></div>
            </div>
          </div>

          <!-- Error State -->
          <div id="readerError" class="hidden flex flex-col items-center justify-center py-20">
            <div class="w-12 h-12 rounded-lg bg-rose-500/10 ring-1 ring-rose-500/20 flex items-center justify-center mb-4">
              <i data-lucide="alert-circle" class="w-6 h-6 text-rose-300"></i>
            </div>
            <h3 class="text-[16px] font-medium text-slate-100 mb-2">Unable to Load Article</h3>
            <p class="text-[14px] text-slate-400 text-center mb-4">This article couldn't be loaded. You can still open it in a new tab.</p>
            <button id="readerOpenOriginal" class="inline-flex items-center gap-2 text-[14px] px-4 py-2 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-500/25">
              <i data-lucide="external-link" class="w-4 h-4"></i>
              Open Original
            </button>
          </div>

          <!-- Article Content -->
          <div id="readerArticle" class="hidden">
            <article class="prose prose-invert max-w-none">
              <div id="articleContent"></div>
            </article>
          </div>
        </div>
      </div>

      <!-- Reader Footer -->
      <div class="reader-footer fixed bottom-0 left-0 right-0 z-10 bg-slate-950/95 backdrop-blur border-t border-white/10">
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <i data-lucide="clock" class="w-4 h-4 text-slate-400"></i>
              <span id="readerTime" class="text-[12px] text-slate-400">0 min read</span>
            </div>
            <div class="flex items-center gap-2">
              <i data-lucide="eye" class="w-4 h-4 text-slate-400"></i>
              <span id="readerProgressText" class="text-[12px] text-slate-400">0% read</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="readerFontSize" class="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10">
              <i data-lucide="type" class="w-3.5 h-3.5"></i>
              <span>Medium</span>
            </button>
            <button id="readerTheme" class="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10">
              <i data-lucide="moon" class="w-3.5 h-3.5"></i>
              <span>Dark</span>
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.readerOverlay);
    this.contentContainer = document.getElementById('articleContent');
    this.progressBar = document.getElementById('readerProgress');
  }

  setupEventListeners() {
    // Close reader
    document.getElementById('readerBack')?.addEventListener('click', () => this.closeReader());
    document.getElementById('readerClose')?.addEventListener('click', () => this.closeReader());
    
    // Reader controls
    document.getElementById('readerBookmark')?.addEventListener('click', () => this.toggleBookmark());
    document.getElementById('readerShare')?.addEventListener('click', () => this.shareArticle());
    document.getElementById('readerOpenOriginal')?.addEventListener('click', () => this.openOriginal());
    
    // Reading settings
    document.getElementById('readerFontSize')?.addEventListener('click', () => this.toggleFontSize());
    document.getElementById('readerTheme')?.addEventListener('click', () => this.toggleTheme());
    
    // Scroll tracking for progress
    this.readerOverlay.addEventListener('scroll', () => this.updateReadingProgress());
    
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
    
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (!data.contents) {
      throw new Error('Could not fetch article content');
    }
    
    // Parse the HTML and extract main content
    return this.extractArticleContent(data.contents);
  }

  extractArticleContent(html) {
    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Try to find the main article content
    const selectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content',
      'main'
    ];
    
    let content = null;
    for (const selector of selectors) {
      content = doc.querySelector(selector);
      if (content) break;
    }
    
    // Fallback to body if no specific content found
    if (!content) {
      content = doc.body;
    }
    
    // Clean up the content
    this.cleanArticleContent(content);
    
    return content.innerHTML;
  }

  cleanArticleContent(element) {
    // Remove unwanted elements
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      '.advertisement',
      '.ads',
      '.social-share',
      '.comments',
      '.related-articles'
    ];
    
    unwantedSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Clean up attributes
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      // Remove most attributes except essential ones
      const allowedAttrs = ['href', 'src', 'alt', 'title'];
      Array.from(el.attributes).forEach(attr => {
        if (!allowedAttrs.includes(attr.name)) {
          el.removeAttribute(attr.name);
        }
      });
    });
  }

  displayArticle(content, item) {
    // Hide loading state
    document.getElementById('readerLoading').classList.add('hidden');
    
    // Show article content
    const articleElement = document.getElementById('readerArticle');
    articleElement.classList.remove('hidden');
    
    // Set content
    this.contentContainer.innerHTML = content;
    
    // Estimate reading time
    const readingTime = this.estimateReadingTime(content);
    document.getElementById('readerTime').textContent = `${readingTime} min read`;
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Start progress tracking
    this.updateReadingProgress();
  }

  showLoadingState() {
    document.getElementById('readerLoading').classList.remove('hidden');
    document.getElementById('readerError').classList.add('hidden');
    document.getElementById('readerArticle').classList.add('hidden');
  }

  showErrorState() {
    document.getElementById('readerLoading').classList.add('hidden');
    document.getElementById('readerError').classList.remove('hidden');
    document.getElementById('readerArticle').classList.add('hidden');
  }

  updateReaderHeader(item) {
    document.getElementById('readerTitle').textContent = item.title;
    document.getElementById('readerMeta').textContent = `From ${new URL(item.url).hostname}`;
  }

  estimateReadingTime(content) {
    // Remove HTML tags and count words
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).length;
    
    // Average reading speed: 200 words per minute
    const minutes = Math.ceil(words / 200);
    return Math.max(1, minutes);
  }

  updateReadingProgress() {
    if (!this.isReading) return;
    
    const scrollTop = this.readerOverlay.scrollTop;
    const scrollHeight = this.readerOverlay.scrollHeight - this.readerOverlay.clientHeight;
    const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
    
    this.progressBar.style.width = `${progress}%`;
    document.getElementById('readerProgressText').textContent = `${Math.round(progress)}% read`;
    
    // Update item progress in data manager
    if (window.dataManager && this.currentItem) {
      window.dataManager.updateItemProgress(this.currentItem.id, progress / 100);
    }
  }

  startReadingTimer() {
    this.readingTime = 0;
    this.timerInterval = setInterval(() => {
      this.readingTime = Math.floor((Date.now() - this.startTime) / 1000);
    }, 1000);
  }

  stopReadingTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  closeReader() {
    this.isReading = false;
    this.stopReadingTimer();
    
    // Hide reader overlay
    this.readerOverlay.classList.add('hidden');
    
    // Reset state
    this.currentItem = null;
    this.readingTime = 0;
    this.startTime = null;
    
    // Reset progress
    this.progressBar.style.width = '0%';
    
    // Refresh the current screen to show updated progress
    if (window.navigationManager) {
      const currentScreen = window.navigationManager.getCurrentScreen();
      window.navigationManager.onScreenChange(currentScreen);
    }
  }

  toggleBookmark() {
    if (!this.currentItem) return;
    
    // Toggle bookmark state (you could add a bookmark field to items)
    const bookmarkBtn = document.getElementById('readerBookmark');
    const icon = bookmarkBtn.querySelector('i');
    
    if (icon.getAttribute('data-lucide') === 'bookmark') {
      icon.setAttribute('data-lucide', 'bookmark-check');
      icon.classList.add('text-cyan-300');
      // Add bookmark logic here
    } else {
      icon.setAttribute('data-lucide', 'bookmark');
      icon.classList.remove('text-cyan-300');
      // Remove bookmark logic here
    }
    
    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  shareArticle() {
    if (!this.currentItem) return;
    
    if (navigator.share) {
      navigator.share({
        title: this.currentItem.title,
        url: this.currentItem.url
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(this.currentItem.url);
      this.showSuccessFeedback('Link copied to clipboard');
    }
  }

  openOriginal() {
    if (this.currentItem && this.currentItem.url) {
      window.open(this.currentItem.url, '_blank', 'noopener');
    }
  }

  toggleFontSize() {
    const fontSizeBtn = document.getElementById('readerFontSize');
    const sizes = ['Small', 'Medium', 'Large'];
    const currentSize = fontSizeBtn.querySelector('span').textContent;
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    const nextSize = sizes[nextIndex];
    
    fontSizeBtn.querySelector('span').textContent = nextSize;
    
    // Apply font size
    const article = document.getElementById('readerArticle');
    const sizeClasses = {
      'Small': 'text-sm',
      'Medium': 'text-base',
      'Large': 'text-lg'
    };
    
    // Remove existing size classes
    Object.values(sizeClasses).forEach(cls => article.classList.remove(cls));
    // Add new size class
    article.classList.add(sizeClasses[nextSize]);
  }

  toggleTheme() {
    const themeBtn = document.getElementById('readerTheme');
    const icon = themeBtn.querySelector('i');
    const span = themeBtn.querySelector('span');
    
    if (icon.getAttribute('data-lucide') === 'moon') {
      // Switch to light theme
      icon.setAttribute('data-lucide', 'sun');
      span.textContent = 'Light';
      this.readerOverlay.classList.add('light-theme');
    } else {
      // Switch to dark theme
      icon.setAttribute('data-lucide', 'moon');
      span.textContent = 'Dark';
      this.readerOverlay.classList.remove('light-theme');
    }
    
    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  showSuccessFeedback(message) {
    // Create temporary success message
    const feedback = document.createElement('div');
    feedback.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[110] bg-emerald-500/90 text-white px-4 py-2 rounded-lg text-sm font-medium';
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
}

// Create global instance
const readerManager = new ReaderManager();
