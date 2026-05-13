# 🌍 Wanderlust Travel - AI Chatbot Demo

A stunning travel agency website with **REAL AI-powered chatbot** integration using Groq API.

## ✨ Features

- 🤖 **Real AI Chatbot** - Powered by Groq's Llama 3.3 70B model
- 💬 **Intelligent Conversations** - Natural language understanding
- 🎨 **Modern Design** - Dark theme with smooth animations
- 📱 **Fully Responsive** - Works on all devices
- ⚡ **Fast Responses** - Lightning-quick AI replies
- 🎯 **Context-Aware** - Remembers conversation history

## 🚀 Quick Start

### 1. Get Your Free Groq API Key

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy your API key

### 2. Configure the Chatbot

Open `chatbot.js` and replace the API key on line 5:

```javascript
const GROQ_API_KEY = 'gsk_YOUR_API_KEY_HERE'; // Replace with your actual key
```

### 3. Run the Website

Simply open `index.html` in your browser. That's it!

**Note:** For production, you should:
- Move the API key to a backend server
- Never expose API keys in frontend code
- Use environment variables

## 📁 Project Structure

```
├── index.html          # Main website structure
├── style.css           # All styling and animations
├── chatbot.js          # AI chatbot logic with Groq API
├── hero.png            # Hero section image
├── destinations.png    # Destinations showcase image
└── README.md          # This file
```

## 🎯 How It Works

1. **User sends message** → Captured by chatbot.js
2. **Message sent to Groq API** → Real AI processing
3. **AI generates response** → Natural, contextual reply
4. **Response displayed** → Smooth animation in chat

## 🔧 Customization

### Change AI Model

In `chatbot.js`, line 50:
```javascript
model: 'llama-3.3-70b-versatile', // Try: mixtral-8x7b-32768, llama3-70b-8192
```

### Adjust AI Personality

Edit the system prompt in `chatbot.js` (lines 30-48) to change:
- Tone and style
- Knowledge base
- Response format
- Business information

### Modify Design

Edit `style.css` to customize:
- Colors (CSS variables at top)
- Animations
- Layout
- Responsive breakpoints

## 💡 Tips for Your Client Demo

1. **Test the AI first** - Make sure API key is working
2. **Show real conversations** - Let them ask questions live
3. **Highlight intelligence** - Show how it understands context
4. **Demonstrate quick replies** - Show the UX features
5. **Explain customization** - Show how easy it is to adapt

## 🌟 Key Selling Points

- ✅ **Real AI** - Not scripted responses
- ✅ **24/7 Available** - Never sleeps
- ✅ **Instant Responses** - No wait times
- ✅ **Scalable** - Handles unlimited conversations
- ✅ **Easy Integration** - Works with any website
- ✅ **Customizable** - Adapts to any business

## 📞 Support

For questions about this demo:
- Email: your-email@example.com
- Phone: +91 88510 86716

## 🔒 Security Note

**IMPORTANT:** This demo exposes the API key in the frontend for simplicity. For production:

1. Create a backend API endpoint
2. Store API key in environment variables
3. Make requests through your backend
4. Add rate limiting and authentication

## 📝 License

This is a demo project for client presentations.

---

**Built with ❤️ by Deteroid** - Showcasing the power of AI chatbots for travel agencies
