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
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("This email is already in use. Please use a different email.")
        return email

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
            'cooking_time', 'prep_time', 'servings', 'difficulty', 'categories'
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
            'ingredients': forms.Textarea(attrs={'rows': 6, 'placeholder': 'Enter one ingredient per line'}),
            'instructions': forms.Textarea(attrs={'rows': 8, 'placeholder': 'Enter one instruction step per line'}),
            'categories': forms.CheckboxSelectMultiple(),
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
    class Meta:
        model = RecipeImage
        fields = ['image', 'caption', 'is_primary']

class RecipeVideoForm(forms.ModelForm):
    class Meta:
        model = RecipeVideo
        fields = ['video', 'caption']

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
        fields = ['name', 'description', 'is_public']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
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