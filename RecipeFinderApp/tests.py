from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.text import slugify
from django.core.files.base import File
import os
from pathlib import Path

from .models import (
    Recipe, UserProfile, Category, Like, 
    Follow, Collection, Comment, RecipeImage
)

class RecipeTestCase(TestCase):
    """Base setup for our tests"""
    
    def setUp(self):
        # Create a couple test users
        self.user1 = User.objects.create_user(
            username='testuser1', 
            email='test1@example.com',
            password='password123'
        )
        self.user2 = User.objects.create_user(
            username='testuser2', 
            email='test2@example.com',
            password='password123'
        )
        
        # Create a category 
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            description='A test category'
        )
        
        # Create a test recipe
        self.recipe = Recipe.objects.create(
            title='Test Recipe',
            slug=slugify('Test Recipe'),
            author=self.user1,
            description='A test recipe description',
            ingredients='Ingredient 1\nIngredient 2\nIngredient 3',
            instructions='Step 1\nStep 2\nStep 3',
            cooking_time=30,
            prep_time=15,
            servings=4,
            difficulty='medium'
        )
        self.recipe.categories.add(self.category)
        
        # Add images from recipe_images directory to the recipe
        self.add_recipe_images()
        
        # Create a client
        self.client = Client()
    
    def add_recipe_images(self):
        """Add images from recipe_images directory to test recipes"""
        # Path to the recipe_images directory
        images_dir = Path('recipe_images')
        
        # Check if the directory exists
        if not images_dir.exists():
            print("Warning: recipe_images directory not found")
            return
        
        # Get all image files from the directory
        image_files = list(images_dir.glob('*.png')) + list(images_dir.glob('*.jpg')) + list(images_dir.glob('*.jpeg'))
        
        # If we have images, add the first one to our test recipe
        if image_files:
            img_path = image_files[0]
            with open(img_path, 'rb') as img_file:
                # Create a RecipeImage instance
                recipe_image = RecipeImage(
                    recipe=self.recipe,
                    caption="Test Recipe Image",
                    is_primary=True
                )
                # Save the image to the RecipeImage instance
                recipe_image.image.save(
                    img_path.name,
                    File(img_file),
                    save=True
                )
            print(f"Added image {img_path.name} to test recipe")

