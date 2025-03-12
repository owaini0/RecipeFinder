from django.contrib import admin
from .models import (
    UserProfile, Category, Recipe, RecipeImage, 
    RecipeVideo, Like, Comment, Follow, Collection
)

class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_chef', 'chef_verified', 'date_joined')
    list_filter = ('is_chef', 'chef_verified')
    search_fields = ('user__username', 'user__email')

class RecipeImageInline(admin.TabularInline):
    model = RecipeImage
    extra = 1

class RecipeVideoInline(admin.TabularInline):
    model = RecipeVideo
    extra = 1

class RecipeAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'cooking_time', 'difficulty', 'created_at', 'featured')
    list_filter = ('difficulty', 'categories', 'featured')
    search_fields = ('title', 'description', 'ingredients')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [RecipeImageInline, RecipeVideoInline]

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}

class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'recipe', 'content', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content', 'user__username')

class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'recipe', 'created_at')
    list_filter = ('created_at',)

class FollowAdmin(admin.ModelAdmin):
    list_display = ('follower', 'following', 'created_at')
    list_filter = ('created_at',)

class CollectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_public', 'created_at')
    list_filter = ('is_public', 'created_at')
    search_fields = ('name', 'description')

admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Recipe, RecipeAdmin)
admin.site.register(Comment, CommentAdmin)
admin.site.register(Like, LikeAdmin)
admin.site.register(Follow, FollowAdmin)
admin.site.register(Collection, CollectionAdmin)
