#!/usr/bin/env python
"""Test script to validate Django setup"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cipherproject.settings')

django.setup()

from django.contrib.auth.models import User
from cipherapp.models import UserProfile, ChatSession, ChatMessage

def test_database():
    """Test database connectivity and models"""
    print("Testing Django database setup...")
    
    # Test User model
    user_count = User.objects.count()
    print(f"Users in database: {user_count}")
    
    # Test UserProfile model
    profile_count = UserProfile.objects.count()
    print(f"User profiles in database: {profile_count}")
    
    # Test ChatSession model
    session_count = ChatSession.objects.count()
    print(f"Chat sessions in database: {session_count}")
    
    # Test ChatMessage model
    message_count = ChatMessage.objects.count()
    print(f"Chat messages in database: {message_count}")
    
    print("Database test completed successfully!")

def create_test_user():
    """Create a test user for testing"""
    username = "testuser"
    email = "test@example.com"
    password = "testpass123"
    
    if not User.objects.filter(username=username).exists():
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name="Test",
            last_name="User"
        )
        
        # Create user profile
        profile = UserProfile.objects.create(
            user=user,
            full_name="Test User"
        )
        
        print(f"Created test user: {username}")
        print(f"Login with: {email} / {password}")
    else:
        print(f"Test user {username} already exists")

if __name__ == "__main__":
    test_database()
    create_test_user()
