// API service layer for all external calls
import { CONFIG } from './config.js';
import { retryWithBackoff } from './utils.js';

/**
 * Call Requesty/OpenAI-compatible chat completions endpoint.
 * Includes model fallback and retry to keep the chatbot reliable.
 */
export async function callAIAPI(messages, tools = null, toolChoice = null) {
  const modelCandidates = Array.isArray(CONFIG.AI_MODEL) ? CONFIG.AI_MODEL : [CONFIG.AI_MODEL];
  const maxAttemptsPerModel = CONFIG.AI_MAX_RETRIES || 1;
  const baseDelayMs = 600;

  let lastError = null;
  for (const model of modelCandidates) {
    for (let attempt = 0; attempt < maxAttemptsPerModel; attempt++) {
      try {
        const requestBody = {
          model,
          messages: messages,
          temperature: CONFIG.AI_TEMPERATURE,
          max_tokens: CONFIG.AI_MAX_TOKENS,
          top_p: CONFIG.AI_TOP_P,
          stream: false,
        };

        // Only add tools and tool_choice if tools are provided
        if (tools && tools.length > 0) {
          requestBody.tools = tools;
          if (toolChoice) requestBody.tool_choice = toolChoice;
        }

        const res = await fetch(CONFIG.AI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (res.ok) return await res.json();

        let errorMessage = `Request failed (${res.status} ${res.statusText})`;
        try {
          const errorData = await res.json();
          errorMessage = errorData?.error?.message || errorMessage;
        } catch {
          // Body isn't JSON; fall back to status text.
        }

        const retryable =
          res.status === 429 ||
          res.status === 408 ||
          (res.status >= 500 && res.status <= 599);

        const err = new Error(errorMessage);
        err.status = res.status;
        err.retryable = retryable;
        throw err;
      } catch (err) {
        lastError = err;
        const msg = String(err?.message || err || '');

        // Authentication/authorization errors will not be fixed by switching models.
        if (msg.includes('401') || msg.includes('403')) break;

        // Retry only for retryable errors and only if we still have attempts left.
        if (err?.retryable && attempt < maxAttemptsPerModel - 1) {
          const delay =
            baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        // Otherwise, move to the next model candidate.
        break;
      }
    }
  }

  throw lastError || new Error('AI API Error');
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
