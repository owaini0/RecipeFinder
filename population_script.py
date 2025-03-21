import os
import sys
import django
import random
from datetime import timedelta
import shutil
from pathlib import Path

# Setup Django environment
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Recipefinder.settings')
django.setup()

# Import Django models after setup
from django.utils.text import slugify
from django.core.files import File
from django.contrib.auth.models import User
from django.utils import timezone
from RecipeFinderApp.models import (
    UserProfile, Category, Recipe, RecipeImage, 
    RecipeVideo, Like, Comment, Follow, Collection, 
    ChefVerification
)

def clear_data():
    """Clear existing data before populating"""
    print("Clearing existing data...")
    Comment.objects.all().delete()
    Like.objects.all().delete()
    RecipeImage.objects.all().delete()
    RecipeVideo.objects.all().delete()
    Recipe.objects.all().delete()
    Collection.objects.all().delete()
    Follow.objects.all().delete()
    ChefVerification.objects.all().delete()
    Category.objects.all().delete()
    User.objects.filter(is_superuser=False).delete()
    
    print("Data cleared.")

def setup_sample_images():
    """Setup sample image directory"""
    sample_img_dir = Path('sample_images')
    
    if not sample_img_dir.exists():
        sample_img_dir.mkdir()
    
    return sample_img_dir

def create_users():
    """Create sample users and chefs"""
    print("Creating users...")
    users = []
    
    # Regular users
    user_data = [
        {'username': 'foodlover', 'email': 'foodlover@example.com', 
         'first_name': 'Sarah', 'last_name': 'Johnson', 'is_chef': False},
        {'username': 'homecook', 'email': 'homecook@example.com', 
         'first_name': 'Mike', 'last_name': 'Davis', 'is_chef': False},
        {'username': 'healthnut', 'email': 'healthnut@example.com', 
         'first_name': 'Emma', 'last_name': 'Wilson', 'is_chef': False},
    ]
    
    # Chef users
    chef_data = [
        {'username': 'chefgordon', 'email': 'gordon@example.com', 
         'first_name': 'Gordon', 'last_name': 'Ramsey', 'is_chef': True, 'chef_verified': True},
        {'username': 'chefjamie', 'email': 'jamie@example.com', 
         'first_name': 'Jamie', 'last_name': 'Oliver', 'is_chef': True, 'chef_verified': True},
        {'username': 'chefnigella', 'email': 'nigella@example.com', 
         'first_name': 'Nigella', 'last_name': 'Lawson', 'is_chef': True, 'chef_verified': False},
    ]
    
    # Create regular users
    for data in user_data:
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password='password123',
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        profile = UserProfile.objects.get(user=user)
        profile.bio = f"Food enthusiast and home cook. Love to share my culinary adventures!"
        profile.location = random.choice(['New York', 'London', 'Paris', 'Tokyo', 'Sydney'])
        profile.website = f"https://{data['username']}.example.com"
        profile.save()
        users.append(user)
    
    # Create chef users
    for data in chef_data:
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password='password123',
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        profile = UserProfile.objects.get(user=user)
        profile.is_chef = True
        profile.chef_verified = data.get('chef_verified', False)
        profile.bio = f"Professional chef with passion for creating delicious recipes."
        profile.location = random.choice(['New York', 'London', 'Paris', 'Tokyo', 'Sydney'])
        profile.website = f"https://{data['username']}.example.com"
        profile.save()
        
        print(f"Created chef user: {user.username} with is_chef={profile.is_chef}")
        
        users.append(user)
        
        # Create verification for chefs
        if data['is_chef']:
            ChefVerification.objects.create(
                user=user,
                full_name=f"{data['first_name']} {data['last_name']}",
                current_position=random.choice(['Head Chef', 'Executive Chef', 'Pastry Chef', 'Sous Chef']),
                establishment=random.choice(['Golden Restaurant', 'Blue Ocean Grill', 'Green Garden Bistro', 'Red Spice Kitchen']),
                status='approved' if data.get('chef_verified', False) else 'pending',
                additional_info="Over 10 years of professional cooking experience in high-end restaurants.",
                submitted_at=timezone.now() - timedelta(days=random.randint(1, 30))
            )
    
    print(f"Created {len(users)} users")
    return users

