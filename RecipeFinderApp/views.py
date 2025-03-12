from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse, HttpResponseForbidden
from django.db.models import Count
from django.views.decorators.http import require_POST
from django.core.paginator import Paginator
from .models import (
    Recipe, Category, UserProfile, Comment, 
    Like, Follow, Collection, RecipeImage, RecipeVideo
)
from .forms import (
    UserRegistrationForm, UserLoginForm, UserProfileForm,
    RecipeForm, CommentForm, CollectionForm, RecipeImageForm,
    RecipeVideoForm, SearchForm
)

def home(request):
    """Homepage view showing featured and popular recipes"""
    # Get featured recipes
    featured_recipes = Recipe.objects.filter(featured=True)[:3]
    
    # Get most liked recipes
    popular_recipes = Recipe.objects.annotate(
        likes_count=Count('likes')).order_by('-likes_count')[:6]
    
    # Get newest recipes
    newest_recipes = Recipe.objects.order_by('-created_at')[:6]
    
    # Get all categories
    categories = Category.objects.all()
    
    context = {
        'featured_recipes': featured_recipes,
        'popular_recipes': popular_recipes,
        'newest_recipes': newest_recipes,
        'categories': categories,
    }
    return render(request, 'recipe_finder/home.html', context)

# Authentication Views
def register(request):
    """User registration view"""
    if request.user.is_authenticated:
        return redirect('home')
        
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Registration successful!')
            return redirect('home')
    else:
        form = UserRegistrationForm()
    
    return render(request, 'recipe_finder/register.html', {'form': form})

def user_login(request):
    """User login view"""
    if request.user.is_authenticated:
        return redirect('home')
        
    if request.method == 'POST':
        form = UserLoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'Welcome back, {username}!')
                return redirect('home')
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = UserLoginForm()
    
    return render(request, 'recipe_finder/login.html', {'form': form})

@login_required
def user_logout(request):
    """User logout view"""
    logout(request)
    messages.success(request, 'You have been logged out.')
    return redirect('home')

# Profile Views
@login_required
def profile(request, username=None):
    """User profile view - shows user info and their recipes"""
    if username:
        user = get_object_or_404(User, username=username)
    else:
        user = request.user
    
    profile = get_object_or_404(UserProfile, user=user)
    recipes = Recipe.objects.filter(author=user).order_by('-created_at')
    collections = Collection.objects.filter(user=user, is_public=True)
    
    # Check if the current user follows this profile
    is_following = False
    if request.user.is_authenticated:
        is_following = Follow.objects.filter(
            follower=request.user, 
            following=user
        ).exists()
    
    context = {
        'profile': profile,
        'recipes': recipes,
        'collections': collections,
        'is_following': is_following
    }
    return render(request, 'recipe_finder/profile.html', context)

@login_required
def edit_profile(request):
    """Edit user profile view"""
    profile = get_object_or_404(UserProfile, user=request.user)
    
    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('profile')
    else:
        form = UserProfileForm(instance=profile)
    
    return render(request, 'recipe_finder/edit_profile.html', {'form': form})

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
    
    # Pagination
    paginator = Paginator(recipes, 9)  # Show 9 recipes per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'form': form,
        'categories': categories
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
    if request.user.is_authenticated:
        user_liked = Like.objects.filter(
            user=request.user, 
            recipe=recipe
        ).exists()
    
    # Comment form
    if request.method == 'POST' and request.user.is_authenticated:
        comment_form = CommentForm(request.POST)
        if comment_form.is_valid():
            new_comment = comment_form.save(commit=False)
            new_comment.user = request.user
            new_comment.recipe = recipe
            new_comment.save()
            messages.success(request, 'Comment added successfully!')
            return redirect('recipe_detail', slug=slug)
    else:
        comment_form = CommentForm()
    
    context = {
        'recipe': recipe,
        'comments': comments,
        'similar_recipes': similar_recipes,
        'user_liked': user_liked,
        'comment_form': comment_form
    }
    
    return render(request, 'recipe_finder/recipe_detail.html', context)

