// PWA Manager - Handles installation, updates, and mobile features
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.updateAvailable = false;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;

    this.init();
  }

  async init() {
    this.checkInstallation();
    this.registerServiceWorker();
    this.setupEventListeners();
    this.setupPullToRefresh();
    this.setupHapticFeedback();
    this.handleSharedContent();
    this.setupOfflineDetection();
    this.setupKeyboardShortcuts();
  }

  // Service Worker Registration
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[PWA] Service Worker registered:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  }

  // Installation handling
  setupEventListeners() {
    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.hideInstallPrompt();
      this.showFeedback('Later installed successfully! 🎉', 'success');
    });

    // Visibility change for background sync
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && 'serviceWorker' in navigator) {
        this.triggerBackgroundSync();
      }
    });

    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateOnlineStatus();
      this.triggerBackgroundSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateOnlineStatus();
    });
  }

  checkInstallation() {
    // Check if app is installed (PWA)
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      this.isInstalled = true;
      document.body.classList.add('pwa-installed');
    }
  }

  showInstallPrompt() {
    if (this.isInstalled || !this.deferredPrompt) return;

    const installBanner = document.createElement('div');
    installBanner.id = 'pwa-install-banner';
    installBanner.className = 'fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-y-[-100px] opacity-0';
    installBanner.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <i data-lucide="download" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-semibold text-sm">Install Later</h3>
            <p class="text-xs opacity-90">Add to home screen for quick access</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button id="pwa-install-btn" class="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
            Install
          </button>
          <button id="pwa-dismiss-btn" class="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-md transition-colors">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(installBanner);

    // Animate in
    requestAnimationFrame(() => {
      installBanner.style.transform = 'translateY(0)';
      installBanner.style.opacity = '1';
    });

    // Initialize Lucide icons for the banner
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Event listeners
    document.getElementById('pwa-install-btn').addEventListener('click', () => {
      this.installApp();
    });

    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
      this.hideInstallPrompt();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.hideInstallPrompt();
    }, 10000);
  }

  hideInstallPrompt() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.transform = 'translateY(-100px)';
      banner.style.opacity = '0';
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
  }

  async installApp() {
    if (!this.deferredPrompt) return;

    try {
      this.deferredPrompt.prompt();
      const result = await this.deferredPrompt.userChoice;

      if (result.outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
      } else {
        console.log('[PWA] User dismissed install prompt');
      }

      this.deferredPrompt = null;
      this.hideInstallPrompt();
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
    }
  }

  // Update notifications
  showUpdateNotification() {
    this.updateAvailable = true;

    const updateBanner = document.createElement('div');
    updateBanner.id = 'pwa-update-banner';
    updateBanner.className = 'fixed bottom-4 left-4 right-4 z-50 bg-emerald-500 text-white p-4 rounded-lg shadow-lg';
    updateBanner.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
          </div>
          <div>
            <h3 class="font-semibold text-sm">Update Available</h3>
            <p class="text-xs opacity-90">New features and improvements</p>
          </div>
        </div>
        <button id="pwa-update-btn" class="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
          Update
        </button>
      </div>
    `;

    document.body.appendChild(updateBanner);

    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    document.getElementById('pwa-update-btn').addEventListener('click', () => {
      this.applyUpdate();
    });
  }

  applyUpdate() {
    if ('serviceWorker' in navigator && this.updateAvailable) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // Pull to refresh
  setupPullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let pullDistance = 0;
    let isPulling = false;
    let refreshThreshold = 60;

    const nowScreen = document.getElementById('nowScreen');
    if (!nowScreen) return;

    // Create refresh indicator
    const refreshIndicator = document.createElement('div');
    refreshIndicator.id = 'pull-refresh-indicator';
    refreshIndicator.className = 'fixed top-0 left-0 right-0 bg-cyan-500/10 text-cyan-300 text-center py-2 transform -translate-y-full transition-transform duration-200 z-40';
    refreshIndicator.innerHTML = `
      <div class="flex items-center justify-center gap-2">
        <i data-lucide="arrow-down" class="w-4 h-4 refresh-arrow"></i>
        <span class="text-sm refresh-text">Pull to refresh</span>
      </div>
    `;
    document.body.appendChild(refreshIndicator);

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling) return;

      currentY = e.touches[0].clientY;
      pullDistance = Math.max(0, currentY - startY);

      if (pullDistance > 0) {
        e.preventDefault();

        const translateY = Math.min(pullDistance * 0.5, refreshThreshold);
        const opacity = Math.min(pullDistance / refreshThreshold, 1);

        refreshIndicator.style.transform = `translateY(${translateY - refreshThreshold}px)`;
        refreshIndicator.style.opacity = opacity;

        const arrow = refreshIndicator.querySelector('.refresh-arrow');
        const text = refreshIndicator.querySelector('.refresh-text');

        if (pullDistance >= refreshThreshold) {
          arrow.style.transform = 'rotate(180deg)';
          text.textContent = 'Release to refresh';
          this.triggerHapticFeedback('light');
        } else {
          arrow.style.transform = 'rotate(0deg)';
          text.textContent = 'Pull to refresh';
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling) return;

      isPulling = false;

      if (pullDistance >= refreshThreshold) {
        this.performRefresh();
      }

      // Reset indicator
      refreshIndicator.style.transform = 'translateY(-100%)';
      refreshIndicator.style.opacity = '0';
      pullDistance = 0;
    };

    nowScreen.addEventListener('touchstart', handleTouchStart, { passive: false });
    nowScreen.addEventListener('touchmove', handleTouchMove, { passive: false });
    nowScreen.addEventListener('touchend', handleTouchEnd);

    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  async performRefresh() {
    try {
      this.showFeedback('Refreshing...', 'info');
      this.triggerHapticFeedback('medium');

      // Trigger background sync
      await this.triggerBackgroundSync();

      // Refresh current screen
      if (window.navigationManager) {
        window.navigationManager.refreshCurrentScreen();
      }

      // Update context
      if (window.contextDetectionManager) {
        window.contextDetectionManager.currentContext = window.contextDetectionManager.detectCurrentContext();
      }

      this.showFeedback('Refreshed!', 'success');
    } catch (error) {
      this.showFeedback('Refresh failed', 'error');
    }
  }

  // Haptic feedback
  setupHapticFeedback() {
    this.hapticSupported = 'vibrate' in navigator;
  }

  triggerHapticFeedback(type = 'light') {
    if (!this.hapticSupported) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [100, 50, 100],
      selection: [5]
    };

    if (navigator.vibrate && patterns[type]) {
      navigator.vibrate(patterns[type]);
    }
  }

  // Shared content handling
  async handleSharedContent() {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedId = urlParams.get('shared');

    if (sharedId) {
      try {
        const sharedContent = await this.getSharedContent(sharedId);
        if (sharedContent) {
          // Open capture modal with shared content
          if (window.captureManager) {
            window.captureManager.openModal(sharedContent);
          }

          // Remove from URL
          window.history.replaceState({}, '', '/');
        }
      } catch (error) {
        console.error('[PWA] Error handling shared content:', error);
      }
    }

    // Handle quick actions from shortcuts
    const action = urlParams.get('action');
    if (action === 'capture' && window.captureManager) {
      window.captureManager.openModal();
    }

    // Handle tab navigation from shortcuts
    const tab = urlParams.get('tab');
    if (tab && window.navigationManager) {
      window.navigationManager.switchToTab(tab);
    }
  }

  async getSharedContent(id) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LaterApp', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['sharedContent'], 'readonly');
        const store = transaction.objectStore('sharedContent');

        store.get(id).onsuccess = (event) => {
          const result = event.target.result;
          resolve(result);

          // Clean up shared content after retrieval
          if (result) {
            const deleteTransaction = db.transaction(['sharedContent'], 'readwrite');
            const deleteStore = deleteTransaction.objectStore('sharedContent');
            deleteStore.delete(id);
          }
        };
      };
    });
  }

  // Background sync
  async triggerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-capture');
        await registration.sync.register('background-article-fetch');
      } catch (error) {
        console.log('[PWA] Background sync failed:', error);
      }
    }
  }

  // Offline detection
  setupOfflineDetection() {
    this.updateOnlineStatus();
  }

  updateOnlineStatus() {
    const offlineIndicator = document.getElementById('offline-indicator');

    if (!this.isOnline) {
      if (!offlineIndicator) {
        const indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.className = 'fixed top-16 left-4 right-4 bg-amber-500/90 text-white text-center py-2 px-4 rounded-lg text-sm z-40';
        indicator.innerHTML = `
          <div class="flex items-center justify-center gap-2">
            <i data-lucide="wifi-off" class="w-4 h-4"></i>
            <span>You're offline. Changes will sync when reconnected.</span>
          </div>
        `;
        document.body.appendChild(indicator);

        if (window.lucide) {
          window.lucide.createIcons();
        }
      }
    } else {
      if (offlineIndicator) {
        offlineIndicator.remove();
      }
    }
  }

  // Keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when not typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            if (window.searchManager) {
              window.searchManager.openSearch();
            }
            break;
          case 'n':
            e.preventDefault();
            if (window.captureManager) {
              window.captureManager.openModal();
            }
            break;
          case '1':
            e.preventDefault();
            if (window.navigationManager) {
              window.navigationManager.switchToTab('now');
            }
            break;
          case '2':
            e.preventDefault();
            if (window.navigationManager) {
              window.navigationManager.switchToTab('inbox');
            }
            break;
          case '3':
            e.preventDefault();
            if (window.navigationManager) {
              window.navigationManager.switchToTab('library');
            }
            break;
        }
      } else {
        switch (e.key) {
          case '/':
            e.preventDefault();
            if (window.searchManager) {
              window.searchManager.openSearch();
            }
            break;
          case 'c':
            if (window.captureManager) {
              window.captureManager.openModal();
            }
            break;
          case 'r':
            e.preventDefault();
            this.performRefresh();
            break;
        }
      }
    });
  }

  // Service worker message handling
  handleServiceWorkerMessage(event) {
    const { data } = event;

    switch (data.type) {
      case 'NOTIFICATION_CLICK':
        // Handle notification click data
        console.log('[PWA] Notification click:', data.data);
        break;
      case 'BACKGROUND_SYNC_COMPLETE':
        this.showFeedback('Sync complete', 'success');
        break;
      case 'CACHE_UPDATED':
        // Handle cache update notifications
        break;
    }
  }

  // Utility methods
  showFeedback(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      type === 'success' ? 'bg-green-500/90 text-white' :
      type === 'error' ? 'bg-red-500/90 text-white' :
      'bg-slate-800/90 text-slate-200'
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        this.showFeedback('Notifications enabled!', 'success');
        return true;
      } else {
        this.showFeedback('Notifications disabled', 'info');
        return false;
      }
    }

    return Notification.permission === 'granted';
  }

  // Schedule notification
  async scheduleNotification(title, body, delay = 0, tag = 'later-reminder') {
    if (await this.requestNotificationPermission()) {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;

        if ('showNotification' in registration) {
          setTimeout(() => {
            registration.showNotification(title, {
              body,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
              tag,
              requireInteraction: false,
              actions: [
                {
                  action: 'view',
                  title: 'View',
                  icon: '/icons/action-view.png'
                }
              ]
            });
          }, delay);
        }
      }
    }
  }

  // Public API
  getStatus() {
    return {
      isInstalled: this.isInstalled,
      isOnline: this.isOnline,
      updateAvailable: this.updateAvailable,
      hapticSupported: this.hapticSupported
    };
  }
}

// Create global instance
const pwaManager = new PWAManager();