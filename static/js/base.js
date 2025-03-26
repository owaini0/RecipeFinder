function initProfileImageHandling(formProfilePicId) {
    const fileInput = document.getElementById(formProfilePicId);
    const preview = document.getElementById('profilePicPreview');
    const removeBtn = document.querySelector('.remove-pic-btn');
    const previewContainer = document.querySelector('.current-pic-preview');
    
    if (previewContainer) {
        previewContainer.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    if (!preview) {
                        if (previewContainer) {
                            previewContainer.innerHTML = `
                                <img id="profilePicPreview" alt="Profile picture preview" src="${e.target.result}">
                                <div class="pic-overlay">
                                    <i class="fas fa-camera"></i>
                                    <span>Click to change</span>
                                </div>
                            `;
                        }
                    } else {
                        preview.src = e.target.result;
                    }

                    if (removeBtn) {
                        removeBtn.removeAttribute('disabled');
                        removeBtn.style.display = 'inline-flex';
                    }
                }
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (previewContainer) {
                previewContainer.innerHTML = `
                    <div class="empty-avatar">
                        <i class="fas fa-user-circle"></i>
                        <span class="avatar-text">Add a photo</span>
                    </div>
                `;
            }

            if (fileInput) {
                fileInput.value = '';
            }

            const deleteField = document.createElement('input');
            deleteField.type = 'hidden';
            deleteField.name = 'profile_pic-clear';
            deleteField.value = 'on';
            document.querySelector('.profile-form').appendChild(deleteField);

            this.style.display = 'none';
            this.setAttribute('disabled', true);
        });
    }
}

function initMultiStepForm() {
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    
    if (!steps.length || !nextButtons.length) {
        console.log("Multi-step form elements not found");
        return;
    }
    
    console.log(`Found ${steps.length} steps and ${nextButtons.length} next buttons`);
    
    let currentStep = 0;
    
    function showStep(stepIndex) {
        console.log(`Showing step ${stepIndex}`);
        steps.forEach((step, index) => {
            step.style.display = index === stepIndex ? 'block' : 'none';
        });
        
        progressSteps.forEach((step, index) => {
            if (index <= stepIndex) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        const formContainer = document.querySelector('.recipe-form-container');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth' });
        }
        
        currentStep = stepIndex;
    }
    
    function validateStep(stepIndex) {
        if (stepIndex === 0) {
            const title = document.querySelector('#id_title');
            const description = document.querySelector('#id_description');
            
            if (title && !title.value.trim()) {
                alert('Please enter a recipe title');
                return false;
            }
            
            if (description && !description.value.trim()) {
                alert('Please provide a recipe description');
                return false;
            }
            
            return true;
        }
        
        if (stepIndex === 1) {
            const ingredients = document.querySelectorAll('.ingredient-input');
            const instructions = document.querySelectorAll('.instruction-input');
            
            if (ingredients.length === 0) {
                alert('Please add at least one ingredient');
                return false;
            }
            
            if (instructions.length === 0) {
                alert('Please add at least one instruction step');
                return false;
            }
            
            return true;
        }
        
        return true;
    }
    
    nextButtons.forEach(button => {
        console.log("Adding click event to next button");
        button.addEventListener('click', function(e) {
            console.log("Next button clicked");
            e.preventDefault();
            if (validateStep(currentStep)) {
                showStep(currentStep + 1);
            }
        });
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            showStep(currentStep - 1);
        });
    });
    
    progressSteps.forEach((step, index) => {
        step.addEventListener('click', function() {
            if (index < currentStep || validateStep(currentStep)) {
                showStep(index);
            }
        });
    });
}

window.initProfileImageHandling = initProfileImageHandling;
window.initMultiStepForm = initMultiStepForm;