// Main chatbot controller
import { CONFIG } from './config.js';
import { isOnline, showToast, debounce } from './utils.js';
import { 
  createMessage, 
  createTypingIndicator, 
  createQuickReplies, 
  createOfflineIndicator,
  createRetryButton 
} from './ui.js';
import { 
  getAIResponse, 
  getWelcomeMessage, 
  getInitialQuickReplies, 
  getFallbackMessage 
} from './ai-service.js';

// State management
class ChatbotState {
  constructor() {
    this.chatHistory = [];
    this.isTyping = false;
    this.typingTimeout = null;
    this.pendingMessage = null;
    this.isOnline = navigator.onLine;
  }

  reset() {
    this.chatHistory = [];
    this.isTyping = false;
    this.clearTypingTimeout();
    this.pendingMessage = null;
  }

  setTyping(value) {
    this.isTyping = value;
    if (value) {
      this.startTypingTimeout();
    } else {
      this.clearTypingTimeout();
    }
  }

  startTypingTimeout() {
    this.clearTypingTimeout();
    this.typingTimeout = setTimeout(() => {
      if (this.isTyping) {
        hideTypingIndicator();
        this.isTyping = false;
        showToast('Response timed out. Please try again.', 'error');
      }
    }, CONFIG.TYPING_INDICATOR_TIMEOUT);
  }

  clearTypingTimeout() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  setOnlineStatus(status) {
    this.isOnline = status;
  }
}

const state = new ChatbotState();

// DOM elements
let chatbotWindow;
let chatbotMessages;
let chatbotInput;
let chatbotForm;
let chatbotSendBtn;
let chatbotClearBtn;

/**
 * Initialize chatbot
 */
export function initChatbot() {
  // Get DOM elements
  chatbotWindow = document.getElementById('chatbotWindow');
  chatbotMessages = document.getElementById('chatbotMessages');
  chatbotInput = document.getElementById('chatbotInput');
  chatbotForm = document.getElementById('chatbotForm');
  chatbotSendBtn = document.getElementById('chatbotSendBtn');
  chatbotClearBtn = document.getElementById('chatbotClearBtn');

  // Add welcome message
  const welcomeMessage = getWelcomeMessage();
  addMessage('bot', welcomeMessage);

  // Show initial quick replies
  setTimeout(() => {
    const quickReplies = getInitialQuickReplies();
    showQuickReplies(quickReplies);
  }, 500);

  // Setup event listeners
  setupEventListeners();

  // Setup online/offline detection
  if (CONFIG.ENABLE_OFFLINE_DETECTION) {
    setupOfflineDetection();
  }

  // Setup accessibility features
  if (CONFIG.ENABLE_ACCESSIBILITY) {
    setupAccessibility();
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Form submit
  chatbotForm.addEventListener('submit', handleChatSubmit);

  // Input changes
  chatbotInput.addEventListener('input', handleInputChange);

  // Enter key
  chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(e);
    }
  });

  // Clear button
  if (chatbotClearBtn) {
    chatbotClearBtn.addEventListener('click', handleClearChat);
  }

  // Close button
  const closeBtn = document.querySelector('.chatbot-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeChatbot);
  }
}

/**
 * Setup offline detection
 */
function setupOfflineDetection() {
  window.addEventListener('online', () => {
    state.setOnlineStatus(true);
    const offlineIndicator = document.getElementById('offline-indicator');
    if (offlineIndicator) {
      offlineIndicator.remove();
    }
    showToast('You\'re back online!', 'success');

    // Retry pending message if exists
    if (state.pendingMessage) {
      const message = state.pendingMessage;
      state.pendingMessage = null;
      getBotResponse(message);
    }
  });

  window.addEventListener('offline', () => {
    state.setOnlineStatus(false);
    const offlineIndicator = createOfflineIndicator();
    chatbotMessages.appendChild(offlineIndicator);
    scrollToBottom();
    showToast('You\'re offline', 'warning');
  });
}

/**
 * Setup accessibility features
 */
function setupAccessibility() {
  // Add keyboard navigation for quick replies
  chatbotMessages.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('quick-reply-btn')) {
      if (e.key === 'ArrowRight') {
        const next = e.target.nextElementSibling;
        if (next) next.focus();
      } else if (e.key === 'ArrowLeft') {
        const prev = e.target.previousElementSibling;
        if (prev) prev.focus();
      }
    }
  });

  // Announce new messages to screen readers
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.classList && node.classList.contains('message')) {
          const liveRegion = document.getElementById('chat-live-region');
          if (liveRegion) {
            const sender = node.classList.contains('bot') ? 'Assistant' : 'You';
            const content = node.querySelector('.message-content')?.textContent || '';
            liveRegion.textContent = `${sender}: ${content}`;
          }
        }
      });
    });
  });

  observer.observe(chatbotMessages, { childList: true });
}

