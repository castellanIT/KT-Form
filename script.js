// Global variables
let employeeSignaturePad;
let isSubmitting = false;
const { jsPDF } = window.jspdf;

// Webhook URL - Replace with your actual webhook URL
const WEBHOOK_URL = 'https://hook.us1.make.com/507tywj448d3jkh9jkl4cj8ojcgbii1i';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeSignaturePad();
    initializeFormHandlers();
    initializeDynamicFields();
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
        document.getElementById('clearEmployeeSignature').addEventListener('click', function() {
            employeeSignaturePad.clear();
        });
    }
}

// Initialize form handlers
function initializeFormHandlers() {
    const form = document.getElementById('ktForm');
    
    form.addEventListener('submit', function(e) {
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

// Initialize dynamic fields (contacts and access)
function initializeDynamicFields() {
    // Add contact functionality
    document.getElementById('addContact').addEventListener('click', addContactRow);
    
    // Add access functionality
    document.getElementById('addAccess').addEventListener('click', addAccessRow);
    
    // Add file upload functionality
    initializeFileUpload();
}

// Add new contact row
function addContactRow() {
    const contactsList = document.getElementById('contactsList');
    const newRow = document.createElement('div');
    newRow.className = 'contact-row';
    newRow.innerHTML = `
        <input type="text" name="contactName[]" placeholder="Full Name" required>
        <input type="email" name="contactEmail[]" placeholder="email@example.com" required>
        <button type="button" class="remove-contact" onclick="removeContact(this)">Remove</button>
    `;
    contactsList.appendChild(newRow);
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
    const accessList = document.getElementById('accessList');
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
function clearFieldError(field) {
    field.classList.remove('error');
    const errorMessage = field.parentNode.querySelector('.error-message');
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
    if (isSubmitting) return;
    
    if (!validateForm()) {
        return;
    }
    
    isSubmitting = true;
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    try {
        // Collect form data
        const formData = await collectFormData();
        
        // Generate PDF
        const pdfDoc = generatePDF(formData);
        const pdfBlob = pdfDoc.output('blob');
        const pdfBase64 = await blobToBase64(pdfBlob);
        
        // Add PDF data separately with split MIME type and content
        const { mimeType: pdfMimeType, base64Content: pdfBase64Content } = splitBase64Data(pdfBase64);
        formData.pdfMimeType = pdfMimeType;
        formData.pdfBase64Content = pdfBase64Content;
        formData.pdfFileName = `KT_Form_${formData.employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Send to webhook
        await sendToWebhook(formData);
        
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

// Collect attachments data
async function collectAttachments() {
    const fileInput = document.getElementById('attachments');
    const files = Array.from(fileInput.files);
    const attachments = [];
    
    for (const file of files) {
        const base64 = await fileToBase64(file);
        const { mimeType, base64Content } = splitBase64Data(base64);
        
        attachments.push({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            mimeType: mimeType,
            base64Content: base64Content
        });
    }
    
    return attachments;
}

// Split base64 data into MIME type and content
function splitBase64Data(base64String) {
    const [mimeType, base64Content] = base64String.split(',');
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
    const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Handle both JSON and text responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    } else {
        // For text responses like "Accepted", just return the text
        const text = await response.text();
        console.log('Webhook response:', text);
        return { status: 'success', message: text };
    }
}

// Show success message
function showSuccessMessage() {
    const form = document.getElementById('ktForm');
    const successMessage = document.getElementById('successMessage');
    
    form.style.display = 'none';
    successMessage.style.display = 'block';
    
    // Scroll to success message
    successMessage.scrollIntoView({ behavior: 'smooth' });
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

// Generate PDF from form data
function generatePDF(formData) {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
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
    
    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(37, 99, 235);
    yPosition = addText('Knowledge Transfer (KT) Form - Employee Exit Process', margin, yPosition, contentWidth, 18);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    yPosition += 10;
    
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
    
    // Add signature image if available
    if (formData.employeeSignature) {
        try {
            // Add signature image
            const img = new Image();
            img.onload = function() {
                const imgWidth = 100;
                const imgHeight = 40;
                doc.addImage(formData.employeeSignature, 'PNG', margin, yPosition, imgWidth, imgHeight);
            };
            img.src = formData.employeeSignature;
            yPosition += 50;
        } catch (error) {
            console.error('Error adding signature to PDF:', error);
        }
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

// Initialize file upload functionality
function initializeFileUpload() {
    const fileInput = document.getElementById('attachments');
    const fileList = document.getElementById('fileList');
    
    fileInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        displayFileList(files);
    });
}

// Display selected files
function displayFileList(files) {
    const fileList = document.getElementById('fileList');
    
    if (files.length === 0) {
        fileList.style.display = 'none';
        return;
    }
    
    fileList.innerHTML = '';
    fileList.style.display = 'block';
    
    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button type="button" class="remove-file" onclick="removeFile(${index})">Remove</button>
        `;
        fileList.appendChild(fileItem);
    });
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
    const fileInput = document.getElementById('attachments');
    const files = Array.from(fileInput.files);
    files.splice(index, 1);
    
    // Create new FileList
    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));
    fileInput.files = dt.files;
    
    displayFileList(files);
}

// Export functions for global access
window.removeContact = removeContact;
window.removeAccess = removeAccess;
window.removeFile = removeFile;
