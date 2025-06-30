# CipherApp views for handling user authentication and chat
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json
import random
import logging
from .models import UserProfile, ChatSession, ChatMessage, UserActivity
from .forms import CustomUserCreationForm, UserProfileForm
import pickle
import os
from pathlib import Path

logger = logging.getLogger(__name__)

def get_client_ip(request):
    """Get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def log_user_activity(user, action, request):
    """Log user activity"""
    UserActivity.objects.create(
        user=user,
        action=action,
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )

def index(request):
    """Redirect to appropriate page based on authentication"""
    if request.user.is_authenticated:
        return redirect('home')
    return redirect('login')

def login_view(request):
    """Handle user login"""
    if request.user.is_authenticated:
        return redirect('home')
    
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        
        if not email or not password:
            messages.error(request, 'Please enter both email and password.')
        else:
            # Try to authenticate with email
            users = User.objects.filter(email=email)
            if not users.exists():
                # Handle user not found (invalid email)
                messages.error(request, 'No user found with this email.')
            elif users.count() > 1:
                # Handle duplicate email error
                messages.error(request, 'Multiple accounts found with this email. Please contact support.')
            else:
                user_obj = users.first()
                user = authenticate(request, username=user_obj.username, password=password)
                
                if user is not None:
                    if user.is_active:
                        login(request, user)
                        log_user_activity(user, 'login', request)
                        messages.success(request, f'Welcome back, {user.first_name or user.username}!')
                        return redirect('home')
                    else:
                        messages.error(request, 'Your account has been deactivated.')
                else:
                    messages.error(request, 'Invalid email or password.')
    
    context = {
        'page_id': 'login-page',
        'page_title': 'Sign in to CipherDepth'
    }
    return render(request, 'cipherapp/login.html', context)

def register_view(request):
    """Handle user registration"""
    if request.user.is_authenticated:
        return redirect('home')
    
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            
            # Create user profile
            UserProfile.objects.create(
                user=user,
                full_name=form.cleaned_data.get('full_name', '')
            )
            
            # Log activity
            log_user_activity(user, 'register', request)
            
            # Auto login after registration
            login(request, user)
            messages.success(request, f'Welcome to CipherDepth, {user.first_name}!')
            return redirect('home')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f'{field}: {error}')
    else:
        form = CustomUserCreationForm()
    
    context = {
        'form': form,
        'page_id': 'register-page',
        'page_title': 'Create your CipherDepth account'
    }
    return render(request, 'cipherapp/register.html', context)

@login_required
def home_view(request):
    """Main dashboard/chat interface"""
    # Get user's chat sessions
    chat_sessions = ChatSession.objects.filter(user=request.user)[:10]
    
    # Get user profile
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    context = {
        'user': request.user,
        'profile': profile,
        'chat_sessions': chat_sessions,
        'site_config': {
            'name': 'CipherDepth',
            'theme_colors': {
                'primary': '#4fd1c7',
                'secondary': '#3fb8ae',
                'background': '#1a2332',
                'surface': '#0f1419'
            }
        }
    }
    
    return render(request, 'cipherapp/home.html', context)

def logout_view(request):
    """Handle user logout"""
    if request.user.is_authenticated:
        log_user_activity(request.user, 'logout', request)
        logout(request)
        messages.info(request, 'You have been logged out successfully.')
    return redirect('login')

@login_required
@csrf_exempt
def chat_api(request):
    """API endpoint for chat functionality"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            message = data.get('message', '').strip()
            session_id = data.get('session_id')
            
            if not message:
                return JsonResponse({'error': 'Message cannot be empty'}, status=400)
            
            # Get or create chat session
            if session_id:
                try:
                    chat_session = ChatSession.objects.get(id=session_id, user=request.user)
                except ChatSession.DoesNotExist:
                    chat_session = ChatSession.objects.create(
                        user=request.user,
                        title=message[:50] + ('...' if len(message) > 50 else '')
                    )
            else:
                chat_session = ChatSession.objects.create(
                    user=request.user,
                    title=message[:50] + ('...' if len(message) > 50 else '')
                )
            
            # Save user message
            user_message = ChatMessage.objects.create(
                session=chat_session,
                message_type='user',
                content=message
            )
            
            # Generate bot response using RL-improved responses
            bot_response = generate_bot_response(message, user_message)
            
            bot_message = ChatMessage.objects.create(
                session=chat_session,
                message_type='bot',
                content=bot_response,
                linked_message=user_message  # Link bot response to user message
            )
            
            # Log activity
            log_user_activity(request.user, 'message_sent', request)
            
            return JsonResponse({
                'success': True,
                'session_id': chat_session.id,
                'user_message': {
                    'id': user_message.id,
                    'content': user_message.content,
                    'timestamp': user_message.timestamp.isoformat()
                },
                'bot_message': {
                    'id': bot_message.id,
                    'content': bot_message.content,
                    'timestamp': bot_message.timestamp.isoformat()
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@login_required
@csrf_exempt
def feedback_api(request):
    """API endpoint for submitting feedback on bot responses"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            message_id = data.get('message_id')
            feedback_type = data.get('feedback_type')  # 'positive' or 'negative'
            
            if not message_id or not feedback_type:
                return JsonResponse({'error': 'Message ID and feedback type are required'}, status=400)
            
            if feedback_type not in ['positive', 'negative']:
                return JsonResponse({'error': 'Invalid feedback type'}, status=400)
            
            # Use RL service to record feedback
            from .rl_service import rl_service
            
            success = rl_service.record_feedback(message_id, request.user, feedback_type)
            
            if success:
                # Log activity
                log_user_activity(request.user, f'feedback_{feedback_type}', request)
                
                return JsonResponse({
                    'success': True,
                    'message': f'Feedback recorded successfully',
                    'feedback_type': feedback_type
                })
            else:
                return JsonResponse({'error': 'Failed to record feedback'}, status=500)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            logger.error(f"Error in feedback API: {e}")
            return JsonResponse({'error': 'An error occurred while submitting feedback'}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def generate_bot_response(message, user_message=None):
    """
    Generate bot response using chatbot model, enhanced knowledge base, and RL improvements.
    """
    try:
        # Import RL service
        from .rl_service import rl_service
        
        # Step 1: Check for basic greetings and common queries first
        base_response = None
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['hello', 'hi', 'hey']):
            base_response = "Hello! How can I assist you today?"
        elif any(word in message_lower for word in ['help', 'what can you do']):
            base_response = "I'm CipherDepth, your AI assistant. I can help you with questions, provide information, assist with tasks, and engage in conversations. What would you like to know?"
        elif any(word in message_lower for word in ['thank', 'thanks']):
            base_response = "You're welcome! I'm happy to help. Is there anything else you'd like to know?"
        elif 'weather' in message_lower:
            base_response = "I don't have access to real-time weather data, but I'd recommend checking a weather app or website for current conditions in your area."
        elif any(word in message_lower for word in ['time', 'date']):
            base_response = "I don't have access to real-time data, but you can check your device's clock for the current time and date."
        elif 'cipher' in message_lower or 'encryption' in message_lower:
            base_response = "I'd be happy to help with cryptography and encryption questions! Ciphers are fascinating - from simple Caesar ciphers to modern AES encryption. What specific aspect interests you?"
            
        # Step 2: If no basic response, check the enhanced knowledge base
        if base_response is None:
            kb_response = search_knowledge_base(message)
            if kb_response:
                base_response = kb_response
                logger.info("Response generated from knowledge base")
        
        # Step 3: If still no response, use the chatbot model
        if base_response is None:
            model_response = get_model_response(message)
            if model_response:
                base_response = model_response
                logger.info("Response generated from chatbot model")
        
        # Step 4: If still no response, use fallback responses
        if base_response is None:
            # Default responses for general queries
            responses = [
                "That's an interesting question! Could you provide more details so I can give you a better response?",
                "I'd be happy to help with that. Could you elaborate on what specific information you're looking for?",
                "Let me help you with that. Can you provide a bit more context about your question?",
                "That sounds like something I can assist with. What would you like to know more about?",
                "I'm here to help! Could you give me more details about what you're looking for?"
            ]
            base_response = random.choice(responses)
        
        # Step 5: Use RL service to improve the response based on past feedback
        improved_response = rl_service.generate_improved_response(message, base_response)
        return improved_response
        
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        # Fallback to basic response
        return "I'd be happy to help you with that! Could you provide more details about your question?"

@login_required
def chat_history(request):
    """Get chat history for a session"""
    session_id = request.GET.get('session_id')
    if session_id:
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
            messages = session.messages.all()
            
            message_data = [{
                'id': msg.id,
                'type': msg.message_type,
                'content': msg.content,
                'timestamp': msg.timestamp.isoformat(),
                'linked_message_id': msg.linked_message.id if msg.linked_message else None
            } for msg in messages]
            
            return JsonResponse({
                'success': True,
                'session': {
                    'id': session.id,
                    'title': session.title,
                    'created_at': session.created_at.isoformat()
                },
                'messages': message_data
            })
        except ChatSession.DoesNotExist:
            return JsonResponse({'error': 'Session not found'}, status=404)
    
    # Return all sessions if no specific session requested
    sessions = ChatSession.objects.filter(user=request.user)
    session_data = [{
        'id': session.id,
        'title': session.title,
        'created_at': session.created_at.isoformat(),
        'updated_at': session.updated_at.isoformat(),
        'message_count': session.messages.count()
    } for session in sessions]
    
    return JsonResponse({
        'success': True,
        'sessions': session_data
    })

@login_required
@csrf_exempt
def delete_chat_session(request):
    """Delete a chat session"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            session_id = data.get('session_id')
            
            if not session_id:
                return JsonResponse({'error': 'Session ID is required'}, status=400)
            
            # Get the session and verify ownership
            try:
                session = ChatSession.objects.get(id=session_id, user=request.user)
                session_title = session.title
                session.delete()
                
                log_user_activity(request.user, 'delete_chat_session', request)
                
                return JsonResponse({
                    'success': True,
                    'message': f'Chat session "{session_title}" deleted successfully'
                })
                
            except ChatSession.DoesNotExist:
                return JsonResponse({'error': 'Chat session not found'}, status=404)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'error': 'An error occurred while deleting the chat session'}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Message Management API Views

@login_required
def edit_message_api(request):
    """API endpoint for editing messages"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        message_id = data.get('message_id')
        new_text = data.get('new_text', '').strip()
        
        if not message_id or not new_text:
            return JsonResponse({'error': 'Message ID and new text are required'}, status=400)
        
        # Get the message and verify ownership
        try:
            message = ChatMessage.objects.get(
                id=message_id,
                session__user=request.user,
                message_type='user'  # Only allow editing user messages
            )
        except ChatMessage.DoesNotExist:
            return JsonResponse({'error': 'Message not found or access denied'}, status=404)
        
        # Update the message
        message.content = new_text
        message.save()
        
        # Remove the old linked bot response since it's no longer relevant
        removed_bot_id = None
        bot_response = ChatMessage.objects.filter(linked_message=message).first()
        if bot_response:
            removed_bot_id = bot_response.id
            bot_response.delete()
        
        # Generate a new bot response for the edited message
        new_bot_response = generate_bot_response(new_text)
        
        new_bot_message = ChatMessage.objects.create(
            session=message.session,
            message_type='bot',
            content=new_bot_response,
            linked_message=message
        )
        
        # Log the activity
        log_user_activity(request.user, 'EDIT_MESSAGE', request)
        
        return JsonResponse({
            'success': True,
            'message': 'Message updated successfully',
            'removed_bot_id': removed_bot_id,
            'new_bot_message': {
                'id': new_bot_message.id,
                'content': new_bot_message.content,
                'timestamp': new_bot_message.timestamp.isoformat()
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def delete_message_api(request):
    """API endpoint for deleting messages"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        message_id = data.get('message_id')
        
        if not message_id:
            return JsonResponse({'error': 'Message ID is required'}, status=400)
        
        # Get the message and verify ownership
        try:
            message = ChatMessage.objects.get(
                id=message_id,
                session__user=request.user
            )
        except ChatMessage.DoesNotExist:
            return JsonResponse({'error': 'Message not found or access denied'}, status=404)
        
        # Find linked messages that should be deleted together
        messages_to_delete = [message]
        
        if message.message_type == 'user':
            # If deleting a user message, also delete its bot response
            bot_response = ChatMessage.objects.filter(linked_message=message).first()
            if bot_response:
                messages_to_delete.append(bot_response)
        elif message.message_type == 'bot' and message.linked_message:
            # If deleting a bot message, also delete its linked user message
            messages_to_delete.append(message.linked_message)
        
        # Delete all linked messages
        deleted_ids = [msg.id for msg in messages_to_delete]
        for msg in messages_to_delete:
            msg.delete()
        
        # Log the activity
        log_user_activity(request.user, 'DELETE_MESSAGE', request)
        
        return JsonResponse({
            'success': True,
            'message': 'Message(s) deleted successfully',
            'deleted_ids': deleted_ids
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def search_messages_api(request):
    """API endpoint for searching messages"""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        query = request.GET.get('query', '').strip()
        session_id = request.GET.get('session_id')
        
        if len(query) < 2:
            return JsonResponse({'error': 'Query must be at least 2 characters'}, status=400)
        
        # Build the search query
        messages_query = ChatMessage.objects.filter(
            session__user=request.user,
            content__icontains=query
        ).order_by('-created_at')
        
        # Filter by session if provided
        if session_id:
            messages_query = messages_query.filter(session_id=session_id)
        
        # Get the messages
        messages = list(messages_query.values(
            'id', 'content', 'message_type', 'created_at', 'session_id', 'session__title'
        )[:50])  # Limit to 50 results
        
        # Format the results
        results = []
        for msg in messages:
            results.append({
                'id': msg['id'],
                'content': msg['content'][:200] + ('...' if len(msg['content']) > 200 else ''),
                'type': msg['message_type'],
                'timestamp': msg['created_at'].isoformat(),
                'session_id': msg['session_id'],
                'session_title': msg['session__title']
            })
        
        return JsonResponse({
            'success': True,
            'results': results,
            'count': len(results)
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def export_conversation_api(request):
    """API endpoint for exporting conversations"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        session_id = data.get('session_id')
        export_format = data.get('format', 'txt').lower()
        
        if not session_id:
            return JsonResponse({'error': 'Session ID is required'}, status=400)
        
        if export_format not in ['txt', 'md', 'pdf']:
            return JsonResponse({'error': 'Invalid format. Use txt, md, or pdf'}, status=400)
        
        # Get the session and verify ownership
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            return JsonResponse({'error': 'Session not found or access denied'}, status=404)
        
        # Get all messages in the session
        messages = ChatMessage.objects.filter(session=session).order_by('created_at')
        
        if not messages.exists():
            return JsonResponse({'error': 'No messages found in this session'}, status=404)
        
        # Generate export content based on format
        if export_format == 'txt':
            content = export_as_txt(session, messages)
            content_type = 'text/plain'
        elif export_format == 'md':
            content = export_as_markdown(session, messages)
            content_type = 'text/markdown'
        elif export_format == 'pdf':
            content = export_as_pdf(session, messages)
            content_type = 'application/pdf'
        
        # Log the activity
        log_user_activity(request.user, f'EXPORT_{export_format.upper()}', request)
        
        from django.http import HttpResponse
        response = HttpResponse(content, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="chat-export-{session_id}.{export_format}"'
        return response
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def export_as_txt(session, messages):
    """Export conversation as plain text"""
    lines = []
    lines.append(f"Chat Export: {session.title}")
    lines.append(f"Date: {session.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("=" * 50)
    lines.append("")
    
    for message in messages:
        timestamp = message.created_at.strftime('%Y-%m-%d %H:%M:%S')
        sender = "You" if message.message_type == 'user' else "Assistant"
        lines.append(f"[{timestamp}] {sender}:")
        lines.append(message.content)
        lines.append("")
    
    return "\n".join(lines)

def export_as_markdown(session, messages):
    """Export conversation as Markdown"""
    lines = []
    lines.append(f"# Chat Export: {session.title}")
    lines.append(f"**Date:** {session.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("")
    
    for message in messages:
        timestamp = message.created_at.strftime('%Y-%m-%d %H:%M:%S')
        sender = "You" if message.message_type == 'user' else "Assistant"
        lines.append(f"## {sender} - {timestamp}")
        lines.append("")
        lines.append(message.content)
        lines.append("")
    
    return "\n".join(lines)

def export_as_pdf(session, messages):
    """Export conversation as PDF"""
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from io import BytesIO
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
        )
        
        user_style = ParagraphStyle(
            'UserMessage',
            parent=styles['Normal'],
            backgroundColor='#E3F2FD',
            borderPadding=5,
            spaceAfter=10,
            leftIndent=20,
        )
        
        bot_style = ParagraphStyle(
            'BotMessage',
            parent=styles['Normal'],
            backgroundColor='#F3E5F5',
            borderPadding=5,
            spaceAfter=10,
            rightIndent=20,
        )
        
        story = []
        
        # Title
        story.append(Paragraph(f"Chat Export: {session.title}", title_style))
        story.append(Paragraph(f"Date: {session.created_at.strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Messages
        for message in messages:
            timestamp = message.created_at.strftime('%Y-%m-%d %H:%M:%S')
            sender = "You" if message.message_type == 'user' else "Assistant"
            
            # Header
            story.append(Paragraph(f"<b>{sender}</b> - {timestamp}", styles['Heading3']))
            
            # Message content
            style = user_style if message.message_type == 'user' else bot_style
            story.append(Paragraph(message.content, style))
            story.append(Spacer(1, 10))
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
        
    except ImportError:
        # Fallback to text if reportlab is not available
        return export_as_txt(session, messages).encode('utf-8')

@csrf_exempt
@login_required
def message_feedback(request):
    """Handle user feedback for bot messages"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        message_id = data.get('message_id')
        feedback_type = data.get('feedback_type')
        
        if not message_id or feedback_type not in ['positive', 'negative']:
            return JsonResponse({'error': 'Invalid parameters'}, status=400)
        
        # Import RL service
        from .rl_service import rl_service
        
        # Record feedback
        success = rl_service.record_feedback(message_id, request.user, feedback_type)
        
        if success:
            # Log user activity
            log_user_activity(request.user, f'feedback_{feedback_type}', request)
            
            return JsonResponse({
                'success': True,
                'message': f'Thank you for your {feedback_type} feedback!'
            })
        else:
            return JsonResponse({'error': 'Failed to record feedback'}, status=500)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error in message_feedback: {e}")
        return JsonResponse({'error': 'Internal server error'}, status=500)

@login_required
def rl_stats(request):
    """Get reinforcement learning model statistics"""
    try:
        from .rl_service import rl_service
        
        performance = rl_service.get_model_performance()
        
        return JsonResponse({
            'success': True,
            'stats': performance
        })
        
    except Exception as e:
        logger.error(f"Error getting RL stats: {e}")
        return JsonResponse({'error': 'Failed to get statistics'}, status=500)

@csrf_exempt
@login_required
def retrain_model(request):
    """Manually trigger model retraining (admin only)"""
    if not request.user.is_staff:
        return JsonResponse({'error': 'Admin access required'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        from .rl_service import rl_service
        
        rl_service.retrain_model()
        performance = rl_service.get_model_performance()
        
        return JsonResponse({
            'success': True,
            'message': 'Model retrained successfully',
            'stats': performance
        })
        
    except Exception as e:
        logger.error(f"Error retraining model: {e}")
        return JsonResponse({'error': 'Failed to retrain model'}, status=500)

def load_chatbot_model():
    """
    Load the noaman_chatbot_model_final.pkl file
    """
    try:
        model_path = Path(__file__).resolve().parent / 'noaman_chatbot_model_final.pkl'
        with open(model_path, 'rb') as f:
            chatbot_model = pickle.load(f)
        return chatbot_model
    except Exception as e:
        logger.error(f"Error loading chatbot model: {e}")
        return None

def get_model_response(message):
    """
    Use the loaded model to generate a response
    """
    try:
        chatbot_model = load_chatbot_model()
        if chatbot_model is None:
            return None
            
        # Generate response from the model
        # Note: Adjust this code based on how your specific model works
        response = chatbot_model.predict([message])[0]
        return response
    except Exception as e:
        logger.error(f"Error getting model response: {e}")
        return None

def search_knowledge_base(query):
    """
    Search the enhanced knowledge base for relevant answers
    """
    try:
        kb_path = Path(__file__).resolve().parent / 'enhanced_knowledge_base.json'
        with open(kb_path, 'r', encoding='utf-8') as f:
            knowledge_base = json.load(f)
            
        if 'qa_pairs' not in knowledge_base:
            logger.error("Invalid knowledge base format")
            return None
            
        # Extract keywords from the query
        query_lower = query.lower()
        query_words = set(word.lower() for word in query_lower.split() 
                          if len(word) > 3 and word.lower() not in 
                          ['what', 'when', 'where', 'how', 'why', 'who', 'which', 'is', 'are', 'the', 'and', 'that'])
        
        # Find matches based on keywords
        best_matches = []
        for qa_pair in knowledge_base['qa_pairs']:
            # Check direct question match
            if query_lower in qa_pair['question'].lower():
                return qa_pair['answer']
                
            # Check keywords match
            keywords = set(kw.lower() for kw in qa_pair.get('keywords', []))
            common_words = query_words.intersection(keywords)
            
            if common_words:
                match_score = len(common_words) / len(query_words) if query_words else 0
                best_matches.append((match_score, qa_pair))
        
        # Return best match if score is above threshold
        if best_matches:
            best_matches.sort(key=lambda x: x[0], reverse=True)
            if best_matches[0][0] >= 0.5:  # 50% keyword match threshold
                return best_matches[0][1]['answer']
                
        return None
    except Exception as e:
        logger.error(f"Error searching knowledge base: {e}")
        return None
