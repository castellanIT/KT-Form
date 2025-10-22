# AWS Amplify Function Deployment Guide

## Option 3: AWS Amplify Function (Lambda + API Gateway)

This solution creates a Lambda function that proxies requests to your Make.com webhook, handling CORS properly.

### Files Created:
- `amplify/backend/function/makeProxy/src/index.js` - Lambda function code
- `amplify/backend/function/makeProxy/package.json` - Dependencies
- `amplify/backend/api/amplifyApi/` - API Gateway configuration
- CloudFormation templates for deployment

### Deployment Steps:

#### Method 1: Using Amplify CLI (Recommended)

1. **Install Amplify CLI**:
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Initialize Amplify in your project**:
   ```bash
   cd "/Users/gunaseelanm/KT Form"
   amplify init
   ```

3. **Add the function**:
   ```bash
   amplify add function
   # Choose: makeProxy
   # Runtime: Node.js
   # Template: Hello World
   ```

4. **Add API Gateway**:
   ```bash
   amplify add api
   # Choose: REST
   # Path: /make-proxy
   # Lambda function: makeProxy
   ```

5. **Deploy**:
   ```bash
   amplify push
   ```

#### Method 2: Manual AWS Console Deployment

1. **Create Lambda Function**:
   - Go to AWS Lambda Console
   - Create new function: `makeProxy`
   - Runtime: Node.js 18.x
   - Copy code from `amplify/backend/function/makeProxy/src/index.js`

2. **Create API Gateway**:
   - Go to API Gateway Console
   - Create new API: REST API
   - Create resource: `/make-proxy`
   - Create method: POST
   - Integration: Lambda Function
   - Enable CORS

3. **Deploy API**:
   - Deploy to stage: `prod`
   - Note the API Gateway URL

### Update Your Frontend:

After deployment, update the webhook URL in `script.js`:

```javascript
// Replace this line:
const WEBHOOK_URL = '/make-proxy';

// With your actual API Gateway URL:
const WEBHOOK_URL = 'https://your-api-id.execute-api.region.amazonaws.com/prod/make-proxy';
```

### Testing:

1. Deploy your frontend to Amplify
2. Test form submission
3. Check CloudWatch logs for Lambda function
4. Verify Make.com receives the data

### Troubleshooting:

- **CORS errors**: Ensure API Gateway has CORS enabled
- **Lambda errors**: Check CloudWatch logs
- **Make.com not receiving**: Verify webhook URL is correct
- **Timeout errors**: Increase Lambda timeout to 30 seconds

### Security Notes:

- The Lambda function includes your Make.com webhook URL
- Consider adding authentication if needed
- Monitor CloudWatch logs for debugging
