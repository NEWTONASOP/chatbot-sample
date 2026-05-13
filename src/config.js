// Configuration for the chatbot
export const CONFIG = {
  // API endpoints (now proxied through Cloudflare Workers for security)
  NVIDIA_API_URL: '/v1/nvidia/chat/completions',
  PEXELS_API_URL: '/v1/pexels/search',
  CALCOM_SLOTS_URL: '/v1/calcom/slots',
  CALCOM_BOOKINGS_URL: '/v1/calcom/bookings',
  
  // Model configuration
  NVIDIA_MODEL: 'mistralai/ministral-14b-instruct-2512',
  
  // Cal.com configuration
  CALCOM_USERNAME: 'Deteroid/deteroid-meeting',
  
  // Contact information
  CONTACT_PHONE: '+91 88510 86716',
  
  // AI configuration
  AI_TEMPERATURE: 0.15,
  AI_MAX_TOKENS: 2048,
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
