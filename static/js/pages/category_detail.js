document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to recipe cards
    const recipeCards = document.querySelectorAll('.recipe-card');
    
    recipeCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.05)';
        });
    });
    
    // Smooth scroll for pagination links
    const paginationLinks = document.querySelectorAll('.pagination a');
    
    paginationLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Don't prevent default as we want the page to navigate
            // Just add a small visual effect
            document.querySelector('.category-recipes').classList.add('fade-transition');
            
            setTimeout(() => {
                document.querySelector('.category-recipes').classList.remove('fade-transition');
            }, 500);
        });
    });
    
    // Add CSS for fade transition if not already in stylesheet
    if (!document.querySelector('#fade-transition-style')) {
        const style = document.createElement('style');
        style.id = 'fade-transition-style';
        style.textContent = `
            @keyframes fadeTransition {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
            .fade-transition {
                animation: fadeTransition 0.5s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Back button hover effect
    const backButton = document.querySelector('.back-to-categories .btn');
    if (backButton) {
        backButton.addEventListener('mouseenter', function() {
            this.style.background = 'var(--primary-color)';
            this.style.color = 'white';
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        });
        
        backButton.addEventListener('mouseleave', function() {
            this.style.background = 'transparent';
            this.style.color = 'var(--primary-color)';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    }
    
    // Lazy loading for images with IntersectionObserver
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        img.classList.add('loaded');
                    }
                    imageObserver.unobserve(img);
                }
            });
        });
        
        // Create a loading placeholder effect
        const lazyImages = document.querySelectorAll('.recipe-image img');
        lazyImages.forEach(img => {
            if (img.complete && img.naturalHeight !== 0) return;
            if (img.src) {
                // Add a loading class for styling
                img.classList.add('loading');
                img.dataset.src = img.src;
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
                imageObserver.observe(img);
            }
        });
        
        // Add loading/loaded animation styles
        if (!document.querySelector('#lazy-load-styles')) {
            const style = document.createElement('style');
            style.id = 'lazy-load-styles';
            style.textContent = `
                .recipe-image img.loading {
                    filter: blur(10px);
                    background-color: #f0f0f0;
                    transition: filter 0.3s ease;
                }
                .recipe-image img.loaded {
                    filter: blur(0);
                    animation: fadeIn 0.5s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0.3; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Add simple filter by difficulty functionality
    const createDifficultyFilter = () => {
        const categoryHeader = document.querySelector('.category-header');
        if (!categoryHeader) return;
        
        const filterContainer = document.createElement('div');
        filterContainer.className = 'difficulty-filter';
        filterContainer.innerHTML = `
            <p>Filter by difficulty:</p>
            <div class="filter-buttons">
                <button class="filter-btn active" data-difficulty="all">All</button>
                <button class="filter-btn" data-difficulty="easy">Easy</button>
                <button class="filter-btn" data-difficulty="medium">Medium</button>
                <button class="filter-btn" data-difficulty="hard">Hard</button>
            </div>
        `;
        
        categoryHeader.appendChild(filterContainer);
        
        // Add filter styles
        if (!document.querySelector('#filter-styles')) {
            const style = document.createElement('style');
            style.id = 'filter-styles';
            style.textContent = `
                .difficulty-filter {
                    margin-top: 20px;
                    text-align: center;
                }
                .difficulty-filter p {
                    margin-bottom: 10px;
                    color: #555;
                }
                .filter-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                }
                .filter-btn {
                    padding: 8px 15px;
                    border-radius: 20px;
                    border: none;
                    background: rgba(255, 255, 255, 0.7);
                    color: #555;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(0, 0, 0, 0.05);
                }
                .filter-btn:hover {
                    background: rgba(255, 255, 255, 0.9);
                    transform: translateY(-2px);
                }
                .filter-btn.active {
                    background: var(--primary-color);
                    color: white;
                }
                .recipe-card.hidden {
                    display: none;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add filter functionality
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const difficulty = btn.getAttribute('data-difficulty');
                
                // Filter recipe cards
                recipeCards.forEach(card => {
                    if (difficulty === 'all') {
                        card.classList.remove('hidden');
                    } else {
                        const cardDifficulty = card.querySelector('.difficulty-badge')?.classList[1];
                        if (cardDifficulty === difficulty) {
                            card.classList.remove('hidden');
                        } else {
                            card.classList.add('hidden');
                        }
                    }
                });
                
                // Update recipe count
                const visibleCount = document.querySelectorAll('.recipe-card:not(.hidden)').length;
                const countElem = document.querySelector('.recipes-count p');
                if (countElem) {
                    countElem.textContent = `${visibleCount} recipe${visibleCount !== 1 ? 's' : ''} found`;
                }
                
                // Show notification about filter applied
                if (typeof Notify !== 'undefined') {
                    if (difficulty === 'all') {
                        Notify.info('Showing all recipes');
                    } else {
                        Notify.info(`Filtered to show ${difficulty} difficulty recipes`);
                    }
                }
                
                // Show/hide "no recipes" message
                const noRecipesDiv = document.querySelector('.no-recipes') || 
                    createNoRecipesMessage();
                
                if (visibleCount === 0 && !document.body.contains(noRecipesDiv)) {
                    const recipesGrid = document.querySelector('.recipes-grid');
                    if (recipesGrid) {
                        recipesGrid.insertAdjacentElement('afterend', noRecipesDiv);
                        recipesGrid.style.display = 'none';
                        
                        // Show warning notification when no recipes match filter
                        if (typeof Notify !== 'undefined') {
                            Notify.warning('No recipes match the selected filter. Try a different difficulty level.');
                        }
                    }
                } else if (visibleCount > 0) {
                    if (document.body.contains(noRecipesDiv)) {
                        noRecipesDiv.remove();
                    }
                    const recipesGrid = document.querySelector('.recipes-grid');
                    if (recipesGrid) {
                        recipesGrid.style.display = 'grid';
                    }
                }
            });
        });
    };
    
    // Create a "no recipes" message for filtered results
    const createNoRecipesMessage = () => {
        const noRecipes = document.createElement('div');
        noRecipes.className = 'no-recipes';
        noRecipes.innerHTML = `
            <i class="fas fa-filter"></i>
            <h3>No recipes match the selected filter</h3>
            <p>Try a different difficulty level</p>
        `;
        return noRecipes;
    };
    
    // Initialize difficulty filter
    createDifficultyFilter();
});
