from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse, HttpResponseForbidden
from django.db.models import Count
from django.views.decorators.http import require_POST
from django.core.paginator import Paginator
from django.urls import reverse
from .models import (
    Recipe, Category, UserProfile, Comment, 
    Like, Follow, Collection, RecipeImage, RecipeVideo, ChefVerification
)
from .forms import (
    UserRegistrationForm, UserLoginForm, UserProfileForm,
    RecipeForm, CommentForm, CollectionForm, RecipeImageForm,
    RecipeVideoForm, SearchForm
)
from django.utils import timezone
from django.db import transaction
from django.utils.text import slugify
import itertools

def home(request):
    """Main landing page with featured, popular, and newest recipes"""
    featured_recipes = Recipe.objects.filter(featured=True)[:3]
    
    popular_recipes = Recipe.objects.annotate(
        total_likes=Count('likes')).order_by('-total_likes')[:6]
    
    newest_recipes = Recipe.objects.order_by('-created_at')[:6]
    
    categories = Category.objects.all()
    
    liked_recipes_ids = []
    if request.user.is_authenticated:
        liked_recipes_ids = Like.objects.filter(user=request.user).values_list('recipe_id', flat=True)
    
    context = {
        'featured_recipes': featured_recipes,
        'popular_recipes': popular_recipes,
        'newest_recipes': newest_recipes,
        'categories': categories,
        'liked_recipes_ids': liked_recipes_ids
    }
    return render(request, 'recipe_finder/home.html', context)

def register(request):
    """User registration with profile creation"""
    if request.user.is_authenticated:
        messages.info(request, 'You are already logged in.')
        return redirect('home')
    
    # Block AJAX requests
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return HttpResponseForbidden("AJAX registration is disabled. Please use traditional form submission.")
        
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            try:
                # Ensure database integrity
                with transaction.atomic():
                    user = form.save()
                    UserProfile.objects.get_or_create(user=user)
                
                # Auto-login after registration
                username = form.cleaned_data.get('username')
                password = form.cleaned_data.get('password1')
                user = authenticate(username=username, password=password)
                
                if user is not None:
                    login(request, user)
                    messages.success(request, f'Welcome to RecipeFinder, {username}! Your account has been created successfully.')
                    return redirect('home')
                else:
                    messages.warning(request, 'Account created but automatic login failed. Please log in manually.')
                    return redirect('login')
            except Exception as e:
                messages.error(request, f'An error occurred during registration: {str(e)}')
        else:
            # Help user fix form errors
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f'{field.replace("_", " ").title()}: {error}')
    else:
        form = UserRegistrationForm()
    
    context = {
        'form': form,
        'timestamp': int(timezone.now().timestamp())  # Cache-busting
    }
    
    return render(request, 'recipe_finder/register.html', context)

def user_login(request):
    """User login view"""
    if request.user.is_authenticated:
        return redirect('home')
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return HttpResponseForbidden("AJAX login is disabled. Please use traditional form submission.")
        
    if request.method == 'POST':
        form = UserLoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'Welcome back, {username}!')
                
                next_url = request.GET.get('next', 'home')
                return redirect(next_url)
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = UserLoginForm()
    
    context = {
        'form': form,
        'timestamp': int(timezone.now().timestamp())  # Cache-busting
    }
    
    return render(request, 'recipe_finder/login.html', context)

@login_required
def user_logout(request):
    """Log out the current user"""
    logout(request)
    messages.success(request, 'You have been logged out.')
    return redirect('home')

