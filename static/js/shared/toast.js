/**
 * Global Toast Notification System
 * Usage: showToast('Your message here', 'success|error|info|warning');
 */

// Create toast container on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
});

/**
 * Display a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast: 'success', 'error', 'info', 'warning' (default: 'success')
 * @param {number} duration - Time in ms to show the toast (default: 3000)
 */
function showToast(message, type = 'success', duration = 3000) {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toastContainer = document.getElementById('toast-container');
    
    // Determine icon based on type
    let iconClass = 'fa-check-circle';
    let toastClass = 'recipe-toast';
    
    switch (type) {
        case 'error':
            iconClass = 'fa-exclamation-circle';
            toastClass += ' error-toast';
            break;
        case 'info':
            iconClass = 'fa-info-circle';
            toastClass += ' info-toast';
            break;
        case 'warning':
            iconClass = 'fa-exclamation-triangle';
            toastClass += ' warning-toast';
            break;
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = toastClass;
    toast.innerHTML = `
        <div class="recipe-toast-content">
            <i class="fas ${iconClass}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300); // Match the CSS transition duration
    }, duration);
} 