def create_categories():
    """Create recipe categories"""
    print("Creating categories...")
    categories = []
    
    category_data = [
        {'name': 'Breakfast', 'description': 'Start your day with these delicious breakfast recipes'},
        {'name': 'Lunch', 'description': 'Perfect midday meal ideas'},
        {'name': 'Dinner', 'description': 'Hearty and satisfying dinner recipes'},
        {'name': 'Dessert', 'description': 'Sweet treats to end any meal'},
        {'name': 'Vegetarian', 'description': 'Meat-free recipes full of flavor'},
        {'name': 'Vegan', 'description': 'Plant-based recipes for everyone'},
        {'name': 'Gluten-Free', 'description': 'Recipes without gluten for dietary needs'},
        {'name': 'Quick & Easy', 'description': 'Ready in 30 minutes or less'},
        {'name': 'Italian', 'description': 'Classic Italian cuisine'},
        {'name': 'Mexican', 'description': 'Spicy and flavorful Mexican dishes'},
        {'name': 'Asian', 'description': 'Recipes from across Asia'},
        {'name': 'Healthy', 'description': 'Nutritious and wholesome recipes'},
        {'name': 'Comfort Food', 'description': 'Soul-satisfying comfort classics'},
        {'name': 'Budget-Friendly', 'description': 'Affordable meals that don\'t break the bank'},
        {'name': 'Holiday', 'description': 'Special occasion and holiday recipes'},
    ]
    
    for data in category_data:
        category = Category.objects.create(
            name=data['name'],
            slug=slugify(data['name']),
            description=data['description']
        )
        categories.append(category)
    
    print(f"Created {len(categories)} categories")
    return categories

