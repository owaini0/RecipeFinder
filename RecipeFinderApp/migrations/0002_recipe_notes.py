# Generated by Django 5.1.7 on 2025-03-17 06:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('RecipeFinderApp', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='recipe',
            name='notes',
            field=models.TextField(blank=True, help_text='Additional notes, tips, or variations for this recipe', null=True),
        ),
    ]