/**
 * Handle input changes
 */
function handleInputChange(e) {
  chatbotSendBtn.disabled = e.target.value.trim() === '' || state.isTyping;
}

/**
 * Handle form submit
 */
function handleChatSubmit(e) {
  e.preventDefault();

  const message = chatbotInput.value.trim();
  if (!message || state.isTyping) return;

  // Check if online
  if (!state.isOnline) {
    showToast('You\'re offline. Please check your connection.', 'error');
    state.pendingMessage = message;
    return;
  }

  // Add user message
  addMessage('user', message);

  // Clear input
  chatbotInput.value = '';
  chatbotSendBtn.disabled = true;

  // Get bot response
  getBotResponse(message);
}

/**
 * Handle clear chat
 */
function handleClearChat() {
  if (state.isTyping) {
    showToast('Please wait for the current response to complete', 'warning');
    return;
  }

  if (confirm('Are you sure you want to clear the chat history?')) {
    state.reset();
    chatbotMessages.innerHTML = '';
    initChatbot();
    showToast('Chat cleared', 'success');
  }
}

/**
 * Close chatbot
 */
export function closeChatbot() {
  if (chatbotWindow) {
    chatbotWindow.style.display = 'none';
  }
}

/**
 * Add message to chat
 */
function addMessage(sender, text, timestamp = new Date()) {
  const messageDiv = createMessage(sender, text, timestamp);
  chatbotMessages.appendChild(messageDiv);

  if (sender === 'user') {
    setTimeout(scrollToBottom, CONFIG.MESSAGE_ANIMATION_DELAY);
  }

  return messageDiv;
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
  state.setTyping(true);
  const typingDiv = createTypingIndicator();
  chatbotMessages.appendChild(typingDiv);
  scrollToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
  state.setTyping(false);
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

/**
 * Show quick reply buttons
 */
function showQuickReplies(replies) {
  if (!replies || replies.length === 0) return;

  const quickRepliesDiv = createQuickReplies(replies, handleQuickReply);
  chatbotMessages.appendChild(quickRepliesDiv);
  scrollToBottom();
}

/**
 * Handle quick reply click
 */
function handleQuickReply(text) {
  addMessage('user', text);
  getBotResponse(text);
}

/**
 * Scroll to bottom of messages
 */
function scrollToBottom() {
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

/**
 * Smart scroll - scroll to message or bottom based on content
 */
function smartScroll(messageDiv) {
  setTimeout(() => {
    if (messageDiv && messageDiv.offsetHeight > chatbotMessages.clientHeight - 80) {
      // Long message: Scroll to the top of the message
      chatbotMessages.scrollTo({
        top: messageDiv.offsetTop - 20,
        behavior: 'smooth',
      });
    } else {
      // Short message: Scroll to bottom
      scrollToBottom();
    }
  }, CONFIG.SCROLL_DELAY);
}

/**
 * Get bot response
 */
async function getBotResponse(userMessage) {
  showTypingIndicator();

  try {
    const result = await getAIResponse(userMessage, state.chatHistory);
    
    hideTypingIndicator();
    const botMessageDiv = addMessage('bot', result.response);

    // Show contextual quick replies
    if (result.quickReplies && result.quickReplies.length > 0) {
      setTimeout(() => {
        showQuickReplies(result.quickReplies);
      }, CONFIG.QUICK_REPLY_DELAY);
    }

    // Smart scroll
    smartScroll(botMessageDiv);

  } catch (error) {
    console.error('Error getting bot response:', error);
    hideTypingIndicator();

    const fallbackMessage = getFallbackMessage();
    const errorMessageDiv = addMessage('bot', fallbackMessage);

    // Add retry button
    const retryBtn = createRetryButton(() => {
      retryBtn.remove();
      getBotResponse(userMessage);
    });
    errorMessageDiv.querySelector('.message-wrapper').appendChild(retryBtn);

    scrollToBottom();
    showToast('Failed to get response. Click retry to try again.', 'error');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initChatbot();
});

// Export for global access (needed for HTML onclick handlers)
window.closeChatbot = closeChatbot;
window.handleChatSubmit = handleChatSubmit;
