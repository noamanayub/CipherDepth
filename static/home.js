/**
 * CipherDepth Home Page - Interactive Dashboard
 * Enhanced with collapsible sidebar and improved session management
 */

// Global state
let currentSessionId = null;
let chatMessages = [];
let isLightMode = false;
let isSidebarCollapsed = false;

/**
 * Message Management Functions
 */

// Message management state
let messageToDelete = null;
let searchResults = [];
let searchActive = false;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the entire application
 */
function initializeApp() {
    console.log('🚀 Initializing CipherDepth Dashboard...');
    
    // Initialize UI elements
    initializeButtons();
    initializeChat();
    initializeTheme();
    initializeSidebar();
    initializeMessageManagement();
    
    // Auto-hide messages after 5 seconds
    autoHideMessages();
    
    // Load initial chat history
    refreshChatHistory();
    
    console.log('✅ Dashboard initialized successfully');
}

/**
 * Initialize sidebar functionality - IMPROVED for tablets
 */
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    // Check if sidebar should start collapsed based on device type
    if (window.innerWidth >= 1025) {
        // Desktop: check saved state
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            sidebar?.classList.add('collapsed');
            isSidebarCollapsed = true;
            updateSidebarToggleIcon();
        }
    } else {
        // Mobile/Tablet: start collapsed
        sidebar?.classList.add('collapsed');
        isSidebarCollapsed = true;
        updateSidebarToggleIcon();
    }
    
    // Initialize overlay click handler
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            console.log('🔲 Overlay clicked');
            // Close sidebar if it's open on mobile/tablet
            if (!isSidebarCollapsed && window.innerWidth <= 1024) {
                handleSidebarToggle();
            }
        });
        console.log('✅ Overlay click handler initialized');
    }
    
    // Handle window resize
    window.addEventListener('resize', handleWindowResize);
    
    console.log('✅ Sidebar initialized');
}

/**
 * Handle window resize for responsive sidebar - IMPROVED for tablets
 */
function handleWindowResize() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (window.innerWidth <= 1024) {
        // Mobile/Tablet: sidebar should slide in/out
        if (!isSidebarCollapsed) {
            sidebar?.classList.remove('collapsed');
            overlay?.classList.add('active');
        } else {
            sidebar?.classList.add('collapsed');
            overlay?.classList.remove('active');
        }
    } else {
        // Desktop: sidebar should collapse/expand in place
        overlay?.classList.remove('active');
        if (isSidebarCollapsed) {
            sidebar?.classList.add('collapsed');
        } else {
            sidebar?.classList.remove('collapsed');
        }
    }
    
    // Update toggle icon for new screen size
    updateSidebarToggleIcon();
}

/**
 * Initialize all button event listeners
 */
function initializeButtons() {
    console.log('🔧 Initializing buttons...');
    
    // New Chat Button - enhanced to only create session on actual send
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', handleNewChat);
        console.log('✅ New Chat button initialized');
    } else {
        console.warn('⚠️ New Chat button not found');
    }
    
    // Logout Button - improved with better error handling
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
        console.log('✅ Logout button initialized');
    } else {
        console.warn('⚠️ Logout button not found');
    }
    
    // Theme Toggle Button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', handleThemeToggle);
        console.log('✅ Theme toggle initialized');
    } else {
        console.warn('⚠️ Theme toggle not found');
    }
    
    // History Button - improved functionality
    const historyBtn = document.getElementById('historyBtn');
    if (historyBtn) {
        historyBtn.addEventListener('click', handleHistoryView);
        console.log('✅ History button initialized');
    } else {
        console.warn('⚠️ History button not found');
    }
    
    // Sidebar Toggle Button - completely rewritten
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', handleSidebarToggle);
        console.log('✅ Sidebar toggle initialized');
    } else {
        console.warn('⚠️ Sidebar toggle not found');
    }
    
    // Send Button - enhanced with better validation
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
        console.log('✅ Send button initialized');
    } else {
        console.warn('⚠️ Send button not found');
    }
    
    // Chat Input Enter Key
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        console.log('✅ Chat input initialized');
    } else {
        console.warn('⚠️ Chat input not found');
    }
    
    // Initialize dynamic chat session buttons
    initializeChatButtons();
    
    console.log('✅ All buttons initialized successfully');
}

/**
 * Initialize chat session and delete buttons
 */
function initializeChatButtons() {
    // Chat Session Buttons
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        item.addEventListener('click', function() {
            const sessionId = this.getAttribute('data-session-id');
            handleLoadChatSession(sessionId);
        });
    });
    console.log(`✅ ${chatItems.length} chat sessions initialized`);
    
    // Chat Delete Buttons
    const deleteButtons = document.querySelectorAll('.chat-delete-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const sessionId = this.getAttribute('data-session-id');
            handleDeleteChatSession(sessionId);
        });
    });
    console.log(`✅ ${deleteButtons.length} delete buttons initialized`);
}

/**
 * Initialize chat functionality
 */
