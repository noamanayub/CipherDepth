// Register page JavaScript for Django
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        
        // Add real-time validation
        const fullNameInput = document.getElementById('full_name');
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const password1Input = document.getElementById('password1');
        const password2Input = document.getElementById('password2');
        
        if (fullNameInput) fullNameInput.addEventListener('blur', validateFullName);
        if (usernameInput) usernameInput.addEventListener('blur', validateUsername);
        if (emailInput) emailInput.addEventListener('blur', validateEmail);
        if (password1Input) password1Input.addEventListener('blur', validatePassword);
        if (password2Input) password2Input.addEventListener('blur', validatePasswordConfirm);
    }
});

function handleRegister(e) {
    const fullName = document.getElementById('full_name').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password1 = document.getElementById('password1').value;
    const password2 = document.getElementById('password2').value;
    
    // Clear previous errors
    clearFieldErrors();
    
    let hasErrors = false;
    
    // Validate full name
    if (!fullName) {
        showFieldError('full_name', 'Full name is required');
        hasErrors = true;
    } else if (fullName.length < 2) {
        showFieldError('full_name', 'Full name must be at least 2 characters');
        hasErrors = true;
    }
    
    // Validate username
    if (!username) {
        showFieldError('username', 'Username is required');
        hasErrors = true;
    } else if (username.length < 3) {
        showFieldError('username', 'Username must be at least 3 characters');
        hasErrors = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showFieldError('username', 'Username can only contain letters, numbers, and underscores');
        hasErrors = true;
    }
    
    // Validate email
    if (!email) {
        showFieldError('email', 'Email is required');
        hasErrors = true;
    } else if (!isValidEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        hasErrors = true;
    }
    
    // Validate password
    if (!password1) {
        showFieldError('password1', 'Password is required');
        hasErrors = true;
    } else if (password1.length < 8) {
        showFieldError('password1', 'Password must be at least 8 characters long');
        hasErrors = true;
    }
    
    // Validate password confirmation
    if (!password2) {
        showFieldError('password2', 'Please confirm your password');
        hasErrors = true;
    } else if (password1 !== password2) {
        showFieldError('password2', 'Passwords do not match');
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

function validateFullName() {
    const fullName = document.getElementById('full_name').value.trim();
    const fullNameGroup = document.getElementById('full_name').closest('.form-group');
    
    if (fullName && fullName.length < 2) {
        fullNameGroup.classList.add('error');
        showFieldError('full_name', 'Full name must be at least 2 characters');
    } else {
        fullNameGroup.classList.remove('error');
        clearFieldError('full_name');
    }
}

function validateUsername() {
    const username = document.getElementById('username').value.trim();
    const usernameGroup = document.getElementById('username').closest('.form-group');
    
    if (username) {
        if (username.length < 3) {
            usernameGroup.classList.add('error');
            showFieldError('username', 'Username must be at least 3 characters');
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            usernameGroup.classList.add('error');
            showFieldError('username', 'Username can only contain letters, numbers, and underscores');
        } else {
            usernameGroup.classList.remove('error');
            clearFieldError('username');
        }
    }
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
    const password = document.getElementById('password1').value;
    const passwordGroup = document.getElementById('password1').closest('.form-group');
    
    if (password && password.length < 8) {
        passwordGroup.classList.add('error');
        showFieldError('password1', 'Password must be at least 8 characters long');
    } else {
        passwordGroup.classList.remove('error');
        clearFieldError('password1');
    }
    
    // Also check password confirmation if it exists
    validatePasswordConfirm();
}

function validatePasswordConfirm() {
    const password1 = document.getElementById('password1').value;
    const password2 = document.getElementById('password2').value;
    const password2Group = document.getElementById('password2').closest('.form-group');
    
    if (password2 && password1 !== password2) {
        password2Group.classList.add('error');
        showFieldError('password2', 'Passwords do not match');
    } else {
        password2Group.classList.remove('error');
        clearFieldError('password2');
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
        submitBtn.textContent = 'Creating Account...';
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