class RecipeViewTests(RecipeTestCase):
    """Basic tests for our main recipe views"""
    
    def test_home_page_loads(self):
        """Check the home page works"""
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Recipe')
    
    def test_recipe_detail_page(self):
        """Make sure recipe details show up"""
        response = self.client.get(
            reverse('recipe_detail', kwargs={'slug': self.recipe.slug})
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Recipe')
        self.assertContains(response, 'A test recipe description')
    
    def test_recipe_filtering(self):
        """Make sure search/filtering works"""
        # Create another recipe for testing
        breakfast_recipe = Recipe.objects.create(
            title='Breakfast Pancakes',
            slug=slugify('Breakfast Pancakes'),
            author=self.user1,
            description='Morning pancakes',
            ingredients='Flour\nEggs\nMilk',
            instructions='Mix\nCook',
            cooking_time=15,
            prep_time=10,
            servings=2,
            difficulty='easy'
        )
        
        # Add a specific pancake image to this recipe if available
        images_dir = Path('recipe_images')
        pancake_images = list(images_dir.glob('*pancake*.png')) + list(images_dir.glob('*Pancake*.png'))
        
        if pancake_images:
            img_path = pancake_images[0]
            with open(img_path, 'rb') as img_file:
                recipe_image = RecipeImage(
                    recipe=breakfast_recipe,
                    caption="Breakfast Pancakes Image",
                    is_primary=True
                )
                recipe_image.image.save(
                    img_path.name,
                    File(img_file),
                    save=True
                )
            print(f"Added image {img_path.name} to breakfast recipe")
        
        # Test search by title
        response = self.client.get(f"{reverse('recipe_list')}?query=pancake")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Breakfast Pancakes')
        self.assertNotContains(response, 'Test Recipe')

class InteractionTests(RecipeTestCase):
    """Tests for user interactions (likes, comments, etc)"""
    
    def test_like_recipe(self):
        """Can users like recipes?"""
        # Log in
        self.client.login(username='testuser2', password='password123')
        
        # Like the recipe
        response = self.client.post(
            reverse('like_recipe'),
            {'recipe_id': self.recipe.id},
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        
        # Check it worked
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['liked'])
        
        # Check database
        self.assertTrue(
            Like.objects.filter(user=self.user2, recipe=self.recipe).exists()
        )
    
    def test_follow_user(self):
        """Can users follow each other?"""
        # Log in
        self.client.login(username='testuser2', password='password123')
        
        # Follow user1
        response = self.client.post(
            reverse('follow_user'),
            {'user_id': self.user1.id},
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        
        # Check it worked
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['following'])
        
        # Check database
        self.assertTrue(
            Follow.objects.filter(
                follower=self.user2, 
                following=self.user1
            ).exists()
        )
    
    def test_add_comment(self):
        """Can users comment on recipes?"""
        # Log in
        self.client.login(username='testuser2', password='password123')
        
        # Add a comment
        response = self.client.post(
            reverse('recipe_detail', kwargs={'slug': self.recipe.slug}),
            {
                'action': 'comment',
                'content': 'Great recipe, thanks!'
            }
        )
        
        # Should redirect back to recipe
        self.assertEqual(response.status_code, 302)
        
        # Check database
        self.assertTrue(
            Comment.objects.filter(
                user=self.user2,
                recipe=self.recipe,
                content='Great recipe, thanks!'
            ).exists()
        )

class CollectionTest(RecipeTestCase):
    """Test recipe collections"""
    
    def test_collection_workflow(self):
        """Test creating and using a collection"""
        # Log in
        self.client.login(username='testuser1', password='password123')
        
        # Create a collection
        response = self.client.post(
            reverse('collection_create'),
            {
                'name': 'My Favorites',
                'description': 'My favorite recipes',
                'is_public': True
            }
        )
        
        # Should redirect to the collection
        self.assertEqual(response.status_code, 302)
        
        # Check the collection was created
        collection = Collection.objects.get(name='My Favorites')
        self.assertEqual(collection.user, self.user1)
        
        # Add the recipe to the collection
        response = self.client.post(
            reverse('add_to_collection'),
            {
                'recipe_id': self.recipe.id,
                'collection_id': collection.id
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Check it's in the collection
        self.assertIn(self.recipe, collection.recipes.all())

# Helper function to add images to recipes for the population script
def add_images_to_recipes(recipes):
    """Attach actual images from recipe_images directory to recipes"""
    images_dir = Path('recipe_images')
    
    if not images_dir.exists():
        print("Warning: recipe_images directory not found")
        return
    
    # Match recipe titles with specific image files based on name patterns
    image_mapping = {
        'pancake': 'Sunday20Pancakes20Recipe20NZ20Chelsea20Sugar.png',
        'carbonara': 'carbonara-horizontal-mediumSquareAt3X-v2.png',
        'avocado': 'avocado-6b1cf76.png',
        'tomato': 'creamy-tomato-basil-soup-image.png',
        'cookie': 'cookie.png'
    }
    
    # Process each recipe
    for recipe in recipes:
        # Find a matching image based on recipe title
        matched_image = None
        for keyword, image_file in image_mapping.items():
            if keyword.lower() in recipe.title.lower():
                matched_image = image_file
                break
        
        # If no specific match, use any available image
        if not matched_image and os.listdir(images_dir):
            matched_image = os.listdir(images_dir)[0]
        
        # If we have an image, attach it to the recipe
        if matched_image:
            img_path = images_dir / matched_image
            if img_path.exists():
                with open(img_path, 'rb') as img_file:
                    recipe_image = RecipeImage(
                        recipe=recipe,
                        caption=f"{recipe.title} Image",
                        is_primary=True
                    )
                    recipe_image.image.save(
                        img_path.name,
                        File(img_file),
                        save=True
                    )
                print(f"Added image {img_path.name} to recipe '{recipe.title}'")
