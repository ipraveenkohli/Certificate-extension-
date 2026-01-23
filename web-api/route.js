import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email || !data.course || !data.trackingNo) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Detect which template to use based on domain
    const domain = data.domain || '';
    let templateFileName = 'certificate-template.pdf'; // Default
    
    if (domain.includes('multisoftsystems.com')) {
      templateFileName = 'certificate-multisoft.pdf';
    } else if (domain.includes('multisoftvirtualacademy.com')) {
      templateFileName = 'certificate-virtualacademy.pdf';
    }
    
    console.log(`Using template: ${templateFileName} for domain: ${domain}`);

    // Format dates
    const fromDateFormatted = formatDateWithSuperscript(data.fromDate);
    const toDateFormatted = formatDateWithSuperscript(data.toDate);
    
    // Auto-generate issue date as today's date
    const today = new Date();
    const currentDateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    const issueDateFormatted = formatDateWithSuperscript(currentDateStr);
    
    // For form fields, we need string versions
    const fromDateStr = formatDateWithSuffix(data.fromDate);
    const toDateStr = formatDateWithSuffix(data.toDate);
    const issueDateStr = formatDateWithSuffix(currentDateStr);

    // Load the PDF template
    const templatePath = path.join(process.cwd(), 'public', templateFileName);
    
    let templateBytes;
    try {
      templateBytes = fs.readFileSync(templatePath);
    } catch (error) {
      // Try default template if domain-specific not found
      console.log(`Template ${templateFileName} not found, trying default`);
      try {
        const defaultPath = path.join(process.cwd(), 'public', 'certificate-template.pdf');
        templateBytes = fs.readFileSync(defaultPath);
        templateFileName = 'certificate-template.pdf';
      } catch (err) {
        return NextResponse.json({
          success: false,
          error: `Certificate template not found. Please place ${templateFileName} in the public folder.`
        }, { status: 404 });
      }
    }

    // Load PDF
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Check if PDF has form fields
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    if (fields.length > 0) {
      // PDF has form fields - fill them
      console.log('Found form fields:', fields.map(f => f.getName()));
      
      try {
        // Try to fill common field names
        const fieldMappings = {
          'Full name': data.name.toUpperCase(),
          'studentName': data.name.toUpperCase(),
          'student_name': data.name.toUpperCase(),
          'Name': data.name.toUpperCase(),
          'course': data.course.toUpperCase(),
          'courseName': data.course.toUpperCase(),
          'course_name': data.course.toUpperCase(),
          'Course': data.course.toUpperCase(),
          'certificateId': data.trackingNo,
          'certificate_id': data.trackingNo,
          'trackingNo': data.trackingNo,
          'tracking number': data.trackingNo,
          'fromDate': fromDateStr,
          'from_date': fromDateStr,
          'start date': fromDateStr,
          'toDate': toDateStr,
          'to_date': toDateStr,
          'end date': toDateStr,
          'Issue Date': issueDateStr,
          'issue_date': issueDateStr
        };

        fields.forEach(field => {
          const fieldName = field.getName();
          if (fieldMappings[fieldName]) {
            try {
              const textField = form.getTextField(fieldName);
              textField.setText(fieldMappings[fieldName]);
            } catch (e) {
              console.log(`Could not set field ${fieldName}:`, e.message);
            }
          }
        });

        // Flatten form to make it non-editable
        form.flatten();
      } catch (error) {
        console.error('Error filling form fields:', error);
      }
    } else {
      // No form fields - overlay text at coordinates
      console.log('No form fields found, using coordinate-based overlay');
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      // Load Literata font files
      let font, regularFont;
      try {
        // Try to load custom Literata fonts from public folder
        const literataBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Literata-Bold.ttf');
        const literataRegularPath = path.join(process.cwd(), 'public', 'fonts', 'Literata-Regular.ttf');
        
        if (fs.existsSync(literataBoldPath) && fs.existsSync(literataRegularPath)) {
          const boldFontBytes = fs.readFileSync(literataBoldPath);
          const regularFontBytes = fs.readFileSync(literataRegularPath);
          
          font = await pdfDoc.embedFont(boldFontBytes);
          regularFont = await pdfDoc.embedFont(regularFontBytes);
          console.log('Using Literata font');
        } else {
          // Fallback to standard fonts if Literata not found
          console.log('Literata fonts not found, falling back to Helvetica');
          font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        }
      } catch (error) {
        console.log('Error loading Literata font, using Helvetica:', error.message);
        font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }
      
      // Draw text on PDF (adjust coordinates based on your template)
      const blue = rgb(0, 0.24, 0.36); // #003D5B
      const black = rgb(0, 0, 0);
      
      // Student Name (centered, large)
      firstPage.drawText(data.name.toTitleCase(), {
        x: width / 2 - (data.name.length * 6),
        y: height - 350,
        size: 28,
        font: font,
        color: blue,
      });
      
      // Course Name (centered)
      firstPage.drawText(data.course.toTitleCase(), {
        x: width / 2 - (data.course.length * 5),
        y: height - 280,
        size: 24,
        font: font,
        color: blue,
      });
      
      // Certificate ID (bottom left)
      firstPage.drawText(data.trackingNo, {
        x: 100,
        y: 60,
        size: 12,
        font: regularFont,
        color: black,
      });
      
      // Dates with superscript
      firstPage.drawText(fromDateFormatted, {
        x: 180,
        y: height - 450,
        size: 11,
        font: regularFont,
        color: black,
      });
      
      firstPage.drawText(toDateFormatted, {
        x: width - 250,
        y: height - 450,
        size: 11,
        font: regularFont,
        color: black,
      });
      
      // Issue Date (bottom right) with superscript
      firstPage.drawText(issueDateFormatted, {
        x: width - 200,
        y: 60,
        size: 11,
        font: regularFont,
        color: black,
      });
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const base64PDF = Buffer.from(pdfBytes).toString('base64');

    return NextResponse.json({
      success: true,
      pdfBase64: base64PDF,
      fileName: `${data.name.replace(/\s+/g, '_')}_${data.course.replace(/\s+/g, '_')}_${data.trackingNo}.pdf`,
      message: 'Certificate generated successfully',
      templateUsed: templateFileName,
      domain: domain,
      hasFormFields: fields.length > 0,
      fieldNames: fields.map(f => f.getName())
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate certificate: ' + error.message
    }, { status: 500 });
  }
}

function formatDateWithSuperscript(dateStr) {
  if (!dateStr) return '';
  
  try {
    let day, month, year;
    
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      day = parts[0];
      month = parts[1];
      year = parts[2];
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      day = parts[0];
      month = parts[1];
      year = parts[2];
    } else {
      return dateStr;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthIndex = parseInt(month) - 1;
    const monthName = monthNames[monthIndex] || month;
    
    const dayNum = parseInt(day);
    let suffix = 'th';
    
    if (dayNum === 1 || dayNum === 21 || dayNum === 31) {
      suffix = 'st';
    } else if (dayNum === 2 || dayNum === 22) {
      suffix = 'nd';
    } else if (dayNum === 3 || dayNum === 23) {
      suffix = 'rd';
    }
    
    // Return formatted string with regular ASCII suffix
    return `${dayNum}${suffix} ${monthName} ${year}`;
  } catch (error) {
    return '';
  }
}


// Legacy function for form fields (text-based)
function formatDateWithSuffix(dateStr) {
  if (!dateStr) return '';
  
  return formatDateWithSuperscript(dateStr);
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
