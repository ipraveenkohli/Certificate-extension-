// content.js - Extracts data from certificate dashboard

// Check if we're on the certificate dashboard page
function isCertificateDashboard() {
  // Look for specific elements that indicate certificate dashboard
  const hasTrackingNo = document.body.textContent.includes('Tracking No:');
  const hasCertificateForm = document.body.textContent.includes('Certificate Sent') || 
                             document.body.textContent.includes('New Request');
  return hasTrackingNo && hasCertificateForm;
}

// Extract data from the dashboard
function extractCertificateData() {
  try {
    const data = {
      trackingNo: '',
      mobileNo: '',
      dateOfRequest: '',
      name: '',
      email: '',
      course: '',
      fromDate: '',
      toDate: '',
      scheduleText: ''
    };

    // Get all table cells
    const allCells = document.querySelectorAll('td');
    
    // Loop through cells to find data
    for (let i = 0; i < allCells.length; i++) {
      const cellText = allCells[i].textContent.trim();
      
      // Tracking Number
      if (cellText === 'Tracking No:' && allCells[i + 1]) {
        data.trackingNo = allCells[i + 1].textContent.trim();
      }
      
      // Mobile Number
      if (cellText === 'Mobile No:' && allCells[i + 1]) {
        data.mobileNo = allCells[i + 1].textContent.trim();
      }
      
      // Date of Request
      if (cellText === 'Date of Request:' && allCells[i + 1]) {
        data.dateOfRequest = allCells[i + 1].textContent.trim();
      }
      
      // Schedule
      if (cellText === 'Schedule' && allCells[i + 1]) {
        data.scheduleText = allCells[i + 1].textContent.trim();
        const dateMatch = data.scheduleText.match(/(\d{2}-\d{2}-\d{4})\s*to\s*(\d{2}-\d{2}-\d{4})/);
        if (dateMatch) {
          data.fromDate = dateMatch[1];
          data.toDate = dateMatch[2];
        }
      }
    }

   const allInputs = document.querySelectorAll('input[type="text"], input:not([type])');

allInputs.forEach(input => {
  const value = input.value.trim();
  const inputName = input.name ? input.name.toLowerCase() : "";
  const inputId = input.id ? input.id.toLowerCase() : "";

  // Get Course: Check if ID or Name contains "course"
  if (inputId.includes('course') || inputName.includes('course')) {
    data.course = value;
  }
  
  // Get Email: Check for @ or input type
  else if (value.includes('@') || input.type === 'email') {
    data.email = value;
  }

  // Get Name: Usually the field that isn't the others and has a space
  else if (value.includes(' ') && !value.includes('@')) {
    data.name = value;
  }
});

    console.log('Extracted Certificate Data:', data);
    return data;
  } catch (error) {
    console.error('Error extracting data:', error);
    return null;
  }
}

