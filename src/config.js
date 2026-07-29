// Configuration for the chatbot
export const CONFIG = {
  // API endpoints (now proxied through Cloudflare Workers for security)
  AI_API_URL: '/v1/requesty/chat/completions',
  PEXELS_API_URL: '/v1/pexels/search',
  CALCOM_SLOTS_URL: '/v1/calcom/slots',
  CALCOM_BOOKINGS_URL: '/v1/calcom/bookings',

  // Model configuration
  // Prefer a Requesty free-tier model.
  // If it isn't available (or if a wrong model name is used), the Worker will auto-retry with a valid free model.
  AI_MODEL: 'google/gemma-4-31b-it',
  AI_MAX_RETRIES: 2,
  // Keep the prompt small to reduce latency and cost.
  MAX_CHAT_HISTORY_MESSAGES: 12,

  // Cal.com configuration
  CALCOM_USERNAME: 'Deteroid/deteroid-meeting',

  // Contact information
  CONTACT_PHONE: '+91 88510 86716',

  // AI configuration
  AI_TEMPERATURE: 1,
  // Lower max tokens to reduce latency.
  AI_MAX_TOKENS: 512,
  AI_TOP_P: 1,

  // UI configuration
  TYPING_INDICATOR_TIMEOUT: 30000, // 30 seconds
  MESSAGE_ANIMATION_DELAY: 50,
  QUICK_REPLY_DELAY: 300,
  SCROLL_DELAY: 400,

  // Feature flags
  ENABLE_TIMESTAMPS: true,
  ENABLE_MESSAGE_COPY: true,
  ENABLE_OFFLINE_DETECTION: true,
  ENABLE_ACCESSIBILITY: true,
};
