
(function() {
    console.log("Mobile menu script loaded");
    
    function initializeMobileMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const mainNav = document.querySelector('.main-nav');
        
        if (!menuToggle || !mainNav) {
            console.error("Mobile menu elements not found");
            return;
        }
        
        console.log("Mobile menu elements found and initialized");

        menuToggle.removeEventListener('click', handleMenuToggle);

        menuToggle.addEventListener('click', handleMenuToggle);
        
        function handleMenuToggle(event) {
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

    initializeMobileMenu();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMobileMenu);
    }

    window.addEventListener('load', initializeMobileMenu);
    document.addEventListener('turbolinks:load', initializeMobileMenu);
})(); 