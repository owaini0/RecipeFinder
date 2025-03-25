// ...existing code...

// Add event listener for heart icons in recipe cards
document.addEventListener('click', function(e) {
  if (e.target && e.target.classList.contains('fa-heart')) {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle active class for visual feedback
    e.target.classList.toggle('active');
    
    // Get recipe ID from closest recipe-card
    const recipeCard = e.target.closest('.recipe-card');
    const recipeId = recipeCard.dataset.id;
    
    // Update liked status in local storage
    toggleLikedRecipe(recipeId);
  }
});

// Function to toggle liked recipe in storage
function toggleLikedRecipe(recipeId) {
  let likedRecipes = JSON.parse(localStorage.getItem('likedRecipes')) || [];
  
  if (likedRecipes.includes(recipeId)) {
    likedRecipes = likedRecipes.filter(id => id !== recipeId);
  } else {
    likedRecipes.push(recipeId);
  }
  
  localStorage.setItem('likedRecipes', JSON.stringify(likedRecipes));
}

// ...existing code...
