/**
 * Generates config.js from environment variables (used in Amplify build).
 * Reads: accessKeyId, secretAccessKey, region, bucketName from process.env
 */
const fs = require('fs');
const path = require('path');

const accessKeyId = process.env.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '';
const region = process.env.region || process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.bucketName || 'kt-form-documents';
const outPath = path.join(__dirname, '..', 'config.js');

if (!accessKeyId || !secretAccessKey) {
    if (fs.existsSync(outPath)) {
        console.warn('accessKeyId/secretAccessKey not set — keeping existing config.js');
        process.exit(0);
    }
    console.error('accessKeyId/secretAccessKey not set and config.js missing. Set Amplify env vars.');
    process.exit(1);
}

const config = `/**
 * S3 config generated from Amplify environment variables (do not edit in repo)
 */
var S3_CONFIG = {
    region: ${JSON.stringify(region)},
    bucketName: ${JSON.stringify(bucketName)},
    accessKeyId: ${JSON.stringify(accessKeyId)},
    secretAccessKey: ${JSON.stringify(secretAccessKey)}
};
`;

fs.writeFileSync(outPath, config, 'utf8');
console.log('Generated config.js from env (region:', region, ', bucket:', bucketName, ')');
