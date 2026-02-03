// Global variables
let employeeSignaturePad;
let isSubmitting = false;
const { jsPDF } = window.jspdf;

// Webhook URL - Direct Make.com webhook (used when proxy is not available)
const WEBHOOK_URL = 'https://hook.us1.make.com/507tywj448d3jkh9jkl4cj8ojcgbii1i';

// Use same-origin proxy when available (avoids CORS; run server with: node server.js)
function getWebhookUrl() {
  const hasOrigin = typeof window !== 'undefined' && window.location?.protocol !== 'file:' && window.location?.host;
  if (hasOrigin) return window.location.origin + '/make-proxy';
  return WEBHOOK_URL;
}

// S3 Configuration is loaded from config.js file
// The config.js file contains the actual AWS credentials and is excluded from Git

// Initialize AWS S3
let s3Client = null;
function initializeS3() {
    // Check if S3_CONFIG is available (config.js loaded successfully)
    if (typeof S3_CONFIG === 'undefined') {
        console.warn('⚠️ S3_CONFIG not available - config.js not loaded or missing');
        console.log('📝 S3 functionality will be disabled, but form will work normally');
        return;
    }

    if (typeof AWS !== 'undefined') {
        try {
            AWS.config.update({
                accessKeyId: S3_CONFIG.accessKeyId,
                secretAccessKey: S3_CONFIG.secretAccessKey,
                region: S3_CONFIG.region
            });
            s3Client = new AWS.S3();
            console.log('✅ S3 client initialized');
        } catch (error) {
            console.warn('⚠️ S3 initialization failed:', error.message);
            console.log('📝 S3 functionality will be disabled, but form will work normally');
        }
    } else {
        console.warn('⚠️ AWS SDK not loaded');
        console.log('📝 S3 functionality will be disabled, but form will work normally');
    }
}

// Analytics and Monitoring
const ANALYTICS = {
    formStartTime: null,
    formSubmissions: 0,
    formErrors: 0,
    webhookResponses: [],
    performanceMetrics: {},
    sessionId: generateSessionId()
};

// Generate unique session ID
function generateSessionId() {
    return 'kt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Initialize analytics
function initAnalytics() {
    ANALYTICS.formStartTime = Date.now();
    console.log('📊 Analytics initialized - Session ID:', ANALYTICS.sessionId);

    // Track form interactions
    document.addEventListener('input', trackFormInteraction);
    document.addEventListener('change', trackFormInteraction);

    // Track performance
    window.addEventListener('load', trackPerformance);
}

// Track form interactions
function trackFormInteraction(event) {
    const fieldName = event.target.name || event.target.id;
    console.log(`📝 Field interaction: ${fieldName}`);
}

// Track form performance
function trackPerformance() {
    const loadTime = Date.now() - ANALYTICS.formStartTime;
    ANALYTICS.performanceMetrics = {
        loadTime: loadTime,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        sessionId: ANALYTICS.sessionId
    };
    console.log('⚡ Performance tracked:', ANALYTICS.performanceMetrics);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM Content Loaded - Initializing application...');
    console.log('🌍 Environment:', window.location.hostname);
    console.log('📅 Build Date:', new Date().toISOString());

    initAnalytics();
    initializeS3();
    initializeSignaturePad();
    initializeFormHandlers();

    // Add a longer delay to ensure all elements are rendered in production
    setTimeout(() => {
        console.log('⏰ Initializing dynamic fields after delay...');
        initializeDynamicFields();
    }, 500);

    // Fallback initialization after 2 seconds if first attempt fails
    setTimeout(() => {
        console.log('🔄 Fallback initialization...');

        // Only run fallback if buttons weren't initialized successfully
        if (!buttonsInitialized) {
            console.log('⚠️ Primary initialization failed - running fallback...');
            const addContactBtn = document.getElementById('addContact');
            const addAccessBtn = document.getElementById('addAccess');

            if (addContactBtn) {
                console.log('🔧 Re-attaching Add Contact button...');
                addContactBtn.addEventListener('click', function (e) {
                    console.log('🔧 Add Contact button clicked! (fallback)');
                    e.preventDefault();
                    addContactRow();
                });
            }

            if (addAccessBtn) {
                console.log('🔧 Re-attaching Add Access button...');
                addAccessBtn.addEventListener('click', function (e) {
                    console.log('🔧 Add Access button clicked! (fallback)');
                    e.preventDefault();
                    addAccessRow();
                });
            }
        } else {
            console.log('✅ Primary initialization successful - skipping fallback');
        }
    }, 2000);

    setCurrentDate();
});

// Initialize signature pad
function initializeSignaturePad() {
    const canvas = document.getElementById('employeeSignature');
    if (canvas) {
        employeeSignaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgba(255, 255, 255, 0)',
            penColor: 'rgb(0, 0, 0)'
        });

        // Set canvas size
        canvas.width = 600;
        canvas.height = 200;

        // Clear signature button
        document.getElementById('clearEmployeeSignature').addEventListener('click', function () {
            employeeSignaturePad.clear();
        });
    }
}

