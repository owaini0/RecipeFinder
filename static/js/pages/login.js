document.addEventListener('DOMContentLoaded', () => {
    console.log("Login script loaded - version 2");
    const loginForm = document.querySelector('.auth-form');
    
    if (loginForm) {
        console.log("Login form found - ONLY handling remember me functionality");
        
        const rememberMe = document.getElementById('remember-me');
        if (rememberMe) {
            const remembered = localStorage.getItem('remember_username');
            if (remembered) {
                const usernameInput = loginForm.querySelector('input[name="username"]');
                if (usernameInput) {
                    usernameInput.value = remembered;
                    rememberMe.checked = true;
                }
            }
            
            rememberMe.addEventListener('change', function() {
                const usernameInput = loginForm.querySelector('input[name="username"]');
                if (this.checked && usernameInput && usernameInput.value) {
                    localStorage.setItem('remember_username', usernameInput.value);
                } else {
                    localStorage.removeItem('remember_username');
                }
            });
        }
    }
});