function initializeChat() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const chatArea = document.getElementById('chatArea');
    
    if (welcomeScreen && chatArea) {
        // Initially show welcome screen
        welcomeScreen.style.display = 'flex';
        chatArea.classList.add('hidden');
        console.log('✅ Chat interface initialized');
    }
}

/**
 * Initialize theme based on user preference
 */
function initializeTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('#themeToggle .icon');
    
    // Check if user has light mode preference
    if (body.classList.contains('light-mode')) {
        isLightMode = true;
        if (themeIcon) themeIcon.textContent = '🌙';
    } else {
        isLightMode = false;
        if (themeIcon) themeIcon.textContent = '☀️';
    }
    
    console.log(`✅ Theme initialized: ${isLightMode ? 'Light' : 'Dark'} mode`);
}

/**
 * Initialize message management features
 */
function initializeMessageManagement() {
    console.log('🔧 Initializing message management...');
    
    // Search functionality - wait for DOM to be fully ready
    setTimeout(() => {
        const searchBtn = document.getElementById('searchBtn');
        const searchContainer = document.getElementById('searchContainer');
        const searchInput = document.getElementById('searchInput');
        const searchPerformBtn = document.getElementById('searchPerformBtn');
        
        console.log('🔍 Search elements check:', { 
            searchBtn: !!searchBtn, 
            searchContainer: !!searchContainer, 
            searchInput: !!searchInput,
            searchPerformBtn: !!searchPerformBtn
        });
        
        if (searchBtn) {
            // Remove any existing listeners first
            searchBtn.removeEventListener('click', handleSearchClick);
            // Add the listener
            searchBtn.addEventListener('click', handleSearchClick);
            console.log('✅ Search button listener added');
        } else {
            console.error('❌ Search button not found');
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', debounce(function(e) {
                performSearch(e.target.value);
            }, 300));
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    toggleSearch();
                } else if (e.key === 'Enter') {
                    performSearch(e.target.value);
                }
            });
            console.log('✅ Search input listeners added');
        }
        
        if (searchPerformBtn) {
            searchPerformBtn.addEventListener('click', function() {
                const query = searchInput ? searchInput.value : '';
                performSearch(query);
            });
            console.log('✅ Search perform button listener added');
        }
    }, 100);

    // Delete modal functionality - ensure proper setup
    setTimeout(() => {
        const deleteModal = document.getElementById('deleteModal');
        const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
        const deleteCancelBtn = document.getElementById('deleteCancelBtn');
        
        console.log('🗑️ Delete modal elements check:', { 
            deleteModal: !!deleteModal, 
            deleteConfirmBtn: !!deleteConfirmBtn, 
            deleteCancelBtn: !!deleteCancelBtn
        });
        
        if (deleteConfirmBtn) {
            // Remove any existing listeners first
            deleteConfirmBtn.removeEventListener('click', confirmDeleteMessage);
            deleteConfirmBtn.addEventListener('click', confirmDeleteMessage);
            console.log('✅ Delete confirm button listener added');
        } else {
            console.error('❌ Delete confirm button not found');
        }
        
        if (deleteCancelBtn) {
            // Remove any existing listeners first
            deleteCancelBtn.removeEventListener('click', cancelDeleteMessage);
            deleteCancelBtn.addEventListener('click', cancelDeleteMessage);
            console.log('✅ Delete cancel button listener added');
        } else {
            console.error('❌ Delete cancel button not found');
        }
        
        // Close modal when clicking outside
        if (deleteModal) {
            deleteModal.addEventListener('click', function(e) {
                if (e.target === deleteModal) {
                    cancelDeleteMessage();
                }
            });
            console.log('✅ Delete modal outside click listener added');
        } else {
            console.error('❌ Delete modal not found');
        }
    }, 150);
    
    console.log('✅ Message management initialized successfully');
}

/**
 * Handle search button click
 */
function handleSearchClick() {
    console.log('🔍 Search button clicked! Current searchActive:', searchActive);
    toggleSearch();
}

/**
 * Toggle search functionality
 */
function toggleSearch() {
    console.log('🔍 toggleSearch called! Current searchActive:', searchActive);
    
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    console.log('🔍 Elements found:', { 
        searchContainer: !!searchContainer, 
        searchInput: !!searchInput, 
        searchBtn: !!searchBtn 
    });
    
    if (!searchContainer || !searchInput || !searchBtn) {
        console.error('🔍 Search elements not found:', { searchContainer, searchInput, searchBtn });
        return;
    }
    
    searchActive = !searchActive;
    console.log('🔍 New search state:', searchActive);
    
    if (searchActive) {
        console.log('🔍 Activating search container...');
        searchContainer.classList.add('active');
        searchBtn.classList.add('active');
        searchInput.focus();
        updateSearchResults('Ready to search...');
        console.log('🔍 Search activated, container classes:', searchContainer.classList.toString());
    } else {
        console.log('🔍 Deactivating search container...');
        searchContainer.classList.remove('active');
        searchBtn.classList.remove('active');
        clearSearchResults();
        searchInput.value = '';
        console.log('🔍 Search deactivated, container classes:', searchContainer.classList.toString());
    }
}

/**
 * Debounce function for search input
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Perform search through messages
 */
