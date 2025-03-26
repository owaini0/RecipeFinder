document.addEventListener('DOMContentLoaded', function() {
    console.log("Register script loaded successfully");
    
    const registerForm = document.querySelector('.auth-form');
    const password1Field = document.querySelector('input[name="password1"]');
    const password2Field = document.querySelector('input[name="password2"]');
    const usernameField = document.querySelector('input[name="username"]');
    const submitButton = document.querySelector('.auth-form button[type="submit"]');
    
    if (!registerForm || !password1Field || !password2Field) return;
    
    let passwordsMatch = false;
    
    function checkUsername() {
        if (usernameField) {
            const username = usernameField.value.trim();
            const maxLength = parseInt(usernameField.getAttribute('maxlength')) || 150;
            
            if (username.length > maxLength) {
                let errorElem = registerForm.querySelector('.username-error');
                if (!errorElem) {
                    errorElem = document.createElement('div');
                    errorElem.className = 'error-message username-error';
                    usernameField.parentNode.appendChild(errorElem);
                }
                errorElem.textContent = `Username must be ${maxLength} characters or less`;
                usernameField.style.borderColor = '#e74c3c';
                return false;
            } else if (username.length > 0) {
                // Remove error message if exists
                const errorElem = registerForm.querySelector('.username-error');
                if (errorElem) errorElem.remove();
                usernameField.style.borderColor = '';
                return true;
            }
        }
        return true;
    }
    function checkPasswordMatch() {
        const password1 = password1Field.value;
        const password2 = password2Field.value;
        
        if (password2.length > 0) {
            if (password1 === password2) {
                password2Field.style.borderColor = '#2ecc71';
                password2Field.style.backgroundColor = 'rgba(46, 204, 113, 0.05)';
                passwordsMatch = true;
                
                const errorElem = registerForm.querySelector('.password-mismatch-error');
                if (errorElem) errorElem.remove();
            } else {
                password2Field.style.borderColor = '#e74c3c';
                password2Field.style.backgroundColor = 'rgba(231, 76, 60, 0.05)';
                passwordsMatch = false;
            }
        } else {
            password2Field.style.borderColor = '';
            password2Field.style.backgroundColor = '';
            passwordsMatch = false;
        }
        
        updateSubmitButton();
    }
    
    function updateSubmitButton() {
        if (submitButton) {
            const isUsernameValid = checkUsername();
            const isValid = passwordsMatch && isUsernameValid;
            submitButton.disabled = !isValid;
            submitButton.style.opacity = isValid ? '1' : '0.6';
        }
    }
    
    if (usernameField) {
        usernameField.addEventListener('input', function() {
            checkUsername();
            updateSubmitButton();
        });
    }
    
    if (password1Field && password2Field) {
        password1Field.addEventListener('input', checkPasswordMatch);
        password2Field.addEventListener('input', checkPasswordMatch);
    }
    
    registerForm.addEventListener('submit', function(event) {
        if (!checkUsername()) {
            event.preventDefault();
            return false;
        }
        
        if (!passwordsMatch) {
            event.preventDefault();
            let errorElem = registerForm.querySelector('.password-mismatch-error');
            if (!errorElem) {
                errorElem = document.createElement('div');
                errorElem.className = 'error-message password-mismatch-error';
                errorElem.textContent = 'Passwords do not match';
                password2Field.parentNode.appendChild(errorElem);
            }
            return false;
        }
        
        const formSubmitted = true;
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        
        return true;
    });
    
    updateSubmitButton();
});
