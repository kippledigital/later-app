// Navigation management for Later App
class NavigationManager {
  constructor() {
    this.currentScreen = 'now';
    this.screens = ['now', 'inbox', 'library'];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.setupEventListeners();
    this.showScreen('now');
    this.initialized = true;
  }

  setupEventListeners() {
    console.log('Setting up navigation event listeners...');
    
    // Tab navigation
    const navButtons = document.querySelectorAll('[data-nav]');
    console.log('Found navigation buttons:', navButtons.length);
    
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        console.log('Navigation button clicked:', e.currentTarget.dataset.nav);
        const screen = e.currentTarget.dataset.nav;
        this.showScreen(screen);
      });
    });

    // Handle back button
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.screen) {
        this.showScreen(e.state.screen, false);
      }
    });
    
    console.log('Navigation event listeners set up');
  }

  showScreen(screenName, updateHistory = true) {
    if (!this.screens.includes(screenName)) return;

    // Hide all screens
    this.screens.forEach(screen => {
      const element = document.getElementById(`screen-${screen}`);
      if (element) {
        element.classList.add('hidden');
        element.classList.remove('opacity-100', 'translate-y-0');
        element.classList.add('opacity-0', 'translate-y-1');
      }
    });

    // Show target screen
    const targetScreen = document.getElementById(`screen-${screenName}`);
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      targetScreen.classList.remove('opacity-0', 'translate-y-1');
      targetScreen.classList.add('opacity-100', 'translate-y-0');
    }

    // Update tab states
    this.updateTabStates(screenName);

    // Update history
    if (updateHistory) {
      history.pushState({ screen: screenName }, '', `#${screenName}`);
    }

    this.currentScreen = screenName;

    // Trigger screen-specific updates
    this.onScreenChange(screenName);
  }

  updateTabStates(activeScreen) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const screen = btn.dataset.nav;
      const icon = btn.querySelector('i');
      const text = btn.querySelector('span');
      
      if (screen === activeScreen) {
        btn.classList.add('bg-white/5');
        btn.classList.remove('bg-white/0');
        if (icon) {
          icon.classList.remove('text-slate-300');
          icon.classList.add('text-cyan-300');
        }
        if (text) {
          text.classList.remove('text-slate-300');
          text.classList.add('text-slate-300');
        }
      } else {
        btn.classList.remove('bg-white/5');
        btn.classList.add('bg-white/0');
        if (icon) {
          icon.classList.add('text-slate-300');
          icon.classList.remove('text-cyan-300');
        }
        if (text) {
          text.classList.remove('text-slate-300');
          text.classList.add('text-slate-300');
        }
      }
    });
  }

  onScreenChange(screenName) {
    // Trigger screen-specific rendering
    switch (screenName) {
      case 'now':
        if (window.appManager) {
          window.appManager.renderNowScreen();
        }
        break;
      case 'inbox':
        if (window.appManager) {
          window.appManager.renderInboxScreen();
        }
        break;
      case 'library':
        if (window.appManager) {
          window.appManager.renderLibraryScreen();
        }
        break;
    }
  }

  getCurrentScreen() {
    return this.currentScreen;
  }
}

// Create global instance
const navigationManager = new NavigationManager();
