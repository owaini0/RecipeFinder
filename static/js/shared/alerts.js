document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.parentElement.style.display = 'none';
        });
    });
    
    convertLegacyAlerts();
    setupAlertObserver();
});

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
        
        const closeBtn = alert.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.remove();
        }
        
        const message = alert.textContent.trim();
        
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

function setupAlertObserver() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.classList && node.classList.contains('alert')) {
                        setTimeout(() => {
                            convertLegacyAlerts();
                        }, 10);
                        break;
                    }
                }
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
} 