def create_recipes(users, categories):
    """Create sample recipes"""
    print("Creating recipes...")
    recipes = []
    
    recipe_data = [
        {
            'title': 'Classic Pancakes',
            'description': 'Fluffy, golden pancakes that are perfect for a weekend breakfast. Serve with maple syrup and fresh berries for a delicious start to the day.',
            'ingredients': '2 cups all-purpose flour\n1 tablespoon baking powder\n2 tablespoons sugar\n1/2 teaspoon salt\n2 large eggs\n1 1/2 cups milk\n1/4 cup butter, melted\n1 teaspoon vanilla extract',
            'instructions': '1. In a large bowl, whisk together flour, baking powder, sugar, and salt.\n2. In another bowl, beat the eggs, then add milk, melted butter, and vanilla.\n3. Pour the wet ingredients into the dry ingredients and stir just until combined. Don\'t overmix.\n4. Heat a lightly oiled griddle or frying pan over medium-high heat.\n5. Pour 1/4 cup of batter onto the griddle for each pancake.\n6. Cook until bubbles form on the surface, then flip and cook until golden brown.\n7. Serve warm with maple syrup, butter, or your favorite toppings.',
            'cooking_time': 15,
            'prep_time': 10,
            'servings': 4,
            'difficulty': 'easy',
            'categories': ['Breakfast', 'Quick & Easy'],
            'notes': 'For extra fluffy pancakes, let the batter rest for 5 minutes before cooking. You can add blueberries, chocolate chips, or sliced bananas to the batter.'
        },
        {
            'title': 'Spaghetti Carbonara',
            'description': 'A classic Italian pasta dish with crispy pancetta, eggs, and Parmesan cheese. Simple yet incredibly satisfying.',
            'ingredients': '1 pound spaghetti\n8 ounces pancetta or bacon, diced\n4 large eggs\n1 cup freshly grated Parmesan cheese\n4 garlic cloves, minced\n1 teaspoon black pepper\nSalt to taste\nFreshly chopped parsley for garnish',
            'instructions': '1. Bring a large pot of salted water to a boil. Add the spaghetti and cook until al dente.\n2. While the pasta is cooking, heat a large skillet over medium heat and cook the pancetta until crispy, about 8-10 minutes.\n3. In a bowl, whisk together eggs, Parmesan cheese, and black pepper.\n4. Add the minced garlic to the pancetta and cook for 30 seconds until fragrant.\n5. Drain the pasta, reserving 1/2 cup of pasta water.\n6. Working quickly, add the hot pasta to the skillet with the pancetta. Remove from heat.\n7. Pour the egg mixture over the pasta and toss quickly to create a creamy sauce. The residual heat will cook the eggs.\n8. If needed, add a splash of the reserved pasta water to loosen the sauce.\n9. Season with salt to taste and garnish with extra Parmesan and chopped parsley.',
            'cooking_time': 15,
            'prep_time': 10,
            'servings': 4,
            'difficulty': 'medium',
            'categories': ['Dinner', 'Italian'],
            'notes': 'The key to a good carbonara is to work quickly and toss the pasta continuously to prevent the eggs from scrambling. For a more authentic version, use guanciale instead of pancetta.'
        },
        {
            'title': 'Avocado Toast with Poached Eggs',
            'description': 'Creamy avocado spread on toasted sourdough bread topped with perfectly poached eggs. A nutritious and delicious breakfast or brunch option.',
            'ingredients': '2 slices sourdough bread\n1 ripe avocado\n2 large eggs\n1 tablespoon white vinegar\nSalt and pepper to taste\nRed pepper flakes (optional)\nFresh chopped herbs (like cilantro or chives)\n1/2 lemon, juiced',
            'instructions': '1. Toast the sourdough bread until golden brown.\n2. Cut the avocado in half, remove the pit, and scoop the flesh into a bowl.\n3. Add lemon juice, salt, and pepper to the avocado and mash with a fork until slightly chunky or smooth, depending on preference.\n4. Fill a deep skillet with about 3 inches of water and bring to a gentle simmer. Add vinegar.\n5. Crack each egg into a small cup or ramekin.\n6. Create a whirlpool in the water and gently slip the eggs in. Cook for 3-4 minutes for runny yolks.\n7. Remove eggs with a slotted spoon and place on a paper towel to drain excess water.\n8. Spread the avocado mixture on the toasted bread.\n9. Top each piece with a poached egg. Season with salt, pepper, and red pepper flakes if desired.\n10. Garnish with fresh herbs and serve immediately.',
            'cooking_time': 10,
            'prep_time': 10,
            'servings': 1,
            'difficulty': 'medium',
            'categories': ['Breakfast', 'Vegetarian', 'Healthy'],
            'notes': 'For extra flavor, try adding crumbled feta cheese, sliced radishes, or microgreens on top. You can also experiment with different spices like everything bagel seasoning or za\'atar.'
        },
        {
            'title': 'Creamy Tomato Soup',
            'description': 'A comforting, silky smooth tomato soup that\'s perfect for lunch or as a starter. Pair with a grilled cheese sandwich for the ultimate comfort meal.',
            'ingredients': '2 tablespoons olive oil\n1 onion, chopped\n2 garlic cloves, minced\n2 tablespoons tomato paste\n2 (28-ounce) cans whole peeled tomatoes\n2 cups vegetable broth\n1/2 cup heavy cream\n2 tablespoons fresh basil, chopped (plus more for garnish)\n1 teaspoon sugar\nSalt and pepper to taste',
            'instructions': '1. Heat olive oil in a large pot over medium heat.\n2. Add onion and cook until soft and translucent, about 5 minutes.\n3. Add garlic and cook for another minute until fragrant.\n4. Stir in tomato paste and cook for 2 minutes.\n5. Add canned tomatoes (with their juice) and vegetable broth.\n6. Bring to a simmer and cook for 15-20 minutes.\n7. Use an immersion blender to puree the soup until smooth. Alternatively, carefully transfer to a blender in batches.\n8. Return soup to pot if using a blender and add heavy cream, chopped basil, and sugar.\n9. Simmer for an additional 5 minutes. Season with salt and pepper.\n10. Serve hot, garnished with additional basil and a swirl of cream if desired.',
            'cooking_time': 25,
            'prep_time': 10,
            'servings': 6,
            'difficulty': 'easy',
            'categories': ['Lunch', 'Vegetarian', 'Comfort Food'],
            'notes': 'For a lighter version, substitute the heavy cream with half-and-half or whole milk. To make it vegan, use coconut milk instead of cream.'
        },
        {
            'title': 'Chocolate Chip Cookies',
            'description': 'Classic chocolate chip cookies with crispy edges and soft, chewy centers loaded with chocolate chips. A timeless favorite that\'s sure to please everyone.',
            'ingredients': '2 1/4 cups all-purpose flour\n1 teaspoon baking soda\n1 teaspoon salt\n1 cup (2 sticks) unsalted butter, softened\n3/4 cup granulated sugar\n3/4 cup packed brown sugar\n2 large eggs\n2 teaspoons vanilla extract\n2 cups semisweet chocolate chips\n1 cup chopped nuts (optional)',
            'instructions': '1. Preheat oven to 375°F (190°C). Line baking sheets with parchment paper.\n2. In a small bowl, whisk together flour, baking soda, and salt.\n3. In a large bowl, beat the butter, granulated sugar, and brown sugar until creamy.\n4. Add eggs one at a time, beating well after each addition. Stir in vanilla.\n5. Gradually stir in the flour mixture until just combined. Do not overmix.\n6. Fold in chocolate chips and nuts if using.\n7. Drop by rounded tablespoons onto the prepared baking sheets, spacing cookies about 2 inches apart.\n8. Bake for 9-11 minutes or until golden brown.\n9. Cool on baking sheets for 2 minutes, then transfer to wire racks to cool completely.',
            'cooking_time': 10,
            'prep_time': 15,
            'servings': 36,
            'difficulty': 'easy',
            'categories': ['Dessert', 'Comfort Food'],
            'notes': 'For best results, chill the dough for at least 30 minutes or up to 24 hours before baking. This allows the flavors to meld and results in a chewier cookie. For flatter, crispier cookies, press down slightly on the dough balls before baking.'
        }
    ]
    
    for data in recipe_data:
        # Choose a random author, preferring chef users sometimes
        chef_users = [u for u in users if hasattr(u, 'profile') and getattr(u.profile, 'is_chef', False)]
        if random.random() > 0.5 and chef_users:
            author = random.choice(chef_users)
        else:
            author = random.choice(users)
        
        # Create recipe
        recipe = Recipe.objects.create(
            title=data['title'],
            slug=slugify(data['title']),
            author=author,
            description=data['description'],
            ingredients=data['ingredients'],
            instructions=data['instructions'],
            cooking_time=data['cooking_time'],
            prep_time=data['prep_time'],
            servings=data['servings'],
            difficulty=data['difficulty'],
            notes=data['notes'],
            featured=random.choice([True, False, False, False]),  # 25% chance to be featured
            created_at=timezone.now() - timedelta(days=random.randint(1, 60))
        )
        
        # Add categories
        for cat_name in data['categories']:
            category = Category.objects.get(name=cat_name)
            recipe.categories.add(category)
        
        recipes.append(recipe)
    
    print(f"Created {len(recipes)} recipes")
    return recipes