// Initialize form handlers
function initializeFormHandlers() {
    const form = document.getElementById('ktForm');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        handleFormSubmission();
    });

    // Add real-time validation
    const requiredFields = form.querySelectorAll('input[required], textarea[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', validateField);
        field.addEventListener('input', clearFieldError);
    });
}

// Track if buttons have been initialized
let buttonsInitialized = false;

// Initialize dynamic fields (contacts and access)
function initializeDynamicFields() {
    console.log('🔧 Initializing dynamic fields...');

    // Add contact functionality
    const addContactBtn = document.getElementById('addContact');
    if (addContactBtn) {
        addContactBtn.addEventListener('click', function (e) {
            console.log('🔧 Add Contact button clicked!');
            e.preventDefault();
            addContactRow();
        });
        console.log('✅ Add Contact button event listener attached');
    } else {
        console.error('❌ Add Contact button not found');
    }

    // Add access functionality
    const addAccessBtn = document.getElementById('addAccess');
    if (addAccessBtn) {
        addAccessBtn.addEventListener('click', function (e) {
            console.log('🔧 Add Access button clicked!');
            e.preventDefault();
            addAccessRow();
        });
        console.log('✅ Add Access button event listener attached');
    } else {
        console.error('❌ Add Access button not found');
    }

    // Add file upload functionality
    initializeFileUpload();
    console.log('✅ Dynamic fields initialization complete');
    buttonsInitialized = true;
}

// Add new contact row
function addContactRow() {
    console.log('🔧 Adding new contact row...');
    const contactsList = document.getElementById('contactsList');
    if (!contactsList) {
        console.error('❌ contactsList element not found');
        return;
    }

    const newRow = document.createElement('div');
    newRow.className = 'contact-row';
    newRow.innerHTML = `
        <input type="text" name="contactName[]" placeholder="Full Name" class="large-input" required>
        <input type="email" name="contactEmail[]" placeholder="email@example.com" class="large-input" required>
        <button type="button" class="remove-contact" onclick="removeContact(this)">Remove</button>
    `;
    contactsList.appendChild(newRow);
    console.log('✅ Contact row added successfully');
}

// Remove contact row
function removeContact(button) {
    const row = button.closest('.contact-row');
    if (document.querySelectorAll('.contact-row').length > 1) {
        row.remove();
    } else {
        alert('At least one contact is required.');
    }
}

// Add new access row
function addAccessRow() {
    console.log('🔧 Adding new access row...');
    const accessList = document.getElementById('accessList');
    if (!accessList) {
        console.error('❌ accessList element not found');
        return;
    }

    const newRow = document.createElement('div');
    newRow.className = 'access-row';

    // Generate unique name for radio buttons in this row
    const rowId = Date.now() + Math.random().toString(36).substr(2, 9);

    newRow.innerHTML = `
        <textarea name="accessCredentials[]" placeholder="Describe the access and credentials (e.g., System: Company Email, Username: john.doe@company.com, Access Level: Admin)" rows="3" required></textarea>
        <div class="radio-group">
            <label class="radio-label">
                <input type="radio" name="accessAction_${rowId}" value="Transfer" required>
                <span class="radio-text">Transfer</span>
            </label>
            <label class="radio-label">
                <input type="radio" name="accessAction_${rowId}" value="Deactivate" required>
                <span class="radio-text">Deactivate</span>
            </label>
            <label class="radio-label">
                <input type="radio" name="accessAction_${rowId}" value="Transfer and Deactivate" required>
                <span class="radio-text">Transfer and Deactivate</span>
            </label>
        </div>
        <button type="button" class="remove-access" onclick="removeAccess(this)">Remove</button>
    `;
    accessList.appendChild(newRow);
    console.log('✅ Access row added successfully');
}

// Remove access row
function removeAccess(button) {
    const row = button.closest('.access-row');
    if (document.querySelectorAll('.access-row').length > 1) {
        row.remove();
    } else {
        alert('At least one access entry is required.');
    }
}

// Validate individual field
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();

    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }

    clearFieldError(field);
    return true;
}

// Show field error
function showFieldError(field, message) {
    clearFieldError(field);
    field.classList.add('error');

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

// Clear field error
function clearFieldError(fieldOrEvent) {
    if (!fieldOrEvent) return; // Safety check

    // Check if this is an event object or a field element
    const field = fieldOrEvent.target || fieldOrEvent;

    if (!field || !field.classList) return; // Additional safety check

    field.classList.remove('error');
    const errorMessage = field.parentNode?.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Validate form
function validateForm() {
    let isValid = true;

    // Check required fields
    const requiredFields = document.querySelectorAll('input[required], textarea[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        }
    });

    // Check signature
    if (employeeSignaturePad.isEmpty()) {
        alert('Please provide your digital signature');
        isValid = false;
    }

    // Check at least one contact
    const contactRows = document.querySelectorAll('.contact-row');
    let hasValidContact = false;
    contactRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const hasData = Array.from(inputs).some(input => input.value.trim());
        if (hasData) hasValidContact = true;
    });

    if (!hasValidContact) {
        alert('Please add at least one key contact');
        isValid = false;
    }

    return isValid;
}

