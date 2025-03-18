/**
 * Toast Notification Examples
 * 
 * This file contains examples of how to use the toast notification system
 * in the RecipeFinder application. These examples can be used as a reference
 * for implementing toast notifications in other parts of the application.
 */

// Basic toast examples
function showBasicToastExamples() {
    // Success toast
    showToast('Recipe saved successfully!', 'success');
    
    // Error toast
    showToast('Failed to save recipe. Please try again.', 'error');
    
    // Info toast
    showToast('Your recipe has been submitted for review.', 'info');
    
    // Warning toast
    showToast('Please fill out all required fields.', 'warning');
}

// Using the Notify utility
function showNotifyExamples() {
    // Success notification
    Notify.success('Your profile has been updated!');
    
    // Error notification
    Notify.error('Unable to connect to the server.');
    
    // Info notification
    Notify.info('New recipes are available in your feed.');
    
    // Warning notification
    showToast('Your session will expire in 5 minutes.', 'warning');
}

// Using StandardMessages
function showStandardMessageExamples() {
    // Using predefined messages
    Notify.success(StandardMessages.PROFILE_UPDATED);
    Notify.error(StandardMessages.SERVER_ERROR);
    Notify.info(StandardMessages.RECIPE_SUBMITTED);
    Notify.warning(StandardMessages.SESSION_EXPIRING);
}

// Toast with action buttons
function showToastWithActions() {
    // Toast with a single action button
    showToast('Recipe deleted.', 'info', 5000, 'undo-delete-toast', [
        {
            text: 'Undo',
            onClick: () => console.log('Undo clicked')
        }
    ]);
    
    // Toast with multiple action buttons
    showToast('Add recipe to collection?', 'info', 10000, 'collection-toast', [
        {
            text: 'Yes',
            onClick: () => console.log('Yes clicked')
        },
        {
            text: 'No',
            onClick: () => console.log('No clicked')
        }
    ]);
}

// Toast with custom duration
function showCustomDurationToasts() {
    // Short duration (2 seconds)
    showToast('Quick notification', 'info', 2000);
    
    // Long duration (10 seconds)
    showToast('Important message that stays longer', 'warning', 10000);
    
    // Persistent toast (doesn't auto-dismiss)
    showToast('This toast will not disappear automatically', 'error', 0);
}

// Example of handling AJAX errors
function handleAjaxErrorExample() {
    fetch('/api/recipes/')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            Notify.success('Recipes loaded successfully');
        })
        .catch(error => {
            // Let the Notify utility handle the error
            Notify.handleAjaxError(error);
        });
}

// Example of form validation with toasts
function formValidationExample() {
    const form = document.getElementById('example-form');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        
        if (!nameInput.value.trim()) {
            Notify.warning('Please enter your name');
            nameInput.focus();
            return;
        }
        
        if (!emailInput.value.trim()) {
            Notify.warning('Please enter your email');
            emailInput.focus();
            return;
        }
        
        // Form is valid, submit it
        Notify.info('Submitting form...');
        
        // Simulate form submission
        setTimeout(() => {
            Notify.success('Form submitted successfully!');
        }, 1500);
    });
}

// Example of using toasts for user onboarding
function userOnboardingExample() {
    // Check if user has seen the welcome message
    if (!localStorage.getItem('welcomeShown')) {
        showToast('Welcome to RecipeFinder! Explore recipes and create your own collections.', 'info', 8000);
        localStorage.setItem('welcomeShown', 'true');
    }
    
    // Show feature highlight toasts
    const featureHighlights = [
        'Click on "Add Recipe" to create your own recipes',
        'Use the search bar to find recipes by name or ingredient',
        'Create collections to organize your favorite recipes'
    ];
    
    featureHighlights.forEach((message, index) => {
        setTimeout(() => {
            showToast(message, 'info', 5000);
        }, 10000 + (index * 6000)); // Show each message with a delay
    });
}

// Export examples for use in the console
window.toastExamples = {
    showBasicToastExamples,
    showNotifyExamples,
    showStandardMessageExamples,
    showToastWithActions,
    showCustomDurationToasts,
    handleAjaxErrorExample,
    formValidationExample,
    userOnboardingExample
}; 