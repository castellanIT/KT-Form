// Simple Express proxy server - forwards form payload to Make.com webhook
// Run with: node server.js
// Open http://localhost:3000 - form and /make-proxy are same-origin so webhook works

const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
app.use(express.json({ limit: '50mb' })); // Allow large payloads (PDF base64, etc.)

// Serve static files from current directory so form works at http://localhost:3000
app.use(express.static(path.join(__dirname)));

// CORS middleware (for Amplify frontend calling deployed API)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Handle preflight requests
app.options('/make-proxy', (req, res) => {
  res.sendStatus(204);
});

// Proxy endpoint
app.post('/make-proxy', async (req, res) => {
  try {
    const webhookUrl = 'https://hook.us1.make.com/507tywj448d3jkh9jkl4cj8ojcgbii1i';
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const responseText = await response.text();
    
    res.status(response.status).json({
      success: response.ok,
      status: response.status,
      message: responseText
    });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