// Add "Generate Certificate" button to the dashboard
function addGenerateButton() {
  // Check if button already exists
  if (document.getElementById('cert-gen-button')) {
    return;
  }

  // Find a good location to add the button
  // Option 1: Look for buttons container
  let targetElement = document.querySelector('.btn-primary, button[type="submit"]');
  
  // Option 2: Look for the form or table
  if (!targetElement) {
    targetElement = document.querySelector('form, table');
  }

  if (targetElement) {
    const generateBtn = document.createElement('button');
    generateBtn.id = 'cert-gen-button';
    generateBtn.type = 'button'; // Prevent form submission
    generateBtn.className = 'cert-generate-btn';
    generateBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
      Generate Certificate
    `;
    
    generateBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleGenerateCertificate();
    };

    // Insert button based on what element we found
    if (targetElement.tagName === 'BUTTON') {
      // Insert after the button
      targetElement.parentNode.insertBefore(generateBtn, targetElement.nextSibling);
    } else {
      // Insert as first child of container
      targetElement.insertBefore(generateBtn, targetElement.firstChild);
    }

    console.log('Generate Certificate button added successfully!');
  } else {
    console.warn('Could not find suitable location for button');
  }
}

// Handle certificate generation
function handleGenerateCertificate() {
  const data = extractCertificateData();
  
  console.log('Certificate data extracted:', data);
  
  if (!data || !data.name || !data.email) {
    showNotification('Error: Unable to extract certificate data. Please ensure Name and Email fields are filled.', 'error');
    console.error('Missing required data:', data);
    return;
  }

  // Show loading state
  const btn = document.getElementById('cert-gen-button');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> Processing...';
  btn.disabled = true;

  // For now, just show the data (we'll connect to web app later)
  console.log('Ready to send this data to web app:', data);
  
  // Simulate processing
  setTimeout(() => {
    showNotification('Data extracted successfully! Check console for details.', 'success');
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    
    // Show what was extracted
    showDataPreview(data);
  }, 1000);

  /* 
  // UNCOMMENT THIS WHEN WEB APP IS READY:
  
  const webAppUrl = 'http://localhost:3000/api/generate'; // Change to Vercel URL later
  
  fetch(webAppUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      showNotification('Certificate generated successfully!', 'success');
      
      if (result.certificateUrl) {
        window.open(result.certificateUrl, '_blank');
      }
      
      setTimeout(() => {
        showEmailComposer(data, result.certificateUrl);
      }, 500);
    } else {
      showNotification('Error: ' + (result.error || 'Failed to generate certificate'), 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Error: Failed to connect to certificate service', 'error');
  })
  .finally(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  });
  */
}

// Show data preview modal
function showDataPreview(data) {
  const modal = document.createElement('div');
  modal.className = 'cert-email-modal';
  modal.innerHTML = `
    <div class="cert-email-modal-content">
      <div class="cert-email-modal-header">
        <h3>📊 Extracted Certificate Data</h3>
        <button class="cert-modal-close">&times;</button>
      </div>
      <div class="cert-email-modal-body">
        <div class="cert-email-preview">
          <p><strong>Name:</strong> ${data.name || 'Not found'}</p>
          <p><strong>Email:</strong> ${data.email || 'Not found'}</p>
          <p><strong>Course:</strong> ${data.course || 'Not found'}</p>
          <p><strong>Tracking No:</strong> ${data.trackingNo || 'Not found'}</p>
          <p><strong>Mobile No:</strong> ${data.mobileNo || 'Not found'}</p>
          <p><strong>From Date:</strong> ${data.fromDate || 'Not found'}</p>
          <p><strong>To Date:</strong> ${data.toDate || 'Not found'}</p>
          <p><strong>Date of Request:</strong> ${data.dateOfRequest || 'Not found'}</p>
        </div>
        <div class="cert-email-actions">
          <button class="cert-btn cert-btn-primary" id="close-preview">
            Got it! Data looks good
          </button>
        </div>
        <p class="cert-email-note">
          <strong>Note:</strong> This is a preview. Once the web app is ready, clicking "Generate Certificate" will create the actual PDF and open the email composer.
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  setTimeout(() => modal.classList.add('show'), 100);
  
  // Close modal handlers
  const closeBtn = modal.querySelector('.cert-modal-close');
  const closePreview = modal.querySelector('#close-preview');
  
  const closeModal = () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  };
  
  closeBtn.onclick = closeModal;
  closePreview.onclick = closeModal;
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `cert-notification cert-notification-${type}`;
  notification.innerHTML = `
    <div class="cert-notification-content">
      <span>${message}</span>
      <button class="cert-notification-close">&times;</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  const closeBtn = notification.querySelector('.cert-notification-close');
  closeBtn.onclick = () => notification.remove();
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Show email composer
function showEmailComposer(data, certificateUrl) {
  const modal = document.createElement('div');
  modal.className = 'cert-email-modal';
  modal.innerHTML = `
    <div class="cert-email-modal-content">
      <div class="cert-email-modal-header">
        <h3>📧 Send Certificate via Email</h3>
        <button class="cert-modal-close">&times;</button>
      </div>
      <div class="cert-email-modal-body">
        <div class="cert-email-preview">
          <p><strong>To:</strong> ${data.email}</p>
          <p><strong>Subject:</strong> Certificate of Completion - ${data.course}</p>
          <div class="cert-email-body">
            <p>Dear ${data.name.split(' ')[0]},</p>
            <p>I hope this message finds you well.</p>
            <p>Please find attached your certificate of completion for the ${data.course} program.</p>
            <p>Congratulations on your achievement, and thank you for your active participation. For your convenience, you may verify or track the authenticity of this certificate using the unique tracking ID provided on the document.</p>
            <p>Wishing you continued success in your future endeavours.</p>
            <p>Tracking number: ${data.trackingNo}</p>
            <br>
            <p>Regards,</p>
          </div>
        </div>
        <div class="cert-email-actions">
          <button class="cert-btn cert-btn-primary" id="compose-email-btn">
            📨 Compose in Outlook
          </button>
          <button class="cert-btn cert-btn-secondary" id="download-cert-btn">
            📥 Download Certificate Only
          </button>
        </div>
        <p class="cert-email-note">
          <strong>Note:</strong> You'll need to manually attach the downloaded certificate to the email.
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  setTimeout(() => modal.classList.add('show'), 100);
  
  // Close modal
  const closeBtn = modal.querySelector('.cert-modal-close');
  closeBtn.onclick = () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  };
  
  // Compose email in Outlook
  document.getElementById('compose-email-btn').onclick = () => {
    const subject = encodeURIComponent(`Certificate of Completion - ${data.course}`);
    const body = encodeURIComponent(
      `Dear ${data.name.split(' ')[0]},\n\n` +
      `I hope this message finds you well.\n\n` +
      `Please find attached your certificate of completion for the ${data.course} program.\n\n` +
      `Congratulations on your achievement, and thank you for your active participation. For your convenience, you may verify or track the authenticity of this certificate using the unique tracking ID provided on the document.\n\n` +
      `Wishing you continued success in your future endeavours.\n\n` +
      `Tracking number: ${data.trackingNo}\n\n\n` +
      `Regards,`
    );
    
    // Open Outlook mailto link
    window.location.href = `mailto:${data.email}?subject=${subject}&body=${body}`;
    
    // Also download the certificate
    if (certificateUrl) {
      window.open(certificateUrl, '_blank');
    }
    
    showNotification('Opening Outlook... Please attach the downloaded certificate.', 'info');
  };
  
  // Download certificate only
  document.getElementById('download-cert-btn').onclick = () => {
    if (certificateUrl) {
      window.open(certificateUrl, '_blank');
      showNotification('Certificate downloaded successfully!', 'success');
    }
  };
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Wait a bit for the page to fully render
  setTimeout(() => {
    if (isCertificateDashboard()) {
      console.log('Certificate dashboard detected!');
      addGenerateButton();
    } else {
      console.log('Not on certificate dashboard');
    }
  }, 1500);
}

