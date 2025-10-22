const https = require('https');

exports.handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': 'https://main.d20lkin2kvtjbb.amplifyapp.com',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': 'https://main.d20lkin2kvtjbb.amplifyapp.com'
            },
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Parse the incoming request body
        const requestBody = JSON.parse(event.body);
        
        // Forward to Make.com webhook using https module
        const webhookUrl = 'https://hook.us1.make.com/507tywj448d3jkh9jkl4cj8ojcgbii1i';
        
        const postData = JSON.stringify(requestBody);
        
        const response = await new Promise((resolve, reject) => {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            const req = https.request(webhookUrl, options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        text: () => Promise.resolve(data)
                    });
                });
            });
            
            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        const responseText = await response.text();

        return {
            statusCode: response.status,
            headers: {
                'Access-Control-Allow-Origin': 'https://main.d20lkin2kvtjbb.amplifyapp.com',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: response.ok,
                status: response.status,
                message: responseText
            })
        };

    } catch (error) {
        console.error('Proxy error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': 'https://main.d20lkin2kvtjbb.amplifyapp.com',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
