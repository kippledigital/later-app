// Performance optimization system with lazy loading and virtual scrolling
class PerformanceOptimizer {
  constructor() {
    this.observedImages = new Set();
    this.virtualLists = new Map();
    this.throttledHandlers = new Map();
    this.intersectionObserver = null;
    this.resizeObserver = null;

    this.init();
  }

  init() {
    this.setupImageLazyLoading();
    this.setupVirtualScrolling();
    this.setupPerformanceMonitoring();
    this.optimizeAnimations();
  }

  // Lazy Loading for Images
  setupImageLazyLoading() {
    if (!('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    // Observe existing images
    this.observeImages();

    // Observe new images added to DOM
    this.observeNewImages();
  }

  observeImages() {
    const lazyImages = document.querySelectorAll('img[data-src], [data-lazy-bg]');
    lazyImages.forEach(img => this.observeImage(img));
  }

  observeNewImages() {
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            // Check if the node itself is a lazy image
            if (node.matches && node.matches('img[data-src], [data-lazy-bg]')) {
              this.observeImage(node);
            }
            // Check for lazy images within the added node
            const lazyImages = node.querySelectorAll && node.querySelectorAll('img[data-src], [data-lazy-bg]');
            if (lazyImages) {
              lazyImages.forEach(img => this.observeImage(img));
            }
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  observeImage(img) {
    if (!this.observedImages.has(img)) {
      this.observedImages.add(img);
      this.intersectionObserver.observe(img);
    }
  }

  loadImage(img) {
    const src = img.dataset.src;
    const lazybg = img.dataset.lazyBg;

    if (src) {
      // Regular image loading with fade-in effect
      const tempImg = new Image();
      tempImg.onload = () => {
        img.src = src;
        img.classList.add('loaded');
        img.removeAttribute('data-src');

        // Fade in animation
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        requestAnimationFrame(() => {
          img.style.opacity = '1';
        });
      };
      tempImg.onerror = () => {
        img.classList.add('error');
        console.warn('[Performance] Failed to load image:', src);
      };
      tempImg.src = src;
    }

    if (lazybg) {
      // Background image loading
      const tempImg = new Image();
      tempImg.onload = () => {
        img.style.backgroundImage = `url(${lazybg})`;
        img.classList.add('loaded');
        img.removeAttribute('data-lazy-bg');
      };
      tempImg.src = lazybg;
    }

    this.observedImages.delete(img);
  }

  // Virtual Scrolling for Large Lists
  setupVirtualScrolling() {
    this.initializeVirtualLists();

    // Re-initialize when new lists are added
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.matches && node.matches('[data-virtual-scroll]')) {
            this.initializeVirtualList(node);
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  initializeVirtualLists() {
    const virtualLists = document.querySelectorAll('[data-virtual-scroll]');
    virtualLists.forEach(list => this.initializeVirtualList(list));
  }

  initializeVirtualList(container) {
    const itemHeight = parseInt(container.dataset.itemHeight) || 60;
    const bufferSize = parseInt(container.dataset.bufferSize) || 5;
    const totalItems = parseInt(container.dataset.totalItems) || 0;

    if (totalItems === 0) return;

    const virtualList = new VirtualList({
      container,
      itemHeight,
      bufferSize,
      totalItems,
      renderItem: this.createVirtualItemRenderer(container)
    });

    this.virtualLists.set(container, virtualList);
  }

  createVirtualItemRenderer(container) {
    const templateId = container.dataset.template;
    const template = document.getElementById(templateId);

    return (index, item) => {
      if (template) {
        const clone = template.content.cloneNode(true);
        // Populate clone with item data
        this.populateTemplate(clone, item, index);
        return clone;
      }

      // Fallback to basic item rendering
      const div = document.createElement('div');
      div.className = 'virtual-item';
      div.textContent = item.title || `Item ${index}`;
      return div;
    };
  }

  populateTemplate(template, item, index) {
    // Replace placeholders in template
    const elements = template.querySelectorAll('[data-bind]');
    elements.forEach(el => {
      const bindPath = el.dataset.bind;
      const value = this.getNestedValue(item, bindPath);

      if (el.tagName === 'IMG') {
        el.dataset.src = value;
        this.observeImage(el);
      } else {
        el.textContent = value;
      }
    });

    // Set data attributes
    const wrapper = template.querySelector('.virtual-item, .card-item, .item');
    if (wrapper) {
      wrapper.dataset.index = index;
      wrapper.dataset.itemId = item.id;
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  // Performance Monitoring
  setupPerformanceMonitoring() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            if (entry.duration > 50) {
              console.warn('[Performance] Long task detected:', entry.duration + 'ms');
            }
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // PerformanceObserver might not support longtask
      }

      // Monitor layout shifts
      try {
        const clsObserver = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            if (entry.value > 0.1) {
              console.warn('[Performance] Cumulative Layout Shift:', entry.value);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // Layout shift monitoring not supported
      }
    }

    // Frame rate monitoring
    this.monitorFrameRate();

    // Memory usage monitoring
    this.monitorMemoryUsage();
  }

  monitorFrameRate() {
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;

    const measureFPS = (currentTime) => {
      frameCount++;

      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;

        // Warn if FPS drops significantly
        if (fps < 30) {
          console.warn('[Performance] Low FPS detected:', fps);
        }
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const usedMB = memory.usedJSHeapSize / 1048576;
        const limitMB = memory.jsHeapSizeLimit / 1048576;

        if (usedMB > limitMB * 0.9) {
          console.warn('[Performance] High memory usage:', usedMB.toFixed(2) + 'MB');
          this.suggestCleanup();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  suggestCleanup() {
    // Trigger garbage collection hints
    if (window.gc) {
      window.gc();
    }

    // Clean up old cache entries
    this.cleanupCaches();

    // Remove old observers
    this.cleanupObservers();
  }

  // Animation Optimizations
  optimizeAnimations() {
    // Ensure animations use transform and opacity for better performance
    this.optimizeExistingAnimations();

    // Observe new animated elements
    this.observeNewAnimations();

    // Reduce motion for users who prefer it
    this.respectReducedMotion();
  }

  optimizeExistingAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate], .animate, .transition');
    animatedElements.forEach(el => {
      this.optimizeElementAnimations(el);
    });
  }

  optimizeElementAnimations(element) {
    // Force hardware acceleration
    element.style.willChange = 'transform, opacity';
    element.style.backfaceVisibility = 'hidden';
    element.style.perspective = '1000px';

    // Clean up will-change after animation
    element.addEventListener('animationend', () => {
      element.style.willChange = 'auto';
    });

    element.addEventListener('transitionend', () => {
      element.style.willChange = 'auto';
    });
  }

  observeNewAnimations() {
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            const animatedElements = node.querySelectorAll &&
              node.querySelectorAll('[data-animate], .animate, .transition');
            if (animatedElements) {
              animatedElements.forEach(el => this.optimizeElementAnimations(el));
            }
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  respectReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleReducedMotion = (e) => {
      if (e.matches) {
        document.body.classList.add('reduce-motion');
        // Disable non-essential animations
        this.disableNonEssentialAnimations();
      } else {
        document.body.classList.remove('reduce-motion');
      }
    };

    prefersReducedMotion.addListener(handleReducedMotion);
    handleReducedMotion(prefersReducedMotion);
  }

  disableNonEssentialAnimations() {
    const style = document.createElement('style');
    style.id = 'reduced-motion-override';
    style.textContent = `
      .reduce-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }

      .reduce-motion .essential-animation {
        animation-duration: revert !important;
        transition-duration: revert !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Throttling and Debouncing Utilities
  throttle(func, limit, context = null) {
    const key = func.toString() + limit;

    if (!this.throttledHandlers.has(key)) {
      let inThrottle;
      const throttled = function(...args) {
        if (!inThrottle) {
          func.apply(context || this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
      this.throttledHandlers.set(key, throttled);
    }

    return this.throttledHandlers.get(key);
  }

  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  }

  // Resource Management
  cleanupCaches() {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        // Clean up old dynamic cache entries
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('dynamic')) {
            caches.open(cacheName).then(cache => {
              cache.keys().then(keys => {
                if (keys.length > 100) {
                  // Remove oldest entries
                  const entriesToDelete = keys.slice(0, keys.length - 50);
                  entriesToDelete.forEach(key => cache.delete(key));
                }
              });
            });
          }
        });
      });
    }
  }

  cleanupObservers() {
    // Remove observers from deleted elements
    const deletedImages = Array.from(this.observedImages).filter(img => !document.contains(img));
    deletedImages.forEach(img => {
      this.observedImages.delete(img);
    });

    // Clean up virtual lists for removed containers
    for (const [container, virtualList] of this.virtualLists) {
      if (!document.contains(container)) {
        virtualList.destroy();
        this.virtualLists.delete(container);
      }
    }
  }

  // Public API
  updateVirtualList(container, newData) {
    const virtualList = this.virtualLists.get(container);
    if (virtualList) {
      virtualList.updateData(newData);
    }
  }

  lazyLoadImage(imgElement, src) {
    imgElement.dataset.src = src;
    this.observeImage(imgElement);
  }

  getPerformanceMetrics() {
    const memory = performance.memory || {};

    return {
      observedImages: this.observedImages.size,
      virtualLists: this.virtualLists.size,
      memoryUsage: {
        used: memory.usedJSHeapSize ? (memory.usedJSHeapSize / 1048576).toFixed(2) + 'MB' : 'Unknown',
        total: memory.totalJSHeapSize ? (memory.totalJSHeapSize / 1048576).toFixed(2) + 'MB' : 'Unknown',
        limit: memory.jsHeapSizeLimit ? (memory.jsHeapSizeLimit / 1048576).toFixed(2) + 'MB' : 'Unknown'
      }
    };
  }
}

// Virtual List Implementation
class VirtualList {
  constructor({ container, itemHeight, bufferSize, totalItems, renderItem }) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.bufferSize = bufferSize;
    this.totalItems = totalItems;
    this.renderItem = renderItem;

    this.startIndex = 0;
    this.endIndex = 0;
    this.scrollTop = 0;
    this.data = [];

    this.init();
  }

  init() {
    this.setupContainer();
    this.setupScrollHandler();
    this.updateVisibleItems();
  }

  setupContainer() {
    // Create scrollable wrapper
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.className = 'virtual-scroll-container';
    this.scrollContainer.style.cssText = `
      height: 100%;
      overflow-y: auto;
      position: relative;
    `;

    // Create content container
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'virtual-content';
    this.contentContainer.style.cssText = `
      height: ${this.totalItems * this.itemHeight}px;
      position: relative;
    `;

    // Create viewport for visible items
    this.viewport = document.createElement('div');
    this.viewport.className = 'virtual-viewport';
    this.viewport.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
    `;

    this.contentContainer.appendChild(this.viewport);
    this.scrollContainer.appendChild(this.contentContainer);

    // Replace container content
    this.container.innerHTML = '';
    this.container.appendChild(this.scrollContainer);
  }

  setupScrollHandler() {
    const scrollHandler = performanceOptimizer.throttle(() => {
      this.scrollTop = this.scrollContainer.scrollTop;
      this.updateVisibleItems();
    }, 16); // ~60fps

    this.scrollContainer.addEventListener('scroll', scrollHandler);
  }

  updateVisibleItems() {
    const containerHeight = this.scrollContainer.clientHeight;
    const visibleStart = Math.floor(this.scrollTop / this.itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / this.itemHeight),
      this.totalItems - 1
    );

    // Add buffer
    this.startIndex = Math.max(0, visibleStart - this.bufferSize);
    this.endIndex = Math.min(this.totalItems - 1, visibleEnd + this.bufferSize);

    this.renderVisibleItems();
  }

  renderVisibleItems() {
    const fragment = document.createDocumentFragment();

    for (let i = this.startIndex; i <= this.endIndex; i++) {
      const item = this.data[i] || { id: i, title: `Item ${i}` };
      const element = this.renderItem(i, item);

      if (element) {
        const wrapper = document.createElement('div');
        wrapper.className = 'virtual-item-wrapper';
        wrapper.style.cssText = `
          position: absolute;
          top: ${i * this.itemHeight}px;
          left: 0;
          right: 0;
          height: ${this.itemHeight}px;
        `;

        if (element instanceof DocumentFragment) {
          wrapper.appendChild(element);
        } else {
          wrapper.appendChild(element);
        }

        fragment.appendChild(wrapper);
      }
    }

    this.viewport.innerHTML = '';
    this.viewport.appendChild(fragment);
  }

  updateData(newData) {
    this.data = newData;
    this.totalItems = newData.length;
    this.contentContainer.style.height = `${this.totalItems * this.itemHeight}px`;
    this.updateVisibleItems();
  }

  scrollToIndex(index) {
    const targetScrollTop = index * this.itemHeight;
    this.scrollContainer.scrollTop = targetScrollTop;
  }

  destroy() {
    // Clean up event listeners and DOM
    this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
    this.container.innerHTML = '';
  }
}

// Create global instance
const performanceOptimizer = new PerformanceOptimizer();