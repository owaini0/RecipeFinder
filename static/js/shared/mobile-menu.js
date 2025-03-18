/**
 * Mobile menu functionality
 * This script handles the mobile menu toggle and works across all pages
 */
(function() {
    // Execute immediately when loaded
    console.log("Mobile menu script loaded");
    
    function initializeMobileMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const mainNav = document.querySelector('.main-nav');
        
        if (!menuToggle || !mainNav) {
            console.error("Mobile menu elements not found");
            return;
        }
        
        console.log("Mobile menu elements found and initialized");
        
        // Remove any existing click listeners
        menuToggle.removeEventListener('click', handleMenuToggle);
        
        // Add click listener with explicit handler function
        menuToggle.addEventListener('click', handleMenuToggle);
        
        function handleMenuToggle(event) {
            // Stop event propagation to prevent conflicts
            event.stopPropagation();
            
            console.log("Menu toggle clicked");
            mainNav.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', mainNav.classList.contains('active'));
            
            const icon = menuToggle.querySelector('i');
            if (mainNav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
        
        // Close menu when clicking outside nav
        document.addEventListener('click', function(event) {
            if (mainNav.classList.contains('active') && 
                !mainNav.contains(event.target) && 
                !menuToggle.contains(event.target)) {
                
                mainNav.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
    
    // Initialize immediately
    initializeMobileMenu();
    
    // Also initialize when DOM is loaded (for safety)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMobileMenu);
    }
    
    // Re-initialize if page is dynamically updated
    window.addEventListener('load', initializeMobileMenu);
    
    // For pages with dynamic content loading
    document.addEventListener('turbolinks:load', initializeMobileMenu);
})(); 