// Handle form submission
async function handleFormSubmission() {
    console.log('📤 Form submit triggered');
    if (isSubmitting) {
        console.log('⚠️ Already submitting, ignoring');
        return;
    }

    if (!validateForm()) {
        console.log('⚠️ Validation failed');
        return;
    }

    console.log('✅ Validation passed, collecting data...');
    isSubmitting = true;
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
        // Collect form data
        const formData = await collectFormData();

        // Generate PDF
        console.log('📄 Generating PDF...');
        const pdfDoc = generatePDF(formData);
        const pdfBlob = pdfDoc.output('blob');
        console.log(`📄 PDF generated, size: ${pdfBlob.size} bytes`);

        const pdfBase64 = await blobToBase64(pdfBlob);
        console.log(`📄 PDF base64 length: ${pdfBase64.length}`);

        // Add PDF data separately with split MIME type and content
        const { mimeType: pdfMimeType, base64Content: pdfBase64Content } = splitBase64Data(pdfBase64);
        formData.pdfMimeType = pdfMimeType;
        formData.pdfBase64Content = pdfBase64Content;
        formData.pdfFileName = `KT_Form_${formData.employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

        console.log(`📄 PDF filename: ${formData.pdfFileName}`);
        console.log(`📄 PDF base64 content length: ${formData.pdfBase64Content?.length || 0}`);

        // Upload files to S3 (if available); on failure, fall back to base64 so webhook still receives data
        let s3Uploads = null;
        if (s3Client) {
            console.log('📤 Starting S3 uploads...');
            try {
                s3Uploads = await uploadAllFilesToS3(formData);
                if (!s3Uploads.pdf || !s3Uploads.pdf.s3Url) {
                    console.warn('⚠️ S3 PDF upload failed, sending PDF as base64 to webhook');
                    s3Uploads = null;
                }
            } catch (s3Error) {
                console.warn('⚠️ S3 upload failed:', s3Error?.message || s3Error, '- sending base64 to webhook');
                s3Uploads = null;
            }
        }
        if (!s3Uploads) {
            console.log('⚠️ S3 not available - using base64 data directly');
            // When S3 is not available, use base64 data from formData
            s3Uploads = {
                attachments: formData.attachments || [],
                pdf: {
                    fileName: formData.pdfFileName,
                    mimeType: formData.pdfMimeType,
                    base64Content: formData.pdfBase64Content
                },
                signature: formData.employeeSignature ? {
                    base64Content: formData.employeeSignature
                } : null
            };
            console.log(`📎 Attachments included: ${s3Uploads.attachments.length} files`);
        }

        if (s3Client && s3Uploads.pdf) {
            console.log('✅ PDF successfully generated and uploaded to S3');
            console.log(`📄 PDF S3 URL: ${s3Uploads.pdf.s3Url}`);
        } else if (s3Uploads.pdf && s3Uploads.pdf.base64Content) {
            console.log('✅ PDF generated with base64 data (S3 unavailable)');
        } else {
            console.log('⚠️ PDF data missing');
        }

        // Create webhook payload
        const webhookPayload = {
            formData: {
                employeeName: formData.employeeName,
                designation: formData.designation,
                department: formData.department,
                reportingManagerName: formData.reportingManagerName,
                reportingManagerEmail: formData.reportingManagerEmail,
                employeeId: formData.employeeId,
                dateOfJoining: formData.dateOfJoining,
                lastWorkingDay: formData.lastWorkingDay,
                currentResponsibilities: formData.currentResponsibilities,
                ongoingProjects: formData.ongoingProjects,
                toolsSystems: formData.toolsSystems,
                keyDocuments: formData.keyDocuments,
                sops: formData.sops,
                successor: formData.successor,
                areasHandedOver: formData.areasHandedOver,
                areasPending: formData.areasPending,
                employeeSignatureDate: formData.employeeSignatureDate,
                submissionDate: formData.submissionDate,
                formVersion: formData.formVersion
            },
            contacts: formData.contacts || [],
            accessCredentials: formData.accessCredentials || [],
            // Use S3 URLs if available, otherwise use base64 data
            attachments: s3Uploads.attachments,
            pdf: s3Uploads.pdf,
            employeeSignature: s3Uploads.signature,
            analytics: {
                sessionId: ANALYTICS.sessionId,
                submissionTime: new Date().toISOString(),
                performanceMetrics: ANALYTICS.performanceMetrics
            }
        };

        // Send to webhook only if PDF is successfully generated
        console.log('🚀 Sending webhook with complete data including PDF...');
        await sendToWebhook(webhookPayload);

        // Show success message
        showSuccessMessage();

    } catch (error) {
        console.error('Form submission error:', error);
        alert('There was an error submitting the form. Please try again.');
    } finally {
        isSubmitting = false;
        submitBtn.textContent = 'Submit Knowledge Transfer Form';
        submitBtn.disabled = false;
    }
}

// Collect form data
async function collectFormData() {
    const form = document.getElementById('ktForm');
    const formData = new FormData(form);

    // Convert FormData to object
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }

    // Add signature data
    if (employeeSignaturePad && !employeeSignaturePad.isEmpty()) {
        data.employeeSignature = employeeSignaturePad.toDataURL();
    }

    // Add contacts array
    data.contacts = collectContacts();

    // Add access array
    data.accessCredentials = collectAccessCredentials();

    // Add attachments array
    data.attachments = await collectAttachments();

    // Add metadata
    data.submissionDate = new Date().toISOString();
    data.formVersion = '1.0';

    return data;
}

// Collect contacts data
function collectContacts() {
    const contacts = [];
    const contactRows = document.querySelectorAll('.contact-row');

    contactRows.forEach(row => {
        const name = row.querySelector('input[name="contactName[]"]').value.trim();
        const email = row.querySelector('input[name="contactEmail[]"]').value.trim();

        if (name || email) {
            contacts.push({
                name,
                email
            });
        }
    });

    return contacts;
}

// Collect access credentials data
function collectAccessCredentials() {
    const access = [];
    const accessRows = document.querySelectorAll('.access-row');

    accessRows.forEach(row => {
        const credentials = row.querySelector('textarea[name="accessCredentials[]"]').value.trim();
        // Find the checked radio button in this row (handle both initial and dynamic names)
        const actionRadio = row.querySelector('input[type="radio"]:checked');
        const action = actionRadio ? actionRadio.value : '';

        if (credentials || action) {
            access.push({
                credentials,
                action
            });
        }
    });

    return access;
}

// Collect attachments data from accumulated files
async function collectAttachments() {
    const attachments = [];

    console.log(`📎 Collecting ${accumulatedFiles.length} attachments...`);

    for (const file of accumulatedFiles) {
        const base64 = await fileToBase64(file);
        const { mimeType, base64Content } = splitBase64Data(base64);

        attachments.push({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            mimeType: mimeType,
            base64Content: base64Content
        });
        console.log(`📎 Processed: ${file.name} (${formatFileSize(file.size)})`);
    }

    return attachments;
}

// Split base64 data into MIME type and content
function splitBase64Data(base64String) {
    const commaIndex = base64String.indexOf(',');
    if (commaIndex === -1) {
        // No comma found, treat as raw base64
        return {
            mimeType: 'application/octet-stream',
            base64Content: base64String
        };
    }

    const mimeType = base64String.substring(0, commaIndex);
    const base64Content = base64String.substring(commaIndex + 1);

    return {
        mimeType: mimeType,
        base64Content: base64Content
    };
}


// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Send data to webhook
async function sendToWebhook(data) {
    const startTime = Date.now();
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    try {
        console.log('🚀 Sending data to webhook:', requestId);
        console.log('📊 Data size:', JSON.stringify(data).length, 'characters');

        // Use the already structured payload passed from handleFormSubmission
        // The data is already properly structured with formData, contacts, etc.
        const structuredPayload = {
            // Core form data - use existing nested structure
            formData: data.formData || {},
            // Contacts array
            contacts: data.contacts || [],
            // Access credentials array
            accessCredentials: data.accessCredentials || [],
            // Attachments - use S3 URLs
            attachments: data.attachments || [],
            // PDF - use S3 URL
            pdf: data.pdf || {},
            // Employee signature - use S3 URL
            employeeSignature: data.employeeSignature,
            // Analytics with requestId
            analytics: {
                ...data.analytics,
                requestId: requestId
            }
        };

        // Check payload size
        const dataSize = JSON.stringify(structuredPayload).length;
        console.log('📦 Structured payload size:', dataSize, 'characters');

        // If payload is too large, create optimized version
        let payloadToSend = structuredPayload;
        if (dataSize > 10000000) { // 10MB limit
            console.warn('⚠️ Payload too large, creating optimized version...');
            payloadToSend = {
                ...structuredPayload,
                // Remove large base64 data but keep metadata
                attachments: (structuredPayload.attachments || []).map(att => ({
                    fileName: att.fileName,
                    fileSize: att.fileSize,
                    fileType: att.fileType,
                    s3Url: att.s3Url,
                    s3Key: att.s3Key
                })),
                pdf: structuredPayload.pdf ? {
                    fileName: structuredPayload.pdf.fileName,
                    s3Url: structuredPayload.pdf.s3Url,
                    s3Key: structuredPayload.pdf.s3Key
                } : null,
                employeeSignature: structuredPayload.employeeSignature ? {
                    s3Url: structuredPayload.employeeSignature.s3Url,
                    s3Key: structuredPayload.employeeSignature.s3Key
                } : null
            };
            console.log('📦 Optimized payload size:', JSON.stringify(payloadToSend).length, 'characters');
        }

        const webhookUrl = getWebhookUrl();
        const isProxy = webhookUrl.indexOf('/make-proxy') !== -1;
        console.log('📡 Sending to:', isProxy ? 'same-origin proxy' : 'direct webhook', webhookUrl);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            mode: isProxy ? 'cors' : 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadToSend)
        });

        const responseTime = Date.now() - startTime;
        ANALYTICS.webhookResponses.push({
            requestId: requestId,
            status: response.ok ? 'sent' : 'error',
            responseTime: responseTime,
            dataSize: dataSize,
            timestamp: new Date().toISOString()
        });

        if (isProxy && !response.ok) {
            const errText = await response.text();
            console.error('❌ Webhook proxy error:', response.status, errText);
            throw new Error(`Webhook returned ${response.status}: ${errText}`);
        }
        console.log('✅ Webhook request sent in', responseTime, 'ms', isProxy ? '(via proxy)' : '');
        console.log('📊 Payload structure:', {
            formData: Object.keys(structuredPayload.formData || {}).length + ' fields',
            contacts: (structuredPayload.contacts || []).length,
            accessCredentials: (structuredPayload.accessCredentials || []).length,
            attachments: (structuredPayload.attachments || []).length,
            hasPdf: structuredPayload.pdf && (structuredPayload.pdf.s3Url || structuredPayload.pdf.fileName) ? 'Yes' : 'No',
            hasSignature: structuredPayload.employeeSignature ? 'Yes' : 'No'
        });
        ANALYTICS.formSubmissions++;
        return { status: 'success', message: 'Structured data sent to webhook', requestId: requestId };

    } catch (error) {
        const responseTime = Date.now() - startTime;
        ANALYTICS.formErrors++;
        ANALYTICS.webhookResponses.push({
            requestId: requestId,
            status: 'error',
            error: error.message,
            responseTime: responseTime,
            timestamp: new Date().toISOString()
        });

        console.error('❌ Webhook error:', error);
        console.log('📊 Analytics summary:', {
            submissions: ANALYTICS.formSubmissions,
            errors: ANALYTICS.formErrors,
            sessionId: ANALYTICS.sessionId
        });

        throw error;
    }
}

// Show success message
function showSuccessMessage() {
    const form = document.getElementById('ktForm');
    const successMessage = document.getElementById('successMessage');
    const submissionDateElement = document.getElementById('submissionDate');

    form.style.display = 'none';
    successMessage.style.display = 'block';

    // Set the submission date
    if (submissionDateElement) {
        submissionDateElement.textContent = new Date().toLocaleString();
    }

    // Scroll to success message
    successMessage.scrollIntoView({ behavior: 'smooth' });

    // Log analytics summary
    console.log('📊 Form submission completed:', {
        sessionId: ANALYTICS.sessionId,
        submissions: ANALYTICS.formSubmissions,
        errors: ANALYTICS.formErrors,
        webhookResponses: ANALYTICS.webhookResponses.length,
        performance: ANALYTICS.performanceMetrics
    });
}

// Display analytics dashboard (for debugging)
function showAnalyticsDashboard() {
    const analytics = {
        sessionId: ANALYTICS.sessionId,
        formSubmissions: ANALYTICS.formSubmissions,
        formErrors: ANALYTICS.formErrors,
        webhookResponses: ANALYTICS.webhookResponses,
        performanceMetrics: ANALYTICS.performanceMetrics,
        timestamp: new Date().toISOString()
    };

    console.log('📊 ANALYTICS DASHBOARD:', analytics);

    // Create a simple dashboard in the console
    console.group('📊 KT Form Analytics Dashboard');
    console.log('Session ID:', analytics.sessionId);
    console.log('Form Submissions:', analytics.formSubmissions);
    console.log('Form Errors:', analytics.formErrors);
    console.log('Webhook Responses:', analytics.webhookResponses);
    console.log('Performance:', analytics.performanceMetrics);
    console.groupEnd();

    return analytics;
}

// Export analytics for external monitoring
function exportAnalytics() {
    return {
        sessionId: ANALYTICS.sessionId,
        formSubmissions: ANALYTICS.formSubmissions,
        formErrors: ANALYTICS.formErrors,
        webhookResponses: ANALYTICS.webhookResponses,
        performanceMetrics: ANALYTICS.performanceMetrics,
        timestamp: new Date().toISOString()
    };
}

// Make analytics available globally for debugging
window.KTFormAnalytics = {
    show: showAnalyticsDashboard,
    export: exportAnalytics,
    data: ANALYTICS
};

// S3 Upload Functions
async function uploadToS3(file, fileName, contentType) {
    if (!s3Client) {
        throw new Error('S3 client not initialized');
    }

    const key = `kt-forms/${Date.now()}-${fileName}`;
    const params = {
        Bucket: S3_CONFIG.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType
        // Note: ACL removed - bucket uses "Block all public access" by default
    };

    try {
        console.log(`📤 Uploading ${fileName} to S3...`);
        const result = await s3Client.upload(params).promise();

        // Construct the regional S3 URL
        const regionalUrl = `https://${S3_CONFIG.bucketName}.s3.${S3_CONFIG.region}.amazonaws.com/${result.Key}`;

        console.log(`✅ Upload successful: ${regionalUrl}`);
        return {
            url: regionalUrl,      // Return the regional S3 object URL
            key: result.Key,       // Return the key from S3 response
            bucket: result.Bucket  // Return the bucket from S3 response
        };
    } catch (error) {
        console.error(`❌ S3 upload failed for ${fileName}:`, error);
        throw error;
    }
}