function performSearch(query) {
    console.log('🔍 Performing search with query:', query);
    
    if (!query || query.trim().length < 2) {
        updateSearchResults('Type at least 2 characters to search...');
        return;
    }
    
    const messages = document.querySelectorAll('.message');
    let results = [];
    let matchCount = 0;
    
    // Clear previous highlights
    clearSearchHighlights();
    
    messages.forEach((message, index) => {
        const messageText = message.textContent.toLowerCase();
        const searchTerm = query.toLowerCase();
        
        if (messageText.includes(searchTerm)) {
            message.classList.add('search-match');
            highlightText(message, searchTerm);
            results.push({ element: message, index });
            matchCount++;
        }
    });
    
    // Scroll to first match if any
    if (results.length > 0) {
        results[0].element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    updateSearchResults(`Found ${matchCount} message${matchCount !== 1 ? 's' : ''} containing "${query}"`);
    console.log('🔍 Search completed. Found', matchCount, 'matches');
}

/**
 * Clear search results and highlights
 */
function clearSearchResults() {
    clearSearchHighlights();
    updateSearchResults('');
}

/**
 * Clear search highlights
 */
function clearSearchHighlights() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => {
        message.classList.remove('search-match');
        // Remove highlight spans
        const highlights = message.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
    });
}

/**
 * Escape regular expression special characters
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlight matching text in a message
 */
function highlightText(element, query) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    
    while (node = walker.nextNode()) {
        if (node.parentNode.className !== 'search-highlight') {
            textNodes.push(node);
        }
    }
    
    textNodes.forEach(textNode => {
        const text = textNode.textContent;
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        
        if (regex.test(text)) {
            const wrapper = document.createElement('span');
            wrapper.innerHTML = text.replace(regex, '<span class="search-highlight">$1</span>');
            
            while (wrapper.firstChild) {
                textNode.parentNode.insertBefore(wrapper.firstChild, textNode);
            }
            textNode.parentNode.removeChild(textNode);
        }
    });
}

/**
 * Update search results display
 */
function updateSearchResults(message) {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.textContent = message;
    }
}

/**
 * Add action buttons to a message element
 */
function addMessageActions(messageElement, messageId, isUserMessage = false) {
    console.log(`🔧 Adding message actions for message ${messageId}, isUser: ${isUserMessage}`);
    
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'message-actions';
    
    if (isUserMessage) {
        const editBtn = document.createElement('button');
        editBtn.className = 'message-action-btn edit-btn';
        editBtn.title = 'Edit message';
        editBtn.innerHTML = '✏️';
        editBtn.addEventListener('click', () => editMessage(messageId));
        actionsContainer.appendChild(editBtn);
    } else {
        // Add feedback buttons for bot messages
        console.log(`👍👎 Adding feedback buttons for bot message ${messageId}`);
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'feedback-buttons';
        
        const thumbsUpBtn = document.createElement('button');
        thumbsUpBtn.className = 'message-action-btn feedback-btn thumbs-up';
        thumbsUpBtn.title = 'Good response';
        thumbsUpBtn.innerHTML = '👍';
        thumbsUpBtn.addEventListener('click', () => submitFeedback(messageId, 'positive'));
        
        const thumbsDownBtn = document.createElement('button');
        thumbsDownBtn.className = 'message-action-btn feedback-btn thumbs-down';
        thumbsDownBtn.title = 'Poor response';
        thumbsDownBtn.innerHTML = '👎';
        thumbsDownBtn.addEventListener('click', () => submitFeedback(messageId, 'negative'));
        
        feedbackContainer.appendChild(thumbsUpBtn);
        feedbackContainer.appendChild(thumbsDownBtn);
        actionsContainer.appendChild(feedbackContainer);
        
        console.log(`✅ Feedback buttons added for message ${messageId}`);
    }
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'message-action-btn delete-btn';
    deleteBtn.title = 'Delete message';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.addEventListener('click', () => deleteMessage(messageId));
    actionsContainer.appendChild(deleteBtn);
    
    messageElement.style.position = 'relative';
    messageElement.appendChild(actionsContainer);
    
    console.log(`🎯 Message actions container added to message ${messageId}`);
}

/**
 * Submit feedback for a bot message
 */
function submitFeedback(messageId, feedbackType) {
    console.log(`🔄 Submitting ${feedbackType} feedback for message ${messageId}`);
    
    fetch('/api/chat/feedback/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': window.CSRF_TOKEN
        },
        body: JSON.stringify({
            message_id: messageId,
            feedback_type: feedbackType
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Feedback submitted successfully');
            showNotification(`Feedback submitted! Thank you for helping improve CipherDepth.`, 'success');
            
            // Update button states
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                const feedbackButtons = messageElement.querySelectorAll('.feedback-btn');
                feedbackButtons.forEach(btn => {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                });
                
                const selectedBtn = messageElement.querySelector(`.${feedbackType === 'positive' ? 'thumbs-up' : 'thumbs-down'}`);
                if (selectedBtn) {
                    selectedBtn.style.opacity = '1';
                    selectedBtn.style.background = feedbackType === 'positive' ? 
                        'linear-gradient(145deg, #10b981, #059669)' : 
                        'linear-gradient(145deg, #ef4444, #dc2626)';
                }
            }
        } else {
            console.error('❌ Error submitting feedback:', data.error);
            showNotification('Error submitting feedback. Please try again.', 'error');
        }
    })
    .catch(error => {
        console.error('❌ Error submitting feedback:', error);
        showNotification('Error submitting feedback. Please check your connection.', 'error');
    });
}

