const NVIDIA_INVOKE_URL = '/v1/nvidia/chat/completions';
const NVIDIA_MODEL = "mistralai/ministral-14b-instruct-2512";
const CALCOM_API_KEY = 'YOUR_CALCOM_API_KEY'; // Replace with actual API key
const CALCOM_EVENT_TYPE_ID = 'YOUR_EVENT_TYPE_ID'; // Replace with actual Event Type ID
const PEXELS_API_KEY = 'WeDRqF27zGhkfGCKq9DMtZ5FRnvCr9Xjx2gUm5XzmeoYj9U0sHUPLXXU';

// State management
let chatHistory = [];
let isTyping = false;

// DOM elements
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotForm = document.getElementById('chatbotForm');
const chatbotSendBtn = document.getElementById('chatbotSendBtn');

// Initialize chatbot
function initChatbot() {
  // Add welcome message
  const welcomeMessage = `Hi there! 👋 I'm your AI travel assistant.

Where would you like to go? I can help with destinations, pricing, bookings, or anything travel-related!`;

  addMessage('bot', welcomeMessage);

  // Show quick replies
  setTimeout(() => {
    showQuickReplies([
      'Plan a 7-day luxury trip to Europe',
      'What are your packages for the Maldives?',
      'Show me trending destinations',
      'I want to schedule a consultation'
    ]);
  }, 500);
}