async function uploadFileToS3(file) {
    return await uploadToS3(file, file.name, file.type);
}

async function uploadBase64ToS3(base64Data, fileName, contentType) {
    try {
        console.log(`🔍 Processing base64 for ${fileName}:`, {
            dataLength: base64Data?.length,
            hasComma: base64Data?.includes(','),
            contentType: contentType
        });

        // Convert base64 to blob
        let base64Content = base64Data;

        // Remove data URL prefix if present
        if (base64Data.includes(',')) {
            base64Content = base64Data.split(',')[1];
        }

        // Clean the base64 string (remove any whitespace/newlines)
        base64Content = base64Content.replace(/\s/g, '');

        console.log(`🔍 Cleaned base64 length: ${base64Content.length}`);

        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: contentType });

        console.log(`✅ Created blob for ${fileName}:`, { size: blob.size, type: blob.type });

        return await uploadToS3(blob, fileName, contentType);
    } catch (error) {
        console.error('❌ Base64 conversion failed:', error);
        console.error('❌ Base64 data sample:', base64Data?.substring(0, 100));
        throw new Error(`Failed to convert base64 data: ${error.message}`);
    }
}

// Function to upload all files to S3
async function uploadAllFilesToS3(formData) {
    const uploadResults = {
        attachments: [],
        pdf: null,
        signature: null
    };

    try {
        // Upload attachments
        if (formData.attachments && formData.attachments.length > 0) {
            console.log('📤 Uploading attachments to S3...');
            for (const attachment of formData.attachments) {
                if (attachment.base64Content) {
                    const uploadResult = await uploadBase64ToS3(
                        attachment.base64Content,
                        attachment.fileName,
                        attachment.fileType
                    );
                    console.log(`🔗 S3 Object URL for ${attachment.fileName}: ${uploadResult.url}`);
                    uploadResults.attachments.push({
                        fileName: attachment.fileName,
                        fileSize: attachment.fileSize,
                        fileType: attachment.fileType,
                        s3Url: uploadResult.url,
                        s3Key: uploadResult.key
                    });
                }
            }
        }

        // Upload PDF
        if (formData.pdfBase64Content) {
            console.log('📤 Uploading PDF to S3...');
            console.log(`📤 PDF base64 content length: ${formData.pdfBase64Content.length}`);
            console.log(`📤 PDF filename: ${formData.pdfFileName}`);

            const pdfUpload = await uploadBase64ToS3(
                formData.pdfBase64Content,
                formData.pdfFileName,
                'application/pdf'
            );
            console.log(`🔗 S3 Object URL for PDF: ${pdfUpload.url}`);
            uploadResults.pdf = {
                fileName: formData.pdfFileName,
                s3Url: pdfUpload.url,
                s3Key: pdfUpload.key
            };
        } else {
            console.warn('⚠️ No PDF base64 content found - PDF generation may have failed');
        }

        // Upload signature
        if (formData.employeeSignature) {
            console.log('📤 Uploading signature to S3...');
            const signatureUpload = await uploadBase64ToS3(
                formData.employeeSignature,
                `signature-${Date.now()}.png`,
                'image/png'
            );
            console.log(`🔗 S3 Object URL for Signature: ${signatureUpload.url}`);
            uploadResults.signature = {
                s3Url: signatureUpload.url,
                s3Key: signatureUpload.key
            };
        }

        console.log('✅ All files uploaded to S3 successfully');
        return uploadResults;

    } catch (error) {
        console.error('❌ S3 upload failed:', error);
        throw error;
    }
}

