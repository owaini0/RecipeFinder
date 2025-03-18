/**
 * Recipe Like Handler
 * Handles the like/unlike functionality for recipes
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Like handler initialized");
    
    // Flag to prevent duplicate notifications
    let notificationShown = false;
    
    // Initialize like buttons and links
    initLikeButtons();
    initLikeLinks();
    
    // Function to get CSRF token
    function getCsrfToken() {
        console.log("Getting CSRF token for like action");
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
        
        // Fallback to hidden input field
        try {
            const tokenField = document.querySelector('input[name="csrfmiddlewaretoken"]');
            if (tokenField) {
                console.log("Found CSRF token in input field");
                return tokenField.value;
            }
        } catch (e) {
            console.error("Error getting CSRF from input:", e);
        }
        
        console.warn("No CSRF token found - like request may fail");
        return '';
    }
    
    // Initialize like buttons (detailed page)
    function initLikeButtons() {
        const likeButtons = document.querySelectorAll('.like-btn, .liked');
        console.log(`Found ${likeButtons.length} like buttons on page`);
        
        likeButtons.forEach((button, index) => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                console.log(`Like button ${index + 1} clicked`);
                
                handleLikeAction(this);
            });
        });
    }
    
    // Initialize like links (listing pages)
    function initLikeLinks() {
        const likeLinks = document.querySelectorAll('.like-recipe-link');
        console.log(`Found ${likeLinks.length} like links on page`);
        
        likeLinks.forEach((link, index) => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                console.log(`Like link ${index + 1} clicked`);
                
                handleLikeLinkAction(this);
            });
        });
    }
    
    // Handle like action for recipe cards
    function handleLikeLinkAction(linkElement) {
        if (!linkElement) {
            console.error("Invalid link element");
            return;
        }
        
        const recipeId = linkElement.getAttribute('data-recipe-id');
        if (!recipeId) {
            console.error("Missing recipe ID");
            return;
        }
        
        const heartIcon = linkElement.querySelector('i.fa-heart');
        const likeCountElement = linkElement.querySelector('.like-count');
        
        if (!heartIcon || !likeCountElement) {
            console.error("Missing heart icon or like count element");
            return;
        }
        
        const isLiked = heartIcon.classList.contains('fas');
        const currentCount = parseInt(likeCountElement.textContent.trim()) || 0;
        
        // Toggle visual state immediately for better UX
        if (isLiked) {
            heartIcon.classList.remove('fas');
            heartIcon.classList.add('far');
            likeCountElement.textContent = Math.max(0, currentCount - 1);
        } else {
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
            likeCountElement.textContent = currentCount + 1;
        }
        
        // Send the AJAX request to update the like status
        sendLikeRequest(recipeId, !isLiked, function(success, data) {
            if (!success) {
                // Revert UI changes if the request failed
                if (isLiked) {
                    heartIcon.classList.remove('far');
                    heartIcon.classList.add('fas');
                    likeCountElement.textContent = currentCount;
                } else {
                    heartIcon.classList.remove('fas');
                    heartIcon.classList.add('far');
                    likeCountElement.textContent = currentCount;
                }
                
                if (typeof Notify !== 'undefined') {
                    Notify.error('Failed to update like status. Please try again.');
                }
            }
        });
    }
    
    // Handle like action for recipe cards
    function handleLikeAction(button) {
        if (!button) {
            console.error("Invalid button element");
            return;
        }
        
        const recipeId = button.dataset.recipeId;
        if (!recipeId) {
            console.error("Missing recipe ID");
            if (typeof Notify !== 'undefined' && typeof Notify.error === 'function') {
                Notify.error("Error: Could not identify recipe to like");
            }
            return;
        }
        
        const isLiked = button.classList.contains('liked');
        console.log(`Recipe ${recipeId} current like status: ${isLiked ? 'liked' : 'not liked'}`);
        
        // Show visual feedback immediately
        if (isLiked) {
            button.classList.remove('liked');
            button.classList.add('like-btn');
        } else {
            button.classList.add('liked');
            button.classList.remove('like-btn');
        }
        
        // Update the like count element visually first
        const likeCountEl = button.querySelector('.like-count');
        if (likeCountEl) {
            const currentCount = parseInt(likeCountEl.textContent) || 0;
            likeCountEl.textContent = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
        }
        
        // Send the AJAX request to update the like status
        sendLikeRequest(recipeId, !isLiked, function(success, data) {
            if (!success) {
                // Revert visual changes on error
                if (isLiked) {
                    button.classList.add('liked');
                    button.classList.remove('like-btn');
                } else {
                    button.classList.remove('liked');
                    button.classList.add('like-btn');
                }
                
                // Revert count change
                if (likeCountEl) {
                    const currentCount = parseInt(likeCountEl.textContent) || 0;
                    likeCountEl.textContent = isLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
                }
            }
        });
    }
    
    // Common function to send like request to server
    function sendLikeRequest(recipeId, shouldLike, callback) {
        if (!recipeId) {
            console.error("Missing recipe ID for like request");
            callback(false);
            return;
        }
        
        // Reset notification flag for new request
        notificationShown = false;
        
        // Get CSRF token
        const csrfToken = getCsrfToken();
        console.log(`Using CSRF token: ${csrfToken ? csrfToken.substring(0, 5) + '...' : 'none'}`);
        
        // Add extra debug information to know what's being sent
        const requestData = {
            'recipe_id': recipeId,
            'csrfmiddlewaretoken': csrfToken,
            'action': 'like'  // Add action parameter to ensure proper handling
        };
        console.log('Request data:', requestData);
        
        $.ajax({
            url: '/recipe/like/',
            type: 'POST',
            data: requestData,
            headers: {
                'X-CSRFToken': csrfToken,
                'Accept': 'application/json'  // Explicitly request JSON response
            },
            dataType: 'json',  // Expect JSON data type
            success: function(data) {
                console.log("Like request successful:", data);
                callback(true, data);
                
                // Update all instances of this recipe's like count on the page
                const allLikeCounts = document.querySelectorAll(`.like-count[data-recipe-id="${recipeId}"], [data-recipe-id="${recipeId}"] .like-count`);
                allLikeCounts.forEach(counter => {
                    counter.textContent = data.likes_count;
                });
                
                // Update all like icons for this recipe
                const allLikeIcons = document.querySelectorAll(`[data-recipe-id="${recipeId}"] i.fa-heart`);
                allLikeIcons.forEach(icon => {
                    if (data.liked) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                    } else {
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                    }
                });
                
                // Update all like buttons for this recipe
                const allLikeButtons = document.querySelectorAll(`[data-recipe-id="${recipeId}"].like-btn, [data-recipe-id="${recipeId}"].liked`);
                allLikeButtons.forEach(btn => {
                    if (data.liked) {
                        btn.classList.remove('like-btn');
                        btn.classList.add('liked');
                    } else {
                        btn.classList.remove('liked');
                        btn.classList.add('like-btn');
                    }
                });
                
                // Show appropriate notification only if not shown yet
                if (typeof Notify !== 'undefined' && !notificationShown) {
                    if (data.liked) {
                        Notify.success("Recipe added to your favorites");
                    } else {
                        Notify.info("Recipe removed from your favorites");
                    }
                    notificationShown = true;
                }
            },
            error: function(xhr, status, error) {
                console.error("Like request failed:", error);
                console.error("Status:", status);
                console.error("Response:", xhr.responseText);
                
                // Check if the response is HTML (redirect or error page)
                if (xhr.responseText && xhr.responseText.trim().startsWith('<!DOCTYPE')) {
                    console.error("Received HTML response instead of JSON - session may have expired");
                    
                    // Show a more specific error message
                    if (typeof Notify !== 'undefined' && !notificationShown) {
                        Notify.error("Session may have expired. Please refresh the page and try again.");
                        notificationShown = true;
                    }
                    
                    // Force page reload after a short delay if this continues to happen
                    setTimeout(function() {
                        if (confirm("Your session may have expired. Would you like to refresh the page?")) {
                            window.location.reload();
                        }
                    }, 3000);
                }
                
                // Check if this is the UNIQUE constraint error (race condition)
                else if (xhr.responseText && xhr.responseText.includes("UNIQUE constraint failed")) {
                    console.log("Unique constraint error - this likely means there was a race condition with multiple clicks");
                    
                    // Instead of showing an error, just refresh the state
                    setTimeout(function() {
                        window.location.reload();
                    }, 500);
                    
                    // Don't show the error notification
                    callback(false);
                    return;
                }
                
                callback(false);
                
                // Show error notification
                if (typeof Notify !== 'undefined' && !notificationShown) {
                    Notify.error("Error updating like status. Please try again.");
                    notificationShown = true;
                }
            }
        });
    }
    
    // Expose the handler for other modules
    window.RecipeLikeHandler = {
        initLikeButtons,
        initLikeLinks,
        handleLikeAction,
        handleLikeLinkAction
    };
}); 