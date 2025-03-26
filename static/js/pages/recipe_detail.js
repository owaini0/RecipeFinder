document.addEventListener('DOMContentLoaded', function() {
    function checkCollectionStatus() {
        const bookmarkBtn = $('.add-collection-btn');
        const serverSideInCollection = bookmarkBtn.data('inCollection') === true;
        const domInCollection = $('.collection-item.active').length > 0;
        const inAnyCollection = serverSideInCollection || domInCollection;
        
        if (inAnyCollection) {
            bookmarkBtn.removeClass('btn-outline-primary').addClass('btn-primary');
            bookmarkBtn.find('i').removeClass('far').addClass('fas');
            bookmarkBtn.data('inCollection', true);
        } else {
            bookmarkBtn.removeClass('btn-primary').addClass('btn-outline-primary');
            bookmarkBtn.find('i').removeClass('fas').addClass('far');
            bookmarkBtn.data('inCollection', false);
        }
    }
    checkCollectionStatus();
    
    $('#collectionModal').on('shown.bs.modal', function() {
        setTimeout(checkCollectionStatus, 500);
    });

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
    
    function initLikesFromLocalStorage() {
        const likedRecipes = JSON.parse(localStorage.getItem('likedRecipes') || '{}');
        
        $('.like-btn').each(function() {
            const btn = $(this);
            const recipeId = btn.data('recipe-id');

            if (likedRecipes[recipeId] && !btn.hasClass('btn-danger')) {
                btn.removeClass('btn-outline-danger').addClass('btn-danger');
                const count = parseInt(btn.find('.like-count').text()) || 0;
                btn.find('.like-count').text(count + 1);
            }

            else if (!likedRecipes[recipeId] && btn.hasClass('btn-danger')) {
                likedRecipes[recipeId] = true;
                localStorage.setItem('likedRecipes', JSON.stringify(likedRecipes));
            }
        });
    }
    
    initLikesFromLocalStorage();

    $('.add-collection-btn').click(function() {
        const recipeId = $(this).data('recipe-id');
        const collectionUrl = $(this).data('collection-url');
        
        console.log('Loading collections for recipe ID:', recipeId);
        console.log('Using URL:', collectionUrl);
        
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
                                    
                                    $('.add-collection-btn i').removeClass('far').addClass('fas');
                                    $('.add-collection-btn').removeClass('btn-outline-primary').addClass('btn-primary');
                                    
                                    Notify.success(StandardMessages.RECIPE_ADDED_TO_COLLECTION);
                                } else {
                                    btn.removeClass('active');
                                    btn.find('.fa-check').remove();
                                    
                                    const stillInAnyCollection = $('.collection-item.active').length > 0;
                                    if (!stillInAnyCollection) {
                                        $('.add-collection-btn i').removeClass('fas').addClass('far');
                                        $('.add-collection-btn').removeClass('btn-primary').addClass('btn-outline-primary');
                                    }
                                    
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
    
    $('.collection-form').on('submit', function() {
        const isActive = $(this).find('button.collection-item').hasClass('active');
        const isAddingToCollection = !isActive;
        const recipeId = $(this).find('input[name="recipe_id"]').val();
        const bookmarkBtn = $('.add-collection-btn');
        
        if (isAddingToCollection) {
            bookmarkBtn.removeClass('btn-outline-primary').addClass('btn-primary');
            bookmarkBtn.find('i').removeClass('far').addClass('fas');
            bookmarkBtn.data('inCollection', true);
        } else if (!isAddingToCollection && $('.collection-item.active').length <= 1) {
            bookmarkBtn.removeClass('btn-primary').addClass('btn-outline-primary');
            bookmarkBtn.find('i').removeClass('fas').addClass('far');
            bookmarkBtn.data('inCollection', false);
        }
    });
});
