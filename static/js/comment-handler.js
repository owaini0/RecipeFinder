function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

document.addEventListener('DOMContentLoaded', function() {
    const commentForm = document.getElementById('comment-form');
    
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const recipeId = this.dataset.recipeId;
            const commentText = document.getElementById('comment-text').value;
            const formData = new FormData();
            formData.append('comment_text', commentText);
            
            fetch(`/recipe/${recipeId}/comment/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Add comment to the page
                    const commentsContainer = document.getElementById('comments-container');
                    const newComment = document.createElement('div');
                    newComment.className = 'comment';
                    newComment.innerHTML = `
                        <p><strong>${data.user}</strong> - ${data.created_at}</p>
                        <p>${data.text}</p>
                        <hr>
                    `;
                    commentsContainer.appendChild(newComment);
                    
                    // Clear the form
                    document.getElementById('comment-text').value = '';
                } else {
                    alert('Error adding comment: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while submitting your comment.');
            });
        });
    }
});
