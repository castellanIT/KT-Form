# Knowledge Transfer (KT) Form - Employee Exit Process

A comprehensive digital form for capturing employee knowledge transfer information during the exit process. This form includes digital signature functionality and webhook integration for automated data processing.

## Features

- **Complete KT Form**: All sections from the original form including employee details, knowledge transfer overview, key contacts, handover details, and access credentials
- **Digital Signatures**: Employee signature capture with canvas-based signing
- **Manager & HR Sign-off Placeholders**: Ready for future signature implementation
- **Dynamic Fields**: Add/remove contacts and access credentials as needed
- **Form Validation**: Real-time validation with error messages
- **Webhook Integration**: Automatic payload submission to configured webhook
- **Responsive Design**: Works on desktop and mobile devices
- **Professional Styling**: Clean, modern UI with blue color scheme

## Files Structure

```
KT Form/
├── index.html          # Main form HTML
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
└── README.md           # This documentation
```

## Setup Instructions

### 1. Configure Webhook URL

Edit the `script.js` file and update the webhook URL:

```javascript
const WEBHOOK_URL = 'https://your-webhook-url.com/endpoint';
```

Replace `https://your-webhook-url.com/endpoint` with your actual webhook URL.

### 2. Webhook Payload Format

The form sends a JSON payload with the following structure:

```json
{
  "employeeName": "John Doe",
  "designation": "Software Engineer",
  "department": "Engineering",
  "reportingManager": "Jane Smith",
  "dateOfJoining": "2022-01-15",
  "lastWorkingDay": "2024-01-15",
  "employeeId": "EMP001",
  "currentResponsibilities": "Full-stack development...",
  "ongoingProjects": "Project Alpha, Project Beta...",
  "toolsSystems": "VS Code, Git, Docker...",
  "keyDocuments": "Documentation in shared drive...",
  "sops": "Standard procedures...",
  "successor": "Alice Johnson",
  "areasHandedOver": "All development tasks...",
  "areasPending": "Client meetings scheduled...",
  "employeeSignature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "employeeSignatureDate": "2024-01-10",
  "contacts": [
    {
      "category": "Client",
      "name": "ABC Corp",
      "role": "Primary contact",
      "details": "john@abc.com"
    }
  ],
  "accessCredentials": [
    {
      "system": "Company Email",
      "type": "Admin",
      "action": "Transfer",
      "status": "Completed"
    }
  ],
  "submissionDate": "2024-01-10T10:30:00.000Z",
  "formVersion": "1.0"
}
```

### 3. Running the Form

1. Open `index.html` in a web browser
2. Fill out all required fields
3. Provide digital signature
4. Submit the form

## Form Sections

### Section 1: Employee Details
- Employee Name (required)
- Designation/Role (required)
- Department/Team (required)
- Reporting Manager (required)
- Date of Joining (required)
- Last Working Day (required)
- Employee ID (optional)

### Section 2: Knowledge Transfer Overview
- Current Responsibilities (required)
- Ongoing Projects/Tasks (required)
- Tools/Systems Used (required)
- Key Documents/Files Location (required)
- Standard Operating Procedures (required)

### Section 3: Key Contacts
- Dynamic table for adding contacts
- Category, Name/Department, Role/Relevance, Contact Details
- Add/Remove functionality

### Section 4: Handover Details
- Successor/Replacement (optional)
- Areas Fully Handed Over (required)
- Areas Pending with reason (required)

### Section 5: Access & Credentials
- Dynamic table for system access
- System/Tool, Type of Access, Action Required, Status
- Add/Remove functionality

### Section 6: Digital Signatures
- Employee signature (required)
- Manager sign-off placeholder
- HR sign-off placeholder

## Digital Signature

The form uses SignaturePad.js for digital signature capture:
- Canvas-based signature drawing
- Clear signature functionality
- Signature is captured as base64 image data
- Required for form submission

## Manager and HR Sign-off

Currently implemented as placeholders:
- Visual placeholders for future signature implementation
- Date fields are disabled for manager and HR sections
- Ready for backend integration

## Validation

- Real-time field validation
- Required field checking
- Signature validation
- Contact and access entry validation

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Touch-friendly signature capture

## Customization

### Styling
Edit `styles.css` to customize:
- Colors and themes
- Layout and spacing
- Typography
- Responsive breakpoints

### Functionality
Edit `script.js` to customize:
- Validation rules
- Webhook payload format
- Form behavior
- Error handling

## Security Considerations

- Validate webhook URLs
- Implement proper authentication for webhook endpoints
- Sanitize form data on the server side
- Consider HTTPS for production use

## Future Enhancements

- Manager and HR digital signature implementation
- Email notifications
- PDF generation
- Database integration
- User authentication
- Form versioning
- Audit trail

## Support

For technical support or customization requests, please refer to the development team.