// Function to send large data separately if needed
async function sendLargeDataSeparately(formData, requestId) {
    const largeData = {
        requestId: requestId,
        employeeSignature: formData.employeeSignature,
        pdfBase64Content: formData.pdfBase64Content,
        attachments: formData.attachments ? formData.attachments.map(att => ({
            fileName: att.fileName,
            base64Content: att.base64Content
        })) : []
    };

    console.log('📎 Large data size:', JSON.stringify(largeData).length, 'characters');
    console.log('📎 This data can be sent separately if needed for processing');

    return largeData;
}

// Utility function to format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Helper function to convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Helper function to add company logo (if available)
function addCompanyLogo(doc, margin, yPosition, logoAreaHeight) {
    // Castellan Real Estate Group logo
    const hasLogo = true;
    const logoBase64 = 'data:image/jpeg;base64,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';

    if (hasLogo && logoBase64) {
        try {
            doc.addImage(logoBase64, 'JPEG', margin, yPosition, 60, logoAreaHeight);
            return true;
        } catch (error) {
            console.warn('Could not add logo to PDF:', error);
        }
    }

    // Fallback: Draw placeholder
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPosition, 60, logoAreaHeight, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('LOGO', margin + 20, yPosition + 25);
    return false;
}

// Generate PDF from form data
function generatePDF(formData) {
    const doc = new jsPDF();
    let yPosition = 15;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 25; // Increased margins for better appearance
    const contentWidth = pageWidth - (margin * 2);

    // Helper function to add text with word wrapping
    function addText(text, x = margin, y = yPosition, maxWidth = contentWidth, fontSize = 10) {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.setFontSize(fontSize);
        doc.text(lines, x, y);
        return y + (lines.length * (fontSize * 0.4)) + 5;
    }

    // Helper function to add section header
    function addSectionHeader(title, y = yPosition) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(37, 99, 235); // Blue color
        yPosition = addText(title, margin, y, contentWidth, 14);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0); // Black color
        return yPosition + 5;
    }

    // Helper function to add field
    function addField(label, value, y = yPosition) {
        if (!value) return y;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        yPosition = addText(`${label}:`, margin, y, contentWidth, 10);
        doc.setFont(undefined, 'normal');
        yPosition = addText(value, margin + 10, yPosition, contentWidth - 10, 10);
        return yPosition + 3;
    }

    // Company Logo Area (placeholder for logo)
    const logoAreaHeight = 40;
    const logoAreaY = yPosition;

    // Add company logo (or placeholder)
    addCompanyLogo(doc, margin, logoAreaY, logoAreaHeight);

    // Company Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(37, 99, 235);
    yPosition = addText('Castellan Real Estate Group', margin + 80, logoAreaY + 10, contentWidth - 80, 20);

    // Subtitle
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    yPosition = addText('Employee Knowledge Transfer Form', margin + 80, yPosition + 5, contentWidth - 80, 12);

    // Reset to normal styling
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    yPosition = logoAreaY + logoAreaHeight + 15;

    // Add company information
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    yPosition = addText('Real Estate Development & Management', margin + 80, yPosition + 5, contentWidth - 80, 9);
    yPosition = addText('Employee Exit Process Documentation', margin + 80, yPosition, contentWidth - 80, 9);

    // Add a separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition + 5, pageWidth - margin, yPosition + 5);
    yPosition += 15;

    // Section 1: Employee Details
    yPosition = addSectionHeader('Section 1: Employee Details');
    yPosition = addField('Employee Name', formData.employeeName, yPosition);
    yPosition = addField('Designation/Role', formData.designation, yPosition);
    yPosition = addField('Department/Team', formData.department, yPosition);
    yPosition = addField('Reporting Manager Name', formData.reportingManagerName, yPosition);
    yPosition = addField('Reporting Manager Email', formData.reportingManagerEmail, yPosition);
    yPosition = addField('Employee ID', formData.employeeId, yPosition);
    yPosition = addField('Date of Joining', formData.dateOfJoining, yPosition);
    yPosition = addField('Last Working Day', formData.lastWorkingDay, yPosition);

    // Check if we need a new page
    if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
    }

    // Section 2: Knowledge Transfer Overview
    yPosition = addSectionHeader('Section 2: Knowledge Transfer Overview');
    yPosition = addField('Current Responsibilities', formData.currentResponsibilities, yPosition);
    yPosition = addField('Ongoing Projects/Tasks', formData.ongoingProjects, yPosition);
    yPosition = addField('Tools/Systems Used', formData.toolsSystems, yPosition);
    yPosition = addField('Key Documents/Files Location', formData.keyDocuments, yPosition);
    yPosition = addField('Standard Operating Procedures', formData.sops, yPosition);

    // Check if we need a new page
    if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
    }

    // Section 3: Key Contacts
    yPosition = addSectionHeader('Section 3: Key Contacts');
    if (formData.contacts && formData.contacts.length > 0) {
        formData.contacts.forEach((contact, index) => {
            yPosition = addField(`Contact ${index + 1}`, `${contact.name} - ${contact.email}`, yPosition);
        });
    }

    // Section 4: Handover Details
    yPosition = addSectionHeader('Section 4: Handover Details');
    yPosition = addField('Successor/Replacement', formData.successor, yPosition);
    yPosition = addField('Areas Fully Handed Over', formData.areasHandedOver, yPosition);
    yPosition = addField('Areas Pending', formData.areasPending, yPosition);

    // Check if we need a new page
    if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
    }

    // Section 5: Access & Credentials
    yPosition = addSectionHeader('Section 5: Access & Credentials');
    if (formData.accessCredentials && formData.accessCredentials.length > 0) {
        formData.accessCredentials.forEach((access, index) => {
            yPosition = addField(`Access ${index + 1}`, `${access.credentials} (Action: ${access.action})`, yPosition);
        });
    }

    // Section 6: Digital Signatures
    yPosition = addSectionHeader('Section 6: Digital Signatures');
    yPosition = addField('Employee Signature Date', formData.employeeSignatureDate, yPosition);
    yPosition = addField('Submission Date', formData.submissionDate, yPosition);
    yPosition += 10;

    // Add employee signature image if available
    if (formData.employeeSignature) {
        try {
            console.log('Adding employee signature to PDF:', formData.employeeSignature.substring(0, 50) + '...');
            const imgWidth = 200;
            const imgHeight = 80;
            doc.addImage(formData.employeeSignature, 'PNG', margin, yPosition, imgWidth, imgHeight);
            yPosition += 90;
            console.log('Employee signature added to PDF successfully');
        } catch (error) {
            console.error('Error adding employee signature to PDF:', error);
            yPosition = addField('Employee Signature', '[Signature captured but could not be embedded]', yPosition);
        }
    } else {
        console.log('No employee signature data found for PDF');
        yPosition = addField('Employee Signature', '[No signature provided]', yPosition);
    }

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, doc.internal.pageSize.height - 10);
    }

    return doc;
}