/**
 * Edit message functionality
 */
function editMessage(messageId) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;
    
    const messageText = messageElement.querySelector('.message-text') || messageElement;
    const currentText = messageText.textContent.trim();
    
    // Create edit container
    const editContainer = document.createElement('div');
    editContainer.className = 'message-edit-container';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'message-edit-input';
    textarea.placeholder = 'Edit your message...';
    textarea.value = currentText;
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-edit-actions';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-save-btn';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => saveEditedMessage(messageId));
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => cancelEditMessage(messageId));
    
    actionsDiv.appendChild(saveBtn);
    actionsDiv.appendChild(cancelBtn);
    editContainer.appendChild(textarea);
    editContainer.appendChild(actionsDiv);
    
    // Hide original text and add edit container
    messageText.style.display = 'none';
    messageElement.classList.add('editing');
    messageElement.appendChild(editContainer);
    
    // Focus on textarea
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

/**
 * Save edited message
 */
async function saveEditedMessage(messageId) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;
    
    const editContainer = messageElement.querySelector('.message-edit-container');
    const textarea = editContainer.querySelector('.message-edit-input');
    const newText = textarea.value.trim();
    
    if (!newText) {
        showMessage('Message cannot be empty', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/chat/edit-message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.CSRF_TOKEN
            },
            body: JSON.stringify({
                message_id: messageId,
                new_text: newText
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const messageText = messageElement.querySelector('.message-text') || messageElement;
            messageText.textContent = newText;
            messageText.style.display = '';
            
            // Remove edit container
            messageElement.classList.remove('editing');
            editContainer.remove();
            
            // Remove old linked bot response if it was deleted
            if (data.removed_bot_id) {
                console.log('✏️ Removing old bot response:', data.removed_bot_id);
                const oldBotElement = document.querySelector(`[data-message-id="${data.removed_bot_id}"]`);
                if (oldBotElement) {
                    oldBotElement.style.opacity = '0';
                    oldBotElement.style.transform = 'translateX(-100%)';
                    setTimeout(() => {
                        oldBotElement.remove();
                    }, 300);
                } else {
                    console.log('⚠️ Old bot message element not found for ID:', data.removed_bot_id);
                }
            }
            
            // Add new bot response if provided
            if (data.new_bot_message) {
                console.log('✏️ Adding new bot response:', data.new_bot_message);
                // Show a "generating response" indicator briefly
                const tempIndicator = addMessageToUI('bot', '⏳ Generating new response...', true, 'temp-' + Date.now());
                
                setTimeout(() => {
                    // Remove the temporary indicator
                    if (tempIndicator) {
                        tempIndicator.remove();
                    }
                    // Add the actual new bot response
                    addMessageToUI('bot', data.new_bot_message.content, true, data.new_bot_message.id);
                }, 800); // Slightly longer delay to show the generating indicator
            }
            
            showMessage('Message updated and new response generated successfully', 'success');
        } else {
            showMessage(data.error || 'Failed to update message', 'error');
        }

    } catch (error) {
        console.error('Error updating message:', error);
        showMessage('Error updating message', 'error');
    }
}

/**
 * Cancel message editing
 */
function cancelEditMessage(messageId) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;
    
    const editContainer = messageElement.querySelector('.message-edit-container');
    const messageText = messageElement.querySelector('.message-text') || messageElement;
    
    // Show original text and remove edit container
    messageText.style.display = '';
    messageElement.classList.remove('editing');
    if (editContainer) {
        editContainer.remove();
    }
}

/**
 * Delete message functionality
 */
function deleteMessage(messageId) {
    console.log('🗑️ Attempting to delete message:', messageId);
    messageToDelete = messageId;
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        deleteModal.classList.add('active');
    }
}

/**
 * Confirm message deletion
 */
