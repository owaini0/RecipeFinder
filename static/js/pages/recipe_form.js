document.addEventListener('DOMContentLoaded', function() {
    function isSelect2Initialized(element) {
        return $(element).hasClass('select2-hidden-accessible');
    }
    
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
    
    function getCurrentStep() {
        const visibleStep = Array.from(document.querySelectorAll('.form-step')).findIndex(step => {
            const display = window.getComputedStyle(step).display;
            return display !== 'none';
        });
        return visibleStep >= 0 ? visibleStep : 0;
    }
    
    function getIngredientValues() {
        const ingredients = [];
        document.querySelectorAll('.ingredient-input').forEach(input => {
            if (input.value.trim()) {
                ingredients.push(input.value.trim());
            }
        });
        return ingredients;
    }
    
    function getInstructionValues() {
        const instructions = [];
        document.querySelectorAll('.instruction-input').forEach(textarea => {
            if (textarea.value.trim()) {
                instructions.push(textarea.value.trim());
            }
        });
        return instructions;
    }
    
    const titleInput = document.getElementById('id_title');
    const descriptionInput = document.getElementById('id_description');
    const titleChars = document.getElementById('title-chars');
    const descriptionChars = document.getElementById('description-chars');
    
    if (titleInput && titleChars) {
        titleInput.addEventListener('input', function() {
            titleChars.textContent = this.value.length;
        });
        titleChars.textContent = titleInput.value.length;
    }
    
    if (descriptionInput && descriptionChars) {
        descriptionInput.addEventListener('input', function() {
            descriptionChars.textContent = this.value.length;
        });
        descriptionChars.textContent = descriptionInput.value.length;
    }
    
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    
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
        
        window.scrollTo({
            top: document.querySelector('.recipe-form-container').offsetTop - 20,
            behavior: 'smooth'
        });
    }
    
    if (nextButtons) {
        nextButtons.forEach(button => {
            button.addEventListener('click', function() {
                const currentStepEl = this.closest('.form-step');
                const currentStep = Array.from(formSteps).indexOf(currentStepEl);
                const nextStep = currentStep + 1;
                
                if (validateStep(currentStep)) {
                    showStep(nextStep);
                    
                    try {
                        const stepNames = ['Basic Information', 'Ingredients & Instructions', 'Images & Media'];
                        if (typeof Notify !== 'undefined') {
                        Notify.info(`Moving to: ${stepNames[nextStep]}`);
                        } else {
                            console.log(`Moving to: ${stepNames[nextStep]}`);
                        }
                    } catch (e) {
                        console.warn('Could not show notification:', e);
                    }
                }
            });
        });
    }
    
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
    
    function validateStep(stepIndex) {
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
            
            let categorySelected = false;
            
            try {
                const categorySelect = $('#id_categories');
                if (isSelect2Initialized(categorySelect)) {
                    const selectedCategories = categorySelect.select2('data');
                    categorySelected = selectedCategories && selectedCategories.length > 0;
                } else {
                    console.log('Select2 not initialized, checking regular select');
                    const selectedOptions = document.querySelectorAll('#id_categories option:checked');
                    categorySelected = selectedOptions.length > 0;
                }
            } catch (e) {
                console.warn('Error validating categories:', e);
                const selectedOptions = document.querySelectorAll('#id_categories option:checked');
                categorySelected = selectedOptions.length > 0;
            }
            
            if (!categorySelected) {
                showError('Please select at least one category');
                return false;
            }
        }
        
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
            
            updateIngredientsField();
            updateInstructionsField();
        }
        
        if (stepIndex === 2) {
            return true;
        }
        
        return true;
    }
    
    function showError(message) {
        try {
        if (typeof Notify !== 'undefined') {
            Notify.error(message);
        } else {
            alert(message);
                console.error('Form error:', message);
                }
            } catch (e) {
            alert(message);
            console.error('Error showing notification:', e, 'Original message:', message);
        }
    }
    
    showStep(0);
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
            const newInput = newItem.querySelector('.ingredient-input');
            newInput.addEventListener('input', function() {
                updateIngredientsField();
            });
            
            newInput.focus();
            
            const removeBtn = newItem.querySelector('.remove-item-btn');
            removeBtn.addEventListener('click', function() {
                newItem.remove();
                updateIngredientsField();
            });
        });
        
        document.querySelectorAll('.ingredient-input').forEach(input => {
            input.addEventListener('input', function() {
                updateIngredientsField();
            });
        });
        
        document.querySelectorAll('.ingredient-item .remove-item-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.ingredient-item').remove();
                updateIngredientsField();
            });
        });
        
        // Initialize from existing ingredients if present
        const ingredientsField = document.getElementById('id_ingredients');
        if (ingredientsField && ingredientsField.value) {
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
                    const input = newItem.querySelector('.ingredient-input');
                    input.addEventListener('input', function() {
                        updateIngredientsField();
                    });
                    
                    const removeBtn = newItem.querySelector('.remove-item-btn');
                    removeBtn.addEventListener('click', function() {
                        newItem.remove();
                        updateIngredientsField();
                    });
                }
            });
        }
    }
    
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
        
        document.querySelectorAll('.instruction-item').forEach((item, index) => {
            item.querySelector('.step-number').textContent = index + 1;
        });
    }
    
    if (addInstructionBtn && instructionsList) {
        addInstructionBtn.addEventListener('click', function() {
            const newItem = document.createElement('div');
            newItem.className = 'instruction-item';
            
            const stepNumber = document.querySelectorAll('.instruction-item').length + 1;
            
            newItem.innerHTML = `
                <span class="step-number">${stepNumber}</span>
                <textarea class="instruction-input" placeholder="Describe this step..."></textarea>
                <button type="button" class="remove-item-btn"><i class="fas fa-times"></i></button>
            `;
            
            instructionsList.appendChild(newItem);
            
            const newTextarea = newItem.querySelector('.instruction-input');
            newTextarea.addEventListener('input', function() {
                updateInstructionsField();
            });
            
            newTextarea.focus();
            
            const removeBtn = newItem.querySelector('.remove-item-btn');
            removeBtn.addEventListener('click', function() {
                newItem.remove();
                updateInstructionsField();
            });
        });
        
        document.querySelectorAll('.instruction-input').forEach(textarea => {
            textarea.addEventListener('input', function() {
                updateInstructionsField();
            });
        });
        
        document.querySelectorAll('.instruction-item .remove-item-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.instruction-item').remove();
                updateInstructionsField();
            });
        });
        
        const instructionsField = document.getElementById('id_instructions');
        if (instructionsField && instructionsField.value) {
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
                    
                    const textarea = newItem.querySelector('.instruction-input');
                    textarea.addEventListener('input', function() {
                        updateInstructionsField();
                    });
                    
                    const removeBtn = newItem.querySelector('.remove-item-btn');
                    removeBtn.addEventListener('click', function() {
                        newItem.remove();
                        updateInstructionsField();
                    });
                }
            });
        }
    }
    
    const imageInput = document.getElementById('id_image');
    const imageDropzone = document.getElementById('image-dropzone');
    const imagePreviews = document.getElementById('image-previews');
    
    if (imageInput && imageDropzone && imagePreviews) {
        imageInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                for (let i = 0; i < this.files.length; i++) {
                    const file = this.files[i];
                    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
                    if (!validImageTypes.includes(file.type)) {
                        showError(`Invalid file type: ${file.name}. Please upload a valid image (JPEG, PNG, GIF, WebP or BMP).`);
                        continue;
                    }
                    
                    const maxSize = 10 * 1024 * 1024;
                    if (file.size > maxSize) {
                        showError(`Image too large: ${file.name}. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
                        continue;
                    }
                    
                    createPreviewItem(file);
                }
                
                if (imagePreviews.children.length > 0) {
                    imageDropzone.style.display = 'none';
                    imagePreviews.style.display = 'grid';
                }
            }
        });
        
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

                    previewItem.remove();
                    
                    if (imagePreviews.children.length === 0) {
                        imageDropzone.style.display = 'block';
                        imagePreviews.style.display = 'none';
                    }

                });
                
                previewItem.appendChild(img);
                previewItem.appendChild(removeBtn);
                imagePreviews.appendChild(previewItem);
            };
            
            reader.readAsDataURL(file);
        }
        
        imageDropzone.addEventListener('click', function() {
            imageInput.click();
        });

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
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    
                    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
                    if (!validImageTypes.includes(file.type)) {
                        showError(`Invalid file type: ${file.name}. Please upload a valid image (JPEG, PNG, GIF, WebP or BMP).`);
                        continue;
                    }
                    
                    const maxSize = 10 * 1024 * 1024;
                    if (file.size > maxSize) {
                        showError(`Image too large: ${file.name}. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
                        continue;
                    }

                    createPreviewItem(file);
                }

                if (imagePreviews.children.length > 0) {
                    imageDropzone.style.display = 'none';
                    imagePreviews.style.display = 'grid';
                }
            }
        }
    }
    
    const recipeForm = document.getElementById('recipe-form');
    
    if (recipeForm) {
        recipeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            updateIngredientsField();
            updateInstructionsField();
            
            let categorySelected = false;
            
            try {

                const categorySelect = $('#id_categories');
                if (isSelect2Initialized(categorySelect)) {
                    const selectedCategories = categorySelect.select2('data');
                    categorySelected = selectedCategories && selectedCategories.length > 0;
                    const newCategories = selectedCategories.filter(cat => cat.id && cat.id.toString().startsWith('new:'));
                    
                    if (newCategories.length > 0) {
                        showLoader('Creating new categories...');
                        
                        for (const newCat of newCategories) {
                            const categoryName = newCat.text.replace(' (New)', '');
                            
                            try {
                                const formData = new FormData();
                                formData.append('name', categoryName);
                                
                                const response = await fetch('/api/categories/create/', {
                                    method: 'POST',
                                    body: formData,
                                    headers: {
                                        'X-CSRFToken': getCsrfToken()
                                    }
                                });
                                
                                if (response.ok) {
                                    const data = await response.json();
                                    
                                    if (data.success) {
                                        const index = selectedCategories.findIndex(cat => cat.id === newCat.id);
                                        if (index !== -1) {
                                            categorySelect.find(`option[value="${newCat.id}"]`).remove();
                                            const newOption = new Option(data.category.name, data.category.id, true, true);
                                            categorySelect.append(newOption);
                                        }
                                    } else {
                                        throw new Error(data.error || 'Failed to create category');
                                    }
                                } else {
                                    throw new Error('Server error creating category');
                                }
                            } catch (err) {
                                console.error('Error creating category:', err);
                                hideLoader();
                                showError(`Error creating category "${categoryName}": ${err.message}`);
                                return false;
                            }
                        }
                        hideLoader();
                    }
                } else {
                    console.log('Select2 not initialized, checking regular select');
                    const selectedOptions = document.querySelectorAll('#id_categories option:checked');
                    categorySelected = selectedOptions.length > 0;
                }
            } catch (e) {
                console.warn('Error checking categories during submission:', e);
                const selectedOptions = document.querySelectorAll('#id_categories option:checked');
                categorySelected = selectedOptions.length > 0;
            }
            
            if (!categorySelected) {
                showError('Please select at least one category');
                showStep(0);
                return false;
            }
            
            const visibleStep = Array.from(formSteps).findIndex(step => 
                step.style.display === 'block' || step.style.display === '');
                
            if (visibleStep === formSteps.length - 1 && !validateStep(visibleStep)) {
                return false;
            }

            this.submit();
        });
    }

    function getCsrfToken() {
        return document.querySelector('input[name="csrfmiddlewaretoken"]').value;
    }
    
    function showLoader(message) {
        let loader = document.getElementById('form-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'form-loader';
            loader.className = 'form-loader';
            
            const spinnerContainer = document.createElement('div');
            spinnerContainer.className = 'loader-spinner';
            
            const spinner = document.createElement('div');
            spinner.className = 'spinner';
            
            const messageEl = document.createElement('div');
            messageEl.className = 'loader-message';
            
            spinnerContainer.appendChild(spinner);
            loader.appendChild(spinnerContainer);
            loader.appendChild(messageEl);
            
            document.body.appendChild(loader);
        }
        
        const messageEl = loader.querySelector('.loader-message');
        messageEl.textContent = message || 'Processing...';
        loader.style.display = 'flex';
    }
    
    function hideLoader() {
        const loader = document.getElementById('form-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
    
    if (ingredientsList && !ingredientsList.querySelector('.ingredient-item')) {
        addIngredientBtn.click();
    }
    
    if (instructionsList && !instructionsList.querySelector('.instruction-item')) {
        addInstructionBtn.click();
    }
}); 