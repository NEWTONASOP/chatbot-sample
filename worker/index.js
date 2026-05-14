// Main Cloudflare Worker entry point
// This serves static assets and handles API routes

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/v1/')) {
      return handleAPIRoute(request, env, url);
    }
    
    // Serve static assets
    return env.ASSETS.fetch(request);
  },
};

// Handle API routing
async function handleAPIRoute(request, env, url) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Route to appropriate handler
    if (url.pathname === '/v1/groq/chat/completions') {
      return await handleGroqAPI(request, env, corsHeaders);
    }
    
    if (url.pathname === '/v1/pexels/search') {
      return await handlePexelsAPI(request, env, corsHeaders);
    }
    
    if (url.pathname === '/v1/calcom/slots') {
      return await handleCalcomSlots(request, env, corsHeaders);
    }
    
    if (url.pathname === '/v1/calcom/bookings') {
      return await handleCalcomBookings(request, env, corsHeaders);
    }
    
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Groq API handler
async function handleGroqAPI(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const body = await request.json();

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Pexels API handler
async function handlePexelsAPI(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get('query');
  const perPage = url.searchParams.get('per_page') || '4';

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    {
      headers: {
        'Authorization': env.PEXELS_API_KEY,
      },
    }
  );

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Cal.com slots handler
async function handleCalcomSlots(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  const response = await fetch(
    `https://api.cal.com/v1/slots?startTime=${startDate}&endTime=${endDate}&eventTypeId=${env.CALCOM_EVENT_TYPE_ID}`,
    {
      headers: {
        'Authorization': `Bearer ${env.CALCOM_API_KEY}`,
      },
    }
  );

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Cal.com bookings handler
async function handleCalcomBookings(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const body = await request.json();

  const response = await fetch('https://api.cal.com/v1/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.CALCOM_API_KEY}`,
    },
    body: JSON.stringify({
      eventTypeId: env.CALCOM_EVENT_TYPE_ID,
      start: body.startTime,
      responses: {
        name: body.name,
        email: body.email,
      },
      timeZone: body.timeZone,
      language: 'en',
    }),
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