# Profile Views
@login_required
def profile(request, username=None):
    """View for user profile page"""
    if username:
        profile_user = get_object_or_404(User, username=username)
    else:
        if not request.user.is_authenticated:
            return redirect('login')
        profile_user = request.user
    
    profile = get_object_or_404(UserProfile, user=profile_user)
    recipes = Recipe.objects.filter(author=profile_user)
    collections = Collection.objects.filter(user=profile_user, is_public=True)
    
    # Auto-update is_chef flag for users with 5+ recipes
    if request.user == profile_user and recipes.count() >= 5 and not profile.is_chef:
        profile.is_chef = True
        profile.save()
    
    # Get IDs of recipes liked by current user
    liked_recipes_ids = []
    if request.user.is_authenticated:
        liked_recipes_ids = Like.objects.filter(
            user=request.user, 
            recipe__in=recipes
        ).values_list('recipe_id', flat=True)
    
    # Get all recipes liked by the profile user
    liked_recipes = []
    if profile_user:
        liked_recipes = Recipe.objects.filter(
            likes__user=profile_user
        ).select_related('author').prefetch_related('images')
    
    # Check if current user follows profile user
    is_following = False
    if request.user.is_authenticated and request.user != profile_user:
        is_following = Follow.objects.filter(
            follower=request.user,
            following=profile_user
        ).exists()
    
    # Count followers and following
    followers_count = Follow.objects.filter(following=profile_user).count()
    following_count = Follow.objects.filter(follower=profile_user).count()
    
    context = {
        'profile': profile,
        'profile_user': profile_user,
        'recipes': recipes,
        'collections': collections,
        'liked_recipes': liked_recipes,
        'liked_recipes_ids': liked_recipes_ids,
        'is_following': is_following,
        'followers_count': followers_count,
        'following_count': following_count,
    }
    
    return render(request, 'recipe_finder/profile.html', context)

@login_required
def edit_profile(request):
    """Edit user profile view"""
    profile = get_object_or_404(UserProfile, user=request.user)
    
    # Count user's recipes
    recipes_count = Recipe.objects.filter(author=request.user).count()
    
    # Calculate how many more recipes are needed for verification
    recipes_needed = max(0, 5 - recipes_count)
    
    # Remove automatic setting of is_chef
    # Let the user decide if they want to be a chef
    
    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            # Don't force is_chef to be true
            form.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('profile')
    else:
        form = UserProfileForm(instance=profile)
    
    return render(request, 'recipe_finder/edit_profile.html', {
        'form': form,
        'profile': profile,
        'recipes_count': recipes_count,
        'recipes_needed': recipes_needed
    })

# Recipe Views
def recipe_list(request):
    """View for listing and searching recipes"""
    recipes = Recipe.objects.all()
    categories = Category.objects.all()
    
    form = SearchForm(request.GET)
    if form.is_valid():
        query = form.cleaned_data.get('query')
        category = form.cleaned_data.get('category')
        difficulty = form.cleaned_data.get('difficulty')
        
        max_cooking_time = form.cleaned_data.get('max_cooking_time')
        
        if query:
            recipes = recipes.filter(title__icontains=query)
        
        if category:
            recipes = recipes.filter(categories=category)
        
        if difficulty:
            recipes = recipes.filter(difficulty=difficulty)
        
        if max_cooking_time:
            recipes = recipes.filter(cooking_time__lte=max_cooking_time)
    
    # Check which recipes the user has liked
    liked_recipes_ids = []
    if request.user.is_authenticated:
        liked_recipes_ids = Like.objects.filter(user=request.user).values_list('recipe_id', flat=True)
    
    # Pagination
    paginator = Paginator(recipes, 9)  # Show 9 recipes per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'form': form,
        'categories': categories,
        'liked_recipes_ids': liked_recipes_ids
    }
    return render(request, 'recipe_finder/recipe_list.html', context)

