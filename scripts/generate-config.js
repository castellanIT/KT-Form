/**
 * Generates config.js from environment variables (used in Amplify build).
 * Reads: accessKeyId, secretAccessKey, region, bucketName from process.env
 */
const fs = require('fs');
const path = require('path');

const accessKeyId = process.env.accessKeyId || '';
const secretAccessKey = process.env.secretAccessKey || '';
const region = process.env.region || process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.bucketName || 'kt-form-documents';

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

const outPath = path.join(__dirname, '..', 'config.js');
fs.writeFileSync(outPath, config, 'utf8');
console.log('Generated config.js from env (region:', region, ', bucket:', bucketName, ')');