async function confirmDeleteMessage() {
    if (!messageToDelete) return;
    
    try {
        const response = await fetch('/api/chat/delete-message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.CSRF_TOKEN
            },
            body: JSON.stringify({
                message_id: messageToDelete
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remove all deleted messages from UI (including linked messages)
            const deletedIds = data.deleted_ids || [messageToDelete];
            console.log('🗑️ Deleting message IDs:', deletedIds);
            
            deletedIds.forEach(messageId => {
                const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                if (messageElement) {
                    console.log('🗑️ Removing message element:', messageId);
                    messageElement.style.opacity = '0';
                    messageElement.style.transform = 'translateX(-100%)';
                    setTimeout(() => {
                        messageElement.remove();
                    }, 300);
                } else {
                    console.log('⚠️ Message element not found for ID:', messageId);
                }
            });
            
            const deletedCount = deletedIds.length;
            const message = deletedCount > 1 ? 
                `${deletedCount} linked messages deleted successfully` : 
                'Message deleted successfully';
            showMessage(message, 'success');
        } else {
            showMessage(data.error || 'Failed to delete message', 'error');
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        showMessage('Error deleting message', 'error');
    }
    
    cancelDeleteMessage();
}

/**
 * Cancel message deletion
 */
function cancelDeleteMessage() {
    messageToDelete = null;
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        deleteModal.classList.remove('active');
    }
}

/**
 * Export conversation functionality
 */
async function exportConversation(format) {
    console.log('📤 Starting export with format:', format);
    console.log('📤 Current session ID:', currentSessionId);
    
    if (!currentSessionId) {
        showMessage('No active conversation to export. Please start a chat first.', 'error');
        return;
    }
    
    try {
        console.log('📤 Sending export request...');
        const response = await fetch('/api/chat/export/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.CSRF_TOKEN
            },
            body: JSON.stringify({
                session_id: currentSessionId,
                format: format
            })
        });
        
        console.log('📤 Export response status:', response.status);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-export-${currentSessionId}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showMessage(`Chat exported as ${format.toUpperCase()}`, 'success');
        } else {
            const data = await response.json();
            console.error('📤 Export error:', data);
            showMessage(data.error || 'Failed to export chat', 'error');
        }
    } catch (error) {
        console.error('📤 Export error:', error);
        showMessage('Error exporting chat', 'error');
    }
}

/**
 * Handle new chat creation - IMPROVED: Only prepares UI, doesn't create session
 */
function handleNewChat() {
    console.log('🆕 Starting new chat...');
    
    // Reset current session - session will be created when first message is sent
    currentSessionId = null;
    chatMessages = [];
    
    // Show welcome screen and hide chat area
    showWelcomeScreen();
    
    // Focus on input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.focus();
        chatInput.placeholder = 'Start a new conversation...';
    }
    
    console.log('✅ New chat prepared (session will be created on first message)');
    showNotification('Ready for new conversation', 'info');
}

/**
 * Handle user logout - IMPROVED: Better error handling and confirmation
 */
function handleLogout(event) {
    console.log('👋 Logout button clicked');
    
    // Prevent any default behavior
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Show confirmation
    if (confirm('Are you sure you want to log out?')) {
        // Show loading state
        const logoutBtn = document.getElementById('logoutBtn');
        const originalText = logoutBtn?.innerHTML;
        
        if (logoutBtn) {
            logoutBtn.innerHTML = '<span class="icon">⏳</span><span class="text">Logging out...</span>';
            logoutBtn.disabled = true;
        }
        
        try {
            // Clear local storage
            localStorage.removeItem('sidebarCollapsed');
            localStorage.removeItem('currentSessionId');
            
            // Use the logout URL from Django
            const logoutUrl = window.LOGOUT_URL || '/logout/';
            console.log('🔗 Redirecting to logout URL:', logoutUrl);
            
            // Add a small delay to show the loading state
            setTimeout(() => {
                window.location.href = logoutUrl;
            }, 300);
            
        } catch (error) {
            console.error('❌ Error during logout:', error);
            
            // Reset button state
            if (logoutBtn) {
                logoutBtn.innerHTML = originalText;
                logoutBtn.disabled = false;
            }
            
            // Fallback to manual logout
            showNotification('Logout failed, trying alternative method...', 'warning');
            setTimeout(() => {
                window.location.href = '/logout/';
            }, 1000);
        }
    } else {
        console.log('👋 Logout cancelled by user');
    }
}

/**
 * Handle theme toggle - IMPROVED: Better visual feedback
 */
function handleThemeToggle() {
    console.log('🎨 Toggling theme...');
    
    const body = document.body;
    const themeIcon = document.querySelector('#themeToggle .icon');
    const themeText = document.querySelector('#themeToggle .text');
    
    // Add transition for smooth theme change
    body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    // Toggle theme
    body.classList.toggle('light-mode');
    isLightMode = !isLightMode;
    
    // Update icon and text
    if (isLightMode) {
        if (themeIcon) themeIcon.textContent = '🌙';
        if (themeText) themeText.textContent = 'Dark Mode';
        console.log('🌞 Switched to Light mode');
        showNotification('Light mode activated', 'info');
    } else {
        if (themeIcon) themeIcon.textContent = '☀️';
        if (themeText) themeText.textContent = 'Light Mode';
        console.log('🌙 Switched to Dark mode');
        showNotification('Dark mode activated', 'info');
    }
    
    // Remove transition after change
    setTimeout(() => {
        body.style.transition = '';
    }, 300);
}

/**
 * Handle history view - IMPROVED: Better feedback and error handling
 */
function handleHistoryView() {
    console.log('📄 Viewing chat history...');
    
    const historyContainer = document.getElementById('chatHistoryContainer');
    if (historyContainer) {
        // Toggle visibility
        const isHidden = historyContainer.classList.contains('hidden');
        
        if (isHidden) {
            historyContainer.classList.remove('hidden');
            refreshChatHistory();
            showNotification('Chat history loaded', 'success');
        } else {
            historyContainer.classList.add('hidden');
            showNotification('Chat history hidden', 'info');
        }
        
        // Update button state
        updateSidebarActiveState(isHidden ? 'historyBtn' : 'newChatBtn');
    }
}