// Global array to store accumulated files
let accumulatedFiles = [];

// Initialize file upload functionality
function initializeFileUpload() {
    const fileInput = document.getElementById('attachments');

    fileInput.addEventListener('change', function (e) {
        const newFiles = Array.from(e.target.files);

        // Check file sizes (limit to 5MB per file)
        const maxSize = 5 * 1024 * 1024; // 5MB
        const oversizedFiles = newFiles.filter(file => file.size > maxSize);

        if (oversizedFiles.length > 0) {
            alert(`Some files are too large (max 5MB each):\n${oversizedFiles.map(f => f.name).join('\n')}`);
        }

        // Filter valid files and check for duplicates
        const validFiles = newFiles.filter(file => {
            if (file.size > maxSize) return false;
            // Check if file already exists (by name and size)
            const isDuplicate = accumulatedFiles.some(
                existing => existing.name === file.name && existing.size === file.size
            );
            if (isDuplicate) {
                console.log(`⚠️ Skipping duplicate file: ${file.name}`);
            }
            return !isDuplicate;
        });

        // Add new valid files to accumulated array
        accumulatedFiles = [...accumulatedFiles, ...validFiles];
        console.log(`📎 Total files accumulated: ${accumulatedFiles.length}`);

        // Update the file input with all accumulated files
        updateFileInput();
        displayFileList();
    });
}

