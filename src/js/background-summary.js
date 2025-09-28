// Background summary generation for saved articles
class BackgroundSummaryManager {
  constructor() {
    this.processingQueue = [];
    this.isProcessing = false;
    this.maxConcurrent = 1; // Process one at a time to be respectful
  }

  init() {
    // Process any items that need summaries on startup
    this.processExistingItems();

    // Listen for new items being saved
    document.addEventListener('itemSaved', (event) => {
      this.queueItemForProcessing(event.detail.item);
    });
  }

  processExistingItems() {
    if (!dataManager) return;

    const items = dataManager.getAllItems();
    const itemsNeedingSummaries = items.filter(item =>
      item.url &&
      !item.hasSummary &&
      item.type === 'article'
    );

    console.log(`Found ${itemsNeedingSummaries.length} items needing summaries`);

    // Queue them for background processing
    itemsNeedingSummaries.forEach(item => {
      this.queueItemForProcessing(item);
    });
  }

  queueItemForProcessing(item) {
    if (!item.url || item.hasSummary) return;

    // Check if already in queue
    if (this.processingQueue.find(queued => queued.id === item.id)) {
      return;
    }

    console.log('Queuing item for background summary:', item.title);
    this.processingQueue.push(item);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`Starting background processing of ${this.processingQueue.length} items`);

    while (this.processingQueue.length > 0) {
      const item = this.processingQueue.shift();

      try {
        await this.processItem(item);

        // Small delay between items to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error('Error processing item in background:', error);
      }
    }