def create_images_for_recipes(recipes):
    """Create sample recipe images with placeholders"""
    print("Creating recipe images...")
    
    # Create sample_images directory if it doesn't exist
    sample_img_dir = Path('sample_images')
    if not sample_img_dir.exists():
        sample_img_dir.mkdir()
    
    # Create a simple placeholder image if none exist
    placeholder_path = sample_img_dir / 'placeholder.jpg'
    if not placeholder_path.exists():
        print("Creating a placeholder image file...")
        try:
            # Option 1: Download a placeholder from a placeholder image service
            import requests
            response = requests.get('https://via.placeholder.com/800x600/CCCCCC/969696?text=Recipe+Image', stream=True)
            with open(placeholder_path, 'wb') as f:
                f.write(response.content)
            print(f"Downloaded placeholder image to {placeholder_path}")
        except Exception as e:
            print(f"Failed to download placeholder image: {e}")
            print("Using built-in sample image creation as fallback...")
            
            # Option 2: Create a basic colored rectangle as placeholder
            try:
                from PIL import Image, ImageDraw, ImageFont
                img = Image.new('RGB', (800, 600), color=(200, 200, 200))
                d = ImageDraw.Draw(img)
                d.rectangle([(50, 50), (750, 550)], fill=(150, 150, 150))
                d.text((400, 300), "Recipe Image", fill=(255, 255, 255), anchor="mm")
                img.save(placeholder_path)
                print(f"Created placeholder image at {placeholder_path}")
            except Exception as e:
                print(f"Failed to create placeholder image: {e}")
                # If all else fails, don't create image records
                print("WARNING: Could not create placeholder images. Recipe images will be skipped.")
                return
    
    # Now attach the placeholder image to recipes
    for recipe in recipes:
        # Create 1-2 images per recipe
        num_images = random.randint(1, 2)
        for i in range(num_images):
            # Open the file and create a Django File object
            with open(placeholder_path, 'rb') as img_file:
                img = RecipeImage(
                    recipe=recipe,
                    caption=f"Delicious {recipe.title}" if i == 0 else f"{recipe.title} - variation",
                    is_primary=(i == 0)  # First image is primary
                )
                # Assign the file to the ImageField
                img.image.save(
                    f"{slugify(recipe.title)}-{i+1}.jpg", 
                    File(img_file),
                    save=True
                )
    
    print(f"Created recipe images for all recipes")

