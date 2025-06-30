# Django admin configuration for CipherApp
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, ChatSession, ChatMessage, UserActivity

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'

class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined', 'last_login', 'chat_session_count')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined', 'last_login')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'userprofile__full_name')
    list_editable = ('is_active',)
    actions = ['deactivate_users', 'export_users_csv', 'export_users_json']

    def chat_session_count(self, obj):
        return ChatSession.objects.filter(user=obj).count()
    chat_session_count.short_description = 'Chat Sessions'

    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} user(s) deactivated.")
    deactivate_users.short_description = "Deactivate selected users"

    def export_users_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename=users.csv'
        writer = csv.writer(response)
        writer.writerow(['Username', 'Email', 'First Name', 'Last Name', 'Is Staff', 'Is Active', 'Date Joined', 'Last Login'])
        for user in queryset:
            writer.writerow([user.username, user.email, user.first_name, user.last_name, user.is_staff, user.is_active, user.date_joined, user.last_login])
        return response
    export_users_csv.short_description = "Export selected users to CSV"

    def export_users_json(self, request, queryset):
        import json
        from django.http import HttpResponse
        users_data = []
        for user in queryset:
            users_data.append({
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
                'is_active': user.is_active,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
            })
        response = HttpResponse(json.dumps(users_data, indent=2), content_type='application/json')
        response['Content-Disposition'] = 'attachment; filename=users.json'
        return response
    export_users_json.short_description = "Export selected users to JSON"

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'theme_preference', 'created_at')
    list_filter = ('theme_preference', 'created_at')
    search_fields = ('user__username', 'user__email', 'full_name')

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'created_at', 'updated_at', 'is_active')
    list_filter = ('is_active', 'created_at', 'updated_at')
    search_fields = ('user__username', 'title')
    ordering = ('-updated_at',)

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'message_type', 'content_preview', 'timestamp')
    list_filter = ('message_type', 'timestamp')
    search_fields = ('content', 'session__title', 'session__user__username')
    ordering = ('-timestamp',)
    
    def content_preview(self, obj):
        return obj.content[:50] + ('...' if len(obj.content) > 50 else '')
    content_preview.short_description = 'Content Preview'

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'timestamp', 'ip_address')
    list_filter = ('action', 'timestamp')
    search_fields = ('user__username', 'action', 'ip_address')
    ordering = ('-timestamp',)
    readonly_fields = ('timestamp',)

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# Customize admin site
admin.site.site_header = "CipherDepth Administration"
admin.site.site_title = "CipherDepth Admin"
admin.site.index_title = "Welcome to CipherDepth Administration"
