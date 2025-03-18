# Toast Notification Integration Guide

This guide explains how to use the toast notification system consistently across the RecipeFinder website.

## Basic Usage

### Direct Toast Method

```javascript
// Basic success toast (default type)
showToast('Your message here');

// Specific toast types
showToast('Success message', 'success');
showToast('Error message', 'error');
showToast('Information message', 'info');
showToast('Warning message', 'warning');

// Custom duration (in milliseconds, default: 3000ms)
showToast('Long message', 'success', 5000);
```

### Using the Notify Utility (Recommended)

```javascript
// Success notifications
Notify.success('Operation completed successfully');

// Error notifications
Notify.error('An error occurred');

// Info notifications
Notify.info('New feature available');

// Warning notifications
Notify.warning('Please complete all fields');

// API error handling
Notify.apiError(xhr); // Automatically determines message based on HTTP status
```

## Standard Messages

Use the `StandardMessages` constants for consistent messaging:

```javascript
// Success messages
Notify.success(StandardMessages.FORM_SAVED);
Notify.success(StandardMessages.RECIPE_LIKED);

// Error messages
Notify.error(StandardMessages.CONNECTION_ERROR);
Notify.error(StandardMessages.GENERIC_ERROR);
```

## Integration Examples

### Form Submissions

```javascript
$('#my-form').on('submit', function(e) {
    e.preventDefault();
    
    $.ajax({
        url: this.action,
        type: 'POST',
        data: $(this).serialize(),
        success: function(response) {
            Notify.success(StandardMessages.FORM_SAVED);
            // Additional processing...
        },
        error: function(xhr) {
            Notify.apiError(xhr);
        }
    });
});
```

### Button Actions

```javascript
$('.action-button').on('click', function() {
    // Perform action...
    
    // Show feedback
    Notify.success('Action completed successfully');
});
```

### AJAX Response Handling

```javascript
$.ajax({
    url: '/api/endpoint',
    success: function(data) {
        if (data.success) {
            Notify.success(data.message || StandardMessages.ITEM_UPDATED);
        } else {
            Notify.warning(data.message || 'Operation failed');
        }
    },
    error: function(xhr) {
        Notify.apiError(xhr);
    }
});
```

## Form Validation Errors

```javascript
function validateForm() {
    const errors = [];
    
    // Validation logic...
    
    if (errors.length > 0) {
        Notify.warning(errors[0]); // Show first error
        return false;
    }
    
    return true;
}
```

## In Python Django Views

```python
from django.contrib import messages

def my_view(request):
    # Process form or action...
    
    # Add a message (automatically converted to toast)
    messages.success(request, "Item saved successfully")
    # OR
    messages.error(request, "An error occurred")
    
    return redirect('some-url')
```

## Best Practices

1. **Be Consistent**: Use standard messages when applicable
2. **Be Concise**: Keep toast messages short and clear
3. **Choose Type Wisely**: Use the appropriate toast type for the context
4. **Handle Errors Gracefully**: Show helpful error messages
5. **Don't Overuse**: Only show toasts for important actions/feedback
6. **Prioritize User Experience**: Avoid showing multiple toasts at once 