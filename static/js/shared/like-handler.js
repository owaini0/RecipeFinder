document.addEventListener('DOMContentLoaded', function() {
    console.log("Like handler initialized");
    
    let notificationShown = false;
    
    initLikeStorageFromHTML();
    
    initLikeButtons();
    initLikeLinks();
    
    document.addEventListener('click', function(e) {
        if (e.target && (e.target.classList.contains('recipe-like-icon') || e.target.classList.contains('fa-heart'))) {
            e.preventDefault();
            handleLikeLinkAction(e.target);
        }
        
        if (e.target && (e.target.classList.contains('like-button') || e.target.parentElement.classList.contains('like-button'))) {
            e.preventDefault();
            const button = e.target.classList.contains('like-button') ? e.target : e.target.parentElement;
            handleLikeAction(button);
        }
    });
    
    updateLikeIconsFromStorage();
    
    function getCsrfToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
            
        if (!cookieValue) {
            const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
            return tokenElement ? tokenElement.value : null;
        }
        
        return cookieValue;
    }

    function isLikedLocally(recipeId) {
        const likes = JSON.parse(localStorage.getItem('recipe_likes') || '{}');
        return likes[recipeId] === true;
    }
    
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
    
    function handleLikeLinkAction(linkElement) {
        let recipeId;
        let parentLink;
        
        if (linkElement.classList.contains('fa-heart')) {
            parentLink = linkElement.closest('.like-recipe-link');
            if (parentLink) {
                recipeId = parentLink.dataset.recipeId;
                linkElement = parentLink.querySelector('i.fa-heart');
            }
        } else if (linkElement.classList.contains('like-recipe-link')) {
            recipeId = linkElement.dataset.recipeId;
            linkElement = linkElement.querySelector('i.fa-heart');
        } else if (linkElement.classList.contains('recipe-like-icon')) {
            const card = linkElement.closest('.recipe-card');
            if (card) {
                recipeId = card.dataset.recipeId;
            }
        }
        
        if (!recipeId || !linkElement) return;
        
        const isLiked = linkElement.classList.contains('fas') || linkElement.classList.contains('fa-solid');
        
        if (isLiked) {
            if (linkElement.classList.contains('fas')) {
                linkElement.classList.replace('fas', 'far');
            }
            if (linkElement.classList.contains('fa-solid')) {
                linkElement.classList.remove('fa-solid');
                linkElement.classList.add('fa-regular');
            }
        } else {
            
            if (linkElement.classList.contains('far')) {
                linkElement.classList.replace('far', 'fas');
            }
            if (linkElement.classList.contains('fa-regular')) {
                linkElement.classList.remove('fa-regular');
                linkElement.classList.add('fa-solid');
            }
        }
        
        updateLikeStorage(recipeId, !isLiked);
        
        let likesCountElement;
        if (parentLink) {
            likesCountElement = parentLink.querySelector('.like-count, .likes-count');
        } else {
            const card = linkElement.closest('.recipe-card');
            if (card) {
                likesCountElement = card.querySelector('.like-count, .likes-count');
            }
        }
        
        let likesCount = parseInt(likesCountElement?.textContent || '0');
        
        if (isLiked) {
            if (likesCount > 0) likesCount--;
        } else {
            likesCount++;
        }
        
        if (likesCountElement) {
            likesCountElement.textContent = likesCount.toString();
        }
        
        sendLikeRequest(recipeId, !isLiked, function(success) {
            if (!success) {
                if (isLiked) {
                    linkElement.classList.replace('far', 'fas');
                } else {
                    linkElement.classList.replace('fas', 'far');
                }
                
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
    
    function handleLikeAction(button) {
        const recipeId = button.dataset.recipeId;
        if (!recipeId) return;
        
        const isLiked = button.classList.contains('liked');
        
        button.classList.toggle('liked');
        
        const likesCountElement = document.querySelector('.like-count');
        let likesCount = parseInt(likesCountElement?.textContent || '0');
        
        updateLikeStorage(recipeId, !isLiked);

        if (isLiked) {
            if (likesCount > 0) likesCount--;
        } else {
            likesCount++;
        }
        
        if (likesCountElement) {
            likesCountElement.textContent = likesCount.toString();
        }
        
        if (button.querySelector('.like-text')) {
            button.querySelector('.like-text').textContent = isLiked ? 'Like' : 'Unlike';
        }
        
        sendLikeRequest(recipeId, !isLiked, function(success) {
            if (!success) {
                button.classList.toggle('liked');
                
                if (likesCountElement) {
                    likesCountElement.textContent = (isLiked ? likesCount + 1 : likesCount - 1).toString();
                }

                if (button.querySelector('.like-text')) {
                    button.querySelector('.like-text').textContent = isLiked ? 'Unlike' : 'Like';
                }
  
                if (typeof Notify !== 'undefined' && !notificationShown) {
                    Notify.error('Could not update like. Please try again.');
                    notificationShown = true;
                }
            }
        });
    }
    
    function updateLikeStorage(recipeId, isLiked) {
        try {
            const likes = JSON.parse(localStorage.getItem('recipe_likes') || '{}');
            likes[recipeId] = isLiked;
            localStorage.setItem('recipe_likes', JSON.stringify(likes));
        } catch (e) {
        }
    }
    
    function updateLikeIconsFromStorage() {
        try {
            const likes = JSON.parse(localStorage.getItem('recipe_likes') || '{}');
            
            document.querySelectorAll('.recipe-card').forEach(card => {
                const recipeId = card.dataset.recipeId;
                if (recipeId && likes[recipeId]) {
                    const icon = card.querySelector('.recipe-like-icon, .fa-heart');
                    if (icon) {
                        if (icon.classList.contains('far')) {
                            icon.classList.replace('far', 'fas');
                        }
                        if (icon.classList.contains('fa-regular')) {
                            icon.classList.remove('fa-regular');
                            icon.classList.add('fa-solid');
                        }
                    }
                }
            });
            
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
        }
    }
    
    function initLikeStorageFromHTML() {
        const likes = JSON.parse(localStorage.getItem('recipe_likes') || '{}');
        let hasChanges = false;
        
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

        if (hasChanges) {
            try {
                localStorage.setItem('recipe_likes', JSON.stringify(likes));
            } catch (e) {
                console.warn("Could not save likes to localStorage", e);
            }
        }
    }

    function sendLikeRequest(recipeId, shouldLike, callback) {
        if (!recipeId) {
            callback(false);
            return;
        }

        notificationShown = false;
        const csrfToken = getCsrfToken();
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
            const likesCountElements = document.querySelectorAll('.likes-count, .like-count');
            likesCountElements.forEach(element => {
                if (element.closest('.like-recipe-link')?.dataset.recipeId === recipeId || 
                    element.closest('.recipe-card')?.dataset.recipeId === recipeId) {
                    element.textContent = data.likes_count.toString();
                }
            });
            
            updateLikeStorage(recipeId, data.liked);

            document.querySelectorAll('.like-recipe-link').forEach(link => {
                if (link.dataset.recipeId === recipeId) {
                    const icon = link.querySelector('i.fa-heart');
                    if (icon) {
                        if (data.liked) {
                            if (icon.classList.contains('far')) {
                                icon.classList.replace('far', 'fas');
                            }
                            if (icon.classList.contains('fa-regular')) {
                                icon.classList.remove('fa-regular');
                                icon.classList.add('fa-solid');
                            }
                        } else {
                            if (icon.classList.contains('fas')) {
                                icon.classList.replace('fas', 'far');
                            }

                            if (icon.classList.contains('fa-solid')) {
                                icon.classList.remove('fa-solid');
                                icon.classList.add('fa-regular');
                            }
                        }
                    }
                }
            });
            

            document.querySelectorAll('.recipe-card').forEach(card => {
                if (card.dataset.recipeId === recipeId) {
                    const icon = card.querySelector('.recipe-like-icon, .fa-heart');
                    if (icon) {
                        if (data.liked) {
                            if (icon.classList.contains('far')) {
                                icon.classList.replace('far', 'fas');
                            }

                            if (icon.classList.contains('fa-regular')) {
                                icon.classList.remove('fa-regular');
                                icon.classList.add('fa-solid');
                            }
                        } else {
                            if (icon.classList.contains('fas')) {
                                icon.classList.replace('fas', 'far');
                            }
                            if (icon.classList.contains('fa-solid')) {
                                icon.classList.remove('fa-solid');
                                icon.classList.add('fa-regular');
                            }
                        }
                    }
                }
            });

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
            if (typeof Notify !== 'undefined' && !notificationShown) {
                Notify.error('Could not update like. Please try again.');
                notificationShown = true;
            }
            
            callback(false);
        });
    }

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