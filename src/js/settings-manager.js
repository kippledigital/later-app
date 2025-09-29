// Settings Manager - allows setting Supabase URL/key at runtime
class SettingsManager {
  constructor() {
    this.initialized = false;
    this.modal = null;
  }

  init() {
    if (this.initialized) return;
    this.injectUI();
    this.bindEvents();
    this.initialized = true;
  }

  injectUI() {
    // Add a lightweight modal to the DOM
    const modal = document.createElement('div');
    modal.id = 'settingsModal';
    modal.className = 'hidden fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur';
    modal.innerHTML = `
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-slate-950 rounded-2xl ring-1 ring-white/10 shadow-2xl translate-y-2 opacity-100 transition-all">
          <div class="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10">
            <h2 class="text-[16px] tracking-tight font-semibold text-slate-100">Settings</h2>
            <button id="settingsClose" class="inline-flex items-center justify-center w-9 h-9 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10">
              <i data-lucide="x" class="w-4 h-4 text-slate-200"></i>
            </button>
          </div>
          <div class="px-5 pt-4 pb-5 space-y-3">
            <div>
              <label class="block text-[12px] text-slate-400 mb-1">Supabase URL</label>
              <input id="sbUrl" type="url" placeholder="https://your-project.supabase.co" class="w-full text-[14px] px-3 py-2 rounded-md bg-white/5 ring-1 ring-white/10 text-slate-200 placeholder:text-slate-500" />
            </div>
            <div>
              <label class="block text-[12px] text-slate-400 mb-1">Supabase Anon Key</label>
              <textarea id="sbKey" rows="3" placeholder="ey..." class="w-full text-[14px] px-3 py-2 rounded-md bg-white/5 ring-1 ring-white/10 text-slate-200 placeholder:text-slate-500"></textarea>
            </div>
            <div class="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button id="settingsCancel" class="inline-flex items-center gap-1.5 text-[13px] px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10">Cancel</button>
              <button id="settingsSave" class="inline-flex items-center gap-1.5 text-[13px] px-3 py-2 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-500/25">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.modal = modal;

    // Add a small button in header for now
    const header = document.querySelector('header .flex.items-center.gap-2:last-child');
    if (header) {
      const btn = document.createElement('button');
      btn.id = 'openSettingsBtn';
      btn.className = 'inline-flex items-center gap-2 text-[13px] px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors';
      btn.title = 'Settings';
      btn.innerHTML = '<i data-lucide="settings" class="w-4 h-4 text-slate-300"></i><span class="text-slate-300">Settings</span>';
      header.appendChild(btn);
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  bindEvents() {
    document.getElementById('openSettingsBtn')?.addEventListener('click', () => this.open());
    document.getElementById('settingsClose')?.addEventListener('click', () => this.close());
    document.getElementById('settingsCancel')?.addEventListener('click', () => this.close());
    document.getElementById('settingsSave')?.addEventListener('click', () => this.save());
  }

  open() {
    if (!this.modal) return;
    // Prefill from current values
    const url = window.SUPABASE_URL || localStorage.getItem('supabaseUrl') || '';
    const key = window.SUPABASE_ANON_KEY || localStorage.getItem('supabaseAnonKey') || '';
    const urlEl = document.getElementById('sbUrl');
    const keyEl = document.getElementById('sbKey');
    if (urlEl) urlEl.value = url;
    if (keyEl) keyEl.value = key;

    this.modal.classList.remove('hidden');
  }

  close() {
    this.modal?.classList.add('hidden');
  }

  save() {
    const url = document.getElementById('sbUrl')?.value?.trim();
    const key = document.getElementById('sbKey')?.value?.trim();
    if (url && key && window.supabaseManager) {
      window.supabaseManager.setConfig(url, key);
      if (window.pwaManager) {
        window.pwaManager.showFeedback('Supabase settings saved', 'success');
      }
    }
    this.close();
  }
}

// Create global instance
const settingsManager = new SettingsManager();

