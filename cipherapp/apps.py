# CipherApp Django app configuration
from django.apps import AppConfig

class CipherappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cipherapp'
    verbose_name = 'Cipher Depth Application'
    
    def ready(self):
        # Import signals here if needed
        pass
