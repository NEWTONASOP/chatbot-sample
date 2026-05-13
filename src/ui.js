// UI component builders for the chatbot
import { sanitizeHTML, parseMarkdown, formatTimestamp, extractTags, generateId, copyToClipboard, showToast } from './utils.js';
import { CONFIG } from './config.js';

/**
 * Create message element
 */
export function createMessage(sender, text, timestamp = new Date()) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.dataset.messageId = generateId();
  messageDiv.setAttribute('role', 'article');
  messageDiv.setAttribute('aria-label', `${sender === 'bot' ? 'Assistant' : 'User'} message`);

  const avatarDiv = createAvatar(sender);
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'message-wrapper';

  const tags = extractTags(text);
  const contentDiv = createMessageContent(tags.cleanText, sender);

  contentWrapper.appendChild(contentDiv);

  // Add timestamp if enabled
  if (CONFIG.ENABLE_TIMESTAMPS) {
    const timestampDiv = createTimestamp(timestamp);
    contentWrapper.appendChild(timestampDiv);
  }

  // Add copy button for bot messages if enabled
  if (CONFIG.ENABLE_MESSAGE_COPY && sender === 'bot') {
    const copyBtn = createCopyButton(tags.cleanText);
    contentWrapper.appendChild(copyBtn);
  }

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentWrapper);

  // Add image carousels
  if (tags.imageDestinations.length > 0) {
    tags.imageDestinations.forEach(item => {
      const carousel = createImageCarousel(item.dest, item.urls);
      contentDiv.appendChild(carousel);
    });
  }

  // Add calendar widget
  if (tags.hasCalendar) {
    const calendar = createCalendarWidget();
    contentDiv.appendChild(calendar);
  }

  return messageDiv;
}

/**
 * Create avatar element
 */
function createAvatar(sender) {
  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'message-avatar';
  avatarDiv.setAttribute('aria-hidden', 'true');

  if (sender === 'bot') {
    avatarDiv.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="12" cy="5" r="3"/>
    </svg>`;
  } else {
    avatarDiv.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`;
  }

  return avatarDiv;
}

/**
 * Create message content
 */
function createMessageContent(text, sender) {
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  let formattedText = sanitizeHTML(text.trim());
  formattedText = parseMarkdown(formattedText);

  contentDiv.style.whiteSpace = 'pre-wrap';
  contentDiv.innerHTML = formattedText;

  return contentDiv;
}

/**
 * Create timestamp element
 */
function createTimestamp(date) {
  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'message-timestamp';
  timestampDiv.textContent = formatTimestamp(date);
  timestampDiv.setAttribute('aria-label', `Sent at ${date.toLocaleTimeString()}`);
  
  // Update timestamp every minute
  setInterval(() => {
    timestampDiv.textContent = formatTimestamp(date);
  }, 60000);
  
  return timestampDiv;
}

/**
 * Create copy button
 */
function createCopyButton(text) {
  const copyBtn = document.createElement('button');
  copyBtn.className = 'message-copy-btn';
  copyBtn.setAttribute('aria-label', 'Copy message');
  copyBtn.title = 'Copy message';
  copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>`;

  copyBtn.onclick = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`;
      showToast('Message copied!', 'success');
      setTimeout(() => {
        copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>`;
      }, 2000);
    } else {
      showToast('Failed to copy', 'error');
    }
  };

  return copyBtn;
}

/**
 * Create image carousel
 */
function createImageCarousel(destination, urls) {
  const carouselWrapper = document.createElement('div');
  carouselWrapper.className = 'image-carousel-wrapper';

  const destLabel = document.createElement('div');
  destLabel.className = 'carousel-label';
  destLabel.textContent = `📍 Views from ${destination}`;
  carouselWrapper.appendChild(destLabel);

  const imagesContainer = document.createElement('div');
  imagesContainer.className = 'image-carousel';
  imagesContainer.setAttribute('role', 'region');
  imagesContainer.setAttribute('aria-label', `Images of ${destination}`);

  if (urls && urls.length > 0) {
    urls.forEach((url, index) => {
      const imgWrapper = createImageWithLoader(url, `${destination} view ${index + 1}`);
      imagesContainer.appendChild(imgWrapper);
    });
  } else {
    // Fallback to placeholder images
    const categories = ['landscape', 'city', 'view'];
    categories.forEach((cat, index) => {
      const url = `https://loremflickr.com/400/300/${encodeURIComponent(destination)},${cat}?lock=${Math.floor(Math.random() * 1000) + index}`;
      const imgWrapper = createImageWithLoader(url, `${destination} ${cat}`);
      imagesContainer.appendChild(imgWrapper);
    });
  }

  carouselWrapper.appendChild(imagesContainer);
  return carouselWrapper;
}

