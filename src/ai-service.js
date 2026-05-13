// AI service for handling conversations and tool calls
import { callNvidiaAPI, fetchDestinationImages, getAvailableSlots, bookMeeting } from './api.js';
import { CONFIG } from './config.js';

/**
 * System prompt for the AI
 */
const SYSTEM_PROMPT = {
  role: 'system',
  content: `You are a world-class, luxury travel agent for Travel AI. Your goal is to curate unforgettable, highly detailed travel experiences.

CRITICAL RULES:
1. NO MARKDOWN SYMBOLS: Never use asterisks (*) for bold/italics, and never use hashtags (#).
2. USE CLEAN TEXT FORMATTING for easy reading: Use line breaks, uppercase letters for headers, and simple dashes (-) for lists to make it readable.
3. BE A PRO: If the user asks for a trip plan or itinerary, provide a high-level, exciting day-by-day summary. Keep each day brief and punchy (1-2 lines per day) so it is easy to read in a chat window. For general questions, keep it to a concise list.
4. Be warm, enthusiastic, and highly professional. Offer insider tips (hidden gems, best times to visit).
5. PRICING GUIDELINES: Quote the following baseline prices when asked:
   - Luxury Europe (7 days): Starts at $3,500/person
   - Tropical Escapes (Maldives/Bali): Starts at $2,500/person
   - Asian Tours (Japan/Thailand): Starts at $2,800/person
   - Quick Getaways (3-4 days): Starts at $900/person
   Always clarify that these are starting prices excluding flights, and encourage booking a consultation for exact quotes.
6. Contact: ${CONFIG.CONTACT_PHONE} (Call/WhatsApp). You can offer to schedule a consultation, but DO NOT show the calendar unless the user explicitly says they want to book or schedule a meeting.
7. CRITICAL REQUIREMENT FOR SCHEDULING: You MUST call the "show_calendar_ui" tool IMMEDIATELY whenever the user asks to "book a meeting", "schedule a call", or "see the calendar". Do not just say you will schedule it; you are REQUIRED to trigger the tool!
8. Also show IMAGES: You MUST call the "show_destination_images" tool EVERY SINGLE TIME you recommend or discuss a specific travel destination, city, or resort. If you mention a place like 'Paris', 'Bali', or 'Maldives' or anything, you are REQUIRED to trigger the image tool for it so the user can see it. Do not skip this!`,
};

/**
 * Tool definitions for the AI
 */
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'show_destination_images',
      description: 'Shows a visual carousel of images for a specific travel destination to the user. ALWAYS call this when you are recommending or describing a specific destination so the user can see what it looks like.',
      parameters: {
        type: 'object',
        properties: {
          destination: { 
            type: 'string', 
            description: 'The name of the destination (e.g., "Maldives", "Paris", "Tokyo", "Swiss Alps")' 
          },
        },
        required: ['destination'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'show_calendar_ui',
      description: 'Shows the visual interactive calendar widget to the user. ONLY call this when the user EXPLICITLY asks to schedule a meeting, book a consultation, or see the calendar. NEVER call this proactively without the user\'s direct request to book.',
      parameters: { 
        type: 'object', 
        properties: {}, 
        required: [] 
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_slots',
      description: 'Get available meeting slots for a specific date range from the Cal.com API.',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
          endDate: { type: 'string', description: 'End date in YYYY-MM-DD format' },
        },
        required: ['startDate', 'endDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_meeting',
      description: 'Book a meeting on behalf of the user for a specific time slot.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'User\'s full name' },
          email: { type: 'string', description: 'User\'s email address' },
          startTime: { type: 'string', description: 'Start time of the meeting in ISO format (e.g. 2024-05-10T10:00:00Z)' },
        },
        required: ['name', 'email', 'startTime'],
      },
    },
  },
];

/**
 * Execute a tool call
 */
async function executeTool(toolCall, toolImageUrls) {
  const functionName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments);
  let functionResult = '';

  switch (functionName) {
    case 'show_calendar_ui':
      functionResult = 'Calendar UI has been shown to the user. No need to output anything else, just say the calendar is shown.';
      break;

    case 'show_destination_images':
      const imageUrls = await fetchDestinationImages(args.destination);
      if (imageUrls && imageUrls.length > 0) {
        toolImageUrls[toolCall.id] = imageUrls;
        functionResult = `Images of ${args.destination} have been shown to the user.`;
      } else {
        functionResult = `Could not find images for ${args.destination}.`;
      }
      break;

    case 'get_available_slots':
      const slotsData = await getAvailableSlots(args.startDate, args.endDate);
      functionResult = JSON.stringify(slotsData);
      break;

    case 'book_meeting':
      const bookingData = await bookMeeting(args.name, args.email, args.startTime);
      functionResult = JSON.stringify(bookingData);
      break;

    default:
      functionResult = `Unknown function: ${functionName}`;
  }

  return functionResult;
}

