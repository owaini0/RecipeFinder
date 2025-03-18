from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from .models import UserProfile, Recipe, Comment, Collection, RecipeImage, RecipeVideo, Category

class UserRegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=30, required=True)
    last_name = forms.CharField(max_length=30, required=True)
    
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'password1', 'password2']
        help_texts = {
            'username': 'Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.',
        }
        error_messages = {
            'username': {
                'max_length': 'Username must be 150 characters or fewer.',
                'required': 'Username is required.',
                'unique': 'A user with that username already exists.',
            },
        }
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("This email is already registered. Please use a different email or try logging in.")
        return email
    
    def clean_username(self):
        username = self.cleaned_data.get('username')
        if len(username) > 150:
            raise forms.ValidationError("Username must be 150 characters or fewer.")
        
        # Check for existing user
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError("This username is already taken. Please choose another one.")
            
        return username

class UserLoginForm(AuthenticationForm):
    username = forms.CharField(widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Username'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Password'}))

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['profile_pic', 'bio', 'website', 'location']
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 4}),
        }

class RecipeForm(forms.ModelForm):
    class Meta:
        model = Recipe
        fields = [
            'title', 'description', 'ingredients', 'instructions', 
            'cooking_time', 'prep_time', 'servings', 'difficulty', 'categories', 'notes'
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
            'ingredients': forms.Textarea(attrs={'rows': 6, 'placeholder': 'Enter one ingredient per line'}),
            'instructions': forms.Textarea(attrs={'rows': 8, 'placeholder': 'Enter one instruction step per line'}),
            'notes': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Enter any additional notes about your recipe'}),
            'categories': forms.SelectMultiple(attrs={'class': 'select2-categories', 'style': 'width: 100%', 'required': False}),
        }
    
    def clean_title(self):
        title = self.cleaned_data.get('title')
        # Generate a unique slug from title
        from django.utils.text import slugify
        import itertools
        
        max_length = Recipe._meta.get_field('slug').max_length
        slug_candidate = slug_original = slugify(title)[:max_length]
        
        if not self.instance.pk:  # Only check for uniqueness if this is a new recipe
            for i in itertools.count(1):
                if not Recipe.objects.filter(slug=slug_candidate).exists():
                    break
                slug_candidate = '{}-{}'.format(slug_original[:max_length - len(str(i)) - 1], i)
        
        self.instance.slug = slug_candidate
        
        return title

class RecipeImageForm(forms.ModelForm):
    image = forms.ImageField(required=False)
    
    class Meta:
        model = RecipeImage
        fields = ['image', 'caption', 'is_primary']
    
    def clean_image(self):
        image = self.cleaned_data.get('image')
        if image:
            # Check file extension
            import os
            ext = os.path.splitext(image.name)[1].lower()
            valid_image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
            valid_video_extensions = ['.mp4', '.webm', '.ogg']
            valid_extensions = valid_image_extensions + valid_video_extensions
            
            if not ext in valid_extensions:
                raise forms.ValidationError(
                    f"Unsupported file extension. Please use one of: {', '.join(valid_image_extensions)} for images or {', '.join(valid_video_extensions)} for videos"
                )
            
            # Check file size (increased to 200MB)
            if image.size > 200 * 1024 * 1024:  # 200MB limit
                raise forms.ValidationError("File too large. Keep it under 200MB.")
            
            return image
        
        # When editing, an image might not be required
        if hasattr(self, 'instance') and self.instance.pk:
            return self.instance.image
            
        # For new recipes, image is not strictly required
        return None

class RecipeVideoForm(forms.ModelForm):
    video = forms.FileField(required=False)
    
    class Meta:
        model = RecipeVideo
        fields = ['video', 'caption']
    
    def clean_video(self):
        video = self.cleaned_data.get('video')
        if video:
            # Check file extension
            import os
            ext = os.path.splitext(video.name)[1].lower()
            valid_extensions = ['.mp4', '.webm', '.ogg']
            
            if not ext in valid_extensions:
                raise forms.ValidationError(
                    f"Unsupported file extension. Please use one of: {', '.join(valid_extensions)}"
                )
            
            # Check file size (increased to 200MB)
            if video.size > 200 * 1024 * 1024:  # 200MB limit
                raise forms.ValidationError("Video file too large. Keep it under 200MB.")
            
            return video
        
        # When editing, a video might not be required
        if hasattr(self, 'instance') and self.instance.pk:
            return self.instance.video
            
        # For new recipes, video is not strictly required
        return None

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Add a comment...'}),
        }

class CollectionForm(forms.ModelForm):
    class Meta:
        model = Collection
        fields = ['name', 'description', 'image', 'is_public']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
            'image': forms.FileInput(attrs={'class': 'form-control', 'accept': 'image/*'}),
        }

class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name', 'description']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }
    
    def clean_name(self):
        name = self.cleaned_data.get('name')
        # Generate slug from name
        from django.utils.text import slugify
        self.instance.slug = slugify(name)
        
        return name

class SearchForm(forms.Form):
    query = forms.CharField(required=False, widget=forms.TextInput(attrs={'placeholder': 'Search recipes...'}))
    category = forms.ModelChoiceField(queryset=Category.objects.all(), required=False)
    difficulty = forms.ChoiceField(choices=[('', 'Any')] + list(Recipe.DIFFICULTY_CHOICES), required=False)
    max_cooking_time = forms.IntegerField(required=False, widget=forms.NumberInput(attrs={'placeholder': 'Max cooking time (mins)'}))