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
    this.currentSummary = null;
    this.showingSummary = false;
    this.originalContent = null;
    this.swipeStartX = 0;
    this.swipeStartY = 0;
    this.isSwipeActive = false;
    this.highlights = new Map(); // Store highlights by item ID
    this.notes = new Map(); // Store notes by item ID
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

    // Summary toggle
    document.getElementById('toggleSummary')?.addEventListener('click', () => this.toggleSummaryView());

    // Summary loading original link
    document.getElementById('summaryLoadingOriginal')?.addEventListener('click', () => this.openOriginal());

    // Content interaction tools
    document.getElementById('highlightTool')?.addEventListener('click', () => this.highlightSelection());
    document.getElementById('noteTool')?.addEventListener('click', () => this.addNoteToSelection());
    document.getElementById('copyTool')?.addEventListener('click', () => this.copySelection());
    document.getElementById('clearSelection')?.addEventListener('click', () => this.clearSelection());

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

    // Swipe navigation setup
    this.setupSwipeNavigation();

    // Text selection monitoring
    this.setupTextSelection();
    
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
    this.showingSummary = false;

    // Show reader overlay
    this.readerOverlay.classList.remove('hidden');

    // Update header with item info
    this.updateReaderHeader(item);

    // Check if we have a cached summary first
    const cached = this.getCachedSummary(item.url);
    if (cached && cached.summary) {
      // We have a summary - show it immediately
      this.currentSummary = cached.summary;
      this.originalContent = cached.content || '';
      this.showSummaryToggle();
      this.showingSummary = true;
      this.displaySummary();
      this.updateSummaryToggle();
      this.startReadingTimer();
      return;
    }

    // No summary available - show loading with option to go to original
    this.showSummaryLoadingState();

    try {
      // Load article content in background
      const content = await this.loadArticleContent(item.url);
      this.originalContent = content;

      // Generate AI summary
      await this.generateSummaryAndShow(content, item.url);
    } catch (error) {
      console.error('Error loading article:', error);
      this.showErrorState();
    }
  }

  async loadArticleContent(url) {
    // Check if we have cached summary for this URL
    const cached = this.getCachedSummary(url);
    if (cached && cached.content) {
      return cached.content;
    }

    // Use proxy service to fetch article content
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    try {
      const response = await fetch(proxyUrl);
      const data = await response.json();

      if (data.contents) {
        return this.parseArticleContent(data.contents, url);
      } else {
        throw new Error('No content received');
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  }

  parseArticleContent(html, url) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract images and metadata first
    const metadata = this.extractArticleMetadata(doc, url);

    // Use Readability.js for better content extraction
    if (typeof Readability !== 'undefined') {
      try {
        const reader = new Readability(doc, {
          debug: false,
          maxElemsToParse: 0,
          nbTopCandidates: 5,
          wordThreshold: 500,
          classesToPreserve: ['highlight', 'quote', 'callout']
        });

        const article = reader.parse();
        if (article && article.content) {
          // Cache the cleaned content with metadata
          this.cacheContentWithMetadata(url, article.content, article.textContent, metadata);
          return article.content;
        }
      } catch (error) {
        console.warn('Readability parsing failed, falling back to manual parsing:', error);
      }
    }

    // Fallback to manual parsing if Readability fails
    const article = doc.querySelector('article') ||
                   doc.querySelector('.post-content') ||
                   doc.querySelector('.entry-content') ||
                   doc.querySelector('main') ||
                   doc.querySelector('.content') ||
                   doc.body;

    const content = article.cloneNode(true);

    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer',
      '.advertisement', '.ads', '.social-share', '.comments',
      '.sidebar', '.menu', '.navigation'
    ];

    unwantedSelectors.forEach(selector => {
      const elements = content.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    const cleanedContent = content.innerHTML;
    this.cacheContentWithMetadata(url, cleanedContent, content.textContent, metadata);
    return cleanedContent;
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

    // Load any saved highlights for this article
    this.loadHighlights();
    
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
    const summary = document.getElementById('readerSummary');
    const summaryLoading = document.getElementById('summaryLoading');

    if (loading) loading.classList.remove('hidden');
    if (error) error.classList.add('hidden');
    if (article) article.classList.add('hidden');
    if (summary) summary.classList.add('hidden');
    if (summaryLoading) summaryLoading.classList.add('hidden');
  }

  showSummaryLoadingState() {
    const loading = document.getElementById('readerLoading');
    const error = document.getElementById('readerError');
    const article = document.getElementById('readerArticle');
    const summary = document.getElementById('readerSummary');
    const summaryLoading = document.getElementById('summaryLoading');

    if (loading) loading.classList.add('hidden');
    if (error) error.classList.add('hidden');
    if (article) article.classList.add('hidden');
    if (summary) summary.classList.add('hidden');
    if (summaryLoading) summaryLoading.classList.remove('hidden');
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
    this.currentSummary = null;
    this.showingSummary = false;
    this.originalContent = null;

    // Reset progress
    if (this.progressBar) {
      this.progressBar.style.width = '0%';
    }

    // Hide summary toggle
    const summaryToggle = document.getElementById('summaryToggle');
    if (summaryToggle) {
      summaryToggle.classList.add('hidden');
      summaryToggle.classList.remove('flex');
    }

    // Hide summary stats
    const summaryStats = document.getElementById('summaryStats');
    if (summaryStats) {
      summaryStats.classList.add('hidden');
      summaryStats.classList.remove('flex');
    }

    // Reset content views
    document.getElementById('readerSummary')?.classList.add('hidden');
    document.getElementById('readerArticle')?.classList.add('hidden');
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

  // AI Summary Methods
  async generateSummary(content, url) {
    if (!content || !aiService) return;

    try {
      // Check if we already have a cached summary
      const cached = this.getCachedSummary(url);
      if (cached && cached.summary) {
        this.currentSummary = cached.summary;
        this.showSummaryToggle();
        // Default to summary view when available
        this.showingSummary = true;
        setTimeout(() => {
          this.displaySummary();
          this.updateSummaryToggle();
        }, 100);
        return;
      }

      // Generate new summary
      const summary = await aiService.generateSummary(content, url);
      this.currentSummary = summary;

      // Cache the summary
      this.cacheSummary(url, summary, content);

      // Update item in database if it exists
      if (this.currentItem && dataManager) {
        dataManager.updateItemSummary(this.currentItem.id, {
          summary: summary.tldr, // Store TLDR as the main summary
          readingTime: summary.readingTime
        });
      }

      // Show summary toggle button and default to summary view
      this.showSummaryToggle();
      this.showingSummary = true;
      this.displaySummary();
      this.updateSummaryToggle();

      console.log('Summary generated:', summary);
    } catch (error) {
      console.error('Error generating summary:', error);
    }
  }

  async generateSummaryAndShow(content, url) {
    if (!content || !aiService) return;

    try {
      // Generate new summary
      const summary = await aiService.generateSummary(content, url);
      this.currentSummary = summary;

      // Cache the summary
      this.cacheSummary(url, summary, content);

      // Update item in database if it exists
      if (this.currentItem && dataManager) {
        dataManager.updateItemSummary(this.currentItem.id, {
          summary: summary.tldr,
          readingTime: summary.readingTime
        });
      }

      // Hide loading and show summary
      document.getElementById('summaryLoading')?.classList.add('hidden');
      this.showSummaryToggle();
      this.showingSummary = true;
      this.displaySummary();
      this.updateSummaryToggle();
      this.startReadingTimer();

      console.log('Summary generated and displayed:', summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      this.showErrorState();
    }
  }

  toggleSummaryView() {
    if (!this.currentSummary) return;

    this.showingSummary = !this.showingSummary;

    if (this.showingSummary) {
      this.displaySummary();
    } else {
      this.displayFullArticle();
    }

    this.updateSummaryToggle();
  }

  displaySummary() {
    // Hide full article
    document.getElementById('readerArticle').classList.add('hidden');

    // Show summary
    const summaryContainer = document.getElementById('readerSummary');
    summaryContainer.classList.remove('hidden');

    // Populate summary content
    this.populateSummaryContent();

    // Update reading time
    this.updateReadingTimes();

    // Reset scroll position
    this.readerOverlay.scrollTop = 0;
  }

  displayFullArticle() {
    // Hide summary
    document.getElementById('readerSummary').classList.add('hidden');

    // Show full article
    document.getElementById('readerArticle').classList.remove('hidden');

    // Update reading time
    this.updateReadingTimes();

    // Reset scroll position
    this.readerOverlay.scrollTop = 0;
  }

  populateSummaryContent() {
    const summary = this.currentSummary;

    // TLDR
    const tldrElement = document.getElementById('summaryTldr');
    if (tldrElement) {
      tldrElement.textContent = summary.tldr;
    }

    // Key Points
    const keyPointsElement = document.getElementById('summaryKeyPoints');
    if (keyPointsElement && summary.keyPoints) {
      keyPointsElement.innerHTML = '';
      summary.keyPoints.forEach(point => {
        const li = document.createElement('li');
        li.className = 'flex items-start gap-3 text-[14px] text-slate-300 bg-white/5 ring-1 ring-white/10 rounded-lg p-3';
        li.innerHTML = `
          <div class="w-5 h-5 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <i data-lucide="check" class="w-3 h-3 text-emerald-300"></i>
          </div>
          <span class="leading-relaxed">${point}</span>
        `;
        keyPointsElement.appendChild(li);
      });
    }

    // Core Ideas
    const coreIdeasElement = document.getElementById('summaryCoreIdeas');
    if (coreIdeasElement && summary.coreIdeas) {
      const paragraphs = summary.coreIdeas.split('\n\n');
      coreIdeasElement.innerHTML = '';
      paragraphs.forEach(paragraph => {
        if (paragraph.trim()) {
          const p = document.createElement('p');
          p.textContent = paragraph.trim();
          coreIdeasElement.appendChild(p);
        }
      });
    }

    // Key Quotes
    const quotesElement = document.getElementById('summaryQuotes');
    if (quotesElement && summary.keyQuotes) {
      quotesElement.innerHTML = '';
      summary.keyQuotes.forEach(quote => {
        const div = document.createElement('div');
        div.className = 'border-l-4 border-amber-500/30 bg-white/5 ring-1 ring-white/10 rounded-r-lg pl-4 pr-3 py-3';
        div.innerHTML = `
          <blockquote class="text-[14px] text-slate-300 italic leading-relaxed">
            "${quote}"
          </blockquote>
        `;
        quotesElement.appendChild(div);
      });
    }

    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  showSummaryToggle() {
    const toggle = document.getElementById('summaryToggle');
    if (toggle) {
      toggle.classList.remove('hidden');
      toggle.classList.add('flex');
    }
  }

  updateSummaryToggle() {
    const toggleText = document.getElementById('toggleText');
    const toggleIcon = document.getElementById('toggleSummary').querySelector('i');

    if (this.showingSummary) {
      toggleText.textContent = 'Full Article';
      toggleIcon.setAttribute('data-lucide', 'file-text');
    } else {
      toggleText.textContent = 'Summary';
      toggleIcon.setAttribute('data-lucide', 'zap');
    }

    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  updateReadingTimes() {
    const summary = this.currentSummary;
    if (!summary || !summary.readingTime) return;

    const fullTimeElement = document.getElementById('readerTime');
    const summaryTimeElement = document.getElementById('summaryTime');
    const summaryStats = document.getElementById('summaryStats');

    if (fullTimeElement) {
      const timeText = this.showingSummary
        ? `${summary.readingTime.summary} min read`
        : `${summary.readingTime.full} min read`;
      fullTimeElement.textContent = timeText;
    }

    if (summaryTimeElement && summaryStats) {
      summaryTimeElement.textContent = `${summary.readingTime.summary} min`;
      summaryStats.classList.remove('hidden');
      summaryStats.classList.add('flex');
    }
  }

  // LocalStorage Methods
  getCachedSummary(url) {
    try {
      const cached = localStorage.getItem(`summary_${this.hashUrl(url)}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error reading cached summary:', error);
      return null;
    }
  }

  cacheSummary(url, summary, content) {
    try {
      const cacheData = {
        summary,
        content,
        timestamp: Date.now(),
        url
      };
      localStorage.setItem(`summary_${this.hashUrl(url)}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching summary:', error);
    }
  }

  cacheContent(url, content, textContent) {
    try {
      const cacheData = {
        content,
        textContent,
        timestamp: Date.now(),
        url
      };
      localStorage.setItem(`content_${this.hashUrl(url)}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching content:', error);
    }
  }

  hashUrl(url) {
    // Simple hash function for URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Enhanced estimate reading time with actual content
  estimateReadingTime(content) {
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordsPerMinute = 200;
    return Math.max(1, Math.round(words.length / wordsPerMinute));
  }

  // Swipe Navigation
  setupSwipeNavigation() {
    const contentArea = document.getElementById('readerContent');
    if (!contentArea) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    contentArea.addEventListener('touchstart', (e) => {
      if (!this.currentSummary) return;

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      this.swipeStartX = touchStartX;
      this.swipeStartY = touchStartY;
    }, { passive: true });

    contentArea.addEventListener('touchmove', (e) => {
      if (!this.currentSummary) return;

      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - touchStartX;
      const deltaY = touchY - touchStartY;

      // Show swipe indicators if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
        this.showSwipeIndicator(deltaX > 0 ? 'right' : 'left');
      }
    }, { passive: true });

    contentArea.addEventListener('touchend', (e) => {
      if (!this.currentSummary) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const deltaTime = Date.now() - touchStartTime;

      this.hideSwipeIndicator();

      // Check for valid swipe (horizontal, fast enough, long enough)
      if (Math.abs(deltaX) > Math.abs(deltaY) && // More horizontal than vertical
          Math.abs(deltaX) > 100 && // Minimum distance
          deltaTime < 500) { // Maximum time

        if (deltaX > 0) {
          // Swipe right - go to summary if showing full article
          if (!this.showingSummary) {
            this.animateToSummary();
          }
        } else {
          // Swipe left - go to full article if showing summary
          if (this.showingSummary) {
            this.animateToFullArticle();
          }
        }
      }
    }, { passive: true });
  }

  showSwipeIndicator(direction) {
    let indicator = document.getElementById('swipeIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'swipeIndicator';
      indicator.className = 'fixed top-1/2 -translate-y-1/2 z-[100] px-4 py-2 rounded-full bg-cyan-500/20 ring-1 ring-cyan-500/40 backdrop-blur text-cyan-300 text-[14px] font-medium pointer-events-none transition-all duration-200';
      document.body.appendChild(indicator);
    }

    const isShowingSummary = this.showingSummary;

    if (direction === 'right' && !isShowingSummary) {
      indicator.innerHTML = '<i data-lucide="chevron-right" class="w-4 h-4 inline mr-1"></i>Summary';
      indicator.className = indicator.className.replace('left-4', '').replace('right-4', '') + ' right-4';
    } else if (direction === 'left' && isShowingSummary) {
      indicator.innerHTML = '<i data-lucide="chevron-left" class="w-4 h-4 inline mr-1"></i>Full Article';
      indicator.className = indicator.className.replace('left-4', '').replace('right-4', '') + ' left-4';
    } else {
      return; // Invalid swipe direction for current state
    }

    indicator.style.opacity = '1';
    indicator.style.transform = 'translateY(-50%) scale(1)';

    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  hideSwipeIndicator() {
    const indicator = document.getElementById('swipeIndicator');
    if (indicator) {
      indicator.style.opacity = '0';
      indicator.style.transform = 'translateY(-50%) scale(0.8)';
    }
  }

  animateToSummary() {
    this.showingSummary = true;
    this.displaySummary();
    this.updateSummaryToggle();
    this.addViewTransition('summary');
  }

  animateToFullArticle() {
    this.showingSummary = false;
    this.displayFullArticle();
    this.updateSummaryToggle();
    this.addViewTransition('article');
  }

  addViewTransition(viewType) {
    const content = document.getElementById('readerContent');
    if (!content) return;

    // Add transition effect
    content.style.transform = viewType === 'summary' ? 'translateX(-10px)' : 'translateX(10px)';
    content.style.opacity = '0.7';

    setTimeout(() => {
      content.style.transform = 'translateX(0)';
      content.style.opacity = '1';
    }, 150);
  }

  // Text Selection and Content Interaction
  setupTextSelection() {
    document.addEventListener('selectionchange', () => {
      this.handleSelectionChange();
    });

    // Enable text selection when tools are active
    document.addEventListener('mouseup', () => {
      setTimeout(() => this.handleSelectionChange(), 10);
    });
  }

  handleSelectionChange() {
    const selection = window.getSelection();
    const toolbar = document.getElementById('contentToolbar');
    const selectionInfo = document.getElementById('selectionInfo');

    if (!selection || !toolbar) return;

    const selectedText = selection.toString().trim();

    if (selectedText.length > 0 && this.isTextInReader(selection)) {
      // Show content toolbar
      toolbar.classList.remove('hidden');
      document.body.classList.add('content-tools-active');

      // Update selection info
      const wordCount = selectedText.split(/\s+/).length;
      if (selectionInfo) {
        selectionInfo.textContent = `${wordCount} word${wordCount === 1 ? '' : 's'} selected`;
      }
    } else {
      // Hide content toolbar if no other highlights exist
      if (!this.hasHighlights()) {
        toolbar.classList.add('hidden');
        document.body.classList.remove('content-tools-active');
      }

      if (selectionInfo) {
        selectionInfo.textContent = '';
      }
    }
  }

  isTextInReader(selection) {
    if (selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    const readerContent = document.querySelector('#readerOverlay .reader-content');

    return readerContent && readerContent.contains(range.commonAncestorContainer);
  }

  hasHighlights() {
    const articleId = this.currentItem?.id;
    return articleId && this.highlights.has(articleId) && this.highlights.get(articleId).length > 0;
  }

  highlightSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) return;

    const range = selection.getRangeAt(0);

    // Create highlight element
    const highlightId = 'highlight_' + Date.now();
    const highlight = document.createElement('mark');
    highlight.className = 'reader-highlight yellow';
    highlight.dataset.highlightId = highlightId;
    highlight.addEventListener('click', () => this.showHighlightOptions(highlightId));

    try {
      range.surroundContents(highlight);

      // Store highlight data
      const articleId = this.currentItem?.id;
      if (articleId) {
        if (!this.highlights.has(articleId)) {
          this.highlights.set(articleId, []);
        }

        this.highlights.get(articleId).push({
          id: highlightId,
          text: selectedText,
          color: 'yellow',
          timestamp: new Date().toISOString(),
          position: this.getElementPosition(highlight)
        });

        this.saveHighlights();
      }

      // Clear selection
      selection.removeAllRanges();
      this.handleSelectionChange();

      this.showFeedback('Text highlighted');
    } catch (error) {
      console.error('Error creating highlight:', error);
      this.showFeedback('Could not highlight selected text', 'error');
    }
  }

  addNoteToSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) return;

    // First highlight the text
    this.highlightSelection();

    // Then prompt for note
    const noteText = prompt('Add a note for this highlight:', '');
    if (noteText && noteText.trim()) {
      const articleId = this.currentItem?.id;
      if (articleId && this.highlights.has(articleId)) {
        const highlights = this.highlights.get(articleId);
        const lastHighlight = highlights[highlights.length - 1];

        if (lastHighlight) {
          lastHighlight.note = noteText.trim();
          this.saveHighlights();

          // Add note indicator
          const highlightElement = document.querySelector(`[data-highlight-id="${lastHighlight.id}"]`);
          if (highlightElement) {
            this.addNoteIndicator(highlightElement, lastHighlight.id);
          }
        }
      }
    }
  }

  copySelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) return;

    // Copy to clipboard
    navigator.clipboard.writeText(selectedText).then(() => {
      this.showFeedback('Text copied to clipboard');
      selection.removeAllRanges();
      this.handleSelectionChange();
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = selectedText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      this.showFeedback('Text copied to clipboard');
      selection.removeAllRanges();
      this.handleSelectionChange();
    });
  }

  clearSelection() {
    const selection = window.getSelection();
    selection.removeAllRanges();
    this.handleSelectionChange();
  }

  addNoteIndicator(highlightElement, highlightId) {
    const indicator = document.createElement('span');
    indicator.className = 'reader-note-indicator';
    indicator.innerHTML = '📝';
    indicator.title = 'Click to view note';
    indicator.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showNoteDialog(highlightId);
    });

    highlightElement.style.position = 'relative';
    highlightElement.appendChild(indicator);
  }

  showNoteDialog(highlightId) {
    const articleId = this.currentItem?.id;
    if (!articleId || !this.highlights.has(articleId)) return;

    const highlight = this.highlights.get(articleId).find(h => h.id === highlightId);
    if (!highlight || !highlight.note) return;

    // Simple dialog - in a real app you'd want a proper modal
    alert(`Note: ${highlight.note}\n\nHighlighted text: "${highlight.text}"`);
  }

  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    return {
      top: rect.top + scrollTop,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom + scrollTop
    };
  }

  saveHighlights() {
    const articleId = this.currentItem?.id;
    if (!articleId) return;

    const highlights = this.highlights.get(articleId) || [];
    localStorage.setItem(`highlights_${articleId}`, JSON.stringify(highlights));
  }

  loadHighlights() {
    const articleId = this.currentItem?.id;
    if (!articleId) return;

    try {
      const saved = localStorage.getItem(`highlights_${articleId}`);
      if (saved) {
        const highlights = JSON.parse(saved);
        this.highlights.set(articleId, highlights);
        this.restoreHighlights(highlights);
      }
    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  }

  restoreHighlights(highlights) {
    // In a real implementation, you'd need to carefully restore highlights
    // based on saved position data. This is a simplified version.
    console.log('Restoring highlights:', highlights.length);
  }

  showFeedback(message, type = 'success') {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[110] px-4 py-2 rounded-lg ring-1 backdrop-blur text-[14px] font-medium ${
      type === 'error'
        ? 'bg-red-900/90 text-red-100 ring-red-500/20'
        : 'bg-slate-900/90 text-slate-100 ring-white/10'
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    }, 2000);
  }

  // Image and Metadata Extraction
  extractArticleMetadata(doc, url) {
    const metadata = {
      imageUrl: null,
      favicon: null,
      title: null,
      description: null
    };

    // Extract main article image
    metadata.imageUrl = this.extractMainImage(doc, url);

    // Extract favicon
    metadata.favicon = this.extractFavicon(doc, url);

    // Extract title if not already provided
    const titleElement = doc.querySelector('title') ||
                        doc.querySelector('meta[property="og:title"]') ||
                        doc.querySelector('meta[name="twitter:title"]') ||
                        doc.querySelector('h1');

    if (titleElement) {
      metadata.title = titleElement.getAttribute('content') || titleElement.textContent;
    }

    // Extract description
    const descElement = doc.querySelector('meta[name="description"]') ||
                       doc.querySelector('meta[property="og:description"]') ||
                       doc.querySelector('meta[name="twitter:description"]');

    if (descElement) {
      metadata.description = descElement.getAttribute('content');
    }

    return metadata;
  }

  extractMainImage(doc, baseUrl) {
    // Priority order for image extraction
    const imageSources = [
      // Open Graph image
      doc.querySelector('meta[property="og:image"]'),
      doc.querySelector('meta[property="og:image:url"]'),

      // Twitter Card image
      doc.querySelector('meta[name="twitter:image"]'),
      doc.querySelector('meta[name="twitter:image:src"]'),

      // Article schema.org image
      doc.querySelector('meta[itemprop="image"]'),

      // JSON-LD structured data
      this.extractJsonLdImage(doc),

      // First large image in content
      this.findFirstContentImage(doc)
    ];

    for (const source of imageSources) {
      if (source) {
        let imageUrl;

        if (typeof source === 'string') {
          imageUrl = source;
        } else if (source.getAttribute) {
          imageUrl = source.getAttribute('content') || source.getAttribute('src');
        }

        if (imageUrl) {
          return this.resolveImageUrl(imageUrl, baseUrl);
        }
      }
    }

    return null;
  }

  extractJsonLdImage(doc) {
    try {
      const jsonLdScript = doc.querySelector('script[type="application/ld+json"]');
      if (jsonLdScript) {
        const data = JSON.parse(jsonLdScript.textContent);

        // Handle arrays
        const jsonData = Array.isArray(data) ? data[0] : data;

        if (jsonData.image) {
          // Handle different image formats
          if (typeof jsonData.image === 'string') {
            return jsonData.image;
          } else if (jsonData.image.url) {
            return jsonData.image.url;
          } else if (Array.isArray(jsonData.image) && jsonData.image[0]) {
            return typeof jsonData.image[0] === 'string' ? jsonData.image[0] : jsonData.image[0].url;
          }
        }
      }
    } catch (error) {
      console.debug('Error parsing JSON-LD:', error);
    }
    return null;
  }

  findFirstContentImage(doc) {
    const contentSelectors = [
      'article img',
      '.post-content img',
      '.entry-content img',
      'main img',
      '.content img'
    ];

    for (const selector of contentSelectors) {
      const images = doc.querySelectorAll(selector);

      for (const img of images) {
        const src = img.getAttribute('src') || img.getAttribute('data-src');
        if (src && this.isValidImageUrl(src)) {
          // Check if image is likely to be substantial (not icon/avatar)
          const width = parseInt(img.getAttribute('width')) || 0;
          const height = parseInt(img.getAttribute('height')) || 0;

          if (width >= 200 || height >= 200 || (!width && !height)) {
            return src;
          }
        }
      }
    }

    return null;
  }

  extractFavicon(doc, baseUrl) {
    const faviconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]'
    ];

    for (const selector of faviconSelectors) {
      const link = doc.querySelector(selector);
      if (link) {
        const href = link.getAttribute('href');
        if (href) {
          return this.resolveImageUrl(href, baseUrl);
        }
      }
    }

    // Fallback to domain favicon
    try {
      const domain = new URL(baseUrl).origin;
      return `${domain}/favicon.ico`;
    } catch {
      return null;
    }
  }

  isValidImageUrl(url) {
    if (!url) return false;

    // Check for common image extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
    if (imageExtensions.test(url)) return true;

    // Check for data URLs
    if (url.startsWith('data:image/')) return true;

    // Check for URLs that might be images but don't have extensions
    if (url.includes('image') || url.includes('photo') || url.includes('picture')) return true;

    return false;
  }

  resolveImageUrl(imageUrl, baseUrl) {
    if (!imageUrl) return null;

    try {
      // If it's already absolute, return as-is
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
        return imageUrl;
      }

      // Resolve relative URLs
      const base = new URL(baseUrl);
      const resolved = new URL(imageUrl, base);
      return resolved.href;
    } catch (error) {
      console.debug('Error resolving image URL:', error);
      return null;
    }
  }

  cacheContentWithMetadata(url, content, textContent, metadata) {
    try {
      const cacheData = {
        content,
        textContent,
        metadata,
        timestamp: Date.now(),
        url
      };

      const urlHash = this.hashUrl(url);
      localStorage.setItem(`content_${urlHash}`, JSON.stringify(cacheData));

      // Update the current item if it exists
      if (this.currentItem && dataManager && metadata.imageUrl) {
        dataManager.updateItem(this.currentItem.id, {
          imageUrl: metadata.imageUrl,
          favicon: metadata.favicon
        });
      }

    } catch (error) {
      console.error('Error caching content with metadata:', error);
    }
  }
}

// Create global instance
const readerManager = new ReaderManager();