// Add message to chat (for display only)
function addMessage(sender, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;

  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'message-avatar';

  if (sender === 'bot') {
    avatarDiv.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="3"/></svg>';
  } else {
    avatarDiv.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  }

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  let hasCalendar = false;
  if (text.includes('[SHOW_CALENDAR]')) {
    hasCalendar = true;
    text = text.replace('[SHOW_CALENDAR]', '').trim();
  }

  // Extract all [SHOW_IMAGES:Destination|url1,url2] tags
  const imageDestinations = [];

  const imageRegexWithUrls = /\[SHOW_IMAGES:(.*?)\|(.*?)\]/g;
  let match;
  while ((match = imageRegexWithUrls.exec(text)) !== null) {
    imageDestinations.push({
      dest: match[1],
      urls: match[2].split(',')
    });
  }
  text = text.replace(imageRegexWithUrls, '').trim();

  const imageRegexFallback = /\[SHOW_IMAGES:(.*?)\]/g;
  while ((match = imageRegexFallback.exec(text)) !== null) {
    imageDestinations.push({
      dest: match[1],
      urls: []
    });
  }
  text = text.replace(imageRegexFallback, '').trim();

  // Preserve original formatting and empty lines for readability
  let formattedText = text.trim();

  // Escape HTML to prevent XSS
  formattedText = formattedText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Parse basic markdown (Bold)
  formattedText = formattedText.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

  contentDiv.style.whiteSpace = 'pre-wrap';
  contentDiv.innerHTML = formattedText;

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentDiv);

  // Add Image Carousels
  if (imageDestinations.length > 0) {
    imageDestinations.forEach(item => {
      const { dest, urls } = item;
      const carouselWrapper = document.createElement('div');
      carouselWrapper.className = 'mt-3 mb-2';

      const destLabel = document.createElement('div');
      destLabel.style.fontSize = '12px';
      destLabel.style.opacity = '0.7';
      destLabel.style.marginBottom = '6px';
      destLabel.textContent = `📍 Views from ${dest}`;
      carouselWrapper.appendChild(destLabel);

      const imagesContainer = document.createElement('div');
      imagesContainer.className = 'image-carousel';
      imagesContainer.style.display = 'flex';
      imagesContainer.style.gap = '10px';
      imagesContainer.style.overflowX = 'auto';
      imagesContainer.style.paddingBottom = '8px';
      imagesContainer.style.width = '100%';

      // Add a custom style block for webkit scrollbar if not exists
      if (!document.getElementById('carousel-styles')) {
        const style = document.createElement('style');
        style.id = 'carousel-styles';
        style.innerHTML = `
          .image-carousel::-webkit-scrollbar { display: none; }
          .image-carousel { -ms-overflow-style: none; scrollbar-width: none; scroll-snap-type: x mandatory; }
          .carousel-img { scroll-snap-align: start; transition: transform 0.2s; cursor: pointer; }
          .carousel-img:hover { transform: scale(1.02); }
        `;
        document.head.appendChild(style);
      }

      if (urls && urls.length > 0) {
        urls.forEach((url, index) => {
          const img = document.createElement('img');
          img.className = 'carousel-img';
          img.src = url;
          img.style.minWidth = '200px';
          img.style.height = '140px';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '10px';
          img.style.border = '1px solid rgba(255,255,255,0.1)';
          img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          img.style.backgroundColor = 'rgba(255,255,255,0.05)';
          img.alt = `${dest} view ${index + 1}`;
          imagesContainer.appendChild(img);
        });
      } else {
        const categories = ['landscape', 'city', 'view'];
        categories.forEach((cat, index) => {
          const img = document.createElement('img');
          img.className = 'carousel-img';
          img.src = `https://loremflickr.com/400/300/${encodeURIComponent(dest)},${cat}?lock=${Math.floor(Math.random() * 1000) + index}`;
          img.style.minWidth = '200px';
          img.style.height = '140px';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '10px';
          img.style.border = '1px solid rgba(255,255,255,0.1)';
          img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          img.style.backgroundColor = 'rgba(255,255,255,0.05)';
          img.alt = `${dest} ${cat}`;
          imagesContainer.appendChild(img);
        });
      }

      carouselWrapper.appendChild(imagesContainer);
      contentDiv.appendChild(carouselWrapper);
    });
  }

  if (hasCalendar) {
    const calContainer = document.createElement('div');
    calContainer.className = 'mt-3';
    calContainer.style.width = '100%';
    calContainer.style.height = '380px';
    calContainer.style.overflow = 'hidden';
    calContainer.style.borderRadius = '12px';
    calContainer.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    calContainer.style.marginTop = '12px';
    calContainer.style.backgroundColor = 'var(--surface-color, #ffffff)';

    const calId = 'cal-' + Date.now();
    const calInner = document.createElement('div');
    calInner.id = calId;
    calInner.style.width = '100%';
    calInner.style.height = '100%';
    calInner.style.overflow = 'scroll';

    calContainer.appendChild(calInner);
    contentDiv.appendChild(calContainer);

    setTimeout(() => {
      if (window.Cal) {
        const calAPI = window.Cal.ns["chatbot-meeting"] || window.Cal;
        calAPI("inline", {
          elementOrSelector: `#${calId}`,
          calLink: "Deteroid/deteroid-meeting",
          layout: "month_view",
          config: { "layout": "month_view", "theme": "dark" }
        });
      }
    }, 100);
  }

  chatbotMessages.appendChild(messageDiv);

  if (sender === 'user') {
    setTimeout(scrollToBottom, 50);
  }

  return messageDiv;
}

