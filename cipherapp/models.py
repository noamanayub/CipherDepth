# CipherApp models for user profiles and chat history
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json

class UserProfile(models.Model):
    """Extended user profile with additional information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    theme_preference = models.CharField(
        max_length=10, 
        choices=[('dark', 'Dark'), ('light', 'Light')],
        default='dark'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"

class ChatSession(models.Model):
    """Chat sessions for organizing conversations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200, default="New Chat")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"

class ChatMessage(models.Model):
    """Individual chat messages"""
    MESSAGE_TYPES = [
        ('user', 'User'),
        ('bot', 'Bot'),
        ('system', 'System'),
    ]
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    # New field to link user messages with their corresponding bot responses
    linked_message = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='response_to')
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.message_type}: {self.content[:50]}..."

class MessageFeedback(models.Model):
    """User feedback for bot messages to train reinforcement learning model"""
    FEEDBACK_CHOICES = [
        ('positive', 'Thumbs Up'),
        ('negative', 'Thumbs Down'),
    ]
    
    message = models.OneToOneField(ChatMessage, on_delete=models.CASCADE, related_name='feedback')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    feedback_type = models.CharField(max_length=10, choices=FEEDBACK_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['message', 'user']
    
    def __str__(self):
        return f"{self.user.username} - {self.feedback_type} on message {self.message.id}"

class ResponsePattern(models.Model):
    """Store patterns that lead to positive/negative feedback for ML training"""
    user_input = models.TextField()  # The user's input that led to the response
    bot_response = models.TextField()  # The bot's response
    positive_feedback_count = models.IntegerField(default=0)
    negative_feedback_count = models.IntegerField(default=0)
    total_uses = models.IntegerField(default=0)
    success_rate = models.FloatField(default=0.0)  # positive/(positive+negative)
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Store additional context for better matching
    context_keywords = models.JSONField(default=list)  # Keywords extracted from user input
    response_category = models.CharField(max_length=50, blank=True)  # Type of response
    
    class Meta:
        ordering = ['-success_rate', '-total_uses']
    
    def update_success_rate(self):
        """Calculate and update success rate"""
        total_feedback = self.positive_feedback_count + self.negative_feedback_count
        if total_feedback > 0:
            self.success_rate = self.positive_feedback_count / total_feedback
        else:
            self.success_rate = 0.0
        self.save()
    
    def __str__(self):
        return f"Pattern: {self.user_input[:50]}... (Success: {self.success_rate:.2%})"

class ReinforcementLearningModel(models.Model):
    """Store the RL model state and parameters"""
    model_version = models.CharField(max_length=20, unique=True)
    parameters = models.JSONField(default=dict)  # Store model weights/parameters
    training_sessions = models.IntegerField(default=0)
    total_feedback_processed = models.IntegerField(default=0)
    accuracy_score = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_trained = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"RL Model v{self.model_version} (Accuracy: {self.accuracy_score:.2%})"

class UserActivity(models.Model):
    """Track user activity and analytics"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=50)  # login, logout, chat_start, message_sent, feedback_given
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} - {self.action} at {self.timestamp}"
