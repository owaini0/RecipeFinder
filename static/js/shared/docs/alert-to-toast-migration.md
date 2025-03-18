# Alert to Toast Migration Guide

This guide explains how to migrate from the traditional alert system to the new toast notification system in the RecipeFinder application.

## What Changed?

We've replaced the traditional Django alert/message boxes with a modern toast notification system that:

- Appears in the corner of the screen instead of at the top of the page
- Automatically disappears after a few seconds
- Has different styling for different message types (success, error, info, warning)
- Doesn't disrupt the page layout or require scrolling

## Automatic Migration

Most existing alerts will be automatically converted to toasts. We've implemented:

1. Django message conversion in `base.html`
2. Legacy alert detection and conversion in `alerts.js`
3. A mutation observer that converts dynamically added alerts

## How to Update Your Code

### In JavaScript

Instead of:
```javascript
// Old approach
alert('Something happened');
// Or
$('.messages').append('<div class="alert alert-success">Success message</div>');
```

Use:
```javascript
// New approach
Notify.success('Success message');
Notify.error('Error message');
Notify.info('Information message');
Notify.warning('Warning message');
```

### In Python/Django Views

Django messages will be automatically converted to toasts, so you can continue using:

```python
from django.contrib import messages

def my_view(request):
    # Process something...
    messages.success(request, "Operation successful")
    messages.error(request, "An error occurred")
    messages.info(request, "Information notice")
    messages.warning(request, "Warning message")
    
    return redirect('some-url')
```

### Standard Messages

For consistency, use standard messages from the `StandardMessages` object:

```javascript
Notify.success(StandardMessages.FORM_SAVED);
Notify.error(StandardMessages.GENERIC_ERROR);
```

## Benefits of Using Toasts

1. **Better User Experience**: Non-intrusive notifications that don't interrupt workflow
2. **Consistency**: Standardized look and feel across the application
3. **Automatic Dismissal**: No need for users to manually close notifications
4. **Mobile-Friendly**: Responsive design that works well on all device sizes
5. **Type Differentiation**: Clear visual distinction between message types

## Technical Implementation

The toast system consists of:

1. `toast.js` - Core toast functionality
2. `notifications.js` - Standardized notification utilities and messages
3. CSS in `components.css` - Styling for toast notifications
4. `alerts.js` - Backward compatibility layer

See the [Toast Integration Guide](./toast-integration-guide.md) for detailed usage instructions. 