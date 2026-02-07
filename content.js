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
    // Detect current domain
    const currentDomain = window.location.hostname;
    const data = {
      trackingNo: '',
      mobileNo: '',
      dateOfRequest: '',
      name: '',
      email: '',
      course: '',
      fromDate: '',
      toDate: '',
      issueDate: '', // [NEW] Added issueDate field
      scheduleText: '',
      domain: currentDomain
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
      // [NEW] Issue Date (if present in table)
      if (cellText === 'Issue Date:' && allCells[i + 1]) {
        data.issueDate = allCells[i + 1].textContent.trim();
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
    // Get input field values - match by name attribute first, then ID
    const allInputs = document.querySelectorAll('input[type="text"], input:not([type])');
    allInputs.forEach(input => {
      const value = input.value.trim();
      const inputId = input.id?.toLowerCase() || '';
      const inputName = input.name?.toLowerCase() || '';
      // Name field
      if ((inputName === 'username' || inputName === 'name' || inputId === 'username' || inputId.includes('name')) && value) {
        data.name = value;
      }
      // Course field
      if ((inputName.includes('course') || inputId.includes('course')) && value) {
        data.course = value;
      }
      // Email field
      if ((inputName.includes('email') || inputId.includes('email')) && value && value.includes('@')) {
        data.email = value;
      } else if (value && value.includes('@') && !data.email) {
        data.email = value;
      }
      // Mobile/Phone field
      if ((inputName.includes('mobile') || inputName.includes('phone') || inputId.includes('mobile') || inputId.includes('phone')) && value) {
        data.mobileNo = value;
      }
      // Start Date field
      if ((inputName.includes('start') || inputId.includes('start')) && value) {
        data.startDate = value;
      }
      // End Date field
      if ((inputName.includes('end') || inputId.includes('end')) && value) {
        data.endDate = value;
      }
      // [NEW] Issue Date field
      if ((inputName.includes('issue') && inputName.includes('date')) || (inputId.includes('issue') && inputId.includes('date')) && value) {
        data.issueDate = value;
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
  let targetElement = document.querySelector('.btn-primary, button[type="submit"]');
  if (!targetElement) {
    targetElement = document.querySelector('form, table');
  }
  if (targetElement) {
    const generateBtn = document.createElement('button');
    generateBtn.id = 'cert-gen-button';
    generateBtn.type = 'button';
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
    generateBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      handleGenerateCertificate();
    };
    if (targetElement.tagName === 'BUTTON') {
      targetElement.parentNode.insertBefore(generateBtn, targetElement.nextSibling);
    } else {
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

  // Ask for custom issue date if not already present or if user wants to override
  // (Optional: You can skip this if issueDate was found, but the requirement suggests asking)
  if (confirm('Do you want to provide a custom issue date?')) {
    const customDate = prompt('Please enter the custom issue date (DD-MM-YYYY):', data.issueDate || '');
    if (customDate) {
      data.issueDate = customDate;
    }
  }
  // Show loading state
  const btn = document.getElementById('cert-gen-button');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> Processing...';
  btn.disabled = true;
  // Send to web app for certificate generation
  const webAppUrl = 'http://localhost:3000/api/generate';
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
// Show action buttons modal
function showActionButtons(data, pdfBase64, fileName) {
  const modal = document.createElement('div');
  modal.className = 'cert-email-modal';
  modal.innerHTML = `
    <div class="cert-email-modal-content">
      <div class="cert-email-modal-header">
        <h3>✅ Certificate Generated Successfully!</h3>
        <button class="cert-modal-close">&times;</button>
      </div>
      <div class="cert-email-modal-body">
        <div class="cert-email-preview">
          <p><strong>Certificate Details:</strong></p>
          <p>📄 Name: ${data.name}</p>
          <p>📧 Email: ${data.email}</p>
          <p>📚 Course: ${data.course}</p>
          <p>🔢 Tracking: ${data.trackingNo}</p>
          ${data.issueDate ? `<p>📅 Issue Date: ${data.issueDate}</p>` : ''}
        </div>
        <div class="cert-email-actions">
          <button class="cert-btn cert-btn-primary" id="download-and-email-btn" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            📥📧 Download & Email Certificate
          </button>
          <button class="cert-btn cert-btn-secondary" id="download-only-btn" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;">
            📥 Download Only
          </button>
          <button class="cert-btn cert-btn-secondary" id="email-only-btn">
            📧 Compose Email (Manual Attach)
          </button>
        </div>
        <p class="cert-email-note">
          <strong>Tip:</strong> Use "Download & Email" for the quickest workflow!
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 100);
  // Download function
  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${pdfBase64}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Certificate downloaded successfully!', 'success');
  };
  // Email function
  const composeEmail = () => {
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
    window.location.href = `mailto:${data.email}?subject=${subject}&body=${body}`;
  };
  // Close modal
  const closeBtn = modal.querySelector('.cert-modal-close');
  closeBtn.onclick = () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  };
  // Download & Email button
  document.getElementById('download-and-email-btn').onclick = () => {
    downloadPDF();
    setTimeout(() => {
      composeEmail();
      showNotification('Opening Outlook... Please attach the downloaded certificate.', 'info');
    }, 1000);
  };
  // Download only button
  document.getElementById('download-only-btn').onclick = () => {
    downloadPDF();
  };
  // Email only button
  document.getElementById('email-only-btn').onclick = () => {
    composeEmail();
    showNotification('Opening Outlook... Remember to attach the certificate!', 'info');
  };
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
// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
function init() {
  setTimeout(() => {
    if (isCertificateDashboard()) {
      console.log('Certificate dashboard detected!');
      addGenerateButton();
    } else {
      console.log('Not on certificate dashboard');
    }
  }, 1500);
}
window.addEventListener('load', () => {
  setTimeout(() => {
    if (isCertificateDashboard() && !document.getElementById('cert-gen-button')) {
      console.log('Adding button after page load');
      addGenerateButton();
    }
  }, 1000);
});
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
