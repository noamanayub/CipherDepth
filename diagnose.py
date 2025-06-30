#!/usr/bin/env python
"""Django Diagnostic Script - Check for common issues"""
import os
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cipherproject.settings')

try:
    import django
    django.setup()
    print("✓ Django setup successful")
except Exception as e:
    print(f"✗ Django setup failed: {e}")
    sys.exit(1)

def check_templates():
    """Check template configuration"""
    print("\n=== TEMPLATE CHECK ===")
    from django.template.loader import get_template
    from django.conf import settings
    
    print(f"Template directories: {settings.TEMPLATES[0]['DIRS']}")
    print(f"App directories enabled: {settings.TEMPLATES[0]['APP_DIRS']}")
    
    templates_to_check = [
        'cipherapp/base.html',
        'cipherapp/login.html',
        'cipherapp/register.html',
        'cipherapp/home.html'
    ]
    
    for template_name in templates_to_check:
        try:
            template = get_template(template_name)
            print(f"✓ {template_name} - Found")
        except Exception as e:
            print(f"✗ {template_name} - Error: {e}")

def check_static_files():
    """Check static files configuration"""
    print("\n=== STATIC FILES CHECK ===")
    from django.conf import settings
    
    print(f"STATIC_URL: {settings.STATIC_URL}")
    print(f"STATICFILES_DIRS: {settings.STATICFILES_DIRS}")
    
    # Check if static files exist
    static_files = ['styles.css', 'login.js', 'img/logo.png']
    
    for static_dir in settings.STATICFILES_DIRS:
        print(f"\nChecking directory: {static_dir}")
        if os.path.exists(static_dir):
            for file_path in static_files:
                full_path = os.path.join(static_dir, file_path)
                if os.path.exists(full_path):
                    print(f"  ✓ {file_path}")
                else:
                    print(f"  ✗ {file_path} - Not found")
        else:
            print(f"  ✗ Directory does not exist")

def check_database():
    """Check database connection"""
    print("\n=== DATABASE CHECK ===")
    from django.db import connection
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            print("✓ Database connection successful")
            
        from django.contrib.auth.models import User
        user_count = User.objects.count()
        print(f"✓ Users in database: {user_count}")
        
    except Exception as e:
        print(f"✗ Database error: {e}")

def check_urls():
    """Check URL configuration"""
    print("\n=== URL CHECK ===")
    from django.urls import reverse
    
    urls_to_check = ['index', 'login', 'register', 'home']
    
    for url_name in urls_to_check:
        try:
            url = reverse(url_name)
            print(f"✓ {url_name} -> {url}")
        except Exception as e:
            print(f"✗ {url_name} - Error: {e}")

def test_view_response():
    """Test view responses"""
    print("\n=== VIEW RESPONSE CHECK ===")
    from django.test import Client
    
    client = Client()
    
    test_urls = [
        ('/', 'Homepage'),
        ('/login/', 'Login page'),
        ('/register/', 'Register page')
    ]
    
    for url, name in test_urls:
        try:
            response = client.get(url)
            if response.status_code == 200:
                print(f"✓ {name} ({url}) - Status: {response.status_code}")
            elif response.status_code == 302:
                print(f"✓ {name} ({url}) - Redirect: {response.status_code}")
            else:
                print(f"⚠ {name} ({url}) - Status: {response.status_code}")
        except Exception as e:
            print(f"✗ {name} ({url}) - Error: {e}")

if __name__ == "__main__":
    print("CipherDepth Django Diagnostic Tool")
    print("=" * 40)
    
    check_templates()
    check_static_files()
    check_database()
    check_urls()
    test_view_response()
    
    print("\n" + "=" * 40)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 40)
    print("\nIf all checks pass, run:")
    print("  python manage.py runserver 127.0.0.1:8000")
    print("\nThen visit: http://127.0.0.1:8000")
