document.addEventListener('DOMContentLoaded', function() {
    console.log('Recipe detail page loaded');

    // Ensure bookmark icon consistency on page load
    function checkCollectionStatus() {
        const bookmarkBtn = $('.add-collection-btn');
        
        // First check the data attribute from server
        const serverSideInCollection = bookmarkBtn.data('inCollection') === true;
        
        // Then check DOM for active collection items as backup
        const domInCollection = $('.collection-item.active').length > 0;
        
        // Use server data if available, otherwise fall back to DOM check
        const inAnyCollection = serverSideInCollection || domInCollection;
        
        if (inAnyCollection) {
            // Recipe is in at least one collection
            bookmarkBtn.removeClass('btn-outline-primary').addClass('btn-primary');
            bookmarkBtn.find('i').removeClass('far').addClass('fas');
            // Update data attribute to match current state
            bookmarkBtn.data('inCollection', true);
        } else {
            // Recipe is not in any collection
            bookmarkBtn.removeClass('btn-primary').addClass('btn-outline-primary');
            bookmarkBtn.find('i').removeClass('fas').addClass('far');
            // Update data attribute to match current state
            bookmarkBtn.data('inCollection', false);
        }
    }
    
    // Run on page load
    checkCollectionStatus();
    
    // Also check after modal is shown (collections loaded)
    $('#collectionModal').on('shown.bs.modal', function() {
        setTimeout(checkCollectionStatus, 500); // Short delay to ensure collections are loaded
    });

    // Global AJAX error handler for debugging
    $(document).ajaxError(function(event, jqxhr, settings, error) {
        console.error('AJAX Error:', {
            status: jqxhr.status,
            statusText: jqxhr.statusText,
            responseText: jqxhr.responseText,
            url: settings.url,
            type: settings.type,
            data: settings.data
        });
    });

    // Like functionality with localStorage persistence - DISABLED in favor of like-handler.js
    /*
    $('.like-btn').click(function() {
        const btn = $(this);
        const recipeId = $(this).data('recipe-id');
        const isLiked = btn.hasClass('btn-danger');
        const csrfToken = $(this).data('csrf-token');
        
        console.log('Toggling like:', isLiked ? 'Unlike' : 'Like');
        
        // Store the original state for rollback if needed
        const originalBtnClass = isLiked ? 'btn-danger' : 'btn-outline-danger';
        const originalCount = parseInt(btn.find('.like-count').text()) || 0;
        
        // Update UI
        if (isLiked) {
            // Unlike if already liked
            btn.removeClass('btn-danger').addClass('btn-outline-danger');
            if (originalCount > 0) {
                btn.find('.like-count').text(originalCount - 1);
            }
        } else {
            // Like if not liked
            btn.removeClass('btn-outline-danger').addClass('btn-danger');
            btn.find('.like-count').text(originalCount + 1);
        }
        
        // Add visual feedback animation
        btn.addClass('pulse');
        
        // Store like state in localStorage
        const likedRecipes = JSON.parse(localStorage.getItem('likedRecipes') || '{}');
        
        if (isLiked) {
            // Remove like
            delete likedRecipes[recipeId];
        } else {
            // Add like
            likedRecipes[recipeId] = true;
        }
        
        localStorage.setItem('likedRecipes', JSON.stringify(likedRecipes));
        
        // Try server-side save with the dedicated like endpoint
        $.ajax({
            url: '/recipe/like/',
            type: 'POST',
            data: {
                'recipe_id': recipeId,
                'csrfmiddlewaretoken': csrfToken
            },
            headers: {
                'X-CSRFToken': csrfToken
            },
            success: function(data) {
                console.log('Like state saved to server:', data);
                
                // Update the UI with the server's data
                if (data.liked) {
                    btn.removeClass('btn-outline-danger').addClass('btn-danger');
                } else {
                    btn.removeClass('btn-danger').addClass('btn-outline-danger');
                }
                
                // Update the like count with the server's count
                btn.find('.like-count').text(data.likes_count);
            },
            error: function(xhr, status, error) {
                console.log('Server-side like failed, using localStorage only:', error);
                // Revert to original state if server update failed
                if (isLiked) {
                    // We were unliking, but it failed, so revert to liked
                    likedRecipes[recipeId] = true;
                } else {
                    // We were liking, but it failed, so remove from liked
                    delete likedRecipes[recipeId];
                }
                localStorage.setItem('likedRecipes', JSON.stringify(likedRecipes));
            },
            complete: function() {
                setTimeout(() => {
                    btn.removeClass('pulse');
                }, 500);
                
                // Show appropriate toast message
                if (typeof Notify !== 'undefined') {
                    if (isLiked) {
                        Notify.success(StandardMessages.RECIPE_UNLIKED || "Recipe removed from favorites");
                    } else {
                        Notify.success(StandardMessages.RECIPE_LIKED || "Recipe added to favorites");
                    }
                }
            }
        });
        
        return false;
    });
    */
    
    // Initialize like buttons from localStorage on page load
    function initLikesFromLocalStorage() {
        const likedRecipes = JSON.parse(localStorage.getItem('likedRecipes') || '{}');
        
        $('.like-btn').each(function() {
            const btn = $(this);
            const recipeId = btn.data('recipe-id');
            
            // If liked in localStorage but not shown as liked in UI
            if (likedRecipes[recipeId] && !btn.hasClass('btn-danger')) {
                btn.removeClass('btn-outline-danger').addClass('btn-danger');
                const count = parseInt(btn.find('.like-count').text()) || 0;
                btn.find('.like-count').text(count + 1);
            }
            // If not liked in localStorage but shown as liked in UI
            else if (!likedRecipes[recipeId] && btn.hasClass('btn-danger')) {
                // Keep server-side likes (don't remove)
                // This prioritizes server likes over localStorage
                likedRecipes[recipeId] = true;
                localStorage.setItem('likedRecipes', JSON.stringify(likedRecipes));
            }
        });
    }
    
    // Call on page load
    initLikesFromLocalStorage();

    // Collection modal
    $('.add-collection-btn').click(function() {
        const recipeId = $(this).data('recipe-id');
        const collectionUrl = $(this).data('collection-url');
        
        console.log('Loading collections for recipe ID:', recipeId);
        console.log('Using URL:', collectionUrl);
        
        // Load user's collections
        $.ajax({
            url: collectionUrl || '/collections/',
            type: 'GET',
            data: {
                'format': 'json'
            },
            beforeSend: function() {
                console.log('Sending request to:', (collectionUrl || '/collections/') + '?format=json');
            },
            success: function(data) {
                console.log('Collections data received:', data);
                let html = '';
                if (data.collections && data.collections.length > 0) {
                    html = '<div class="list-group">';
                    data.collections.forEach(function(collection) {
                        // Add a class if the recipe is already in the collection
                        const inCollection = collection.recipes && collection.recipes.includes(parseInt(recipeId));
                        html += `
                            <button type="button" 
                                    class="list-group-item list-group-item-action collection-item ${inCollection ? 'active' : ''}"
                                    data-collection-id="${collection.id}"
                                    data-recipe-id="${recipeId}">
                                ${collection.name}
                                ${inCollection ? '<i class="fas fa-check ms-2"></i>' : ''}
                            </button>
                        `;
                    });
                    html += '</div>';
                } else {
                    html = '<p>You don\'t have any collections yet.</p>';
                }
                $('#collections-list').html(html);
                
                // Add click handler
                $('.collection-item').click(function() {
                    const collectionId = $(this).data('collection-id');
                    const recipeId = $(this).data('recipe-id');
                    const btn = $(this);
                    const addUrl = $('#collections-list').data('add-url');
                    
                    console.log('Adding recipe to collection:', { collectionId, recipeId });
                    console.log('Using URL:', addUrl);
                    
                    $.ajax({
                        url: addUrl || '/collection/add/',
                        type: 'POST',
                        data: {
                            'collection_id': collectionId,
                            'recipe_id': recipeId,
                            'csrfmiddlewaretoken': $('input[name="csrfmiddlewaretoken"]').val()
                        },
                        success: function(data) {
                            if (data.in_collection !== undefined) {
                                if (data.in_collection) {
                                    btn.addClass('active');
                                    if (!btn.find('.fa-check').length) {
                                        btn.append('<i class="fas fa-check ms-2"></i>');
                                    }
                                    
                                    // Update the bookmark button to solid icon
                                    $('.add-collection-btn i').removeClass('far').addClass('fas');
                                    $('.add-collection-btn').removeClass('btn-outline-primary').addClass('btn-primary');
                                    
                                    // Show success toast
                                    Notify.success(StandardMessages.RECIPE_ADDED_TO_COLLECTION);
                                } else {
                                    btn.removeClass('active');
                                    btn.find('.fa-check').remove();
                                    
                                    // Check if recipe is in any collection
                                    const stillInAnyCollection = $('.collection-item.active').length > 0;
                                    if (!stillInAnyCollection) {
                                        // Update the bookmark button to regular icon
                                        $('.add-collection-btn i').removeClass('fas').addClass('far');
                                        $('.add-collection-btn').removeClass('btn-primary').addClass('btn-outline-primary');
                                    }
                                    
                                    // Show removed toast
                                    Notify.success(StandardMessages.RECIPE_REMOVED_FROM_COLLECTION);
                                }
                            } else {
                                Notify.error(data.error || 'Error updating collection');
                            }
                        },
                        error: function(xhr, status, error) {
                            Notify.apiError(xhr);
                            console.error("Error details:", xhr.responseText);
                        }
                    });
                });
            },
            error: function(xhr, status, error) {
                $('#collections-list').html('<p>Error loading collections: ' + error + '</p>');
                Notify.error(StandardMessages.GENERIC_ERROR);
                console.error("AJAX error:", xhr.responseText);
            }
        });
    });
    
    // Add special handling for direct form submissions
    $('.collection-form').on('submit', function() {
        // Determine if adding or removing (toggle based on current state)
        const isActive = $(this).find('button.collection-item').hasClass('active');
        const isAddingToCollection = !isActive;
        
        // Get recipe ID from hidden input
        const recipeId = $(this).find('input[name="recipe_id"]').val();
        
        // Update bookmark button state immediately before form submits
        const bookmarkBtn = $('.add-collection-btn');
        
        if (isAddingToCollection) {
            // Adding recipe to collection
            bookmarkBtn.removeClass('btn-outline-primary').addClass('btn-primary');
            bookmarkBtn.find('i').removeClass('far').addClass('fas');
            bookmarkBtn.data('inCollection', true);
        } else if (!isAddingToCollection && $('.collection-item.active').length <= 1) {
            // If this is the only active collection and we're removing it
            bookmarkBtn.removeClass('btn-primary').addClass('btn-outline-primary');
            bookmarkBtn.find('i').removeClass('fas').addClass('far');
            bookmarkBtn.data('inCollection', false);
        }
    });
});
