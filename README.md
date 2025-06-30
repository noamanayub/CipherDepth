## CipherDepth - Journey Beyond the Surface of AI

A modern web application built with Django featuring user authentication, real-time chat interface, AI-powered responses with Reinforcement Learning, and a beautiful 3D animated UI.

**Created by Noaman Ayub**
- LinkedIn: [https://www.linkedin.com/in/noamanayub](https://www.linkedin.com/in/noamanayub)
- GitHub: [https://github.com/noamanayub](https://github.com/noamanayub)

## Table of Contents

1. [Features](#features)
2. [AI & Machine Learning Features](#ai--machine-learning-features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Installation & Setup](#installation--setup)
    - [Install Dependencies](#1-install-dependencies)
    - [Database Setup](#2-database-setup)
    - [Test the Setup](#3-test-the-setup)
    - [Run the Server](#4-run-the-server)
6. [Database Models](#database-models)
7. [AI Response System](#ai-response-system)
8. [Recent Updates & Bug Fixes](#recent-updates--bug-fixes)
9. [API Endpoints](#api-endpoints)
    - [User Management](#user-management)
    - [Chat & AI Features](#chat--ai-features)
    - [Administration](#administration)
10. [Usage](#usage)
     - [User Registration](#1-user-registration)
     - [User Login](#2-user-login)
     - [Chat Interface with AI](#3-chat-interface-with-ai)
     - [Administration & AI Management](#4-administration--ai-management)
11. [Testing](#testing)
12. [Customization](#customization)
     - [Theme Colors](#theme-colors)
     - [Database Configuration](#database-configuration)
13. [Security Considerations](#security-considerations)
14. [Troubleshooting](#troubleshooting)
15. [License](#license)
16. [Support](#support)


## Features

- **User Authentication**: Secure registration and login system
- **AI-Powered Chat**: Intelligent responses using Reinforcement Learning
- **Modern UI**: 3D animated buttons, responsive design, dark theme
- **Chat Interface**: Real-time messaging with chat history and session management
- **Reinforcement Learning**: Adaptive AI that improves responses based on user feedback
- **Database Integration**: SQLite database for user management and chat storage
- **Admin Panel**: Django admin interface for user and chat management
- **Message Management**: Edit, delete, and manage chat messages
- **Response Analytics**: Track and improve AI response quality

## AI & Machine Learning Features

- **Reinforcement Learning Service**: AI responses improve over time based on user feedback
- **Pattern Recognition**: Identifies successful response patterns and reuses them
- **Contextual Responses**: Categorizes user inputs and provides appropriate responses
- **Feedback System**: Users can rate responses to train the AI model
- **Response Templates**: Structured templates for different conversation types

## Tech Stack

- **Backend**: Django 4.2.7
- **Database**: SQLite (easily configurable for PostgreSQL/MySQL)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Templates**: Django template system with inheritance
- **Authentication**: Django built-in authentication system
- **AI/ML**: NumPy for machine learning computations
- **Reinforcement Learning**: Custom RL service for response improvement

## Project Structure

```
CipherDepth/
├── cipherproject/          # Django project configuration
│   ├── settings.py         # Main settings
│   ├── urls.py            # URL routing
│   └── wsgi.py            # WSGI configuration
├── cipherapp/             # Main Django application
│   ├── models.py          # Database models (User, Chat, AI models)
│   ├── views.py           # View controllers
│   ├── forms.py           # Django forms
│   ├── urls.py            # App URLs
│   ├── admin.py           # Admin configuration
│   ├── rl_service.py      # Reinforcement Learning service
│   ├── static/            # Static files (CSS, JS, images)
│   └── templates/         # HTML templates
├── static/                # Collected static files
├── manage.py              # Django management script
├── requirements.txt       # Python dependencies
├── run_django.bat         # Windows startup script
└── test_django.py         # Database test script
```

## Installation & Setup

### 1. Install Dependencies

```bash
# Install all required packages including AI/ML dependencies
pip install -r requirements.txt
```

### 2. Database Setup

```bash
# Create database migrations (includes AI models)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### 3. Test the Setup

```bash
python test_django.py
```

### 4. Run the Server

**Option 1: Command Line**
```bash
python manage.py runserver 8000
```

**Option 2: Windows Batch File**
```bash
run_django.bat
```

The application will be available at: `http://localhost:8000`

## Database Models

### UserProfile
- Extended user information (full name, avatar, theme preference)
- One-to-one relationship with Django User model

### ChatSession  
- Organizes conversations by user
- Tracks chat titles and timestamps

### ChatMessage
- Individual messages within chat sessions
- Supports user, bot, and system message types

### UserActivity
- Tracks user actions (login, logout, chat activity)
- Includes IP address and user agent for analytics

### MessageFeedback
- Stores user feedback on AI responses (positive/negative)
- Used by Reinforcement Learning system for improvement

### ResponsePattern
- Stores successful response patterns
- Tracks success rates and usage statistics

### ReinforcementLearningModel
- Manages AI model versions and parameters
- Tracks accuracy and training metrics

## AI Response System

The CipherDepth AI uses a sophisticated Reinforcement Learning system:

1. **Input Analysis**: Categorizes user messages (greeting, technical, creative, etc.)
2. **Pattern Matching**: Finds similar successful responses from history
3. **Response Generation**: Creates appropriate responses using templates or learned patterns
4. **Feedback Loop**: Users can rate responses to improve future interactions
5. **Continuous Learning**: Model adapts and improves based on user feedback

## Recent Updates & Bug Fixes

### v1.1 - Bug Fix Update
- **Fixed**: Duplicate greeting responses issue
- **Issue**: AI was returning "Hello! I'm CipherDepth, your AI assistant created by Noaman Ayub. How can I help you today? Hello! How can I assist you today?"
- **Solution**: Modified RL service to prevent concatenation of template and base responses for greeting category
- **Updated**: Enhanced requirements.txt with comprehensive dependencies
- **Updated**: README.md with detailed AI features and creator information

## API Endpoints

### User Management
- `/` - Redirects to login page
- `/login/` - User login page
- `/register/` - User registration page
- `/logout/` - User logout

### Chat & AI Features
- `/home/` - Main chat dashboard (requires authentication)
- `/api/chat/` - Chat API for sending/receiving messages with AI responses
- `/api/chat/history/` - Chat history retrieval
- `/api/edit-message/` - Edit chat messages
- `/api/delete-session/` - Delete chat sessions

### Administration
- `/admin/` - Django admin panel for managing users, chats, and AI models

## Usage

### 1. User Registration
- Navigate to `/register/`
- Fill in: Full Name, Username, Email, Password
- Account is created and user is automatically logged in

### 2. User Login  
- Navigate to `/login/`
- Enter email and password
- Redirected to chat dashboard

### 3. Chat Interface with AI
- Click "New Chat" to start a conversation with CipherDepth AI
- Type messages in the input field
- AI responds using advanced Reinforcement Learning
- Rate responses with thumbs up/down to improve AI performance
- Chat history is automatically saved
- Previous chats accessible from sidebar
- Edit or delete messages as needed

### 4. Administration & AI Management
- Access `/admin/` with superuser credentials
- Manage users, chat sessions, and messages
- View AI model performance and feedback
- Monitor response patterns and success rates
- Analyze user activity and engagement
- Configure AI model parameters

## Testing

A test user has been created for development:
- **Email**: test@example.com
- **Password**: testpass123

## Customization

### Theme Colors
Edit `cipherproject/settings.py` or modify CSS variables in `styles.css`:

```css
:root {
    --primary-color: #4fd1c7;
    --secondary-color: #3fb8ae;
    --background-color: #1a2332;
    --surface-color: #0f1419;
}
```

### Database Configuration
For production, update `DATABASES` in `settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'cipherdeepth',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## Security Considerations

- Change `SECRET_KEY` in production
- Set `DEBUG = False` in production
- Configure `ALLOWED_HOSTS` for your domain
- Use HTTPS in production
- Consider rate limiting for chat API
- Implement CSRF protection (already included)

## Troubleshooting

### Common Issues

1. **Static files not loading**
   - Run `python manage.py collectstatic`
   - Ensure `STATIC_URL` and `STATICFILES_DIRS` are configured

2. **Database errors**
   - Delete `cipherdeepth.db` and run migrations again
   - Check file permissions

3. **Template not found**
   - Verify template paths in `TEMPLATES` setting
   - Ensure templates are in correct directories

### Development

- Use `python manage.py shell` for interactive testing
- Enable Django debug toolbar for development
- Check `python manage.py check` for configuration issues

## License

This project is created by **Noaman Ayub** and is open source. Feel free to modify and distribute.

**Creator Contact:**
- LinkedIn: [https://www.linkedin.com/in/noamanayub](https://www.linkedin.com/in/noamanayub)
- GitHub: [https://github.com/noamanayub](https://github.com/noamanayub)

## Support

For issues or questions, please check the Django documentation or create an issue in the project repository.

---

**CipherDepth v1.1** - AI-Powered Chat Assistant with Reinforcement Learning  