def recipe_detail(request, slug):
    """View for showing a recipe's details"""
    recipe = get_object_or_404(Recipe, slug=slug)
    comments = Comment.objects.filter(recipe=recipe)
    
    # Get similar recipes from same categories
    similar_recipes = Recipe.objects.filter(
        categories__in=recipe.categories.all()
    ).exclude(id=recipe.id).distinct()[:3]
    
    # Check if user has liked this recipe
    user_liked = False
    user_collections = []
    if request.user.is_authenticated:
        user_liked = Like.objects.filter(
            user=request.user, 
            recipe=recipe
        ).exists()
        
        # Get user's collections
        user_collections = Collection.objects.filter(user=request.user)
    
    # Comment form 
    comment_form = CommentForm()
    if request.method == 'POST' and request.user.is_authenticated:
        # Check if it's an AJAX comment submission
        if request.POST.get('action') == 'comment':
            comment_form = CommentForm(request.POST)
            if comment_form.is_valid():
                new_comment = comment_form.save(commit=False)
                new_comment.user = request.user
                new_comment.recipe = recipe
                new_comment.save()
                
                # Check if it's an AJAX request
                is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
                if is_ajax:
                    return JsonResponse({
                        'success': True,
                        'username': request.user.username,
                        'content': new_comment.content
                    })
                else:
                    # Non-AJAX comment submission should redirect
                    messages.success(request, 'Comment added successfully!')
                    return redirect('recipe_detail', slug=slug)
        else:
            # Regular form submission
            comment_form = CommentForm(request.POST)
            if comment_form.is_valid():
                new_comment = comment_form.save(commit=False)
                new_comment.user = request.user
                new_comment.recipe = recipe
                new_comment.save()
                messages.success(request, 'Comment added successfully!')
                return redirect('recipe_detail', slug=slug)
            else:
                messages.error(request, 'Error submitting comment. Please check the form.')
    
    context = {
        'recipe': recipe,
        'comments': comments,
        'similar_recipes': similar_recipes,
        'user_liked': user_liked,
        'comment_form': comment_form,
        'comments_count': comments.count(),
        'user_collections': user_collections
    }
    
    return render(request, 'recipe_finder/recipe_detail.html', context)

@login_required
def recipe_create(request):
    """View for creating a new recipe"""
    if request.method == 'POST':
        recipe_form = RecipeForm(request.POST)
        image_form = RecipeImageForm(request.POST, request.FILES)
        video_form = RecipeVideoForm(request.POST, request.FILES)
        
        if recipe_form.is_valid():
            # Recipe form is valid, save the recipe
            recipe = recipe_form.save(commit=False)
            recipe.author = request.user
            recipe.save()
            recipe_form.save_m2m()  # Save many-to-many relationships
            
            # Handle multiple media uploads
            files = request.FILES.getlist('image')
            if files:
                # Process all uploaded files
                is_first = True  # Track first file to set as primary
                for file in files:
                    try:
                        # Check if it's a video file
                        import os
                        ext = os.path.splitext(file.name)[1].lower()
                        video_extensions = ['.mp4', '.webm', '.ogg']
                        
                        if ext in video_extensions:
                            # Create a video instance
                            video = RecipeVideo(
                                recipe=recipe,
                                video=file,
                                caption=request.POST.get('caption', '')
                            )
                            video.save()
                        else:
                            # Create an image instance
                            image = RecipeImage(
                                recipe=recipe,
                                image=file,
                                caption=request.POST.get('caption', ''),
                                is_primary=is_first  # First file is primary
                            )
                            image.save()
                            is_first = False  # Only the first file is primary
                    except Exception as e:
                        messages.error(request, f"Error saving media: {str(e)}")
                
                messages.success(request, f'Recipe created successfully with uploaded media!')
            else:
                # No images or videos uploaded
                messages.warning(request, "Recipe saved without images or videos. You can edit your recipe to add media later.")
            
            return redirect('recipe_detail', slug=recipe.slug)
        else:
            # Recipe form is invalid
            messages.error(request, "Please correct the errors in your form.")
    else:
        recipe_form = RecipeForm()
        image_form = RecipeImageForm()
        video_form = RecipeVideoForm()
    
    # Add categories to the context
    categories = Category.objects.all()
    
    context = {
        'recipe_form': recipe_form,
        'image_form': image_form,
        'video_form': video_form,
        'categories': categories,
    }
    return render(request, 'recipe_finder/recipe_form.html', context)