/**
 * Process tool calls and generate final response
 */
async function processToolCalls(responseMessage, messages) {
  const toolImageUrls = {};
  const toolMessages = [];

  // Execute all tool calls
  for (const toolCall of responseMessage.tool_calls) {
    const functionResult = await executeTool(toolCall, toolImageUrls);
    
    toolMessages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      name: toolCall.function.name,
      content: functionResult,
    });
  }

  // Build final messages array
  const finalMessages = [
    ...messages,
    responseMessage,
    ...toolMessages,
    {
      role: 'system',
      content: 'Tool execution complete. Now generate your final text response to the user. Do NOT call any more tools in this turn.',
    },
  ];

  // Get final response from AI (without tools this time)
  const secondData = await callNvidiaAPI(finalMessages, null, null);
  let finalAiResponse = secondData.choices[0]?.message?.content || '';

  // Fallback if model still tries to call tools
  if (!finalAiResponse && secondData.choices[0]?.message?.tool_calls) {
    finalAiResponse = 'I\'ve pulled up some information for you. Let me know if you need any adjustments!';
  }

  // Add special tags for UI rendering
  if (responseMessage.tool_calls.some(tc => tc.function.name === 'show_calendar_ui')) {
    finalAiResponse += '\n[SHOW_CALENDAR]';
  }

  const imageToolCalls = responseMessage.tool_calls.filter(tc => tc.function.name === 'show_destination_images');
  for (const tc of imageToolCalls) {
    try {
      const args = JSON.parse(tc.function.arguments);
      const urls = toolImageUrls[tc.id];
      if (args.destination && urls && urls.length > 0) {
        finalAiResponse += `\n[SHOW_IMAGES:${args.destination}|${urls.join(',')}]`;
      } else if (args.destination) {
        finalAiResponse += `\n[SHOW_IMAGES:${args.destination}]`;
      }
    } catch (e) {
      console.error('Error processing image tool call:', e);
    }
  }

  return {
    response: finalAiResponse,
    messages: [responseMessage, ...toolMessages],
  };
}

/**
 * Get contextual quick replies based on AI response
 */
function getContextualQuickReplies(response, historyLength) {
  const lowerResponse = response.toLowerCase();
  
  if (lowerResponse.includes('destination') || lowerResponse.includes('recommend')) {
    return ['Tell me more', 'Show other options', 'Book a consultation'];
  }
  
  if (lowerResponse.includes('price') || lowerResponse.includes('cost')) {
    return ['Schedule a call', 'Show budget options', 'Tell me more'];
  }
  
  if (historyLength <= 4) {
    return ['Show me destinations', 'Help plan a trip', 'Talk to an agent'];
  }
  
  return [];
}

/**
 * Main function to get AI response
 */
export async function getAIResponse(userMessage, chatHistory) {
  // Add user message to history
  chatHistory.push({
    role: 'user',
    content: userMessage,
  });

  // Prepare messages for API
  const messages = [SYSTEM_PROMPT, ...chatHistory];

  // Call AI API
  const data = await callNvidiaAPI(messages, TOOLS, 'auto');
  const responseMessage = data.choices[0]?.message;

  // Sanitize response (remove reasoning field if present)
  if (responseMessage && responseMessage.reasoning) {
    delete responseMessage.reasoning;
  }

  let finalResponse;
  let historyUpdates = [];

  // Check if AI wants to use tools
  if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
    const result = await processToolCalls(responseMessage, messages);
    finalResponse = result.response;
    historyUpdates = result.messages;
  } else {
    finalResponse = responseMessage?.content || 'I\'m having trouble connecting right now. Please try again!';
    historyUpdates = [responseMessage];
  }

  // Add all updates to history
  historyUpdates.forEach(msg => chatHistory.push(msg));
  
  // Add final response to history
  chatHistory.push({
    role: 'assistant',
    content: finalResponse,
  });

  // Get contextual quick replies
  const quickReplies = getContextualQuickReplies(finalResponse, chatHistory.length);

  return {
    response: finalResponse,
    quickReplies,
  };
}

/**
 * Get welcome message
 */
export function getWelcomeMessage() {
  return `Hi there! 👋 I'm your AI travel assistant.

Where would you like to go? I can help with destinations, pricing, bookings, or anything travel-related!`;
}

/**
 * Get initial quick replies
 */
export function getInitialQuickReplies() {
  return [
    'Plan a 7-day luxury trip to Europe',
    'What are your packages for the Maldives?',
    'Show me trending destinations',
    'I want to schedule a consultation',
  ];
}

/**
 * Get fallback error message
 */
export function getFallbackMessage() {
  return `I'm having trouble connecting to my AI brain right now! 😅

But don't worry - you can still reach our amazing travel team:

📞 Call/WhatsApp: ${CONFIG.CONTACT_PHONE}

They're available to help you plan your perfect vacation right away!`;
}
