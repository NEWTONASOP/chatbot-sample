// Utility functions for the chatbot

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parse basic markdown (bold only)
 */
export function parseMarkdown(text) {
  return text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Debounce function to limit rapid calls
 */
export function debounce(func, wait) {
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
 * Check if user is online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Extract special tags from AI response
 */
export function extractTags(text) {
  const tags = {
    hasCalendar: false,
    imageDestinations: [],
    cleanText: text,
  };

  // Extract calendar tag
  if (text.includes('[SHOW_CALENDAR]')) {
    tags.hasCalendar = true;
    tags.cleanText = tags.cleanText.replace('[SHOW_CALENDAR]', '').trim();
  }

  // Extract image tags with URLs
  const imageRegexWithUrls = /\[SHOW_IMAGES:(.*?)\|(.*?)\]/g;
  let match;
  while ((match = imageRegexWithUrls.exec(text)) !== null) {
    tags.imageDestinations.push({
      dest: match[1],
      urls: match[2].split(','),
    });
  }
  tags.cleanText = tags.cleanText.replace(imageRegexWithUrls, '').trim();

  // Extract image tags without URLs (fallback)
  const imageRegexFallback = /\[SHOW_IMAGES:(.*?)\]/g;
  while ((match = imageRegexFallback.exec(tags.cleanText)) !== null) {
    tags.imageDestinations.push({
      dest: match[1],
      urls: [],
    });
  }
  tags.cleanText = tags.cleanText.replace(imageRegexFallback, '').trim();

  return tags;
}

/**
 * Generate unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
