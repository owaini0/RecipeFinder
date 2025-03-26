document.addEventListener('DOMContentLoaded', function() {

    const recipeCards = document.querySelectorAll('.recipe-card');
    
    if (recipeCards.length > 0) {

        recipeCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    }

    document.querySelectorAll('.remove-from-collection').forEach(button => {
        button.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-recipe-id');
            const collectionId = this.getAttribute('data-collection-id');
            const recipeCard = this.closest('.recipe-card');
            const recipeName = recipeCard.querySelector('h3 a')?.textContent || 'this recipe';

            showConfirmationModal(
                `Remove Recipe`, 
                `Are you sure you want to remove "${recipeName}" from this collection?`, 
                function() {
                    removeRecipeFromCollection(recipeId, collectionId, recipeCard);
                }
            );
        });
    });

    function showConfirmationModal(title, message, onConfirm) {

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.width = '100%';
        modalOverlay.style.height = '100%';
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalOverlay.style.zIndex = '1000';
        modalOverlay.style.display = 'flex';
        modalOverlay.style.justifyContent = 'center';
        modalOverlay.style.alignItems = 'center';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.backgroundColor = 'white';
        modalContent.style.borderRadius = '8px';
        modalContent.style.padding = '20px';
        modalContent.style.maxWidth = '450px';
        modalContent.style.width = '90%';
        modalContent.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        modalContent.style.animation = 'fadeIn 0.3s';
        
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.style.borderBottom = '1px solid #eee';
        modalHeader.style.paddingBottom = '10px';
        modalHeader.style.marginBottom = '15px';
        
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = title;
        modalTitle.style.margin = '0';
        modalTitle.style.fontSize = '18px';
        modalTitle.style.color = '#333';
        
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.style.margin = '15px 0';
        
        const modalMessage = document.createElement('p');
        modalMessage.textContent = message;
        modalMessage.style.margin = '0';
        modalMessage.style.fontSize = '16px';
        
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        modalFooter.style.display = 'flex';
        modalFooter.style.justifyContent = 'flex-end';
        modalFooter.style.gap = '10px';
        modalFooter.style.marginTop = '20px';
        
        const btnNo = document.createElement('button');
        btnNo.textContent = 'No';
        btnNo.className = 'btn btn-outline-secondary';
        btnNo.style.padding = '8px 16px';
        btnNo.style.border = '1px solid #ccc';
        btnNo.style.borderRadius = '4px';
        btnNo.style.cursor = 'pointer';
        
        const btnYes = document.createElement('button');
        btnYes.textContent = 'Yes';
        btnYes.className = 'btn btn-danger';
        btnYes.style.padding = '8px 16px';
        btnYes.style.backgroundColor = 'var(--danger-color, #dc3545)';
        btnYes.style.color = 'white';
        btnYes.style.border = 'none';
        btnYes.style.borderRadius = '4px';
        btnYes.style.cursor = 'pointer';
        
        
        modalHeader.appendChild(modalTitle);
        modalBody.appendChild(modalMessage);
        modalFooter.appendChild(btnNo);
        modalFooter.appendChild(btnYes);
        
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        

        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
        

        btnNo.addEventListener('click', function() {
            document.body.removeChild(modalOverlay);
        });
        
        btnYes.addEventListener('click', function() {
            document.body.removeChild(modalOverlay);
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        });
        

        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });
    }
    

    function removeRecipeFromCollection(recipeId, collectionId, recipeCard) {
        fetch('/add-to-collection/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: `recipe_id=${recipeId}&collection_id=${collectionId}`
        })
        .then(response => response.json())
        .then(data => {
            if (!data.in_collection) {

                recipeCard.style.transform = 'scale(0.8)';
                recipeCard.style.opacity = '0';
                

                if (typeof Notify !== 'undefined') {
                    Notify.success(StandardMessages.RECIPE_REMOVED_FROM_COLLECTION || 'Recipe removed from collection');
                }
                
                setTimeout(() => {
                    recipeCard.remove();
                    
                    const remainingCards = document.querySelectorAll('.recipe-card');
                    if (remainingCards.length === 0) {

                        window.location.reload();
                    }
                }, 300);
            }
        })
        .catch(error => {
            console.error('Error removing recipe from collection:', error);
            if (typeof Notify !== 'undefined') {
                Notify.error(StandardMessages.SERVER_ERROR || 'Error connecting to server');
            }
        });
    }
    
    const metaItems = document.querySelectorAll('.collection-meta span');
    metaItems.forEach(item => {
        item.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        item.addEventListener('mouseout', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}); 