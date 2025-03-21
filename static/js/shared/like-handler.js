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
    
    /**
     * Attach event listeners to all like buttons
     * Uses event delegation for dynamically added elements
     */
    document.addEventListener('click', function(e) {
        // Handle heart icon clicks in recipe cards
        if (e.target && e.target.classList.contains('recipe-like-icon')) {
            e.preventDefault();
            handleLikeLinkAction(e.target);
        }
        
        // Handle like button clicks on recipe detail page
        if (e.target && (e.target.classList.contains('like-button') || e.target.parentElement.classList.contains('like-button'))) {
            e.preventDefault();
            const button = e.target.classList.contains('like-button') ? e.target : e.target.parentElement;
            handleLikeAction(button);
        }
    });
    
    // Load liked state from localStorage and update UI
    updateLikeIconsFromStorage();
    
    // Function to get CSRF token
    function getCsrfToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
            
        if (!cookieValue) {
            // Fallback to looking for the token in the DOM
            const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
            return tokenElement ? tokenElement.value : null;
        }
        
        return cookieValue;
    }
    
    /**
     * Get like status from localStorage
     * @param {string} recipeId - The recipe ID 
     * @returns {boolean} Whether the recipe is liked
     */
    function isLikedLocally(recipeId) {
        const likes = JSON.parse(localStorage.getItem('recipe_likes') || '{}');
        return likes[recipeId] === true;
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
        // Get the recipe card container
        const card = linkElement.closest('.recipe-card');
        if (!card) return;
        
        // Get the recipe ID
        const recipeId = card.dataset.recipeId;
        if (!recipeId) return;
        
        // Determine the current state
        const isLiked = linkElement.classList.contains('fas');
        
        // Toggle immediately for better UX
        if (isLiked) {
            linkElement.classList.replace('fas', 'far');
        } else {
            linkElement.classList.replace('far', 'fas');
        }
        
        // Update local storage
        updateLikeStorage(recipeId, !isLiked);
        
        // Get likes count display
        const likesCountElement = card.querySelector('.likes-count');
        let likesCount = parseInt(likesCountElement?.textContent || '0');
        
        // Optimistically update the likes count
        if (isLiked) {
            if (likesCount > 0) likesCount--;
        } else {
            likesCount++;
        }
        
        if (likesCountElement) {
            likesCountElement.textContent = likesCount.toString();
        }
        
        // Send the like request to the server
        sendLikeRequest(recipeId, !isLiked, function(success) {
            if (!success) {
                // Revert the UI change if the server request failed
                if (isLiked) {
                    linkElement.classList.replace('far', 'fas');
                } else {
                    linkElement.classList.replace('fas', 'far');
                }
                
                // Revert the count
                if (likesCountElement) {
                    likesCountElement.textContent = (isLiked ? likesCount + 1 : likesCount - 1).toString();
                }
                
                // Show error notification
                if (typeof Notify !== 'undefined' && !notificationShown) {
                    Notify.error('Could not update like. Please try again.');
                    notificationShown = true;
                }
            }
        });
    }
    
    // Handle like action for recipe cards
    function handleLikeAction(button) {
        // Get the recipe ID
        const recipeId = button.dataset.recipeId;
        if (!recipeId) return;
        
        // Determine the current state
        const isLiked = button.classList.contains('liked');
        
        // Toggle immediately for better UX
        button.classList.toggle('liked');
        
        // Get likes count display
        const likesCountElement = document.querySelector('.like-count');
        let likesCount = parseInt(likesCountElement?.textContent || '0');
        
        // Update local storage
        updateLikeStorage(recipeId, !isLiked);
        
        // Optimistically update the likes count
        if (isLiked) {
            if (likesCount > 0) likesCount--;
        } else {
            likesCount++;
        }
        
        if (likesCountElement) {
            likesCountElement.textContent = likesCount.toString();
        }
        
        // Update button text
        if (button.querySelector('.like-text')) {
            button.querySelector('.like-text').textContent = isLiked ? 'Like' : 'Unlike';
        }
        
        // Send the like request to the server
        sendLikeRequest(recipeId, !isLiked, function(success) {
            if (!success) {
                // Revert the UI change if the server request failed
                button.classList.toggle('liked');
                
                // Revert the count
                if (likesCountElement) {
                    likesCountElement.textContent = (isLiked ? likesCount + 1 : likesCount - 1).toString();
                }
                
                // Revert button text
                if (button.querySelector('.like-text')) {
                    button.querySelector('.like-text').textContent = isLiked ? 'Unlike' : 'Like';
                }
                
                // Show error notification
                if (typeof Notify !== 'undefined' && !notificationShown) {
                    Notify.error('Could not update like. Please try again.');
                    notificationShown = true;
                }
            }
        });
    }
    
    /**
     * Update the local storage with like status
     * @param {string} recipeId - The recipe ID
     * @param {boolean} isLiked - Whether the recipe is liked 
     */
    function updateLikeStorage(recipeId, isLiked) {
        try {
            const likes = JSON.parse(localStorage.getItem('recipe_likes') || '{}');
            likes[recipeId] = isLiked;
            localStorage.setItem('recipe_likes', JSON.stringify(likes));
        } catch (e) {
            // Storage might be full or disabled
        }
    }
    
    /**
     * Update all like icons based on localStorage
     */
    function updateLikeIconsFromStorage() {
        try {
            const likes = JSON.parse(localStorage.getItem('recipe_likes') || '{}');
            
            // Update heart icons
            document.querySelectorAll('.recipe-card').forEach(card => {
                const recipeId = card.dataset.recipeId;
                if (recipeId && likes[recipeId]) {
                    const icon = card.querySelector('.recipe-like-icon');
                    if (icon && icon.classList.contains('far')) {
                        icon.classList.replace('far', 'fas');
                    }
                }
            });
            
            // Update like button on detail page
            const detailLikeButton = document.querySelector('.like-button');
            if (detailLikeButton) {
                const recipeId = detailLikeButton.dataset.recipeId;
                if (recipeId && likes[recipeId]) {
                    detailLikeButton.classList.add('liked');
                    if (detailLikeButton.querySelector('.like-text')) {
                        detailLikeButton.querySelector('.like-text').textContent = 'Unlike';
                    }
                }
            }
        } catch (e) {
            // Storage might be disabled or corrupted
        }
    }
    
    // Common function to send like request to server
    function sendLikeRequest(recipeId, shouldLike, callback) {
        if (!recipeId) {
            callback(false);
            return;
        }
        
        // Reset notification flag for new request
        notificationShown = false;
        
        // Get CSRF token
        const csrfToken = getCsrfToken();
        
        // Add request data
        const requestData = {
            'recipe_id': recipeId,
            'csrfmiddlewaretoken': csrfToken,
            'action': 'like'
        };
        
        fetch('/like-recipe/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            },
            body: new URLSearchParams(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update like counts from server
            const likesCountElements = document.querySelectorAll('.likes-count, .like-count');
            likesCountElements.forEach(element => {
                element.textContent = data.likes_count.toString();
            });
            
            // Update local storage with server response
            updateLikeStorage(recipeId, data.liked);
            
            // Update all icons and buttons
            document.querySelectorAll('.recipe-card').forEach(card => {
                if (card.dataset.recipeId === recipeId) {
                    const icon = card.querySelector('.recipe-like-icon');
                    if (icon) {
                        if (data.liked) {
                            icon.classList.replace('far', 'fas');
                        } else {
                            icon.classList.replace('fas', 'far');
                        }
                    }
                }
            });
            
            // Update the like button on detail page
            const detailLikeButton = document.querySelector('.like-button');
            if (detailLikeButton && detailLikeButton.dataset.recipeId === recipeId) {
                if (data.liked) {
                    detailLikeButton.classList.add('liked');
                    if (detailLikeButton.querySelector('.like-text')) {
                        detailLikeButton.querySelector('.like-text').textContent = 'Unlike';
                    }
                } else {
                    detailLikeButton.classList.remove('liked');
                    if (detailLikeButton.querySelector('.like-text')) {
                        detailLikeButton.querySelector('.like-text').textContent = 'Like';
                    }
                }
            }
            
            callback(true);
        })
        .catch(error => {
            // Show error notification if needed
            if (typeof Notify !== 'undefined' && !notificationShown) {
                Notify.error('Could not update like. Please try again.');
                notificationShown = true;
            }
            
            callback(false);
        });
    }
    
    // Expose the handler for other modules
    window.RecipeLikeHandler = {
        initLikeButtons,
        initLikeLinks,
        handleLikeAction,
        handleLikeLinkAction,
        isLikedLocally,
        updateLikeStorage,
        updateLikeIconsFromStorage
    };
}); 