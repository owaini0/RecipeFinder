// Common utilities
const utils = {
    // Show notification - using toast system
    showAlert(message, type = 'success') {
        // Check if Notify is available (preferred)
        if (typeof Notify !== 'undefined') {
            switch(type) {
                case 'error':
                case 'danger':
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
            return;
        }
        
        // Fallback to direct toast if available
        if (typeof showToast !== 'undefined') {
            showToast(message, type);
            return;
        }
        
        // Legacy fallback to alert div
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="close-btn">&times;</button>
        `;
        
        const messagesContainer = document.querySelector('.messages');
        if (messagesContainer) {
            messagesContainer.appendChild(alertDiv);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
        }
    },

    // Get CSRF token from various sources
    getCsrfToken() {
        console.log("Getting CSRF token");
        
        // Try to get from cookie first (Django's recommended approach)
        try {
            const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
            if (cookieMatch) {
                console.log("Found CSRF token in cookie");
                return cookieMatch[1];
            }
        } catch (e) {
            console.error("Error getting CSRF from cookie:", e);
        }
        
        // Try to get from hidden input field
        try {
            const tokenField = document.querySelector('input[name="csrfmiddlewaretoken"]');
            if (tokenField) {
                console.log("Found CSRF token in input field");
                return tokenField.value;
            }
        } catch (e) {
            console.error("Error getting CSRF from input field:", e);
        }
        
        // Try to get from meta tag
        try {
            const metaToken = document.querySelector('meta[name="csrf-token"]');
            if (metaToken) {
                console.log("Found CSRF token in meta tag");
                return metaToken.getAttribute('content');
            }
        } catch (e) {
            console.error("Error getting CSRF from meta tag:", e);
        }
        
        console.warn("No CSRF token found - request may fail");
        return '';
    },

    // Format date to readable string
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    },

    // Handle AJAX requests with CSRF token
    async fetchWithCSRF(url, options = {}) {
        // Check if this is a login form submission and bypass AJAX entirely
        if (url.includes('/login/')) {
            console.log("Login form detected, bypassing AJAX to avoid interference from extensions");
            
            // For login forms, we redirect to the login page to use traditional form submission
            window.location.href = '/login/';
            
            // Return a dummy response to prevent further execution
            return new Promise(() => {});
        }
        
        const csrfToken = this.getCsrfToken();
        
        console.log("fetchWithCSRF called with URL:", url);
        console.log("Request options:", JSON.stringify(options));
        
        let defaultOptions = {
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin'
        };
        
        // If FormData is being submitted, let the browser set the Content-Type with boundary
        if (options.body instanceof FormData) {
            delete defaultOptions.headers['Content-Type'];
            console.log("FormData detected, removed Content-Type header");
        }

        try {
            console.log("Fetch request starting with token:", csrfToken);
            const response = await fetch(url, { ...defaultOptions, ...options });
            console.log("Raw response status:", response.status, response.statusText);
            
            if (!response.ok) {
                // Show error notification
                const errorMsg = `Error: ${response.status} ${response.statusText}`;
                console.error("Response not OK:", errorMsg);
                if (typeof Notify !== 'undefined') {
                    Notify.error(errorMsg);
                } else {
                    this.showAlert(errorMsg, 'error');
                }
                throw new Error('Network response was not ok');
            }
            
            // Get the response text and check if it's HTML instead of JSON
            const responseText = await response.text();
            console.log("Response text (first 150 chars):", responseText.substring(0, 150));
            if (this.isHtmlResponse(responseText)) {
                console.error("Received HTML response when expecting JSON:", responseText.substring(0, 100));
                if (typeof Notify !== 'undefined') {
                    Notify.error("Session expired. Redirecting to login page...");
                }
                
                // Redirect to login page after a brief delay
                setTimeout(() => {
                    window.location.href = '/login/?next=' + encodeURIComponent(window.location.pathname);
                }, 1500);
                
                return { error: "Received HTML response instead of expected JSON", session_expired: true };
            }
            
            // Try to parse JSON safely
            try {
                return JSON.parse(responseText);
            } catch (e) {
                console.error("JSON parse error:", e);
                if (typeof Notify !== 'undefined') {
                    Notify.error("Invalid response format received from server");
                }
                return { error: "Invalid JSON response" };
            }
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Debounce function for search inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Handle image upload preview
    handleImagePreview(fileInput, previewElement) {
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewElement.src = e.target.result;
                
                // Show success notification
                if (typeof Notify !== 'undefined') {
                    Notify.success('Image preview updated');
                }
            };
            reader.readAsDataURL(fileInput.files[0]);
        }
    },

    // Check if a response is HTML instead of JSON
    isHtmlResponse(text) {
        if (!text || typeof text !== 'string') return false;
        // Check for common HTML indicators
        return text.trim().startsWith('<!DOCTYPE') || 
               text.trim().startsWith('<html') || 
               (text.includes('<head>') && text.includes('<body>'));
    },
    
    // Safely parse JSON with HTML detection
    safeJsonParse(text) {
        if (this.isHtmlResponse(text)) {
            console.error("Received HTML response when expecting JSON:", text.substring(0, 100));
            return { error: "Received HTML response instead of expected JSON" };
        }
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("JSON parse error:", e);
            return { error: "Invalid JSON response" };
        }
    }
};

// Initialize common elements
document.addEventListener('DOMContentLoaded', () => {
    // Handle alert close buttons (legacy support)
    document.addEventListener('click', (e) => {
        if (e.target.matches('.close-btn')) {
            e.target.parentElement.remove();
        }
    });
    
    // Perform toast initialization if needed
    if (typeof showToast !== 'undefined' && !document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
});

// Make utils available globally
window.utils = utils;