@login_required
def recipe_create(request):
    """View for creating a new recipe"""
    if request.method == 'POST':
        recipe_form = RecipeForm(request.POST)
        image_form = RecipeImageForm(request.POST, request.FILES)
        
        if recipe_form.is_valid() and image_form.is_valid():
            # Save the recipe
            recipe = recipe_form.save(commit=False)
            recipe.author = request.user
            recipe.save()
            recipe_form.save_m2m()  # Save many-to-many relationships
            
            # Save the primary image
            if 'image' in request.FILES:
                image = image_form.save(commit=False)
                image.recipe = recipe
                image.is_primary = True
                image.save()
            
            messages.success(request, 'Recipe created successfully!')
            return redirect('recipe_detail', slug=recipe.slug)
    else:
        recipe_form = RecipeForm()
        image_form = RecipeImageForm()
    
    # Add categories to the context
    categories = Category.objects.all()
    
    context = {
        'recipe_form': recipe_form,
        'image_form': image_form,
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
        
        if recipe_form.is_valid():
            recipe_form.save()
            
            # Handle new image if provided
            if 'image' in request.FILES and image_form.is_valid():
                image = image_form.save(commit=False)
                image.recipe = recipe
                
                # Check if making this the primary image
                if image_form.cleaned_data.get('is_primary'):
                    # Reset other primary images
                    RecipeImage.objects.filter(recipe=recipe, is_primary=True).update(is_primary=False)
                    image.is_primary = True
                    
                image.save()
            
            messages.success(request, 'Recipe updated successfully!')
            return redirect('recipe_detail', slug=recipe.slug)
    else:
        recipe_form = RecipeForm(instance=recipe)
        image_form = RecipeImageForm()
    
    context = {
        'recipe_form': recipe_form,
        'image_form': image_form,
        'recipe': recipe,
        'editing': True
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
    recipe = get_object_or_404(Recipe, id=recipe_id)
    
    like, created = Like.objects.get_or_create(user=request.user, recipe=recipe)
    
    if not created:
        # User already liked it, so unlike
        like.delete()
        liked = False
    else:
        liked = True
    
    return JsonResponse({
        'liked': liked,
        'likes_count': recipe.likes.count()
    })

@login_required
@require_POST
def follow_user(request):
    """AJAX view for following/unfollowing a user"""
    user_id = request.POST.get('user_id')
    user_to_follow = get_object_or_404(User, id=user_id)
    
    # Can't follow yourself
    if request.user == user_to_follow:
        return JsonResponse({'error': 'You cannot follow yourself'}, status=400)
    
    follow, created = Follow.objects.get_or_create(
        follower=request.user, 
        following=user_to_follow
    )
    
    if not created:
        # User already followed, so unfollow
        follow.delete()
        following = False
    else:
        following = True
    
    return JsonResponse({
        'following': following,
        'followers_count': user_to_follow.followers.count()
    })

# Collection Views
@login_required
def collection_list(request):
    """View for listing a user's collections"""
    collections = Collection.objects.filter(user=request.user)
    return render(request, 'recipe_finder/collection_list.html', {'collections': collections})

@login_required
def collection_detail(request, pk):
    """View for showing a collection's details"""
    collection = get_object_or_404(Collection, pk=pk)
    
    # Check if user has permission to view
    if collection.user != request.user and not collection.is_public:
        return HttpResponseForbidden("You don't have permission to view this collection")
    
    recipes = collection.recipes.all()
    
    context = {
        'collection': collection,
        'recipes': recipes
    }
    return render(request, 'recipe_finder/collection_detail.html', context)

@login_required
def collection_create(request):
    """View for creating a new collection"""
    if request.method == 'POST':
        form = CollectionForm(request.POST)
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
        form = CollectionForm(request.POST, instance=collection)
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
    """AJAX view for adding/removing a recipe from a collection"""
    recipe_id = request.POST.get('recipe_id')
    collection_id = request.POST.get('collection_id')
    
    recipe = get_object_or_404(Recipe, id=recipe_id)
    collection = get_object_or_404(Collection, id=collection_id)
    
    # Check if user owns the collection
    if collection.user != request.user:
        return JsonResponse({'error': 'You do not own this collection'}, status=403)
    
    if recipe in collection.recipes.all():
        # Remove recipe if it's already in collection
        collection.recipes.remove(recipe)
        in_collection = False
    else:
        # Add recipe to collection
        collection.recipes.add(recipe)
        in_collection = True
    
    return JsonResponse({
        'in_collection': in_collection,
        'collection_name': collection.name
    })

# Category Views
def category_detail(request, slug):
    """View for showing recipes in a specific category"""
    category = get_object_or_404(Category, slug=slug)
    recipes = Recipe.objects.filter(categories=category)
    
    # Pagination
    paginator = Paginator(recipes, 9)  # Show 9 recipes per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'category': category,
        'page_obj': page_obj
    }
    return render(request, 'recipe_finder/category_detail.html', context)
