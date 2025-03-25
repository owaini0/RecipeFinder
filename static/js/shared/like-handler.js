/**
 * Recipe Like Handler
 * Handles the like/unlike functionality for recipes
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Like handler initialized");
    
    // Flag to prevent duplicate notifications
    let notificationShown = false;
    
    // Initialize the local storage from the initial page load
    initLikeStorageFromHTML();
    
    // Initialize like buttons and links
    initLikeButtons();
    initLikeLinks();
    
    /**
     * Attach event listeners to all like buttons
     * Uses event delegation for dynamically added elements
     */
    document.addEventListener('click', function(e) {
        // Handle heart icon clicks in recipe cards
        if (e.target && (e.target.classList.contains('recipe-like-icon') || e.target.classList.contains('fa-heart'))) {
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
        // Get the recipe ID - check if the element itself has it or if parent does
        let recipeId;
        let parentLink;
        
        // If clicked on icon, find the parent link with recipe ID
        if (linkElement.classList.contains('fa-heart')) {
            parentLink = linkElement.closest('.like-recipe-link');
            if (parentLink) {
                recipeId = parentLink.dataset.recipeId;
                // Use parent link for later class manipulations
                linkElement = parentLink.querySelector('i.fa-heart');
            }
        } else if (linkElement.classList.contains('like-recipe-link')) {
            // If clicked on the link itself
            recipeId = linkElement.dataset.recipeId;
            // Find the icon within this link
            linkElement = linkElement.querySelector('i.fa-heart');
        } else if (linkElement.classList.contains('recipe-like-icon')) {
            // Original case - recipe-like-icon
            const card = linkElement.closest('.recipe-card');
            if (card) {
                recipeId = card.dataset.recipeId;
            }
        }
        
        if (!recipeId || !linkElement) return;
        
        // Determine the current state (check for both fas and fa-solid classes)
        const isLiked = linkElement.classList.contains('fas') || linkElement.classList.contains('fa-solid');
        
        // Toggle immediately for better UX
        if (isLiked) {
            // For FontAwesome 5+
            if (linkElement.classList.contains('fas')) {
                linkElement.classList.replace('fas', 'far');
            }
            // For FontAwesome 6 (if used)
            if (linkElement.classList.contains('fa-solid')) {
                linkElement.classList.remove('fa-solid');
                linkElement.classList.add('fa-regular');
            }
        } else {
            // For FontAwesome 5+
            if (linkElement.classList.contains('far')) {
                linkElement.classList.replace('far', 'fas');
            }
            // For FontAwesome 6 (if used)
            if (linkElement.classList.contains('fa-regular')) {
                linkElement.classList.remove('fa-regular');
                linkElement.classList.add('fa-solid');
            }
        }
        
        // Update local storage
        updateLikeStorage(recipeId, !isLiked);
        
        // Get likes count display - it might be a sibling element to the heart icon
        let likesCountElement;
        if (parentLink) {
            likesCountElement = parentLink.querySelector('.like-count, .likes-count');
        } else {
            // Try to find the count near the card
            const card = linkElement.closest('.recipe-card');
            if (card) {
                likesCountElement = card.querySelector('.like-count, .likes-count');
            }
        }
        
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
                    // Try both classes of icons
                    const icon = card.querySelector('.recipe-like-icon, .fa-heart');
                    if (icon) {
                        // Handle FontAwesome 5
                        if (icon.classList.contains('far')) {
                            icon.classList.replace('far', 'fas');
                        }
                        // Handle FontAwesome 6 (if used)
                        if (icon.classList.contains('fa-regular')) {
                            icon.classList.remove('fa-regular');
                            icon.classList.add('fa-solid');
                        }
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
    
    /**
     * Initialize local storage from the HTML state
     * This ensures local storage reflects server/database state on page load
     */
    function initLikeStorageFromHTML() {
        const likes = JSON.parse(localStorage.getItem('recipe_likes') || '{}');
        let hasChanges = false;
        
        // Check recipe cards with the likes icon
        document.querySelectorAll('.like-recipe-link').forEach(link => {
            const recipeId = link.dataset.recipeId;
            if (!recipeId) return;
            
            const icon = link.querySelector('i.fa-heart');
            if (icon) {
                const isLiked = icon.classList.contains('fas') || icon.classList.contains('fa-solid');
                if (likes[recipeId] !== isLiked) {
                    likes[recipeId] = isLiked;
                    hasChanges = true;
                }
            }
        });
        
        // Also check detail page like button
        const detailLikeButton = document.querySelector('.like-button');
        if (detailLikeButton) {
            const recipeId = detailLikeButton.dataset.recipeId;
            if (recipeId) {
                const isLiked = detailLikeButton.classList.contains('liked');
                if (likes[recipeId] !== isLiked) {
                    likes[recipeId] = isLiked;
                    hasChanges = true;
                }
            }
        }
        
        // Save changes to localStorage if needed
        if (hasChanges) {
            try {
                localStorage.setItem('recipe_likes', JSON.stringify(likes));
            } catch (e) {
                // Storage might be full or disabled
                console.warn("Could not save likes to localStorage", e);
            }
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
        
        fetch('/recipe/like/', {
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
                if (element.closest('.like-recipe-link')?.dataset.recipeId === recipeId || 
                    element.closest('.recipe-card')?.dataset.recipeId === recipeId) {
                    element.textContent = data.likes_count.toString();
                }
            });
            
            // Update local storage with server response
            updateLikeStorage(recipeId, data.liked);
            
            // Update all like links for this recipe
            document.querySelectorAll('.like-recipe-link').forEach(link => {
                if (link.dataset.recipeId === recipeId) {
                    const icon = link.querySelector('i.fa-heart');
                    if (icon) {
                        if (data.liked) {
                            // Handle FontAwesome 5
                            if (icon.classList.contains('far')) {
                                icon.classList.replace('far', 'fas');
                            }
                            // Handle FontAwesome 6 (if used)
                            if (icon.classList.contains('fa-regular')) {
                                icon.classList.remove('fa-regular');
                                icon.classList.add('fa-solid');
                            }
                        } else {
                            // Handle FontAwesome 5
                            if (icon.classList.contains('fas')) {
                                icon.classList.replace('fas', 'far');
                            }
                            // Handle FontAwesome 6 (if used)
                            if (icon.classList.contains('fa-solid')) {
                                icon.classList.remove('fa-solid');
                                icon.classList.add('fa-regular');
                            }
                        }
                    }
                }
            });
            
            // Also check for recipe cards with data-recipe-id attribute (legacy support)
            document.querySelectorAll('.recipe-card').forEach(card => {
                if (card.dataset.recipeId === recipeId) {
                    const icon = card.querySelector('.recipe-like-icon, .fa-heart');
                    if (icon) {
                        if (data.liked) {
                            // Handle FontAwesome 5
                            if (icon.classList.contains('far')) {
                                icon.classList.replace('far', 'fas');
                            }
                            // Handle FontAwesome 6 (if used)
                            if (icon.classList.contains('fa-regular')) {
                                icon.classList.remove('fa-regular');
                                icon.classList.add('fa-solid');
                            }
                        } else {
                            // Handle FontAwesome 5
                            if (icon.classList.contains('fas')) {
                                icon.classList.replace('fas', 'far');
                            }
                            // Handle FontAwesome 6 (if used)
                            if (icon.classList.contains('fa-solid')) {
                                icon.classList.remove('fa-solid');
                                icon.classList.add('fa-regular');
                            }
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