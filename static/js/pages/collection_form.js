document.addEventListener('DOMContentLoaded', function() {

    const publicOption = document.querySelector('.option-public');
    const privateOption = document.querySelector('.option-private');
    let isPublicField = document.querySelector('input[name="is_public"]');
    
    if (publicOption && privateOption) {

        if (publicOption.classList.contains('active')) {
            isPublicField.value = 'true';
        } else if (privateOption.classList.contains('active')) {
            isPublicField.value = 'false';
        }
        

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
            
            privateOption.style.backgroundColor = '';
        });
        
        privateOption.addEventListener('click', function() {
            privateOption.classList.add('active');
            publicOption.classList.remove('active');
            isPublicField.value = 'false';
            
            publicOption.style.backgroundColor = '';
        });
    }
    
    const imageInput = document.getElementById('id_image');
    const imagePreview = document.getElementById('image-preview');
    
    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', function() {
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