/**
 * Alerts Handler
 * Provides backward compatibility with the old alert system
 * and converts legacy alerts to toast notifications
 */

document.addEventListener('DOMContentLoaded', function() {
    // Handle legacy alert close buttons if they exist
    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.parentElement.style.display = 'none';
        });
    });
    
    // Convert any existing alert elements to toasts
    convertLegacyAlerts();
    
    // Setup a mutation observer to convert dynamically added alerts
    setupAlertObserver();
});

/**
 * Converts existing alert elements to toasts
 */
function convertLegacyAlerts() {
    const alerts = document.querySelectorAll('.alert');
    
    alerts.forEach(alert => {
        // Get alert type from class
        let type = 'success';
        if (alert.classList.contains('alert-error') || alert.classList.contains('alert-danger')) {
            type = 'error';
        } else if (alert.classList.contains('alert-warning')) {
            type = 'warning';
        } else if (alert.classList.contains('alert-info')) {
            type = 'info';
        }
        
        // Get message content (without the close button)
        const closeBtn = alert.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.remove();
        }
        
        // Show toast with the alert content
        const message = alert.textContent.trim();
        
        // Use the Notify utility if available, otherwise fallback to direct showToast
        if (typeof Notify !== 'undefined') {
            switch(type) {
                case 'error':
                    Notify.error(message);
                    break;
                case 'warning':
                    Notify.warning(message);
                    break;
                case 'info':
                    Notify.info(message);
                    break;
                default:
                    Notify.success(message);
            }
        } else if (typeof showToast !== 'undefined') {
            showToast(message, type);
        }
        
        // Hide the original alert
        alert.style.display = 'none';
    });
}

/**
 * Setup a mutation observer to convert dynamically added alerts
 */
function setupAlertObserver() {
    // Create an observer instance
    const observer = new MutationObserver(mutations => {
        // Check if any new alerts were added
        mutations.forEach(mutation => {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.classList && node.classList.contains('alert')) {
                        // Convert the newly added alert
                        setTimeout(() => {
                            convertLegacyAlerts();
                        }, 10);
                        break;
                    }
                }
            }
        });
    });
    
    // Observe the document body for new alerts
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
} 