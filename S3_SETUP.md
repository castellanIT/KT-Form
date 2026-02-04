# S3 Setup Guide for KT Form

## 🚀 **AWS S3 Configuration**

### **Step 1: Create S3 Bucket**

1. **Go to AWS S3 Console**: https://s3.console.aws.amazon.com/
2. **Create Bucket**:
   - Bucket name: `kt-form-documents` (or your preferred name)
   - Region: `us-east-1` (or your preferred region)
   - Block all public access: **Keep enabled** (for security)
   - Versioning: **Disabled** (optional)
   - Encryption: **Enabled** (recommended)

### **Step 2: Create IAM User**

1. **Go to IAM Console**: https://console.aws.amazon.com/iam/
2. **Create User**:
   - User name: `kt-form-s3-user`
   - Access type: **Programmatic access**

3. **Attach Policy**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:PutObjectAcl",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::kt-form-documents/*"
       },
       {
         "Effect": "Allow",
         "Action": "s3:ListBucket",
         "Resource": "arn:aws:s3:::kt-form-documents"
       }
     ]
   }
   ```

4. **Save Credentials**:
   - Access Key ID
   - Secret Access Key

### **Step 3: Update Configuration**

Copy the example config and add your credentials:

```bash
cp config.example.js config.js
```

Then edit `config.js` and set:

- `region` – e.g. `'us-east-1'`
- `bucketName` – e.g. `'kt-form-documents'`
- `accessKeyId` – from Step 2
- `secretAccessKey` – from Step 2

If `config.js` is missing, the app loads with a stub (no S3). Use `config.example.js` as a template.

### **Step 4: CORS Configuration**

Add CORS policy to your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## 📊 **New Webhook Payload Structure**

With S3 integration, your webhook will receive:

```json
{
  "formData": {
    "employeeName": "John Doe",
    "designation": "Software Engineer",
    // ... all form fields
  },
  "contacts": [
    {"name": "Contact Name", "email": "email@example.com"}
  ],
  "accessCredentials": [
    {"credentials": "System access", "action": "Transfer"}
  ],
  "attachments": [
    {
      "fileName": "document.pdf",
      "fileSize": 1024,
      "fileType": "application/pdf",
      "s3Url": "https://kt-form-documents.s3.amazonaws.com/kt-forms/1234567890-document.pdf",
      "s3Key": "kt-forms/1234567890-document.pdf"
    }
  ],
  "pdf": {
    "fileName": "KT_Form_John_Doe_2025-10-22.pdf",
    "s3Url": "https://kt-form-documents.s3.amazonaws.com/kt-forms/1234567890-KT_Form_John_Doe_2025-10-22.pdf",
    "s3Key": "kt-forms/1234567890-KT_Form_John_Doe_2025-10-22.pdf"
  },
  "employeeSignature": {
    "s3Url": "https://kt-form-documents.s3.amazonaws.com/kt-forms/1234567890-signature.png",
    "s3Key": "kt-forms/1234567890-signature.png"
  },
  "analytics": {
    "sessionId": "kt_1234567890_abc123",
    "submissionTime": "2025-10-22T15:42:52.995Z"
  }
}
```

## 🔧 **Benefits of S3 Integration**

✅ **Smaller Payloads**: No more large base64 strings in webhook  
✅ **Better Performance**: Faster form submissions  
✅ **Scalable**: Handle large files without size limits  
✅ **Secure**: Files stored in private S3 bucket  
✅ **Organized**: Files organized by timestamp and type  
✅ **Reliable**: AWS S3 99.999999999% durability  

## 🛠️ **Troubleshooting**

### **Common Issues**:

1. **CORS Errors**: Ensure CORS policy is configured on S3 bucket
2. **Access Denied**: Check IAM permissions for S3 operations
3. **Region Mismatch**: Ensure S3 bucket region matches configuration
4. **Credentials**: Verify AWS credentials are correct

### **Testing**:

1. Open browser console
2. Check for S3 upload logs
3. Verify files appear in S3 bucket
4. Test webhook receives S3 URLs

## 📝 **Security Notes**

- Files are uploaded as **private** by default
- Consider adding S3 lifecycle policies for cleanup
- Monitor S3 costs and usage
- Use IAM roles instead of access keys in production
