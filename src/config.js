// Configuration for the chatbot
export const CONFIG = {
  // API endpoints (now proxied through Cloudflare Workers for security)
  GROQ_API_URL: '/v1/groq/chat/completions',
  PEXELS_API_URL: '/v1/pexels/search',
  CALCOM_SLOTS_URL: '/v1/calcom/slots',
  CALCOM_BOOKINGS_URL: '/v1/calcom/bookings',
  
  // Model configuration
  GROQ_MODEL: 'llama-3.3-70b-versatile', // Alternative: 'llama-3.1-70b-versatile' or 'mixtral-8x7b-32768'
  
  // Cal.com configuration
  CALCOM_USERNAME: 'Deteroid/deteroid-meeting',
  
  // Contact information
  CONTACT_PHONE: '+91 88510 86716',
  
  // AI configuration
  AI_TEMPERATURE: 1,
  AI_MAX_TOKENS: 1024,
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
