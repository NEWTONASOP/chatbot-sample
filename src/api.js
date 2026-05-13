// API service layer for all external calls
import { CONFIG } from './config.js';
import { retryWithBackoff } from './utils.js';

/**
 * Call NVIDIA AI API
 */
export async function callNvidiaAPI(messages, tools = null, toolChoice = 'auto') {
  const response = await fetch(CONFIG.NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CONFIG.NVIDIA_MODEL,
      messages: messages,
      tools: tools,
      tool_choice: toolChoice,
      temperature: CONFIG.AI_TEMPERATURE,
      max_tokens: CONFIG.AI_MAX_TOKENS,
      top_p: CONFIG.AI_TOP_P,
      stream: false,
    }),
  });

  if (!response.ok) {
    let errorMessage = 'NVIDIA API Error';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch (e) {
      errorMessage = `Server Error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Fetch destination images from Pexels
 */
export async function fetchDestinationImages(destination) {
  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(
        `${CONFIG.PEXELS_API_URL}?query=${encodeURIComponent(destination + ' travel')}&per_page=4`
      );
      if (!res.ok) throw new Error('Failed to fetch images');
      return res;
    });

    const data = await response.json();
    
    if (data && data.photos && data.photos.length > 0) {
      return data.photos.map(p => p.src.medium);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching images:', error);
    return null;
  }
}

/**
 * Get available Cal.com slots
 */
export async function getAvailableSlots(startDate, endDate) {
  try {
    const response = await fetch(
      `${CONFIG.CALCOM_SLOTS_URL}?startDate=${startDate}&endDate=${endDate}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch available slots');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching slots:', error);
    return { error: error.message };
  }
}

/**
 * Book a meeting via Cal.com
 */
export async function bookMeeting(name, email, startTime) {
  try {
    const response = await fetch(CONFIG.CALCOM_BOOKINGS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to book meeting');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error booking meeting:', error);
    return { error: error.message };
  }
}