/**
 * Create image with loading state
 */
function createImageWithLoader(url, alt) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-img-wrapper';

  const loader = document.createElement('div');
  loader.className = 'carousel-img-loader';
  wrapper.appendChild(loader);

  const img = document.createElement('img');
  img.className = 'carousel-img';
  img.alt = alt;
  img.loading = 'lazy';

  img.onload = () => {
    loader.style.display = 'none';
    img.style.opacity = '1';
  };

  img.onerror = () => {
    loader.style.display = 'none';
    wrapper.innerHTML = '<div class="carousel-img-error">Failed to load</div>';
  };

  img.src = url;
  wrapper.appendChild(img);

  return wrapper;
}

/**
 * Create calendar widget
 */
function createCalendarWidget() {
  const calContainer = document.createElement('div');
  calContainer.className = 'calendar-container';
  calContainer.setAttribute('role', 'region');
  calContainer.setAttribute('aria-label', 'Meeting scheduler');

  const calId = 'cal-' + Date.now();
  const calInner = document.createElement('div');
  calInner.id = calId;
  calInner.className = 'calendar-inner';

  calContainer.appendChild(calInner);

  // Initialize Cal.com widget
  setTimeout(() => {
    if (window.Cal) {
      try {
        const calAPI = window.Cal.ns['chatbot-meeting'] || window.Cal;
        calAPI('inline', {
          elementOrSelector: `#${calId}`,
          calLink: CONFIG.CALCOM_USERNAME,
          layout: 'month_view',
          config: { layout: 'month_view', theme: 'dark' },
        });
      } catch (error) {
        console.error('Failed to initialize calendar:', error);
        calInner.innerHTML = '<div class="calendar-error">Failed to load calendar. Please try again later.</div>';
      }
    } else {
      calInner.innerHTML = '<div class="calendar-error">Calendar widget not available.</div>';
    }
  }, 100);

  return calContainer;
}

/**
 * Create typing indicator
 */
export function createTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot typing-indicator';
  typingDiv.id = 'typing-indicator';
  typingDiv.setAttribute('role', 'status');
  typingDiv.setAttribute('aria-label', 'Assistant is typing');

  typingDiv.innerHTML = `
    <div class="message-avatar" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="10" rx="2"/>
        <circle cx="12" cy="5" r="3"/>
      </svg>
    </div>
    <div class="message-wrapper">
      <div class="message-content">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;

  return typingDiv;
}

/**
 * Create quick reply buttons
 */
export function createQuickReplies(replies, onClickHandler) {
  const quickRepliesDiv = document.createElement('div');
  quickRepliesDiv.className = 'quick-replies';
  quickRepliesDiv.setAttribute('role', 'group');
  quickRepliesDiv.setAttribute('aria-label', 'Quick reply options');

  replies.forEach((reply, index) => {
    const btn = document.createElement('button');
    btn.className = 'quick-reply-btn';
    btn.textContent = reply;
    btn.setAttribute('aria-label', `Quick reply: ${reply}`);
    btn.style.animationDelay = `${index * 0.1}s`;
    
    btn.onclick = () => {
      onClickHandler(reply);
      quickRepliesDiv.remove();
    };
    
    quickRepliesDiv.appendChild(btn);
  });

  return quickRepliesDiv;
}

/**
 * Create offline indicator
 */
export function createOfflineIndicator() {
  const offlineDiv = document.createElement('div');
  offlineDiv.className = 'offline-indicator';
  offlineDiv.id = 'offline-indicator';
  offlineDiv.setAttribute('role', 'alert');
  offlineDiv.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
    <span>You're offline. Messages will be sent when you reconnect.</span>
  `;
  return offlineDiv;
}

/**
 * Create retry button for failed messages
 */
export function createRetryButton(onRetry) {
  const retryBtn = document.createElement('button');
  retryBtn.className = 'message-retry-btn';
  retryBtn.setAttribute('aria-label', 'Retry sending message');
  retryBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
    Retry
  `;
  retryBtn.onclick = onRetry;
  return retryBtn;
}
