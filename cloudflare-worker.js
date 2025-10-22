// Cloudflare Worker to proxy Make.com webhook requests
// Deploy this to Cloudflare Workers and use the worker URL instead

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': 'https://main.d20lkin2kvtjbb.amplifyapp.com',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': 'https://main.d20lkin2kvtjbb.amplifyapp.com'
      }
    })
  }

  try {
    // Forward to Make.com webhook
    const webhookUrl = 'https://hook.us1.make.com/507tywj448d3jkh9jkl4cj8ojcgbii1i'
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: request.body
    })

    const responseText = await response.text()

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      message: responseText
    }), {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': 'https://main.d20lkin2kvtjbb.amplifyapp.com',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://main.d20lkin2kvtjbb.amplifyapp.com',
        'Content-Type': 'application/json'
      }
    })
  }
}