def create_likes_and_comments(users, recipes):
    """Create likes and comments for recipes"""
    print("Creating likes and comments...")
    likes_count = 0
    comments_count = 0
    
    comment_texts = [
        "Delicious recipe! I made this last night and my family loved it.",
        "Great flavors, but I added a bit more salt than specified.",
        "This has become a weekly staple in our house. So good!",
        "I substituted chicken for tofu and it worked really well.",
        "Thank you for sharing such a detailed recipe with all the steps.",
        "Mine didn't turn out as pretty as yours, but it tasted amazing!",
        "Perfect weekend cooking project. Worth the effort.",
        "I've been looking for a recipe like this for ages. Thank you!",
        "The flavors in this are incredible. Restaurant quality for sure.",
        "Made this for a dinner party and everyone asked for the recipe!"
    ]
    
    for recipe in recipes:
        # Add 5-20 likes per recipe
        like_count = random.randint(5, 20)
        liking_users = random.sample(users, min(like_count, len(users)))
        for user in liking_users:
            Like.objects.create(
                user=user,
                recipe=recipe,
                created_at=recipe.created_at + timedelta(days=random.randint(1, 30))
            )
            likes_count += 1
        
        # Add 2-8 comments per recipe
        comment_count = random.randint(2, 8)
        commenting_users = random.sample(users, min(comment_count, len(users)))
        for user in commenting_users:
            Comment.objects.create(
                user=user,
                recipe=recipe,
                content=random.choice(comment_texts),
                created_at=recipe.created_at + timedelta(days=random.randint(1, 30))
            )
            comments_count += 1
    
    print(f"Created {likes_count} likes and {comments_count} comments")

def create_follows(users):
    """Create follow relationships between users"""
    print("Creating follows...")
    follows_count = 0
    
    for user in users:
        # Each user follows 1-4 other users
        follow_count = random.randint(1, 4)
        potential_followings = [u for u in users if u != user]
        following_users = random.sample(potential_followings, min(follow_count, len(potential_followings)))
        
        for following in following_users:
            Follow.objects.create(
                follower=user,
                following=following,
                created_at=timezone.now() - timedelta(days=random.randint(1, 60))
            )
            follows_count += 1
    
    print(f"Created {follows_count} follows")

def create_collections(users, recipes):
    """Create recipe collections"""
    print("Creating collections...")
    collections = []
    
    collection_names = [
        "Favorite Breakfasts",
        "Quick Weeknight Dinners",
        "Party Appetizers",
        "Healthy Meal Prep",
        "Comfort Food Classics",
        "Holiday Desserts",
        "Summer Grilling",
        "Winter Soups",
        "International Cuisine",
        "Family Favorites"
    ]
    
    for user in users:
        # Create 1-3 collections per user
        collection_count = random.randint(1, 3)
        user_collection_names = random.sample(collection_names, min(collection_count, len(collection_names)))
        
        for name in user_collection_names:
            # Create collection
            collection = Collection.objects.create(
                name=name,
                description=f"A collection of {name.lower()} recipes that I love.",
                user=user,
                is_public=random.choice([True, True, False]),  # 2/3 chance to be public
                created_at=timezone.now() - timedelta(days=random.randint(1, 90))
            )
            
            # Add 3-6 random recipes to collection
            recipe_count = random.randint(3, 6)
            collection_recipes = random.sample(list(recipes), min(recipe_count, len(recipes)))
            collection.recipes.add(*collection_recipes)
            
            collections.append(collection)
    
    print(f"Created {len(collections)} collections")

def run():
    """Main function to run the population script"""
    print("Starting population script...")
    
    # Clear existing data
    clear_data()
    
    # Create data
    users = create_users()
    categories = create_categories()
    recipes = create_recipes(users, categories)
    
    try:
        create_images_for_recipes(recipes)
    except Exception as e:
        print(f"WARNING: Failed to create recipe images: {e}")
        print("Continuing with population script...")
    
    create_likes_and_comments(users, recipes)
    create_follows(users)
    create_collections(users, recipes)
    
    print("Population completed successfully!")

if __name__ == '__main__':
    run() 