@login_required
def recipe_edit(request, slug):
    """View for editing an existing recipe"""
    recipe = get_object_or_404(Recipe, slug=slug)
    
    # Check if user is the author
    if request.user != recipe.author:
        return HttpResponseForbidden("You don't have permission to edit this recipe")
    
    if request.method == 'POST':
        recipe_form = RecipeForm(request.POST, instance=recipe)
        image_form = RecipeImageForm(request.POST, request.FILES)
        video_form = RecipeVideoForm(request.POST, request.FILES)
        
        if recipe_form.is_valid():
            recipe_form.save()
            
            # Handle multiple media uploads
            files = request.FILES.getlist('image')
            if files:
                # Process all uploaded files
                make_primary = request.POST.get('is_primary') == 'on'
                
                if make_primary:
                    # Reset primary status on existing images if a new one will be primary
                    RecipeImage.objects.filter(recipe=recipe, is_primary=True).update(is_primary=False)
                
                # Determine if this is the first image for the recipe
                first_image = not RecipeImage.objects.filter(recipe=recipe).exists()
                
                # Count for reporting to user
                image_count = 0
                video_count = 0
                
                for file in files:
                    try:
                        # Check if it's a video file
                        import os
                        ext = os.path.splitext(file.name)[1].lower()
                        video_extensions = ['.mp4', '.webm', '.ogg']
                        
                        if ext in video_extensions:
                            # Create a video instance
                            video = RecipeVideo(
                                recipe=recipe,
                                video=file,
                                caption=request.POST.get('caption', '')
                            )
                            video.save()
                            video_count += 1
                        else:
                            # Create an image instance
                            image = RecipeImage(
                                recipe=recipe,
                                image=file,
                                caption=request.POST.get('caption', ''),
                                # Make the first image primary if no images exist, or if requested
                                is_primary=(first_image and image_count == 0) or make_primary
                            )
                            image.save()
                            image_count += 1
                            # Only the first image should be primary if multiple are uploaded
                            make_primary = False
                    except Exception as e:
                        messages.error(request, f"Error saving media: {str(e)}")
                
                # Craft a success message based on what was uploaded
                if image_count > 0 and video_count > 0:
                    messages.success(request, f'Recipe updated with {image_count} new images and {video_count} new videos!')
                elif image_count > 0:
                    messages.success(request, f'Recipe updated with {image_count} new images!')
                elif video_count > 0:
                    messages.success(request, f'Recipe updated with {video_count} new videos!')
                else:
                    messages.success(request, 'Recipe updated successfully!')
            else:
                messages.success(request, 'Recipe updated successfully!')
            
            return redirect('recipe_detail', slug=recipe.slug)
    else:
        recipe_form = RecipeForm(instance=recipe)
        image_form = RecipeImageForm()
        video_form = RecipeVideoForm()
    
    context = {
        'recipe_form': recipe_form,
        'image_form': image_form,
        'video_form': video_form,
        'recipe': recipe,
        'editing': True,
    }
    return render(request, 'recipe_finder/recipe_form.html', context)

@login_required
def recipe_delete(request, slug):
    """View for deleting a recipe"""
    recipe = get_object_or_404(Recipe, slug=slug)
    
    # Check if user is the author
    if request.user != recipe.author:
        return HttpResponseForbidden("You don't have permission to delete this recipe")
    
    if request.method == 'POST':
        recipe.delete()
        messages.success(request, 'Recipe deleted successfully!')
        return redirect('recipe_list')
    
    return render(request, 'recipe_finder/recipe_delete.html', {'recipe': recipe})

