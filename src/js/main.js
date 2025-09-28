// Main application logic for Later App
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initializeApp();
});

function initializeApp() {
    // Render existing items
    uiManager.renderAllItems();
    
    // Show empty state if no items
    uiManager.showEmptyState();
    
    // Add some helpful keyboard shortcuts
    setupKeyboardShortcuts();
    
    console.log('Later App initialized successfully!');
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Focus on input when '/' is pressed
        if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
            const activeElement = document.activeElement;
            if (activeElement !== uiManager.itemInput) {
                e.preventDefault();
                uiManager.itemInput.focus();
            }
        }
        
        // Clear input with Escape
        if (e.key === 'Escape' && document.activeElement === uiManager.itemInput) {
            uiManager.itemInput.value = '';
            uiManager.itemInput.blur();
        }
    });
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Export for potential future use
window.LaterApp = {
    dataManager,
    uiManager,
    formatDate
};
