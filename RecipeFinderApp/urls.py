from django.urls import path
from . import views

urlpatterns = [
    # Home
    path('', views.home, name='home'),

    # Authentication
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),

    # Profiles
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('profile/chef-verification/', views.chef_verification, name='chef_verification'),
    path('profile/', views.profile, name='profile'),
    path('profile/<str:username>/', views.profile, name='profile_with_username'),

    # Recipes
    path('recipe/new/', views.recipe_create, name='recipe_create'),
    path('recipe/<slug:slug>/edit/', views.recipe_edit, name='recipe_edit'),
    path('recipe/<slug:slug>/delete/', views.recipe_delete, name='recipe_delete'),
    path('recipe/like/', views.like_recipe, name='like_recipe'),
    path('recipe/<slug:slug>/', views.recipe_detail, name='recipe_detail'),
    path('recipes/', views.recipe_list, name='recipe_list'),

    # AJAX
    path('user/follow/', views.follow_user, name='follow_user'),
    path('user/follow/status/', views.follow_user_status, name='follow_user_status'),
    path('collection/add/', views.add_to_collection, name='add_to_collection'),
    path('api/categories/', views.category_list_json, name='category_list_json'),
    path('api/categories/create/', views.category_create, name='category_create'),

    # Collections
    path('collection/new/', views.collection_create, name='collection_create'),
    path('collection/<int:pk>/edit/', views.collection_edit, name='collection_edit'),
    path('collection/<int:pk>/delete/', views.collection_delete, name='collection_delete'),
    path('collection/<int:pk>/share/', views.collection_share, name='collection_share'),
    path('collection/<int:pk>/', views.collection_detail, name='collection_detail'),
    path('collections/', views.collection_list, name='collection_list'),

    # Categories
    path('category/<slug:slug>/', views.category_detail, name='category_detail'),
]