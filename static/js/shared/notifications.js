/**
 * Standard Notification Utility
 * Provides standardized toast notifications for common actions across the site
 */

// Object containing standard messages for common actions
const StandardMessages = {
    // Form and data actions
    FORM_SAVED: 'Form saved successfully',
    ITEM_CREATED: 'Item created successfully',
    ITEM_UPDATED: 'Item updated successfully',
    ITEM_DELETED: 'Item deleted successfully',
    
    // Authentication
    LOGIN_SUCCESS: 'Logged in successfully',
    LOGOUT_SUCCESS: 'Logged out successfully',
    PASSWORD_CHANGED: 'Password changed successfully',
    
    // Recipe-specific
    RECIPE_SAVED: 'Recipe saved successfully',
    RECIPE_LIKED: 'Recipe liked!',
    RECIPE_UNLIKED: 'Like removed',
    RECIPE_ADDED_TO_COLLECTION: 'Recipe added to collection',
    RECIPE_REMOVED_FROM_COLLECTION: 'Recipe removed from collection',
    RECIPE_SHARED: 'Recipe shared successfully',
    
    // Collection-specific
    COLLECTION_CREATED: 'Collection created successfully',
    COLLECTION_UPDATED: 'Collection updated successfully',
    COLLECTION_DELETED: 'Collection deleted successfully',
    
    // User actions
    PROFILE_UPDATED: 'Profile updated successfully',
    SUBSCRIPTION_UPDATED: 'Subscription preferences updated',
    
    // Error messages
    GENERIC_ERROR: 'An error occurred. Please try again.',
    CONNECTION_ERROR: 'Connection error. Please check your internet connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    VALIDATION_ERROR: 'Please check the form for errors.',
    NOT_FOUND_ERROR: 'The requested resource was not found.',
    UNAUTHORIZED_ERROR: 'You need to be logged in to perform this action.',
    FORBIDDEN_ERROR: 'You do not have permission to perform this action.'
};

// Shorthand notification functions
const Notify = {
    // Success notifications
    success: function(message, duration) {
        showToast(message, 'success', duration || 3000);
    },
    
    // Error notifications
    error: function(message, duration) {
        showToast(message, 'error', duration || 4000);
    },
    
    // Info notifications
    info: function(message, duration) {
        showToast(message, 'info', duration || 3000);
    },
    
    // Warning notifications
    warning: function(message, duration) {
        showToast(message, 'warning', duration || 3500);
    },
    
    // Handle API response errors
    apiError: function(xhr) {
        let message = StandardMessages.GENERIC_ERROR;
        
        if (!xhr) {
            this.error(message);
            return;
        }
        
        // Handle different HTTP status codes
        if (xhr.status === 0) {
            message = StandardMessages.CONNECTION_ERROR;
        } else if (xhr.status === 401) {
            message = StandardMessages.UNAUTHORIZED_ERROR;
        } else if (xhr.status === 403) {
            message = StandardMessages.FORBIDDEN_ERROR;
        } else if (xhr.status === 404) {
            message = StandardMessages.NOT_FOUND_ERROR;
        } else if (xhr.status === 422) {
            message = StandardMessages.VALIDATION_ERROR;
        } else if (xhr.status >= 500) {
            message = StandardMessages.SERVER_ERROR;
        }
        
        this.error(message);
    }
};

// Initialize AJAX error handling to use toasts
document.addEventListener('DOMContentLoaded', function() {
    // Set up global AJAX error handler if jQuery is available
    if (typeof $ !== 'undefined') {
        $(document).ajaxError(function(event, xhr, settings) {
            console.error('AJAX Error:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText,
                url: settings.url
            });
            
            // Don't show toast for aborted requests
            if (xhr.statusText === 'abort') return;
            
            // Check for HTML response which may indicate a server error
            if (xhr.responseText && typeof xhr.responseText === 'string' && 
                xhr.responseText.trim().startsWith('<!DOCTYPE')) {
                console.error('Server returned HTML instead of JSON. Possible server error or redirect.');
                // Show a more helpful message to the user
                Notify.error('Server error occurred. The application may need to be refreshed.');
                return;
            }
            
            Notify.apiError(xhr);
        });
    }
}); 