    this.isProcessing = false;
    console.log('Background summary processing complete');
  }

  async processItem(item) {
    console.log('Background processing:', item.title);

    try {
      // Check if we already have a cached summary
      const urlHash = this.hashUrl(item.url);
      const cached = localStorage.getItem(`summary_${urlHash}`);

      if (cached) {
        const cacheData = JSON.parse(cached);
        // Update the item with existing summary data
        dataManager.updateItemSummary(item.id, {
          summary: cacheData.summary.tldr,
          readingTime: cacheData.summary.readingTime
        });
        console.log('Applied cached summary to item:', item.title);
        return;
      }

      // Load and process the article
      const content = await this.loadArticleContent(item.url);
      if (!content) {
        console.warn('No content loaded for:', item.url);
        return;
      }

      // Generate summary
      const summary = await aiService.generateSummary(content, item.url);

      // Cache the summary
      const cacheData = {
        summary,
        content,
        timestamp: Date.now(),
        url: item.url
      };
      localStorage.setItem(`summary_${urlHash}`, JSON.stringify(cacheData));

      // Update the item in the database with summary and image data
      const updateData = {
        summary: summary.tldr,
        readingTime: summary.readingTime
      };

      // Add image data if available
      if (this.articleMetadata) {
        if (this.articleMetadata.imageUrl) {
          updateData.imageUrl = this.articleMetadata.imageUrl;
        }
        if (this.articleMetadata.favicon) {
          updateData.favicon = this.articleMetadata.favicon;
        }
      }

      dataManager.updateItemSummary(item.id, updateData);

      console.log('Generated background summary for:', item.title);

      // Dispatch event for UI updates
      document.dispatchEvent(new CustomEvent('summaryGenerated', {
        detail: { item, summary }
      }));

    } catch (error) {
      console.error('Error generating background summary for:', item.title, error);
    }
  }

  async loadArticleContent(url) {
    // Use a similar approach to the reader
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    try {
      const response = await fetch(proxyUrl);
      const data = await response.json();

      if (data.contents) {
        return this.parseArticleContent(data.contents, url);
      }
    } catch (error) {
      console.error('Error fetching article for background processing:', error);
    }

    return null;
  }

  parseArticleContent(html, url) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract metadata including images
    const metadata = this.extractArticleMetadata(doc, url);

    // Use Readability.js if available
    if (typeof Readability !== 'undefined') {
      try {
        const reader = new Readability(doc, {
          debug: false,
          maxElemsToParse: 0,
          nbTopCandidates: 5,
          wordThreshold: 500
        });

        const article = reader.parse();
        if (article && article.content) {
          // Store metadata for later use
          this.articleMetadata = metadata;
          return article.content;
        }
      } catch (error) {
        console.warn('Readability parsing failed for background processing:', error);
      }
    }

    // Fallback parsing
    const article = doc.querySelector('article') ||
                   doc.querySelector('.post-content') ||
                   doc.querySelector('.entry-content') ||
                   doc.querySelector('main') ||
                   doc.querySelector('.content') ||
                   doc.body;

    if (!article) return null;

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

    return content.innerHTML;
  }

  extractArticleMetadata(doc, url) {
    const metadata = {
      imageUrl: null,
      favicon: null,
      title: null,
      description: null
    };

    // Extract title
    metadata.title = doc.querySelector('meta[property="og:title"]')?.content ||
                     doc.querySelector('meta[name="twitter:title"]')?.content ||
                     doc.querySelector('title')?.textContent ||
                     '';

    // Extract description
    metadata.description = doc.querySelector('meta[property="og:description"]')?.content ||
                          doc.querySelector('meta[name="twitter:description"]')?.content ||
                          doc.querySelector('meta[name="description"]')?.content ||
                          '';

    // Extract main image using multiple strategies
    // 1. Open Graph image
    let imageUrl = doc.querySelector('meta[property="og:image"]')?.content;

    // 2. Twitter Card image
    if (!imageUrl) {
      imageUrl = doc.querySelector('meta[name="twitter:image"]')?.content ||
                 doc.querySelector('meta[name="twitter:image:src"]')?.content;
    }

    // 3. JSON-LD structured data
    if (!imageUrl) {
      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      for (const script of jsonLdScripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data.image) {
            imageUrl = Array.isArray(data.image) ? data.image[0] : data.image;
            if (typeof imageUrl === 'object' && imageUrl.url) {
              imageUrl = imageUrl.url;
            }
            break;
          }
        } catch (e) {
          // Continue if JSON parsing fails
        }
      }
    }

    // 4. First substantial content image
    if (!imageUrl) {
      const contentImages = doc.querySelectorAll('img');
      for (const img of contentImages) {
        const src = img.src || img.getAttribute('data-src');
        if (src && this.isValidImageUrl(src)) {
          // Check if image is substantial (not likely an icon or tracking pixel)
          const width = parseInt(img.getAttribute('width') || '0');
          const height = parseInt(img.getAttribute('height') || '0');

          if ((width >= 200 && height >= 150) || (!width && !height)) {
            imageUrl = src;
            break;
          }
        }
      }
    }

    // Make image URL absolute if relative
    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        const baseUrl = new URL(url);
        imageUrl = new URL(imageUrl, baseUrl.origin).href;
      } catch (e) {
        imageUrl = null;
      }
    }

    metadata.imageUrl = imageUrl;

    // Extract favicon
    let faviconUrl = doc.querySelector('link[rel="icon"]')?.href ||
                     doc.querySelector('link[rel="shortcut icon"]')?.href ||
                     doc.querySelector('link[rel="apple-touch-icon"]')?.href;

    // Make favicon URL absolute if relative
    if (faviconUrl && !faviconUrl.startsWith('http')) {
      try {
        const baseUrl = new URL(url);
        faviconUrl = new URL(faviconUrl, baseUrl.origin).href;
      } catch (e) {
        // Fallback to default favicon location
        try {
          const baseUrl = new URL(url);
          faviconUrl = `${baseUrl.origin}/favicon.ico`;
        } catch (e2) {
          faviconUrl = null;
        }
      }
    }

    metadata.favicon = faviconUrl;

    return metadata;
  }

  isValidImageUrl(url) {
    if (!url) return false;

    // Check for common image extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i;
    if (imageExtensions.test(url)) return true;

    // Exclude obvious non-images
    const excludePatterns = [
      /tracking/i,
      /analytics/i,
      /pixel/i,
      /beacon/i,
      /1x1/i,
      /\.gif$/i // Many tracking pixels are 1x1 gifs
    ];

    return !excludePatterns.some(pattern => pattern.test(url));
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

  // Get queue status for debugging
  getQueueStatus() {
    return {
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing,
      currentItem: this.isProcessing && this.processingQueue.length > 0
        ? this.processingQueue[0].title
        : null
    };
  }
}

// Create global instance
const backgroundSummaryManager = new BackgroundSummaryManager();