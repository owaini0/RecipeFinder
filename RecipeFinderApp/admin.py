from django.contrib import admin
from django.utils import timezone
from .models import (
    UserProfile, Category, Recipe, RecipeImage, 
    RecipeVideo, Like, Comment, Follow, Collection,
    ChefVerification
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

class ChefVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'current_position', 'status', 'submitted_at')
    list_filter = ('status', 'submitted_at')
    search_fields = ('user__username', 'full_name', 'establishment')
    readonly_fields = ('submitted_at',)
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'full_name', 'current_position', 'establishment')
        }),
        ('Verification Information', {
            'fields': ('certificate', 'additional_info', 'submitted_at')
        }),
        ('Review', {
            'fields': ('status', 'processed_at', 'admin_notes')
        }),
    )
    
    # Custom action to approve verification
    actions = ['approve_verification', 'reject_verification']
    
    def approve_verification(self, request, queryset):
        # Update verification status and timestamp
        for verification in queryset:
            if verification.status != 'approved':
                verification.status = 'approved'
                verification.processed_at = timezone.now()
                verification.save()
                
                # Update user profile to mark as verified chef
                profile = verification.user.profile
                profile.chef_verified = True
                profile.save()
        
        self.message_user(request, f"Successfully approved {queryset.count()} verification(s)")
    approve_verification.short_description = "Approve selected verifications"
    
    def reject_verification(self, request, queryset):
        # Update verification status and timestamp
        for verification in queryset:
            if verification.status != 'rejected':
                verification.status = 'rejected'
                verification.processed_at = timezone.now()
                verification.save()
        
        self.message_user(request, f"Successfully rejected {queryset.count()} verification(s)")
    reject_verification.short_description = "Reject selected verifications"
    
    # Save model to automatically set processed_at time
    def save_model(self, request, obj, form, change):
        if 'status' in form.changed_data:
            obj.processed_at = timezone.now()
            
            # If approving, update the user's profile
            if obj.status == 'approved':
                profile = obj.user.profile
                profile.chef_verified = True
                profile.save()
            
        super().save_model(request, obj, form, change)

admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Recipe, RecipeAdmin)
admin.site.register(Comment, CommentAdmin)
admin.site.register(Like, LikeAdmin)
admin.site.register(Follow, FollowAdmin)
admin.site.register(Collection, CollectionAdmin)
admin.site.register(ChefVerification, ChefVerificationAdmin)
