document.addEventListener('DOMContentLoaded', function() {
    console.log("Like handler initialized");
    
    // Add a site-wide variable to store the current base URL
    window.RECIPE_FINDER_BASE_URL = window.location.origin;
    
    // Override XMLHttpRequest for legacy code that might use it
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        // If this is a request to the old endpoint, fix it
        if (typeof url === 'string' && 
            (url.includes('/like-recipe/') || url.match(/https?:\/\/[^\/]+\/like-recipe\//))) {
            
            console.warn('Intercepted XMLHttpRequest to deprecated like-recipe URL, redirecting to recipe/like/');
            
            if (url.match(/https?:\/\/[^\/]+\/like-recipe\//)) {
                url = url.replace(/\/like-recipe\//, '/recipe/like/');
            } else {
                url = url.replace('/like-recipe/', '/recipe/like/');
            }
            
            console.log('XMLHttpRequest redirected to:', url);
        }
        
        // Call the original method with possibly modified URL
        return originalXHROpen.call(this, method, url, async, user, password);
    };
    
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : input.url;
        
        if (url === '/like-recipe/' || 
            url.startsWith('/like-recipe/?') || 
            url.includes('/like-recipe/') || 
            url.match(/https?:\/\/[^\/]+\/like-recipe\//)) {
            
            console.warn('Intercepted request to deprecated like-recipe URL, redirecting to /recipe/like/');
            let newUrl;
            
            // Handle both absolute and relative URLs
            if (url.match(/https?:\/\/[^\/]+\/like-recipe\//)) {
                // Absolute URL - replace the path part
                newUrl = url.replace(/\/like-recipe\//, '/recipe/like/');
            } else {
                // Relative URL
                newUrl = url.replace('/like-recipe/', '/recipe/like/');
            }
            
            console.log('Redirecting request from', url, 'to', newUrl);
            
            // If input is a Request object, create a new one with the updated URL
            if (typeof input !== 'string') {
                const newRequest = new Request(newUrl, input);
                return originalFetch(newRequest, init);
            }
            
            // If input is a string, just use the new URL
            return originalFetch(newUrl, init);
        }
        
        // Otherwise, proceed with original fetch
        return originalFetch(input, init);
    };
    
    // Intercept jQuery Ajax calls if jQuery is available
    if (typeof jQuery !== 'undefined') {
        const originalAjax = jQuery.ajax;
        jQuery.ajax = function(url, settings) {
            // Handle overloaded signature
            if (typeof url === 'object') {
                settings = url;
                url = settings.url;
            }
            
            // Check if settings is an object
            if (settings && typeof settings === 'object' && settings.url) {
                // Check for both relative and absolute URLs
                if (settings.url === '/like-recipe/' || 
                    settings.url.startsWith('/like-recipe/?') || 
                    settings.url.includes('/like-recipe/') ||
                    settings.url.match(/https?:\/\/[^\/]+\/like-recipe\//)) {
                    
                    console.warn('Intercepted jQuery ajax request to deprecated like-recipe URL, redirecting to recipe/like/');
                    
                    // Handle both absolute and relative URLs
                    if (settings.url.match(/https?:\/\/[^\/]+\/like-recipe\//)) {
                        settings.url = settings.url.replace(/\/like-recipe\//, '/recipe/like/');
                    } else {
                        settings.url = settings.url.replace('/like-recipe/', '/recipe/like/');
                    }
                    
                    console.log('Redirected Ajax URL to:', settings.url);
                }
            }
            
            // Call original Ajax with possibly modified settings
            return originalAjax.apply(this, arguments);
        };
    }
    
    // For jQuery compatibility - ensure jQuery doesn't handle these clicks separately
    if (typeof jQuery !== 'undefined') {
        console.log("Setting jQuery event handler overrides");
        jQuery(document).off('click', '.like-recipe-link');
        jQuery(document).off('click', '.recipe-like-icon, .fa-heart');
        jQuery(document).off('click', '.like-button');
        
        // Also ensure any future jQuery bindings are cleared
        const originalOn = jQuery.fn.on;
        jQuery.fn.on = function() {
            if (arguments[0] === 'click' && (
                (typeof arguments[1] === 'string' && 
                 (arguments[1].includes('like-recipe-link') || 
                  arguments[1].includes('fa-heart') || 
                  arguments[1].includes('like-button'))
                ) || 
                (typeof arguments[1] !== 'string' && 
                 typeof arguments[0] === 'string' && 
                 (arguments[0].includes('click.like') || 
                  arguments[0].includes('click .like'))
                )
            )) {
                console.warn('Attempted to bind jQuery click handler for likes - suppressed');
                return this;
            }
            return originalOn.apply(this, arguments);
        };
    }
    
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
        console.log(`CLICK DEBUG: Click event on element:`, e.target);
        console.log(`CLICK DEBUG: Element classes:`, e.target.className);
        
        // Handle heart icon clicks in recipe cards
        if (e.target && (e.target.classList.contains('recipe-like-icon') || e.target.classList.contains('fa-heart'))) {
            e.preventDefault();
            console.log(`CLICK DEBUG: Heart icon clicked, passing to handleLikeLinkAction`);
            handleLikeLinkAction(e.target);
        }
        
        // Handle like button clicks on recipe detail page
        if (e.target && (e.target.classList.contains('like-button') || e.target.parentElement.classList.contains('like-button'))) {
            e.preventDefault();
            const button = e.target.classList.contains('like-button') ? e.target : e.target.parentElement;
            console.log(`CLICK DEBUG: Like button clicked, passing to handleLikeAction`);
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
            // Remove any existing click handlers directly from the DOM element
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            // Add our click handler
            newLink.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation(); // Stop event bubbling
                console.log(`Direct like link ${index + 1} clicked`);
                
                const icon = this.querySelector('i.fa-heart');
                if (icon) {
                    handleLikeLinkAction(icon);
                } else {
                    handleLikeLinkAction(this);
                }
                
                return false; // Prevent default and stop propagation
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
            console.log("Updating like icons from storage, liked recipes:", Object.keys(likes).filter(id => likes[id]));
            
            // Update heart icons within .like-recipe-link elements 
            document.querySelectorAll('.like-recipe-link').forEach(link => {
                const recipeId = link.dataset.recipeId;
                if (recipeId && likes[recipeId]) {
                    const icon = link.querySelector('i.fa-heart');
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
            
            // Legacy support for recipe cards with direct data-recipe-id attribute
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
            console.warn("Error updating like icons:", e);
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
            console.error('No recipe ID provided for like request');
            callback(false);
            return;
        }
        
        // Reset notification flag for new request
        notificationShown = false;
        
        // Get CSRF token
        const csrfToken = getCsrfToken();
        if (!csrfToken) {
            console.error('No CSRF token found');
        }
        
        // Add request data
        const requestData = {
            'recipe_id': recipeId,
            'csrfmiddlewaretoken': csrfToken,
            'action': 'like'
        };
        
        // The URL to fetch - MUST use /recipe/like/ as configured in the Django URLs
        // Use relative URL to avoid cross-domain issues
        const url = '/recipe/like/';
        
        console.log(`%c LIKE REQUEST `, 'background: #4CAF50; color: white; font-size: 14px; font-weight: bold;');
        console.table({
            'URL': url,
            'Recipe ID': recipeId,
            'Action': shouldLike ? 'like' : 'unlike',
            'CSRF Token': csrfToken ? csrfToken.substring(0, 6) + '...' : 'MISSING',
            'Site Origin': window.location.origin
        });
        
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrfToken
        };
        
        console.log('Request headers:');
        console.table(headers);
        
        const params = new URLSearchParams(requestData);
        console.log('Request body (urlencoded):', params.toString());
        
        // Use try-catch to provide detailed error handling
        try {
            fetch(url, {
                method: 'POST',
                headers: headers,
                body: params,
                // Add credentials to ensure cookies are sent
                credentials: 'same-origin'
            })
            .then(response => {
                console.log(`%c RESPONSE ${response.status} `, 
                            response.ok ? 'background: #4CAF50; color: white;' : 'background: #F44336; color: white;', 
                            response);
                
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`LIKE DEBUG: Success response data:`, data);
                
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
                console.error(`Like request failed: ${error.message}`);
                
                // Show error notification if needed
                if (typeof Notify !== 'undefined' && !notificationShown) {
                    Notify.error('Could not update like. Please try again.');
                    notificationShown = true;
                }
                
                callback(false);
            });
        } catch (e) {
            console.error(`Like request exception: ${e.message}`);
            
            // Show error notification if needed
            if (typeof Notify !== 'undefined' && !notificationShown) {
                Notify.error('Could not update like. Please try again.');
                notificationShown = true;
            }
            
            callback(false);
        }
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