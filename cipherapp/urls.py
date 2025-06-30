# URL configuration for CipherApp
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('home/', views.home_view, name='home'),
    path('api/chat/', views.chat_api, name='chat_api'),
    path('api/chat/history/', views.chat_history, name='chat_history'),
    path('api/chat/feedback/', views.feedback_api, name='feedback_api'),
    path('api/delete-chat/', views.delete_chat_session, name='delete_chat_session'),
    # Message Management APIs
    path('api/chat/edit-message/', views.edit_message_api, name='edit_message_api'),
    path('api/chat/delete-message/', views.delete_message_api, name='delete_message_api'),
    path('api/chat/search/', views.search_messages_api, name='search_messages_api'),
    path('api/chat/export/', views.export_conversation_api, name='export_conversation_api'),
]