/**
 * Handle sidebar toggle - IMPROVED: Better responsive behavior for all devices
 */
function handleSidebarToggle() {
    console.log('🔲 Toggling sidebar...');
    
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar) {
        console.error('❌ Sidebar element not found');
        return;
    }
    
    // Toggle collapsed state
    isSidebarCollapsed = !isSidebarCollapsed;
    
    // Apply appropriate behavior based on screen size
    if (window.innerWidth <= 1024) {
        // Mobile/Tablet: slide in/out with overlay
        if (isSidebarCollapsed) {
            sidebar.classList.add('collapsed');
            if (overlay) overlay.classList.remove('active');
        } else {
            sidebar.classList.remove('collapsed');
            if (overlay) overlay.classList.add('active');
        }
    } else {
        // Desktop: collapse/expand in place, no overlay
        if (isSidebarCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
        // Always ensure overlay is hidden on desktop
        if (overlay) overlay.classList.remove('active');
        
        // Save state for desktop
        localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());
    }
    
    // Update toggle icon
    updateSidebarToggleIcon();
    
    console.log(`📱 Sidebar ${isSidebarCollapsed ? 'collapsed' : 'expanded'} (${window.innerWidth <= 1024 ? 'mobile/tablet' : 'desktop'})`);
}

/**
 * Update sidebar toggle icon based on state and device type
 */
function updateSidebarToggleIcon() {
    const toggleIcon = document.querySelector('#sidebarToggle .icon');
    if (toggleIcon) {
        if (window.innerWidth <= 1024) {
            // Mobile/Tablet: show hamburger when collapsed, X when expanded
            toggleIcon.textContent = isSidebarCollapsed ? '☰' : '✕';
        } else {
            // Desktop: show appropriate collapse/expand icon
            toggleIcon.textContent = isSidebarCollapsed ? '▶' : '◀';
        }
    }
}

/**
 * Handle sending a message - IMPROVED: Only creates session when needed
 */
function handleSendMessage(event) {
    console.log('💬 Send button clicked');
    
    // Prevent any default behavior
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (!chatInput) {
        console.error('❌ Chat input element not found');
        return;
    }
    
    if (!sendBtn) {
        console.error('❌ Send button element not found');
        return;
    }
    
    const message = chatInput.value?.trim();
    
    if (!message) {
        console.log('⚠️ Empty message, ignoring send');
        chatInput.focus();
        return;
    }
    
    console.log('💬 Sending message:', message);
    
    // Clear input immediately
    chatInput.value = '';
    chatInput.placeholder = 'Type your message...';
    
    // Show chat area and hide welcome screen
    showChatArea();
    
    // Send message to API first, then add to UI with proper IDs
    sendMessageToAPI(message);
    
    // Focus back on input
    chatInput?.focus();
}

/**
 * Handle loading a specific chat session
 */
