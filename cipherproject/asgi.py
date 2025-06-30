"""
ASGI config for cipherproject project.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cipherproject.settings')
application = get_asgi_application()