// Also try when content loads
window.addEventListener('load', () => {
  setTimeout(() => {
    if (isCertificateDashboard() && !document.getElementById('cert-gen-button')) {
      console.log('Adding button after page load');
      addGenerateButton();
    }
  }, 1000);
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const data = extractCertificateData();
    sendResponse({ data });
  } else if (request.action === 'generateCertificate') {
    handleGenerateCertificate();
    sendResponse({ success: true });
  }
  return true;

});


/* // content.js - Extracts data from certificate dashboard

// Check if we're on the certificate dashboard page
function isCertificateDashboard() {
  // Look for specific elements that indicate certificate dashboard
  const hasTrackingNo = document.body.textContent.includes('Tracking No:');
  const hasCertificateForm = document.body.textContent.includes('Certificate Sent') || 
                             document.body.textContent.includes('New Request');
  return hasTrackingNo && hasCertificateForm;
}

// Extract data from the dashboard
function extractCertificateData() {
  try {
    const data = {
      trackingNo: '',
      mobileNo: '',
      dateOfRequest: '',
      name: '',
      email: '',
      course: '',
      fromDate: '',
      toDate: '',
      scheduleText: ''
    };

    // Get all table cells
    const allCells = document.querySelectorAll('td');
    
    // Loop through cells to find data
    for (let i = 0; i < allCells.length; i++) {
      const cellText = allCells[i].textContent.trim();
      
      // Tracking Number
      if (cellText === 'Tracking No:' && allCells[i + 1]) {
        data.trackingNo = allCells[i + 1].textContent.trim();
      }
      
      // Mobile Number
      if (cellText === 'Mobile No:' && allCells[i + 1]) {
        data.mobileNo = allCells[i + 1].textContent.trim();
      }
      
      // Date of Request
      if (cellText === 'Date of Request:' && allCells[i + 1]) {
        data.dateOfRequest = allCells[i + 1].textContent.trim();
      }
      
      // Schedule
      if (cellText === 'Schedule' && allCells[i + 1]) {
        data.scheduleText = allCells[i + 1].textContent.trim();
        const dateMatch = data.scheduleText.match(/(\d{2}-\d{2}-\d{4})\s*to\s*(\d{2}-\d{2}-\d{4})/);
        if (dateMatch) {
          data.fromDate = dateMatch[1];
          data.toDate = dateMatch[2];
        }
      }
    }

    // Get input field values
    const allInputs = document.querySelectorAll('input[type="text"], input:not([type])');
    
    allInputs.forEach(input => {
      const value = input.value.trim();
      
      // Name field - usually contains full name
      if (value && value.includes(' ') && !value.includes('@') && !value.includes('SAP') && !value.includes('AME')) {
        if (!data.name || value.length > data.name.length) {
          data.name = value;
        }
      }
      
      // Email field - contains @
      if (value && value.includes('@')) {
        data.email = value;
      }
      
      // Course field - usually all caps or contains course keywords
      if (value && (value.includes('SAP') || value.includes('AME') || value.includes('DESIGN') || 
          value === value.toUpperCase() && value.length > 3)) {
        data.course = value;
      }
    });

    console.log('Extracted Certificate Data:', data);
    return data;
  } catch (error) {
    console.error('Error extracting data:', error);
    return null;
  }
}

// Add "Generate Certificate" button to the dashboard
function addGenerateButton() {
  // Check if button already exists
  if (document.getElementById('cert-gen-button')) {
    return;
  }

  // Find a good location to add the button
  // Option 1: Look for buttons container
  let targetElement = document.querySelector('.btn-primary, button[type="submit"]');
  
  // Option 2: Look for the form or table
  if (!targetElement) {
    targetElement = document.querySelector('form, table');
  }

  if (targetElement) {
    const generateBtn = document.createElement('button');
    generateBtn.id = 'cert-gen-button';
    generateBtn.type = 'button'; // Prevent form submission
    generateBtn.className = 'cert-generate-btn';
    generateBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
      Generate Certificate
    `;
    
    generateBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleGenerateCertificate();
    };

    // Insert button based on what element we found
    if (targetElement.tagName === 'BUTTON') {
      // Insert after the button
      targetElement.parentNode.insertBefore(generateBtn, targetElement.nextSibling);
    } else {
      // Insert as first child of container
      targetElement.insertBefore(generateBtn, targetElement.firstChild);
    }

    console.log('Generate Certificate button added successfully!');
  } else {
    console.warn('Could not find suitable location for button');
  }
}

// Handle certificate generation
function handleGenerateCertificate() {
  const data = extractCertificateData();
  
  console.log('Certificate data extracted:', data);
  
  if (!data || !data.name || !data.email) {
    showNotification('Error: Unable to extract certificate data. Please ensure Name and Email fields are filled.', 'error');
    console.error('Missing required data:', data);
    return;
  }

  // Show loading state
  const btn = document.getElementById('cert-gen-button');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> Processing...';
  btn.disabled = true;

  // Send to web app for certificate generation
  const webAppUrl = 'http://localhost:3000/api/generate'; // Change to your Vercel URL after deployment
  
  fetch(webAppUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      showNotification('Certificate generated successfully!', 'success');
      
      // Show action buttons modal
      setTimeout(() => {
        showActionButtons(data, result.pdfBase64, result.fileName);
      }, 500);
    } else {
      showNotification('Error: ' + (result.error || 'Failed to generate certificate'), 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Error: Failed to connect to certificate service. Make sure the web app is running.', 'error');
  })
  .finally(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  });
}

// Show data preview modal
function showDataPreview(data) {
  const modal = document.createElement('div');
  modal.className = 'cert-email-modal';
  modal.innerHTML = `
    <div class="cert-email-modal-content">
      <div class="cert-email-modal-header">
        <h3>📊 Extracted Certificate Data</h3>
        <button class="cert-modal-close">&times;</button>
      </div>
      <div class="cert-email-modal-body">
        <div class="cert-email-preview">
          <p><strong>Name:</strong> ${data.name || 'Not found'}</p>
          <p><strong>Email:</strong> ${data.email || 'Not found'}</p>
          <p><strong>Course:</strong> ${data.course || 'Not found'}</p>
          <p><strong>Tracking No:</strong> ${data.trackingNo || 'Not found'}</p>
          <p><strong>Mobile No:</strong> ${data.mobileNo || 'Not found'}</p>
          <p><strong>From Date:</strong> ${data.fromDate || 'Not found'}</p>
          <p><strong>To Date:</strong> ${data.toDate || 'Not found'}</p>
          <p><strong>Date of Request:</strong> ${data.dateOfRequest || 'Not found'}</p>
        </div>
        <div class="cert-email-actions">
          <button class="cert-btn cert-btn-primary" id="close-preview">
            Got it! Data looks good
          </button>
        </div>
        <p class="cert-email-note">
          <strong>Note:</strong> This is a preview. Once the web app is ready, clicking "Generate Certificate" will create the actual PDF and open the email composer.
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  setTimeout(() => modal.classList.add('show'), 100);
  
  // Close modal handlers
  const closeBtn = modal.querySelector('.cert-modal-close');
  const closePreview = modal.querySelector('#close-preview');
  
  const closeModal = () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  };
  
  closeBtn.onclick = closeModal;
  closePreview.onclick = closeModal;
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `cert-notification cert-notification-${type}`;
  notification.innerHTML = `
    <div class="cert-notification-content">
      <span>${message}</span>
      <button class="cert-notification-close">&times;</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  const closeBtn = notification.querySelector('.cert-notification-close');
  closeBtn.onclick = () => notification.remove();
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Show email composer
function showEmailComposer(data, certificateUrl) {
  const modal = document.createElement('div');
  modal.className = 'cert-email-modal';
  modal.innerHTML = `
    <div class="cert-email-modal-content">
      <div class="cert-email-modal-header">
        <h3>📧 Send Certificate via Email</h3>
        <button class="cert-modal-close">&times;</button>
      </div>
      <div class="cert-email-modal-body">
        <div class="cert-email-preview">
          <p><strong>To:</strong> ${data.email}</p>
          <p><strong>Subject:</strong> Certificate of Completion - ${data.course}</p>
          <div class="cert-email-body">
            <p>Dear ${data.name.split(' ')[0]},</p>
            <p>I hope this message finds you well.</p>
            <p>Please find attached your certificate of completion for the ${data.course} program.</p>
            <p>Congratulations on your achievement, and thank you for your active participation. For your convenience, you may verify or track the authenticity of this certificate using the unique tracking ID provided on the document.</p>
            <p>Wishing you continued success in your future endeavours.</p>
            <p>Tracking number: ${data.trackingNo}</p>
            <br>
            <p>Regards,</p>
          </div>
        </div>
        <div class="cert-email-actions">
          <button class="cert-btn cert-btn-primary" id="compose-email-btn">
            📨 Compose in Outlook
          </button>
          <button class="cert-btn cert-btn-secondary" id="download-cert-btn">
            📥 Download Certificate Only
          </button>
        </div>
        <p class="cert-email-note">
          <strong>Note:</strong> You'll need to manually attach the downloaded certificate to the email.
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  setTimeout(() => modal.classList.add('show'), 100);
  
  // Close modal
  const closeBtn = modal.querySelector('.cert-modal-close');
  closeBtn.onclick = () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  };
  
  // Compose email in Outlook
  document.getElementById('compose-email-btn').onclick = () => {
    const subject = encodeURIComponent(`Certificate of Completion - ${data.course}`);
    const body = encodeURIComponent(
      `Dear ${data.name.split(' ')[0]},\n\n` +
      `I hope this message finds you well.\n\n` +
      `Please find attached your certificate of completion for the ${data.course} program.\n\n` +
      `Congratulations on your achievement, and thank you for your active participation. For your convenience, you may verify or track the authenticity of this certificate using the unique tracking ID provided on the document.\n\n` +
      `Wishing you continued success in your future endeavours.\n\n` +
      `Tracking number: ${data.trackingNo}\n\n\n` +
      `Regards,`
    );
    
    // Open Outlook mailto link
    window.location.href = `mailto:${data.email}?subject=${subject}&body=${body}`;
    
    // Also download the certificate
    if (certificateUrl) {
      window.open(certificateUrl, '_blank');
    }
    
    showNotification('Opening Outlook... Please attach the downloaded certificate.', 'info');
  };
  
  // Download certificate only
  document.getElementById('download-cert-btn').onclick = () => {
    if (certificateUrl) {
      window.open(certificateUrl, '_blank');
      showNotification('Certificate downloaded successfully!', 'success');
    }
  };
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Wait a bit for the page to fully render
  setTimeout(() => {
    if (isCertificateDashboard()) {
      console.log('Certificate dashboard detected!');
      addGenerateButton();
    } else {
      console.log('Not on certificate dashboard');
    }
  }, 1500);
}

// Also try when content loads
window.addEventListener('load', () => {
  setTimeout(() => {
    if (isCertificateDashboard() && !document.getElementById('cert-gen-button')) {
      console.log('Adding button after page load');
      addGenerateButton();
    }
  }, 1000);
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const data = extractCertificateData();
    sendResponse({ data });
  } else if (request.action === 'generateCertificate') {
    handleGenerateCertificate();
    sendResponse({ success: true });
  }
  return true;
});
*/