function handleLoadChatSession(sessionId) {
    console.log(`💬 Loading chat session: ${sessionId}`);
    
    if (!sessionId) {
        console.error('❌ No session ID provided');
        return;
    }
    
    // Update current session
    currentSessionId = sessionId;
    
    // Load chat history for this session
    const url = `${window.CHAT_HISTORY_URL}?session_id=${sessionId}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`✅ Loaded chat session: ${data.session.title}`);
                
                // Show chat area
                showChatArea();
                
                // Clear and populate messages
                const messagesContainer = document.getElementById('messagesContainer');
                if (messagesContainer) {
                    messagesContainer.innerHTML = '';
                    
                    data.messages.forEach(msg => {
                        addMessageToUI(msg.type, msg.content, false, msg.id);
                    });
                }
                
                // Update sidebar active state
                updateSidebarActiveState(null, sessionId);
                
                // Update input placeholder
                const chatInput = document.getElementById('chatInput');
                if (chatInput) {
                    chatInput.placeholder = 'Continue the conversation...';
                }
                
                showNotification(`Loaded: ${data.session.title}`, 'success');
            } else {
                console.error('❌ Failed to load chat session');
                showNotification('Failed to load chat session', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error loading chat session:', error);
            showNotification('Error loading chat session', 'error');
        });
}

/**
 * Handle deleting a chat session - IMPROVED: Better animation and feedback
 */
function handleDeleteChatSession(sessionId) {
    console.log(`🗑️ Deleting chat session: ${sessionId}`);
    
    if (!sessionId) {
        console.error('❌ No session ID provided');
        return;
    }
    
    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
        return;
    }
    
    // Show loading state on delete button
    const deleteBtn = document.querySelector(`button[data-session-id="${sessionId}"].chat-delete-btn`);
    if (deleteBtn) {
        deleteBtn.innerHTML = '<span class="icon">⏳</span>';
        deleteBtn.disabled = true;
    }
    
    // Create delete endpoint URL
    const url = window.DELETE_CHAT_URL;
    
    // Send delete request
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': window.CSRF_TOKEN
        },
        body: JSON.stringify({
            session_id: sessionId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(`✅ Chat session deleted: ${sessionId}`);
            
            // Remove from UI with animation
            const chatWrapper = document.querySelector(`button[data-session-id="${sessionId}"]`)?.closest('.chat-item-wrapper');
            if (chatWrapper) {
                chatWrapper.style.opacity = '0';
                chatWrapper.style.transform = 'translateX(-100%)';
                setTimeout(() => {
                    chatWrapper.remove();
                    // Refresh history to ensure consistency
                    refreshChatHistory();
                }, 300);
            } else {
                // If we can't find the wrapper, just refresh the entire history
                refreshChatHistory();
            }
            
            // If this was the current session, reset to welcome screen
            if (currentSessionId === sessionId) {
                currentSessionId = null;
                showWelcomeScreen();
            }
            
            showNotification('Chat session deleted', 'success');
        } else {
            console.error('❌ Failed to delete chat session:', data.error);
            showNotification(data.error || 'Failed to delete chat session', 'error');
            
            // Reset delete button
            if (deleteBtn) {
                deleteBtn.innerHTML = '<span class="icon">✕</span>';
                deleteBtn.disabled = false;
            }
        }
    })
    .catch(error => {
        console.error('❌ Error deleting chat session:', error);
        showNotification('Error deleting chat session', 'error');
        
        // Reset delete button
        if (deleteBtn) {
            deleteBtn.innerHTML = '<span class="icon">✕</span>';
            deleteBtn.disabled = false;
        }
    });
}

/**
 * Show chat area and hide welcome screen
 */
function showChatArea() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const chatArea = document.getElementById('chatArea');
    
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
        welcomeScreen.classList.add('hidden');
    }
    
    if (chatArea) {
        chatArea.classList.remove('hidden');
        chatArea.style.display = 'block';
    }
}

/**
 * Show welcome screen and hide chat area
 */
function showWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const chatArea = document.getElementById('chatArea');
    const messagesContainer = document.getElementById('messagesContainer');
    
    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
        welcomeScreen.classList.remove('hidden');
    }
    
    if (chatArea) {
        chatArea.classList.add('hidden');
    }
    
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
    }
    
    // Clear chat input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value = '';
        chatInput.focus();
    }
    
    // Update sidebar active state
    updateSidebarActiveState('newChatBtn');
}

/**
 * Add message to UI
 */
function addMessageToUI(type, content, animate = true, messageId = null) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    // Generate message ID if not provided
    if (!messageId) {
        messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    messageDiv.setAttribute('data-message-id', messageId);
    
    if (animate) {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
    }
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-text">${escapeHtml(content)}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    
    // Add message actions (edit for user messages, delete for all)
    addMessageActions(messageDiv, messageId, type === 'user');
    
    // Animate message appearance
    if (animate) {
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        });
    }
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageDiv;
}

/**
 * Send message to API
 */
function sendMessageToAPI(message) {
    const apiUrl = window.API_BASE || '/api/chat/';
    
    console.log('🔗 Sending to API URL:', apiUrl);
    console.log('💬 Message:', message);
    console.log('🔑 Session ID:', currentSessionId);
    console.log('🛡️ CSRF Token:', window.CSRF_TOKEN ? 'Present' : 'Missing');
    
    const payload = {
        message: message,
        session_id: currentSessionId
    };
    
    console.log('📦 Payload:', payload);
    
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': window.CSRF_TOKEN || ''
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('📥 Response data:', data);
        
        if (data.success) {
            console.log('✅ Message sent successfully');
            
            // Update session ID if new session was created
            if (data.session_id) {
                const wasNewSession = !currentSessionId;
                currentSessionId = data.session_id;
                
                // If this was a new session, refresh the chat history
                if (wasNewSession) {
                    setTimeout(() => refreshChatHistory(), 500);
                }
            }
            
            // Add user message to UI with proper ID from backend
            if (data.user_message) {
                addMessageToUI('user', data.user_message.content, true, data.user_message.id);
            }
            
            // Add bot response to UI with proper ID from backend
            if (data.bot_message) {
                setTimeout(() => {
                    addMessageToUI('bot', data.bot_message.content, true, data.bot_message.id);
                }, 500); // Small delay for better UX
            }
        } else {
            console.error('❌ Failed to send message:', data.error);
            showNotification(data.error || 'Failed to send message', 'error');
        }
    })
    .catch(error => {
        console.error('❌ Error sending message:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack
        });
        showNotification('Error sending message: ' + error.message, 'error');
    });
}

/**
 * Refresh the chat history in the sidebar
 */
function refreshChatHistory() {
    console.log('🔄 Refreshing chat history...');
    
    fetch(window.CHAT_HISTORY_URL)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSidebarHistory(data.sessions);
                console.log('✅ Chat history refreshed');
            } else {
                console.error('❌ Failed to refresh chat history');
            }
        })
        .catch(error => {
            console.error('❌ Error refreshing chat history:', error);
        });
}

/**
 * Update the sidebar history with new data
 */
function updateSidebarHistory(sessions) {
    const historyContainer = document.getElementById('chatHistoryContainer');
    if (!historyContainer) return;
    
    const scrollContainer = historyContainer.querySelector('.chat-history-scroll');
    if (!scrollContainer) return;
    
    // Clear existing chat items but keep the "No chats" message structure
    const existingItems = scrollContainer.querySelectorAll('.chat-item-wrapper');
    existingItems.forEach(item => item.remove());
    
    // Remove existing "no-chats" message
    const noChatsMsg = scrollContainer.querySelector('.no-chats');
    if (noChatsMsg) {
        noChatsMsg.remove();
    }
    
    if (sessions && sessions.length > 0) {
        // Add new chat items
        sessions.forEach(session => {
            const wrapper = document.createElement('div');
            wrapper.className = 'chat-item-wrapper';
            
            const chatItem = document.createElement('button');
            chatItem.className = 'chat-item';
            chatItem.setAttribute('data-session-id', session.id);
            
            const icon = document.createElement('span');
            icon.className = 'icon';
            icon.textContent = '💬';
            
            const title = document.createElement('span');
            title.className = 'chat-title';
            title.textContent = session.title.length > 25 ? session.title.substring(0, 25) + '...' : session.title;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'chat-delete-btn';
            deleteBtn.setAttribute('data-session-id', session.id);
            deleteBtn.setAttribute('title', 'Delete this chat');
            deleteBtn.innerHTML = '<span class="icon">✕</span>';
            
            chatItem.appendChild(icon);
            chatItem.appendChild(title);
            wrapper.appendChild(chatItem);
            wrapper.appendChild(deleteBtn);
            
            scrollContainer.appendChild(wrapper);
            
            // Add event listeners
            chatItem.addEventListener('click', function() {
                const sessionId = this.getAttribute('data-session-id');
                handleLoadChatSession(sessionId);
            });
            
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const sessionId = this.getAttribute('data-session-id');
                handleDeleteChatSession(sessionId);
            });
        });
        
        // Show the history container
        historyContainer.classList.remove('hidden');
    } else {
        // Show "no chats" message
        const noChatsMsg = document.createElement('p');
        noChatsMsg.className = 'no-chats';
        noChatsMsg.textContent = 'No chat history yet. Start a conversation!';
        scrollContainer.appendChild(noChatsMsg);
    }
}

/**
 * Update sidebar active state
 */
function updateSidebarActiveState(activeButtonId, activeSessionId = null) {
    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Remove active class from all chat items
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to specified button
    if (activeButtonId) {
        const activeButton = document.getElementById(activeButtonId);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
    
    // Add active class to specified chat session
    if (activeSessionId) {
        const activeSession = document.querySelector(`[data-session-id="${activeSessionId}"]`);
        if (activeSession) {
            activeSession.classList.add('active');
        }
    }
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.cursor = 'pointer';
    
    // Add to messages container
    let messagesContainer = document.querySelector('.messages');
    if (!messagesContainer) {
        messagesContainer = document.createElement('div');
        messagesContainer.className = 'messages';
        document.body.appendChild(messagesContainer);
    }
    
    messagesContainer.appendChild(notification);
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 4000);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

/**
 * Auto-hide existing Django messages
 */
function autoHideMessages() {
    const existingMessages = document.querySelectorAll('.messages .alert');
    existingMessages.forEach(msg => {
        // Add click to dismiss
        msg.addEventListener('click', () => {
            msg.style.opacity = '0';
            msg.style.transform = 'translateX(100%)';
            setTimeout(() => {
                msg.remove();
            }, 300);
        });
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (msg.parentNode) {
                msg.style.opacity = '0';
                msg.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    msg.remove();
                }, 300);
            }
        }, 5000);
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show message using notification system
 */
function showMessage(message, type = 'info') {
    showNotification(message, type);
}

/**
 * Debug function - log current state
 */
function logDebugInfo() {
    console.log('🔍 Debug Info:', {
        currentSessionId,
        messageCount: chatMessages.length,
        isLightMode,
        searchActive,
        apiEndpoints: {
            chat: window.API_BASE,
            history: window.CHAT_HISTORY_URL,
            logout: window.LOGOUT_URL
        }
    });
}

/**
 * Test function for debugging search functionality
 */
function testSearchFunction() {
    console.log('🧪 Testing search functionality...');
    console.log('Current searchActive:', searchActive);
    const searchBtn = document.getElementById('searchBtn');
    const searchContainer = document.getElementById('searchContainer');
    
    if (searchBtn) {
        console.log('✅ Search button found');
        searchBtn.click();
    } else {
        console.log('❌ Search button not found');
    }
    
    if (searchContainer) {
        console.log('✅ Search container found, classes:', searchContainer.classList.toString());
    } else {
        console.log('❌ Search container not found');
    }
}

// Expose useful functions globally for debugging
window.cipherDebug = logDebugInfo;
window.testSearchFunction = testSearchFunction;
window.toggleSearch = toggleSearch;
window.handleSearchClick = handleSearchClick;
