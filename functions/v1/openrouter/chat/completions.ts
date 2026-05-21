// Cloudflare Worker function to proxy OpenRouter API requests securely
export async function onRequest(context: any) {
  const { request, env } = context;

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await request.json();

    // Log request for debugging (remove in production)
    console.log('OpenRouter API Request:', JSON.stringify(body, null, 2));

    // Forward to OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': env.SITE_URL || 'https://travel-ai-chatbot.pages.dev',
        'X-Title': 'Travel AI Chatbot',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Log response for debugging (remove in production)
    if (!response.ok) {
      console.error('OpenRouter API Error:', JSON.stringify(data, null, 2));
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Worker Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
}
