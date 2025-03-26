from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.urls import reverse
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_pic = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    is_chef = models.BooleanField(default=False)
    chef_verified = models.BooleanField(default=False)
    website = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}"
    
    def get_absolute_url(self):
        return reverse('profile_with_username', kwargs={'username': self.user.username})

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name_plural = "Categories"
    
    def __str__(self):
        return self.name

class Recipe(models.Model):
    DIFFICULTY_CHOICES = (
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    )
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recipes')
    description = models.TextField()
    ingredients = models.TextField(help_text="Enter ingredients, one per line")
    instructions = models.TextField(help_text="Enter instructions step by step")
    cooking_time = models.IntegerField(help_text="In minutes")
    prep_time = models.IntegerField(help_text="In minutes")
    servings = models.IntegerField(default=1)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    categories = models.ManyToManyField(Category, related_name='recipes')
    notes = models.TextField(blank=True, null=True, help_text="Additional notes, tips, or variations for this recipe")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    featured = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('recipe_detail', kwargs={'slug': self.slug})
    
    @property
    def total_time(self):
        return self.cooking_time + self.prep_time
    
    @property
    def likes_count(self):
        return self.likes.count()
    
    @property
    def comments_count(self):
        return self.comments.count()
    
    def get_ingredients_list(self):
        return self.ingredients.split('\n')
    
    def get_instructions_list(self):
        return self.instructions.split('\n')

class RecipeImage(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='recipe_images/')
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-is_primary', 'uploaded_at']
    
    def __str__(self):
        return f"Image for {self.recipe.title}"

class RecipeVideo(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='videos')
    video = models.FileField(upload_to='recipe_videos/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Video for {self.recipe.title}"

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'recipe')
    
    def __str__(self):
        return f"{self.user.username} likes {self.recipe.title}"

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Comment by {self.user.username} on {self.recipe.title}"

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('follower', 'following')
    
    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

class Collection(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='collection_images/', blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    recipes = models.ManyToManyField(Recipe, related_name='collections')
    is_public = models.BooleanField(default=True)  # Controls visibility to other users
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.name} by {self.user.username}"
    
    def get_absolute_url(self):
        return reverse('collection_detail', kwargs={'pk': self.pk})

# Chef verification process for professional chefs
class ChefVerification(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chef_verifications')
    full_name = models.CharField(max_length=200)
    current_position = models.CharField(max_length=200)
    establishment = models.CharField(max_length=200, blank=True, null=True)
    certificate = models.FileField(upload_to='chef_certificates/')  # Upload of credentials
    additional_info = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)  # When admin reviews
    admin_notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.full_name} - {self.get_status_display()}"
    
    class Meta:
        ordering = ['-submitted_at']
        verbose_name = "Chef Verification"
        verbose_name_plural = "Chef Verifications"
