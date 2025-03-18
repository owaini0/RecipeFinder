document.addEventListener('DOMContentLoaded', function() {
    // Form state management
    const STORAGE_KEY = 'recipe_form_state';
    
    // Helper function to check if Select2 is initialized on an element
    function isSelect2Initialized(element) {
        return $(element).hasClass('select2-hidden-accessible');
    }
    
    // Safely get Select2 data
    function getSelect2Data(element) {
        try {
            if (isSelect2Initialized(element)) {
                return $(element).select2('data');
            }
            return [];
        } catch (e) {
            console.warn('Error getting Select2 data:', e);
            return [];
        }
    }
    
    // Save form state
    function saveFormState() {
        const currentStep = getCurrentStep();
        
        // Get all form data
        const formData = {
            step: currentStep,
            title: document.getElementById('id_title')?.value || '',
            description: document.getElementById('id_description')?.value || '',
            cooking_time: document.getElementById('id_cooking_time')?.value || '',
            prep_time: document.getElementById('id_prep_time')?.value || '',
            servings: document.getElementById('id_servings')?.value || '',
            difficulty: document.getElementById('id_difficulty')?.value || '',
            categories: getSelect2Data('#id_categories'),
            ingredients: getIngredientValues(),
            instructions: getInstructionValues(),
            notes: document.getElementById('id_notes')?.value || ''
        };
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
    
    // Get current step index
    function getCurrentStep() {
        const visibleStep = Array.from(document.querySelectorAll('.form-step')).findIndex(step => {
            const display = window.getComputedStyle(step).display;
            return display !== 'none';
        });
        return visibleStep >= 0 ? visibleStep : 0;
    }
    
    // Get ingredient values
    function getIngredientValues() {
        const ingredients = [];
        document.querySelectorAll('.ingredient-input').forEach(input => {
            if (input.value.trim()) {
                ingredients.push(input.value.trim());
            }
        });
        return ingredients;
    }
    
    // Get instruction values
    function getInstructionValues() {
        const instructions = [];
        document.querySelectorAll('.instruction-input').forEach(textarea => {
            if (textarea.value.trim()) {
                instructions.push(textarea.value.trim());
            }
        });
        return instructions;
    }
    
    // Restore form state from localStorage
    function restoreFormState() {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (!savedState) return false;
        
        try {
            const formData = JSON.parse(savedState);
            
            // Restore input values
            if (document.getElementById('id_title')) document.getElementById('id_title').value = formData.title || '';
            if (document.getElementById('id_description')) document.getElementById('id_description').value = formData.description || '';
            if (document.getElementById('id_cooking_time')) document.getElementById('id_cooking_time').value = formData.cooking_time || '';
            if (document.getElementById('id_prep_time')) document.getElementById('id_prep_time').value = formData.prep_time || '';
            if (document.getElementById('id_servings')) document.getElementById('id_servings').value = formData.servings || '';
            if (document.getElementById('id_difficulty')) document.getElementById('id_difficulty').value = formData.difficulty || '';
            if (document.getElementById('id_notes')) document.getElementById('id_notes').value = formData.notes || '';
            
            // Update character counters
            if (titleChars) titleChars.textContent = formData.title?.length || 0;
            if (descriptionChars) descriptionChars.textContent = formData.description?.length || 0;
            
            // Restore categories (for Select2) after ensuring it's initialized
            if (formData.categories && formData.categories.length > 0) {
                // Wait a bit to ensure Select2 is initialized
                setTimeout(() => {
                    try {
                        const categorySelect = $('#id_categories');
                        
                        // Only proceed if Select2 is initialized
                        if (isSelect2Initialized(categorySelect)) {
                            // Clear existing options first
                            categorySelect.empty();
                            
                            // Add the saved options
                            formData.categories.forEach(category => {
                                if (category && category.id && category.text) {
                                    const option = new Option(category.text, category.id, true, true);
                                    categorySelect.append(option);
                                }
                            });
                            categorySelect.trigger('change');
                        }
                    } catch (e) {
                        console.warn('Error restoring Select2 data:', e);
                    }
                }, 500); // Increased timeout to ensure Select2 is ready
            }
            
            // Restore ingredients
            if (formData.ingredients && formData.ingredients.length > 0) {
                // Clear existing ingredients
                document.querySelector('.ingredients-list').innerHTML = '';
                
                // Add each ingredient
                formData.ingredients.forEach(ingredient => {
                    const newItem = document.createElement('div');
                    newItem.className = 'ingredient-item';
                    newItem.innerHTML = `
                        <input type="text" class="ingredient-input" placeholder="e.g. 2 cups flour" value="${ingredient}">
                        <button type="button" class="remove-item-btn"><i class="fas fa-times"></i></button>
                    `;
                    document.querySelector('.ingredients-list').appendChild(newItem);
                    
                    // Add event listeners
                    const input = newItem.querySelector('.ingredient-input');
                    input.addEventListener('input', updateIngredientsField);
                    
                    const removeBtn = newItem.querySelector('.remove-item-btn');
                    removeBtn.addEventListener('click', function() {
                        newItem.remove();
                        updateIngredientsField();
                        saveFormState();
                    });
                });
                updateIngredientsField();
            }
            
            // Restore instructions
            if (formData.instructions && formData.instructions.length > 0) {
                // Clear existing instructions
                document.querySelector('.instructions-list').innerHTML = '';
                
                // Add each instruction
                formData.instructions.forEach((instruction, index) => {
                    const newItem = document.createElement('div');
                    newItem.className = 'instruction-item';
                    newItem.innerHTML = `
                        <span class="step-number">${index + 1}</span>
                        <textarea class="instruction-input" placeholder="Describe this step...">${instruction}</textarea>
                        <button type="button" class="remove-item-btn"><i class="fas fa-times"></i></button>
                    `;
                    document.querySelector('.instructions-list').appendChild(newItem);
                    
                    // Add event listeners
                    const textarea = newItem.querySelector('.instruction-input');
                    textarea.addEventListener('input', updateInstructionsField);
                    
                    const removeBtn = newItem.querySelector('.remove-item-btn');
                    removeBtn.addEventListener('click', function() {
                        newItem.remove();
                        updateInstructionsField();
                        saveFormState();
                    });
                });
                updateInstructionsField();
            }
            
            // Go to saved step
            if (typeof formData.step === 'number' && formData.step >= 0) {
                showStep(formData.step);
                return true;
            }
            
            return true;
        } catch (e) {
            console.error('Error restoring form state:', e);
            return false;
        }
    }
    
    // Clear saved form state
    function clearFormState() {
        localStorage.removeItem(STORAGE_KEY);
    }
    
    // Character counters
    const titleInput = document.getElementById('id_title');
    const descriptionInput = document.getElementById('id_description');
    const titleChars = document.getElementById('title-chars');
    const descriptionChars = document.getElementById('description-chars');
    
    if (titleInput && titleChars) {
        titleInput.addEventListener('input', function() {
            titleChars.textContent = this.value.length;
            saveFormState();
        });
        // Initialize counter
        titleChars.textContent = titleInput.value.length;
    }
    
    if (descriptionInput && descriptionChars) {
        descriptionInput.addEventListener('input', function() {
            descriptionChars.textContent = this.value.length;
            saveFormState();
        });
        // Initialize counter
        descriptionChars.textContent = descriptionInput.value.length;
    }
    
    // Track changes on all form inputs
    document.querySelectorAll('#recipe-form input, #recipe-form textarea, #recipe-form select').forEach(input => {
        input.addEventListener('change', saveFormState);
    });
    
    // Multi-step form navigation
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    
    // Show a specific step
    function showStep(stepIndex) {
        formSteps.forEach((step, index) => {
            step.style.display = index === stepIndex ? 'block' : 'none';
        });
        
        progressSteps.forEach((step, index) => {
            if (index <= stepIndex) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Scroll to top of form
        window.scrollTo({
            top: document.querySelector('.recipe-form-container').offsetTop - 20,
            behavior: 'smooth'
        });
        
        // Save the current step
        // Delay saving form state to ensure Select2 is fully initialized
        setTimeout(saveFormState, 100);
    }
    
    // Next button click handler
    if (nextButtons) {
        nextButtons.forEach(button => {
            button.addEventListener('click', function() {
                const currentStepEl = this.closest('.form-step');
                const currentStep = Array.from(formSteps).indexOf(currentStepEl);
                const nextStep = currentStep + 1;
                
                if (validateStep(currentStep)) {
                    showStep(nextStep);
                    
                    // Show step transition notification
                    try {
                        const stepNames = ['Basic Information', 'Ingredients & Instructions', 'Images & Media'];
                        if (typeof Notify !== 'undefined') {
                        Notify.info(`Moving to: ${stepNames[nextStep]}`);
                        } else {
                            // Fallback if Notify is not defined
                            console.log(`Moving to: ${stepNames[nextStep]}`);
                        }
                    } catch (e) {
                        console.warn('Could not show notification:', e);
                        // Continue regardless of notification error
                    }
                }
            });
        });
    }
    
    // Previous button click handler
    if (prevButtons) {
        prevButtons.forEach(button => {
            button.addEventListener('click', function() {
                const currentStepEl = this.closest('.form-step');
                const currentStep = Array.from(formSteps).indexOf(currentStepEl);
                const prevStep = currentStep - 1;
                showStep(prevStep);
            });
        });
    }
    
    // Validate each step
    function validateStep(stepIndex) {
        // Basic info validation
        if (stepIndex === 0) {
            const title = document.getElementById('id_title').value.trim();
            const description = document.getElementById('id_description').value.trim();
            const servings = document.getElementById('id_servings').value.trim();
            const prepTime = document.getElementById('id_prep_time').value.trim();
            const cookingTime = document.getElementById('id_cooking_time').value.trim();
            
            if (!title) {
                showError('Please enter a recipe title');
                return false;
            }
            
            if (!description) {
                showError('Please enter a recipe description');
                return false;
            }
            
            if (!servings) {
                showError('Please enter the number of servings');
                return false;
            }
            
            if (!prepTime) {
                showError('Please enter the preparation time');
                return false;
            }
            
            if (!cookingTime) {
                showError('Please enter the cooking time');
                return false;
            }
            
            // Check if at least one category is selected
            let categorySelected = false;
            
            try {
                // Try Select2 method first
                const categorySelect = $('#id_categories');
                if (isSelect2Initialized(categorySelect)) {
                    const selectedCategories = categorySelect.select2('data');
                    categorySelected = selectedCategories && selectedCategories.length > 0;
                } else {
                    // If Select2 not initialized, check the regular select
                    console.log('Select2 not initialized, checking regular select');
                    const selectedOptions = document.querySelectorAll('#id_categories option:checked');
                    categorySelected = selectedOptions.length > 0;
                }
            } catch (e) {
                console.warn('Error validating categories:', e);
                // Fallback to checking regular select
                const selectedOptions = document.querySelectorAll('#id_categories option:checked');
                categorySelected = selectedOptions.length > 0;
            }
            
            if (!categorySelected) {
                showError('Please select at least one category');
                return false;
            }
        }
        
        // Ingredients & instructions validation
        if (stepIndex === 1) {
            const ingredientItems = document.querySelectorAll('.ingredient-item .ingredient-input');
            const instructionItems = document.querySelectorAll('.instruction-item .instruction-input');
            
            let hasIngredient = false;
            ingredientItems.forEach(item => {
                if (item.value.trim()) hasIngredient = true;
            });
            
            if (!hasIngredient) {
                showError('Please add at least one ingredient');
                return false;
            }
            
            let hasInstruction = false;
            instructionItems.forEach(item => {
                if (item.value.trim()) hasInstruction = true;
            });
            
            if (!hasInstruction) {
                showError('Please add at least one instruction step');
                return false;
            }
            
            // Ensure ingredients and instructions are updated in the hidden field
            updateIngredientsField();
            updateInstructionsField();
        }
        
        return true;
    }
    
    function showError(message) {
        try {
        if (typeof Notify !== 'undefined') {
            Notify.error(message);
        } else {
                // Fallback if Notify is not defined
            alert(message);
                // Log the error to console as well
                console.error('Form error:', message);
                }
            } catch (e) {
            // Ultimate fallback if anything fails
            alert(message);
            console.error('Error showing notification:', e, 'Original message:', message);
        }
    }
    
    // Wait for possible Select2 initialization before attempting to restore form
    setTimeout(function() {
        // Try to restore form state first, if not, initialize form to first step
        if (!restoreFormState()) {
            showStep(0);
        }
    }, 300);
    
    // Dynamic ingredient fields
    const ingredientsList = document.querySelector('.ingredients-list');
    const addIngredientBtn = document.querySelector('.add-ingredient-btn');
    
    function updateIngredientsField() {
        const ingredients = [];
        document.querySelectorAll('.ingredient-input').forEach(input => {
            const value = input.value.trim();
            if (value) {
                ingredients.push(value);
            }
        });
        
        document.getElementById('id_ingredients').value = ingredients.join('\n');
    }
    
    if (addIngredientBtn && ingredientsList) {
        addIngredientBtn.addEventListener('click', function() {
            const newItem = document.createElement('div');
            newItem.className = 'ingredient-item';
            newItem.innerHTML = `
                <input type="text" class="ingredient-input" placeholder="e.g. 2 cups flour">
                <button type="button" class="remove-item-btn"><i class="fas fa-times"></i></button>
            `;
            
            ingredientsList.appendChild(newItem);
            
            // Add event listener to new ingredient input
            const newInput = newItem.querySelector('.ingredient-input');
            newInput.addEventListener('input', function() {
                updateIngredientsField();
                saveFormState();
            });
            
            // Focus the new input
            newInput.focus();
            
            // Add event listener to remove button
            const removeBtn = newItem.querySelector('.remove-item-btn');
            removeBtn.addEventListener('click', function() {
                newItem.remove();
                updateIngredientsField();
                saveFormState();
            });
            
            // Save state after adding new item
            saveFormState();
        });
        
        // Add event listeners to existing ingredient inputs
        document.querySelectorAll('.ingredient-input').forEach(input => {
            input.addEventListener('input', function() {
                updateIngredientsField();
                saveFormState();
            });
        });
        
        // Add event listeners to existing remove buttons
        document.querySelectorAll('.ingredient-item .remove-item-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.ingredient-item').remove();
                updateIngredientsField();
                saveFormState();
            });
        });
        
        // Initialize from existing ingredients if present
        const ingredientsField = document.getElementById('id_ingredients');
        if (ingredientsField && ingredientsField.value && !localStorage.getItem(STORAGE_KEY)) {
            // Clear any existing ingredient items
            ingredientsList.innerHTML = '';
            
            const ingredients = ingredientsField.value.split('\n');
            ingredients.forEach(ingredient => {
                if (ingredient.trim()) {
                    const newItem = document.createElement('div');
                    newItem.className = 'ingredient-item';
                    newItem.innerHTML = `
                        <input type="text" class="ingredient-input" placeholder="e.g. 2 cups flour" value="${ingredient.trim()}">
                        <button type="button" class="remove-item-btn"><i class="fas fa-times"></i></button>
                    `;
                    
                    ingredientsList.appendChild(newItem);
                    
                    // Add event listener to input
                    const input = newItem.querySelector('.ingredient-input');
                    input.addEventListener('input', function() {
                        updateIngredientsField();
                        saveFormState();
                    });
                    
                    // Add event listener to remove button
                    const removeBtn = newItem.querySelector('.remove-item-btn');
                    removeBtn.addEventListener('click', function() {
                        newItem.remove();
                        updateIngredientsField();
                        saveFormState();
                    });
                }
            });
        }
    }
    
    // Dynamic instruction fields
    const instructionsList = document.querySelector('.instructions-list');
    const addInstructionBtn = document.querySelector('.add-instruction-btn');
    
    function updateInstructionsField() {
        const instructions = [];
        document.querySelectorAll('.instruction-input').forEach(textarea => {
            const value = textarea.value.trim();
            if (value) {
                instructions.push(value);
            }
        });
        
        document.getElementById('id_instructions').value = instructions.join('\n');
        
        // Update step numbers
        document.querySelectorAll('.instruction-item').forEach((item, index) => {
            item.querySelector('.step-number').textContent = index + 1;
        });
    }
    
    if (addInstructionBtn && instructionsList) {
        addInstructionBtn.addEventListener('click', function() {
            const newItem = document.createElement('div');
            newItem.className = 'instruction-item';
            
            // Calculate the next step number
            const stepNumber = document.querySelectorAll('.instruction-item').length + 1;
            
            newItem.innerHTML = `
                <span class="step-number">${stepNumber}</span>
                <textarea class="instruction-input" placeholder="Describe this step..."></textarea>
                <button type="button" class="remove-item-btn"><i class="fas fa-times"></i></button>
            `;
            
            instructionsList.appendChild(newItem);
            
            // Add event listener to new instruction textarea
            const newTextarea = newItem.querySelector('.instruction-input');
            newTextarea.addEventListener('input', function() {
                updateInstructionsField();
                saveFormState();
            });
            
            // Focus the new textarea
            newTextarea.focus();
            
            // Add event listener to remove button
            const removeBtn = newItem.querySelector('.remove-item-btn');
            removeBtn.addEventListener('click', function() {
                newItem.remove();
                updateInstructionsField();
                saveFormState();
            });
            
            // Save state after adding new item
            saveFormState();
        });
        
        // Add event listeners to existing instruction textareas
        document.querySelectorAll('.instruction-input').forEach(textarea => {
            textarea.addEventListener('input', function() {
                updateInstructionsField();
                saveFormState();
            });
        });
        
        // Add event listeners to existing remove buttons
        document.querySelectorAll('.instruction-item .remove-item-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.instruction-item').remove();
                updateInstructionsField();
                saveFormState();
            });
        });
        
        // Initialize from existing instructions if present
        const instructionsField = document.getElementById('id_instructions');
        if (instructionsField && instructionsField.value && !localStorage.getItem(STORAGE_KEY)) {
            // Clear any existing instruction items
            instructionsList.innerHTML = '';
            
            const instructions = instructionsField.value.split('\n');
            instructions.forEach((instruction, index) => {
                if (instruction.trim()) {
                    const newItem = document.createElement('div');
                    newItem.className = 'instruction-item';
                    newItem.innerHTML = `
                        <span class="step-number">${index + 1}</span>
                        <textarea class="instruction-input" placeholder="Describe this step...">${instruction.trim()}</textarea>
                        <button type="button" class="remove-item-btn"><i class="fas fa-times"></i></button>
                    `;
                    
                    instructionsList.appendChild(newItem);
                    
                    // Add event listener to textarea
                    const textarea = newItem.querySelector('.instruction-input');
                    textarea.addEventListener('input', function() {
                        updateInstructionsField();
                        saveFormState();
                    });
                    
                    // Add event listener to remove button
                    const removeBtn = newItem.querySelector('.remove-item-btn');
                    removeBtn.addEventListener('click', function() {
                        newItem.remove();
                        updateInstructionsField();
                        saveFormState();
                    });
                }
            });
        }
    }
    
    // Image preview
    const imageInput = document.getElementById('id_image');
    const imageDropzone = document.getElementById('image-dropzone');
    const imagePreviews = document.getElementById('image-previews');
    
    if (imageInput && imageDropzone && imagePreviews) {
        // Handle file selection
        imageInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                // Process each file
                for (let i = 0; i < this.files.length; i++) {
                    const file = this.files[i];
                    
                    // Validate file type
                    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
                    if (!validImageTypes.includes(file.type)) {
                        showError(`Invalid file type: ${file.name}. Please upload a valid image (JPEG, PNG, GIF, WebP or BMP).`);
                        continue; // Skip this file but continue with others
                    }
                    
                    // Validate file size (max 10MB)
                    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
                    if (file.size > maxSize) {
                        showError(`Image too large: ${file.name}. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
                        continue; // Skip this file but continue with others
                    }
                    
                    // Create preview for this file
                    createPreviewItem(file);
                }
                
                // Hide dropzone if we have previews
                if (imagePreviews.children.length > 0) {
                    imageDropzone.style.display = 'none';
                    imagePreviews.style.display = 'grid';
                }
            }
        });
        
        // Function to create a preview item
        function createPreviewItem(file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.dataset.fileName = file.name;
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = 'Preview';
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-image-btn';
                removeBtn.type = 'button';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.addEventListener('click', function() {
                    // Remove this preview
                    previewItem.remove();
                    
                    // Show dropzone if no more previews
                    if (imagePreviews.children.length === 0) {
                        imageDropzone.style.display = 'block';
                        imagePreviews.style.display = 'none';
                    }
                    
                    // Note: we can't truly remove a file from the FileList, 
                    // we'll handle this in the form submission
                });
                
                previewItem.appendChild(img);
                previewItem.appendChild(removeBtn);
                imagePreviews.appendChild(previewItem);
            };
            
            reader.readAsDataURL(file);
        }
        
        // Handle dropzone click
        imageDropzone.addEventListener('click', function() {
            imageInput.click();
        });
        
        // Handle drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            imageDropzone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            imageDropzone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            imageDropzone.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            imageDropzone.classList.add('highlight');
        }
        
        function unhighlight() {
            imageDropzone.classList.remove('highlight');
        }
        
        imageDropzone.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files && files.length > 0) {
                // Process each dropped file
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    
                    // Validate file type
                    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
                    if (!validImageTypes.includes(file.type)) {
                        showError(`Invalid file type: ${file.name}. Please upload a valid image (JPEG, PNG, GIF, WebP or BMP).`);
                        continue; // Skip this file but continue with others
                    }
                    
                    // Validate file size (max 10MB)
                    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
                    if (file.size > maxSize) {
                        showError(`Image too large: ${file.name}. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
                        continue; // Skip this file but continue with others
                    }
                    
                    // Create preview for this file
                    createPreviewItem(file);
                }
                
                // We don't update the file input directly because FileList is read-only
                // Instead, we'll handle the uploaded files during form submission
                
                // Hide dropzone if we have previews
                if (imagePreviews.children.length > 0) {
                    imageDropzone.style.display = 'none';
                    imagePreviews.style.display = 'grid';
                }
            }
        }
    }
    
    // Form submission with validation
    const recipeForm = document.getElementById('recipe-form');
    
    if (recipeForm) {
        recipeForm.addEventListener('submit', function(e) {
            // Update hidden fields
            updateIngredientsField();
            updateInstructionsField();
            
            // Final validation check for categories
            let categorySelected = false;
            
            try {
                // Try Select2 method first
                const categorySelect = $('#id_categories');
                if (isSelect2Initialized(categorySelect)) {
                    const selectedCategories = categorySelect.select2('data');
                    categorySelected = selectedCategories && selectedCategories.length > 0;
                } else {
                    // If Select2 not initialized, check the regular select
                    console.log('Select2 not initialized, checking regular select');
                    const selectedOptions = document.querySelectorAll('#id_categories option:checked');
                    categorySelected = selectedOptions.length > 0;
                }
            } catch (e) {
                console.warn('Error checking categories during submission:', e);
                // Fallback to checking regular select
                const selectedOptions = document.querySelectorAll('#id_categories option:checked');
                categorySelected = selectedOptions.length > 0;
            }
            
            if (!categorySelected) {
                e.preventDefault();
                showError('Please select at least one category');
                showStep(0); // Go back to first step where categories are
                return false;
            }
            
            // Validate final step if we're on it
            const visibleStep = Array.from(formSteps).findIndex(step => 
                step.style.display === 'block' || step.style.display === '');
            
            if (visibleStep === 2) {
                const imageInput = document.getElementById('id_image');
                
                // Check if we're editing and already have images or if a new image is selected
                const isEditing = window.location.pathname.includes('edit');
                const hasExistingImages = document.querySelector('.current-images')?.querySelector('.image-item');
                
                if (!isEditing || !hasExistingImages) {
                    if (!imageInput.files || !imageInput.files[0]) {
                        e.preventDefault();
                        showError('Please upload at least one image for your recipe');
                        return false;
                    }
                    
                    // Additional validation for the selected image
                    const file = imageInput.files[0];
                    
                    // Validate file type
                    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
                    if (!validImageTypes.includes(file.type)) {
                        e.preventDefault();
                        showError(`Invalid file type. Please upload a valid image (JPEG, PNG, GIF, WebP or BMP). You uploaded: ${file.type}`);
                        return false;
                    }
                    
                    // Validate file size (max 10MB)
                    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
                    if (file.size > maxSize) {
                        e.preventDefault();
                        showError(`Image is too large. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
                        return false;
                    }
                }
            }
            
            // If we get here, form is valid, clear saved state
            clearFormState();
        });
    }
    
    // Add initial ingredient and instruction items if needed
    if (ingredientsList && !ingredientsList.querySelector('.ingredient-item') && !localStorage.getItem(STORAGE_KEY)) {
        addIngredientBtn.click();
    }
    
    if (instructionsList && !instructionsList.querySelector('.instruction-item') && !localStorage.getItem(STORAGE_KEY)) {
        addInstructionBtn.click();
    }
}); 