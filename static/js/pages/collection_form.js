document.addEventListener('DOMContentLoaded', function() {
    // Handle collection privacy toggle
    const publicOption = document.querySelector('.option-public');
    const privateOption = document.querySelector('.option-private');
    let isPublicField = document.querySelector('input[name="is_public"]');
    
    if (publicOption && privateOption) {
        // Set initial value based on which option is active
        if (publicOption.classList.contains('active')) {
            isPublicField.value = 'true';
        } else if (privateOption.classList.contains('active')) {
            isPublicField.value = 'false';
        }
        
        // Add hover effects
        [publicOption, privateOption].forEach(option => {
            option.addEventListener('mouseenter', function() {
                if (!this.classList.contains('active')) {
                    this.style.backgroundColor = '#f5f5f5';
                }
            });
            
            option.addEventListener('mouseleave', function() {
                if (!this.classList.contains('active')) {
                    this.style.backgroundColor = '';
                }
            });
        });
        
        publicOption.addEventListener('click', function() {
            publicOption.classList.add('active');
            privateOption.classList.remove('active');
            isPublicField.value = 'true';
            
            // Reset background color on inactive option
            privateOption.style.backgroundColor = '';
        });
        
        privateOption.addEventListener('click', function() {
            privateOption.classList.add('active');
            publicOption.classList.remove('active');
            isPublicField.value = 'false';
            
            // Reset background color on inactive option
            publicOption.style.backgroundColor = '';
        });
    }
    
    // Handle image preview
    const imageInput = document.getElementById('id_image');
    const imagePreview = document.getElementById('image-preview');
    
    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', function() {
            // Clear existing preview content
            imagePreview.innerHTML = '';
            imagePreview.classList.remove('empty');
            
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = 'Collection Image Preview';
                    imagePreview.appendChild(img);
                };
                
                reader.readAsDataURL(this.files[0]);
            } else {
                // No file selected, show placeholder
                imagePreview.classList.add('empty');
                const icon = document.createElement('i');
                icon.className = 'fas fa-image';
                const span = document.createElement('span');
                span.textContent = 'No image selected';
                
                imagePreview.appendChild(icon);
                imagePreview.appendChild(span);
            }
        });
    }
}); 