const AWS = require('aws-sdk');

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
        
        // Forward to Make.com webhook
        const webhookUrl = 'https://hook.us1.make.com/507tywj448d3jkh9jkl4cj8ojcgbii1i';
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
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
