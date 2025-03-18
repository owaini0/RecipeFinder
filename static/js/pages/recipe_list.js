document.addEventListener('DOMContentLoaded', function() {
    console.log('Recipe list page loaded');
    
    // Handle filter changes
    $('.filter-control').on('change', function() {
        $('#filter-form').submit();
    });
    
    // Show toast when filters are applied
    $('#filter-form').on('submit', function() {
        Notify.info('Applying filters...');
    });
    
    // Reset filters button
    $('#reset-filters').on('click', function(e) {
        e.preventDefault();
        
        // Reset all form controls
        $('#filter-form select').val('');
        $('#filter-form input[type="number"]').val('');
        $('#filter-form input[type="checkbox"]').prop('checked', false);
        
        // Submit the form
        $('#filter-form').submit();
        
        // Show notification
        Notify.info('Filters reset');
    });
    
    // Handle sorting
    $('.sort-option').on('click', function(e) {
        e.preventDefault();
        
        const sortBy = $(this).data('sort');
        $('#sort-by').val(sortBy);
        $('#filter-form').submit();
        
        // Update active sort option
        $('.sort-option').removeClass('active');
        $(this).addClass('active');
        
        // Show toast
        Notify.info('Sorting recipes...');
    });
    
    // Handle search form
    $('.search-form').on('submit', function(e) {
        const searchInput = $(this).find('input[name="q"]');
        
        if (!searchInput.val().trim()) {
            e.preventDefault();
            Notify.warning('Please enter a search term');
        } else {
            Notify.info(`Searching for "${searchInput.val()}"...`);
        }
    });
    
    // Handle collection actions if collections exist on this page
    $('.add-to-collection').on('click', function() {
        const recipeId = $(this).data('recipe-id');
        
        // Code to show collection modal...
        
        Notify.info('Select a collection to add this recipe to');
    });
    
    // Add animation effects for recipe cards
    const recipeCards = document.querySelectorAll('.recipe-card');
    
    if (recipeCards.length > 0) {
        // Add staggered animation for recipe cards on page load
        recipeCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    }
    
    // Add animation to Create Recipe CTA
    const createRecipeCta = document.querySelector('.create-recipe-cta');
    if (createRecipeCta) {
        setTimeout(() => {
            createRecipeCta.style.opacity = '1';
            createRecipeCta.style.transform = 'translateY(0)';
        }, 300);
    }
    
    // Add filter functionality animations
    const filterForm = document.querySelector('.filter-form');
    if (filterForm) {
        // Search bar animations
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
        
        // Handle select inputs and number input animations
        const filterInputs = [...filterForm.querySelectorAll('select'), ...filterForm.querySelectorAll('input[type="number"]')];
        filterInputs.forEach(input => {
            // For inputs that already have a value, mark them as changed
            if ((input.tagName === 'SELECT' && input.value) || 
                (input.type === 'number' && input.value !== '')) {
                input.classList.add('changed');
                input.parentElement.classList.add('active');
            }
            
            input.addEventListener('change', function() {
                this.classList.add('changed');
                this.parentElement.classList.add('active');
            });
            
            // For number inputs, also listen for input event
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
        
        // Animate category chips
        const categoryChips = document.querySelectorAll('.category-chip');
        categoryChips.forEach((chip, index) => {
            setTimeout(() => {
                chip.style.opacity = '1';
                chip.style.transform = 'translateY(0)';
            }, 50 * index);
        });
    }
}); 