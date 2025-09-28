// UI management for Later App
class UIManager {
    constructor() {
        this.itemInput = document.getElementById('itemInput');
        this.addButton = document.getElementById('addButton');
        this.itemsList = document.getElementById('itemsList');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addButton.addEventListener('click', () => this.handleAddItem());
        this.itemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddItem();
            }
        });
    }

    handleAddItem() {
        const text = this.itemInput.value;
        if (text.trim()) {
            const item = dataManager.addItem(text);
            this.renderItem(item);
            this.itemInput.value = '';
        }
    }

    renderItem(item) {
        const li = document.createElement('li');
        li.className = `item ${item.completed ? 'completed' : ''}`;
        li.dataset.id = item.id;
        
        li.innerHTML = `
            <span class="item-text">${this.escapeHtml(item.text)}</span>
            <div class="item-actions">
                <button class="toggle-btn" title="${item.completed ? 'Mark as pending' : 'Mark as done'}">
                    ${item.completed ? '↩️' : '✅'}
                </button>
                <button class="delete-btn" title="Delete item">🗑️</button>
            </div>
        `;

        // Add event listeners
        const toggleBtn = li.querySelector('.toggle-btn');
        const deleteBtn = li.querySelector('.delete-btn');
        
        toggleBtn.addEventListener('click', () => this.toggleItem(item.id));
        deleteBtn.addEventListener('click', () => this.deleteItem(item.id));

        this.itemsList.appendChild(li);
    }

    toggleItem(id) {
        dataManager.toggleItem(id);
        this.renderAllItems();
    }

    deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            dataManager.removeItem(id);
            this.renderAllItems();
        }
    }

    renderAllItems() {
        this.itemsList.innerHTML = '';
        const items = dataManager.getAllItems();
        items.forEach(item => this.renderItem(item));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showEmptyState() {
        if (dataManager.getAllItems().length === 0) {
            this.itemsList.innerHTML = `
                <li class="empty-state">
                    <p>No items saved yet. Add something to get started!</p>
                </li>
            `;
        }
    }
}

// Create global instance
const uiManager = new UIManager();
