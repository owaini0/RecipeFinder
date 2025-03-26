document.addEventListener('DOMContentLoaded', function() {
    console.log('Recipe list page loaded');
    
    $('.filter-control').on('change', function() {
        $('#filter-form').submit();
    });
    
    $('#filter-form').on('submit', function() {
        Notify.info('Applying filters...');
    });
    
    $('#reset-filters').on('click', function(e) {
        e.preventDefault();
        
        $('#filter-form select').val('');
        $('#filter-form input[type="number"]').val('');
        $('#filter-form input[type="checkbox"]').prop('checked', false);
        
        $('#filter-form').submit();
        
        Notify.info('Filters reset');
    });
    
    $('.sort-option').on('click', function(e) {
        e.preventDefault();
        
        const sortBy = $(this).data('sort');
        $('#sort-by').val(sortBy);
        $('#filter-form').submit();
        
        $('.sort-option').removeClass('active');
        $(this).addClass('active');
        
        Notify.info('Sorting recipes...');
    });
    
    $('.search-form').on('submit', function(e) {
        const searchInput = $(this).find('input[name="q"]');
        
        if (!searchInput.val().trim()) {
            e.preventDefault();
            Notify.warning('Please enter a search term');
        } else {
            Notify.info(`Searching for "${searchInput.val()}"...`);
        }
    });
    
    $('.add-to-collection').on('click', function() {
        const recipeId = $(this).data('recipe-id');
        
        Notify.info('Select a collection to add this recipe to');
    });
    
    const recipeCards = document.querySelectorAll('.recipe-card');
    
    if (recipeCards.length > 0) {
        recipeCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    }
    
    const createRecipeCta = document.querySelector('.create-recipe-cta');
    if (createRecipeCta) {
        setTimeout(() => {
            createRecipeCta.style.opacity = '1';
            createRecipeCta.style.transform = 'translateY(0)';
        }, 300);
    }
    
    const filterForm = document.querySelector('.filter-form');
    if (filterForm) {
        const searchBar = filterForm.querySelector('.search-bar');
        const searchInput = searchBar.querySelector('input[type="text"]');
        
        if (searchInput) {
            searchInput.addEventListener('focus', function() {
                searchBar.classList.add('focused');
            });
            
            searchInput.addEventListener('blur', function() {
                searchBar.classList.remove('focused');
            });
        }
        
        const filterInputs = [...filterForm.querySelectorAll('select'), ...filterForm.querySelectorAll('input[type="number"]')];
        filterInputs.forEach(input => {
            if ((input.tagName === 'SELECT' && input.value) || 
                (input.type === 'number' && input.value !== '')) {
                input.classList.add('changed');
                input.parentElement.classList.add('active');
            }
            
            input.addEventListener('change', function() {
                this.classList.add('changed');
                this.parentElement.classList.add('active');
            });
            
            if (input.type === 'number') {
                input.addEventListener('input', function() {
                    if (this.value !== '') {
                        this.classList.add('changed');
                        this.parentElement.classList.add('active');
                    } else {
                        this.classList.remove('changed');
                        this.parentElement.classList.remove('active');
                    }
                });
            }
        });
        
        const categoryChips = document.querySelectorAll('.category-chip');
        categoryChips.forEach((chip, index) => {
            setTimeout(() => {
                chip.style.opacity = '1';
                chip.style.transform = 'translateY(0)';
            }, 50 * index);
        });
    }
}); 