# AJAX Interaction Views
@login_required
@require_POST
def like_recipe(request):
    """AJAX view for liking/unliking a recipe"""
    recipe_id = request.POST.get('recipe_id')
    
    if not recipe_id:
        return JsonResponse({'error': 'No recipe_id provided'}, status=400)
    
    try:
        # The try block should only handle normal processing,
        # not the 404 case which should be handled by get_object_or_404
        recipe = Recipe.objects.get(pk=recipe_id)
        
        # Check if user already liked this recipe
        existing_like = Like.objects.filter(user=request.user, recipe=recipe).first()
        
        if existing_like:
            # User already liked it, so unlike
            existing_like.delete()
            liked = False
        else:
            # User hasn't liked it yet, so create a new like
            # Use get_or_create to prevent duplicate likes (race condition)
            _, created = Like.objects.get_or_create(user=request.user, recipe=recipe)
            liked = True
        
        # Get the updated count directly from the database
        updated_count = recipe.likes.count()
        
        return JsonResponse({
            'liked': liked,
            'likes_count': updated_count
        })
    except Recipe.DoesNotExist:
        # If recipe doesn't exist, return 404
        return JsonResponse({'error': 'Recipe not found'}, status=404)
    except Exception as e:
        # More specific error response
        if "UNIQUE constraint failed" in str(e):
            # This is a race condition - the user already liked this recipe
            # Return a 200 response with the current state instead of an error
            try:
                recipe = Recipe.objects.get(id=recipe_id)
                like_exists = Like.objects.filter(user=request.user, recipe=recipe).exists()
                return JsonResponse({
                    'liked': like_exists,
                    'likes_count': recipe.likes.count(),
                    'note': 'Your like was already recorded'
                })
            except:
                pass
                
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_POST
def follow_user(request):
    """AJAX view for following/unfollowing a user"""
    user_id = request.POST.get('user_id')
    
    if not user_id:
        return JsonResponse({'error': 'No user_id provided'}, status=400)
    
    try:
        user_to_follow = get_object_or_404(User, id=user_id)
        
        # Can't follow yourself
        if request.user == user_to_follow:
            return JsonResponse({'error': 'You cannot follow yourself'}, status=400)
        
        # Check if already following
        existing_follow = Follow.objects.filter(
            follower=request.user, 
            following=user_to_follow
        ).first()
        
        if existing_follow:
            # User already followed, so unfollow
            existing_follow.delete()
            following = False
        else:
            # Create new follow
            Follow.objects.create(follower=request.user, following=user_to_follow)
            following = True
        
        # Get the updated followers count
        followers_count = user_to_follow.followers.count()
        
        return JsonResponse({
            'following': following,
            'followers_count': followers_count
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def follow_user_status(request):
    """AJAX view for getting current follow status and follower count"""
    user_id = request.GET.get('user_id')
    
    if not user_id:
        return JsonResponse({'error': 'User ID is required'}, status=400)
    
    try:
        user_to_check = User.objects.get(id=user_id)
        
        # Check if the current user is following the specified user
        following = False
        if request.user.is_authenticated:
            following = Follow.objects.filter(
                follower=request.user,
                following=user_to_check
            ).exists()
        
        # Get the follower count
        followers_count = user_to_check.followers.count()
        
        # Get the following count
        following_count = user_to_check.following.count()
        
        return JsonResponse({
            'following': following,
            'followers_count': followers_count,
            'following_count': following_count
        })
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# Collection Views
@login_required
def collection_list(request):
    """View for listing a user's collections"""
    collections = Collection.objects.filter(user=request.user)
    
    # Check if JSON format is requested
    if request.GET.get('format') == 'json':
        collections_data = []
        for collection in collections:
            collection_data = {
                'id': collection.id,
                'name': collection.name,
                'recipes': list(collection.recipes.values_list('id', flat=True))
            }
            collections_data.append(collection_data)
        return JsonResponse({'collections': collections_data})
    
    return render(request, 'recipe_finder/collection_list.html', {'collections': collections})

@login_required
def collection_detail(request, pk):
    """View for showing a collection's details"""
    collection = get_object_or_404(Collection, pk=pk)
    
    # Check if user has permission to view
    if collection.user != request.user and not collection.is_public:
        return HttpResponseForbidden("You don't have permission to view this collection")
    
    recipes = collection.recipes.all()
    
    # Check which recipes the user has liked
    liked_recipes_ids = []
    if request.user.is_authenticated:
        liked_recipes_ids = Like.objects.filter(user=request.user).values_list('recipe_id', flat=True)
    
    context = {
        'collection': collection,
        'recipes': recipes,
        'liked_recipes_ids': liked_recipes_ids
    }
    return render(request, 'recipe_finder/collection_detail.html', context)

@login_required
def collection_create(request):
    """View for creating a new collection"""
    if request.method == 'POST':
        form = CollectionForm(request.POST, request.FILES)
        if form.is_valid():
            collection = form.save(commit=False)
            collection.user = request.user
            collection.save()
            messages.success(request, 'Collection created successfully!')
            return redirect('collection_detail', pk=collection.pk)
    else:
        form = CollectionForm()
    
    return render(request, 'recipe_finder/collection_form.html', {'form': form})

@login_required
def collection_edit(request, pk):
    """View for editing an existing collection"""
    collection = get_object_or_404(Collection, pk=pk)
    
    # Check if user is the owner
    if request.user != collection.user:
        return HttpResponseForbidden("You don't have permission to edit this collection")
    
    if request.method == 'POST':
        form = CollectionForm(request.POST, request.FILES, instance=collection)
        if form.is_valid():
            form.save()
            messages.success(request, 'Collection updated successfully!')
            return redirect('collection_detail', pk=collection.pk)
    else:
        form = CollectionForm(instance=collection)
    
    context = {
        'form': form,
        'collection': collection,
        'editing': True
    }
    return render(request, 'recipe_finder/collection_form.html', context)

@login_required
def collection_delete(request, pk):
    """View for deleting a collection"""
    collection = get_object_or_404(Collection, pk=pk)
    
    # Check if user is the owner
    if request.user != collection.user:
        return HttpResponseForbidden("You don't have permission to delete this collection")
    
    if request.method == 'POST':
        collection.delete()
        messages.success(request, 'Collection deleted successfully!')
        return redirect('collection_list')
    
    return render(request, 'recipe_finder/collection_delete.html', {'collection': collection})

@login_required
@require_POST
def add_to_collection(request):
    """View for adding/removing a recipe from a collection"""
    recipe_id = request.POST.get('recipe_id')
    collection_id = request.POST.get('collection_id')
    
    recipe = get_object_or_404(Recipe, id=recipe_id)
    collection = get_object_or_404(Collection, id=collection_id)
    
    # Check if user owns the collection
    if collection.user != request.user:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'error': 'You do not own this collection'}, status=403)
        else:
            messages.error(request, "You don't have permission to modify this collection")
            return redirect('recipe_detail', slug=recipe.slug)
    
    if recipe in collection.recipes.all():
        # Remove recipe if it's already in collection
        collection.recipes.remove(recipe)
        in_collection = False
        message = f'Recipe removed from "{collection.name}"'
    else:
        # Add recipe to collection
        collection.recipes.add(recipe)
        in_collection = True
        message = f'Recipe added to "{collection.name}"'
    
    # Check if it's an AJAX request
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        response_data = {
            'in_collection': in_collection,
            'collection_name': collection.name
        }
        return JsonResponse(response_data)
    else:
        # Handle regular form submission
        messages.success(request, message)
        return redirect('recipe_detail', slug=recipe.slug)

