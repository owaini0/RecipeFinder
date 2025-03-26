const utils = {
    showAlert(message, type = 'success') {
        if (typeof Notify !== 'undefined') {
            switch (type) {
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

        if (typeof showToast !== 'undefined') {
            showToast(message, type);
            return;
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="close-btn">&times;</button>
        `;

        const messagesContainer = document.querySelector('.messages');
        if (messagesContainer) {
            messagesContainer.appendChild(alertDiv);

            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
        }
    },

    getCsrfToken() {
        console.log("Getting CSRF token");

        try {
            const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
            if (cookieMatch) {
                console.log("Found CSRF token in cookie");
                return cookieMatch[1];
            }
        } catch (e) {
            console.error("Error getting CSRF from cookie:", e);
        }

        try {
            const tokenField = document.querySelector('input[name="csrfmiddlewaretoken"]');
            if (tokenField) {
                console.log("Found CSRF token in input field");
                return tokenField.value;
            }
        } catch (e) {
            console.error("Error getting CSRF from input field:", e);
        }

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

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    },

    async fetchWithCSRF(url, options = {}) {
        if (url.includes('/login/')) {
            console.log("Login form detected, bypassing AJAX to avoid interference from extensions");

            window.location.href = '/login/';

            return new Promise(() => { });
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

        if (options.body instanceof FormData) {
            delete defaultOptions.headers['Content-Type'];
            console.log("FormData detected, removed Content-Type header");
        }

        try {
            console.log("Fetch request starting with token:", csrfToken);
            const response = await fetch(url, { ...defaultOptions, ...options });
            console.log("Raw response status:", response.status, response.statusText);

            if (!response.ok) {
                const errorMsg = `Error: ${response.status} ${response.statusText}`;
                console.error("Response not OK:", errorMsg);
                if (typeof Notify !== 'undefined') {
                    Notify.error(errorMsg);
                } else {
                    this.showAlert(errorMsg, 'error');
                }
                throw new Error('Network response was not ok');
            }

            const responseText = await response.text();
            console.log("Response text (first 150 chars):", responseText.substring(0, 150));
            if (this.isHtmlResponse(responseText)) {
                console.error("Received HTML response when expecting JSON:", responseText.substring(0, 100));
                if (typeof Notify !== 'undefined') {
                    Notify.error("Session expired. Redirecting to login page...");
                }

                setTimeout(() => {
                    window.location.href = '/login/?next=' + encodeURIComponent(window.location.pathname);
                }, 1500);

                return { error: "Received HTML response instead of expected JSON", session_expired: true };
            }

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

    handleImagePreview(fileInput, previewElement) {
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewElement.src = e.target.result;

                if (typeof Notify !== 'undefined') {
                    Notify.success('Image preview updated');
                }
            };
            reader.readAsDataURL(fileInput.files[0]);
        }
    },

    isHtmlResponse(text) {
        if (!text || typeof text !== 'string') return false;
        return text.trim().startsWith('<!DOCTYPE') ||
            text.trim().startsWith('<html') ||
            (text.includes('<head>') && text.includes('<body>'));
    },

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

document.addEventListener('DOMContentLoaded', () => {

    document.addEventListener('click', (e) => {
        if (e.target.matches('.close-btn')) {
            e.target.parentElement.remove();
        }
    });

    if (typeof showToast !== 'undefined' && !document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
});

window.utils = utils;