// Update file input with accumulated files
function updateFileInput() {
    const fileInput = document.getElementById('attachments');
    const dt = new DataTransfer();
    accumulatedFiles.forEach(file => dt.items.add(file));
    fileInput.files = dt.files;
}

// Set current date in signature date field
function setCurrentDate() {
    const dateInput = document.getElementById('employeeSignatureDate');
    if (dateInput) {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        dateInput.value = dateString;
    }
}

// Display selected files from accumulated array
function displayFileList() {
    const fileList = document.getElementById('fileList');

    if (accumulatedFiles.length === 0) {
        fileList.style.display = 'none';
        fileList.innerHTML = '';
        return;
    }

    fileList.innerHTML = '';
    fileList.style.display = 'block';

    // Add file count header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'file-list-header';
    headerDiv.innerHTML = `<strong>📎 ${accumulatedFiles.length} file(s) selected</strong>`;
    fileList.appendChild(headerDiv);

    accumulatedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button type="button" class="remove-file" onclick="removeFile(${index})">Remove</button>
        `;
        fileList.appendChild(fileItem);
    });

    // Add clear all button if multiple files
    if (accumulatedFiles.length > 1) {
        const clearAllDiv = document.createElement('div');
        clearAllDiv.className = 'file-list-footer';
        clearAllDiv.innerHTML = `<button type="button" class="clear-all-files" onclick="clearAllFiles()">Clear All Files</button>`;
        fileList.appendChild(clearAllDiv);
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Remove file from list
function removeFile(index) {
    accumulatedFiles.splice(index, 1);
    console.log(`📎 File removed. Remaining: ${accumulatedFiles.length}`);
    updateFileInput();
    displayFileList();
}

// Clear all files
function clearAllFiles() {
    accumulatedFiles = [];
    const fileInput = document.getElementById('attachments');
    fileInput.value = '';
    console.log('📎 All files cleared');
    displayFileList();
}

// Export functions for global access
window.removeContact = removeContact;
window.removeAccess = removeAccess;
window.removeFile = removeFile;
window.clearAllFiles = clearAllFiles;