# Category Views
def category_detail(request, slug):
    """View for showing recipes in a specific category"""
    category = get_object_or_404(Category, slug=slug)
    recipes = Recipe.objects.filter(categories=category)
    
    # Check which recipes the user has liked
    liked_recipes_ids = []
    if request.user.is_authenticated:
        liked_recipes_ids = Like.objects.filter(user=request.user).values_list('recipe_id', flat=True)
    
    # Pagination
    paginator = Paginator(recipes, 9)  # Show 9 recipes per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'category': category,
        'page_obj': page_obj,
        'liked_recipes_ids': liked_recipes_ids
    }
    return render(request, 'recipe_finder/category_detail.html', context)

def category_list_json(request):
    """View to return categories in JSON format for Select2"""
    search_term = request.GET.get('term', '')
    
    if search_term:
        # If search term provided, filter categories
        categories = Category.objects.filter(name__icontains=search_term)
    else:
        # Otherwise return all categories
        categories = Category.objects.all()
    
    # Format the data for Select2
    category_data = [{'id': cat.id, 'name': cat.name} for cat in categories]
    
    return JsonResponse({'categories': category_data})

@login_required
@require_POST
def category_create(request):
    """API endpoint to create a new category"""
    category_name = request.POST.get('name', '').strip()
    
    if not category_name:
        return JsonResponse({'success': False, 'error': 'Category name is required'}, status=400)
    
    # Check if category already exists
    existing_category = Category.objects.filter(name__iexact=category_name).first()
    if existing_category:
        # Return the existing category
        return JsonResponse({
            'success': True, 
            'category': {'id': existing_category.id, 'name': existing_category.name}
        })
    
    # Create a new category
    import itertools
    
    # Generate a unique slug
    max_length = Category._meta.get_field('slug').max_length
    slug_candidate = slug_original = slugify(category_name)[:max_length]
    
    for i in itertools.count(1):
        if not Category.objects.filter(slug=slug_candidate).exists():
            break
        slug_candidate = '{}-{}'.format(slug_original[:max_length - len(str(i)) - 1], i)
    
    # Create the new category
    try:
        category = Category.objects.create(
            name=category_name,
            slug=slug_candidate
        )
        return JsonResponse({
            'success': True, 
            'category': {'id': category.id, 'name': category.name}
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
def chef_verification(request):
    """View for submitting chef verification request"""
    if request.method == 'POST':
        # Ensure that the user is a chef in their profile
        profile = request.user.profile
        if not profile.is_chef:
            profile.is_chef = True
            profile.save()
        
        # Ensure the user has at least 5 recipes
        recipe_count = Recipe.objects.filter(author=request.user).count()
        if recipe_count < 5:
            messages.error(request, 'You need at least 5 recipes to apply for chef verification')
            return redirect('profile_with_username', username=request.user.username)
        
        # Check if user already has a pending verification
        existing_verification = ChefVerification.objects.filter(
            user=request.user, 
            status='pending'
        ).exists()
        
        if existing_verification:
            messages.info(request, 'You already have a pending verification request')
            return redirect('profile_with_username', username=request.user.username)
        
        # Process the verification submission
        try:
            full_name = request.POST.get('full_name')
            current_position = request.POST.get('current_position')
            establishment = request.POST.get('establishment')
            additional_info = request.POST.get('additional_info')
            certificate_file = request.FILES.get('certificate_file')
            
            if not certificate_file:
                raise ValueError("Certificate file is required")
            
            # Create verification request
            verification = ChefVerification(
                user=request.user,
                full_name=full_name,
                current_position=current_position,
                establishment=establishment,
                additional_info=additional_info,
                certificate=certificate_file
            )
            verification.save()
            
            # Show success message
            messages.success(request, 'Your chef verification request has been submitted. Our team will review it shortly.')
            
            # Send notification to admins (optional)
            # You could implement email notifications here
            
            return redirect('profile_with_username', username=request.user.username)
            
        except Exception as e:
            messages.error(request, f'Error submitting verification: {str(e)}')
            return redirect('profile_with_username', username=request.user.username)
    
    # If not POST, redirect to profile
    return redirect('profile_with_username', username=request.user.username)

@login_required
def collection_share(request, pk):
    """View for sharing a collection"""
    collection = get_object_or_404(Collection, pk=pk)
    
    # Ensure only the collection owner can share it
    if request.user != collection.user:
        messages.error(request, "You don't have permission to share this collection.")
        return redirect('collection_detail', pk=pk)
    
    # Generate a shareable URL that works even for private collections
    share_url = request.build_absolute_uri(reverse('collection_detail', args=[pk]))
    
    context = {
        'collection': collection,
        'share_url': share_url,
    }
    
    return render(request, 'recipe_finder/collection_share.html', context)
