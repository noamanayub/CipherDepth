// Login page JavaScript for Django
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        
        // Add real-time validation
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput) emailInput.addEventListener('blur', validateEmail);
        if (passwordInput) passwordInput.addEventListener('blur', validatePassword);
    }
});

function handleLogin(e) {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Clear previous errors
    clearFieldErrors();
    
    let hasErrors = false;
    
    // Validate email
    if (!email) {
        showFieldError('email', 'Email is required');
        hasErrors = true;
    } else if (!isValidEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        hasErrors = true;
    }
    
    // Validate password
    if (!password) {
        showFieldError('password', 'Password is required');
        hasErrors = true;
    }
    
    if (hasErrors) {
        e.preventDefault();
        return false;
    }
    
    // Show loading state
    showLoadingState();
    
    // Let the form submit normally to Django
    return true;
}

function validateEmail() {
    const email = document.getElementById('email').value.trim();
    const emailGroup = document.getElementById('email').closest('.form-group');
    
    if (email && !isValidEmail(email)) {
        emailGroup.classList.add('error');
        showFieldError('email', 'Please enter a valid email address');
    } else {
        emailGroup.classList.remove('error');
        clearFieldError('email');
    }
}

function validatePassword() {
    const password = document.getElementById('password').value;
    const passwordGroup = document.getElementById('password').closest('.form-group');
    
    if (password && password.length < 1) {
        passwordGroup.classList.add('error');
        showFieldError('password', 'Password is required');
    } else {
        passwordGroup.classList.remove('error');
        clearFieldError('password');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFieldError(fieldId, message) {
    clearFieldError(fieldId);
    
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    
    formGroup.classList.add('error');
    
    const errorSpan = document.createElement('span');
    errorSpan.className = 'form-error';
    errorSpan.textContent = message;
    
    formGroup.appendChild(errorSpan);
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    const existingError = formGroup.querySelector('.form-error');
    
    if (existingError) {
        existingError.remove();
    }
    formGroup.classList.remove('error');
}

function clearFieldErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    const errorGroups = document.querySelectorAll('.form-group.error');
    
    errorElements.forEach(el => el.remove());
    errorGroups.forEach(group => group.classList.remove('error'));
}

function showLoadingState() {
    const submitBtn = document.querySelector('.sign-in-btn');
    if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;
        
        // Re-enable after a timeout (in case of form errors)
        setTimeout(() => {
            if (submitBtn.disabled) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }, 5000);
    }
}