// Show typing indicator
function showTypingIndicator() {
  isTyping = true;

  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot typing-indicator';
  typingDiv.id = 'typing-indicator';

  typingDiv.innerHTML = `
    <div class="message-avatar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="3"/></svg>
    </div>
    <div class="message-content">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;

  chatbotMessages.appendChild(typingDiv);
  scrollToBottom();
}
// Hide typing indicator
function hideTypingIndicator() {
  isTyping = false;
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Show quick reply buttons
function showQuickReplies(replies) {
  const quickRepliesDiv = document.createElement('div');
  quickRepliesDiv.className = 'quick-replies';

  replies.forEach(reply => {
    const btn = document.createElement('button');
    btn.className = 'quick-reply-btn';
    btn.textContent = reply;
    btn.onclick = () => {
      handleQuickReply(reply);
      quickRepliesDiv.remove();
    };
    quickRepliesDiv.appendChild(btn);
  });

  chatbotMessages.appendChild(quickRepliesDiv);
  scrollToBottom();
}

// Handle quick reply click
function handleQuickReply(text) {
  addMessage('user', text);
  getBotResponse(text);
}

// Scroll to bottom of messages
function scrollToBottom() {
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Handle form submit
function handleChatSubmit(e) {
  e.preventDefault();

  const message = chatbotInput.value.trim();
  if (!message || isTyping) return;

  // Add user message
  addMessage('user', message);

  // Clear input
  chatbotInput.value = '';
  chatbotSendBtn.disabled = true;

  // Get bot response
  getBotResponse(message);
}
// Get bot response using REAL AI (Groq API)
async function getBotResponse(userMessage) {
  showTypingIndicator();

  try {
    // System prompt for the AI
    const systemPrompt = {
      role: 'system',
      content: `You are a world-class, luxury travel agent for Travel AI. Your goal is to curate unforgettable, highly detailed travel experiences.

CRITICAL RULES:
1. NO MARKDOWN SYMBOLS: Never use asterisks (*) for bold/italics, and never use hashtags (#).
2. USE CLEAN TEXT FORMATTING for easy reading not complicated: Use line breaks, uppercase letters for headers, and simple dashes (-) for lists to make it readable.
3. BE A PRO: If the user asks for a trip plan or itinerary, provide a high-level, exciting day-by-day summary. Keep each day brief and punchy (1-2 lines per day) so it is easy to read in a chat window. For general questions, keep it to a concise list.
4. Be warm, enthusiastic, and highly professional. Offer insider tips (hidden gems, best times to visit).
6. PRICING GUIDELINES: Quote the following baseline prices when asked:
   - Luxury Europe (7 days): Starts at $3,500/person
   - Tropical Escapes (Maldives/Bali): Starts at $2,500/person
   - Asian Tours (Japan/Thailand): Starts at $2,800/person
   - Quick Getaways (3-4 days): Starts at $900/person
   Always clarify that these are starting prices excluding flights, and encourage booking a consultation for exact quotes.
7. Contact: +91 88510 86716 (Call/WhatsApp). You can offer to schedule a consultation, but DO NOT show the calendar unless the user explicitly says they want to book or schedule a meeting.
8. CRITICAL REQUIREMENT FOR SCHEDULING: You MUST call the "show_calendar_ui" tool IMMEDIATELY whenever the user asks to "book a meeting", "schedule a call", or "see the calendar". Do not just say you will schedule it; you are REQUIRED to trigger the tool!
9. Also show IMAGES: You MUST call the "show_destination_images" tool EVERY SINGLE TIME you recommend or discuss a specific travel destination, city, or resort. If you mention a place like 'Paris', 'Bali', or 'Maldives' or anything, you are REQUIRED to trigger the image tool for it so the user can see it. Do not skip this!`
    };

    const tools = [
      {
        type: "function",
        function: {
          name: "show_destination_images",
          description: "Shows a visual carousel of images for a specific travel destination to the user. ALWAYS call this when you are recommending or describing a specific destination so the user can see what it looks like.",
          parameters: {
            type: "object",
            properties: {
              destination: { type: "string", description: "The name of the destination (e.g., 'Maldives', 'Paris', 'Tokyo', 'Swiss Alps')" }
            },
            required: ["destination"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "show_calendar_ui",
          description: "Shows the visual interactive calendar widget to the user. ONLY call this when the user EXPLICITLY asks to schedule a meeting, book a consultation, or see the calendar. NEVER call this proactively without the user's direct request to book.",
          parameters: { type: "object", properties: {}, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "get_available_slots",
          description: "Get available meeting slots for a specific date range from the Cal.com API.",
          parameters: {
            type: "object",
            properties: {
              startDate: { type: "string", description: "Start date in YYYY-MM-DD format" },
              endDate: { type: "string", description: "End date in YYYY-MM-DD format" }
            },
            required: ["startDate", "endDate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "book_meeting",
          description: "Book a meeting on behalf of the user for a specific time slot.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "User's full name" },
              email: { type: "string", description: "User's email address" },
              startTime: { type: "string", description: "Start time of the meeting in ISO format (e.g. 2024-05-10T10:00:00Z)" }
            },
            required: ["name", "email", "startTime"]
          }
        }
      }
    ];

    // Add current user message to history
    chatHistory.push({
      role: 'user',
      content: userMessage
    });

    // Prepare messages for API - system + all history
    const messages = [
      systemPrompt,
      ...chatHistory
    ];

    const response = await fetch(NVIDIA_INVOKE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: messages,
        tools: tools,
        tool_choice: "auto",
        temperature: 0.15,
        max_tokens: 2048,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      let errorMessage = "NVIDIA API Error";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        errorMessage = `Server Error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const responseMessage = data.choices[0]?.message;

    // Sanitize the message: remove 'reasoning' to prevent history crashes if you swap models later
    if (responseMessage && responseMessage.reasoning) {
      delete responseMessage.reasoning;
    }

    let finalMessages = [...messages, responseMessage];

    let finalAiResponse = "";
    let botMessageDiv = null;

    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolImageUrls = {};

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        let functionResult = "";

        if (functionName === "show_calendar_ui") {
          functionResult = "Calendar UI has been shown to the user. No need to output anything else, just say the calendar is shown.";
        } else if (functionName === "show_destination_images") {
          try {
            const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(args.destination + " travel")}&per_page=4&orientation=landscape`, {
              headers: { Authorization: PEXELS_API_KEY }
            });
            const data = await res.json();
            if (data && data.photos && data.photos.length > 0) {
              const imageUrls = data.photos.map(p => p.src.medium);
              toolImageUrls[toolCall.id] = imageUrls;
              functionResult = `Images of ${args.destination} have been shown to the user.`;
            } else {
              functionResult = `Could not find images for ${args.destination}.`;
            }
          } catch (err) {
            functionResult = `Failed to fetch images for ${args.destination}.`;
          }
        } else if (functionName === "get_available_slots") {
          try {
            if (!CALCOM_API_KEY || !CALCOM_EVENT_TYPE_ID || CALCOM_API_KEY === 'YOUR_CALCOM_API_KEY') {
              functionResult = JSON.stringify({ error: "API Key or Event Type ID is missing." });
            } else {
              const res = await fetch(`https://api.cal.com/v2/slots?eventTypeId=${CALCOM_EVENT_TYPE_ID}&start=${args.startDate}T00:00:00.000Z&end=${args.endDate}T23:59:59.000Z`, {
                headers: {
                  "Authorization": `Bearer ${CALCOM_API_KEY}`,
                  "cal-api-version": "2024-08-13"
                }
              });
              const slotData = await res.json();
              functionResult = JSON.stringify(slotData);
            }
          } catch (err) {
            functionResult = JSON.stringify({ error: err.message });
          }
        } else if (functionName === "book_meeting") {
          try {
            if (!CALCOM_API_KEY || !CALCOM_EVENT_TYPE_ID || CALCOM_API_KEY === 'YOUR_CALCOM_API_KEY') {
              functionResult = JSON.stringify({ error: "API Key or Event Type ID is missing." });
            } else {
              const res = await fetch(`https://api.cal.com/v2/bookings`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${CALCOM_API_KEY}`,
                  'cal-api-version': '2024-08-13'
                },
                body: JSON.stringify({
                  eventTypeId: parseInt(CALCOM_EVENT_TYPE_ID),
                  start: args.startTime,
                  attendee: {
                    name: args.name,
                    email: args.email,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    language: "en"
                  }
                })
              });
              const bookData = await res.json();
              functionResult = JSON.stringify(bookData);
            }
          } catch (err) {
            functionResult = JSON.stringify({ error: err.message });
          }
        }

        finalMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: functionName,
          content: functionResult
        });
      }

      // Prevent smaller open source models from getting stuck in an infinite tool-calling loop
      finalMessages.push({
        role: "system",
        content: "Tool execution complete. Now generate your final text response to the user. Do NOT call any more tools in this turn."
      });

      const secondResponse = await fetch(NVIDIA_INVOKE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          messages: finalMessages,
          temperature: 0.15,
          max_tokens: 2048,
        })
      });

      if (!secondResponse.ok) {
        let errorMessage = "NVIDIA API Error (Tools)";
        try {
          const errorData = await secondResponse.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = `Server Error: ${secondResponse.status} ${secondResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const secondData = await secondResponse.json();
      finalAiResponse = secondData.choices[0]?.message?.content || "";

      // If the stubborn model still calls a tool instead of outputting text, provide a fallback text
      if (!finalAiResponse && secondData.choices[0]?.message?.tool_calls) {
        finalAiResponse = "I've pulled up some information for you. Let me know if you need any adjustments!";
      }

      if (responseMessage.tool_calls.some(tc => tc.function.name === "show_calendar_ui")) {
        finalAiResponse += "\n[SHOW_CALENDAR]";
      }

      const imageToolCalls = responseMessage.tool_calls.filter(tc => tc.function.name === "show_destination_images");
      for (const tc of imageToolCalls) {
        try {
          const args = JSON.parse(tc.function.arguments);
          const urls = toolImageUrls[tc.id];
          if (args.destination && urls && urls.length > 0) {
            finalAiResponse += `\n[SHOW_IMAGES:${args.destination}|${urls.join(',')}]`;
          } else if (args.destination) {
            finalAiResponse += `\n[SHOW_IMAGES:${args.destination}]`;
          }
        } catch (e) { }
      }

      // Add to history
      chatHistory.push(responseMessage);
      for (let m of finalMessages.slice(messages.length + 1)) {
        chatHistory.push(m);
      }
      chatHistory.push({ role: 'assistant', content: finalAiResponse });

      hideTypingIndicator();
      botMessageDiv = addMessage('bot', finalAiResponse);
    } else {
      finalAiResponse = responseMessage?.content || "I'm having trouble connecting right now. Please try again!";

      chatHistory.push({
        role: 'assistant',
        content: finalAiResponse
      });

      hideTypingIndicator();
      botMessageDiv = addMessage('bot', finalAiResponse);
    }

    // Show contextual quick replies based on response
    const lowerResponse = finalAiResponse.toLowerCase();
    let quickReplies = [];

    if (lowerResponse.includes('destination') || lowerResponse.includes('recommend')) {
      quickReplies = ['Tell me more', 'Show other options', 'Book a consultation'];
    } else if (lowerResponse.includes('price') || lowerResponse.includes('cost')) {
      quickReplies = ['Schedule a call', 'Show budget options', 'Tell me more'];
    } else if (chatHistory.length <= 4) {
      quickReplies = ['Show me destinations', 'Help plan a trip', 'Talk to an agent'];
    }

    if (quickReplies.length > 0) {
      setTimeout(() => {
        showQuickReplies(quickReplies);
      }, 300);
    }

    // Master scroll controller: Runs after calendar (100ms) and quick replies (300ms)
    setTimeout(() => {
      if (botMessageDiv && botMessageDiv.offsetHeight > chatbotMessages.clientHeight - 80) {
        // Long message: Scroll to the top of the AI's response
        chatbotMessages.scrollTo({
          top: botMessageDiv.offsetTop - 20,
          behavior: 'smooth'
        });
      } else {
        // Short message: Just scroll to the very bottom
        scrollToBottom();
      }
    }, 400);

  } catch (error) {
    hideTypingIndicator();

    // Fallback response if API fails
    const fallbackResponse = `I'm having trouble connecting to my AI brain right now! 😅

But don't worry - you can still reach our amazing travel team:

📞 Call/WhatsApp: +91 88510 86716

They're available to help you plan your perfect vacation right away!`;

    addMessage('bot', fallbackResponse);
  }
}
// Clear chat
function clearChat() {
  chatHistory = [];
  chatbotMessages.innerHTML = '';
  initChatbot();
}

// Enable/disable send button based on input
chatbotInput.addEventListener('input', (e) => {
  chatbotSendBtn.disabled = e.target.value.trim() === '';
});

// Handle Enter key
chatbotInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleChatSubmit(e);
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initChatbot();
});
