'use client';

import { useState } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    course: '',
    trackingNo: '',
    fromDate: '',
    toDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pdfData, setPdfData] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setPdfData(null);
    setDebugInfo(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Certificate generated successfully!');
        setPdfData({
          base64: result.pdfBase64,
          fileName: result.fileName
        });
        
        // Show debug info
        if (result.hasFormFields !== undefined) {
          setDebugInfo({
            hasFormFields: result.hasFormFields,
            fieldNames: result.fieldNames || [],
            domain: result.domain,
            templateUsed: result.templateUsed
          });
        }

        // Auto-download
        setTimeout(() => {
          downloadPDF(result.pdfBase64, result.fileName);
        }, 500);
      } else {
        setMessage('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error generating certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (base64, fileName) => {
    if (!base64) {
      if (pdfData) {
        base64 = pdfData.base64;
        fileName = pdfData.fileName;
      } else {
        return;
      }
    }
    
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const composeEmail = () => {
    const subject = encodeURIComponent(`Certificate of Completion - ${formData.course}`);
    const body = encodeURIComponent(
      `Dear ${formData.name.split(' ')[0]},\n\n` +
      `I hope this message finds you well.\n\n` +
      `Please find attached your certificate of completion for the ${formData.course} program.\n\n` +
      `Congratulations on your achievement, and thank you for your active participation. For your convenience, you may verify or track the authenticity of this certificate using the unique tracking ID provided on the document.\n\n` +
      `Wishing you continued success in your future endeavours.\n\n` +
      `Tracking number: ${formData.trackingNo}\n\n\n` +
      `Regards,`
    );
    
    window.location.href = `mailto:${formData.email}?subject=${subject}&body=${body}`;
  };

  const downloadAndEmail = () => {
    if (pdfData) {
      downloadPDF(pdfData.base64, pdfData.fileName);
      setTimeout(() => {
        composeEmail();
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl">
              📜
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Multisoft Certificate Generator</h1>
              <p className="text-sm text-purple-200">PDF Form Field Method - Professional Grade</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Generate Professional Certificates
            </h2>
            <p className="text-xl text-purple-200">
              Using PDF form field technology
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-800">PDF Template Required</p>
                  <p className="text-sm text-blue-700">
                    Place your PDF form template as <strong>certificate-template.pdf</strong> in the <strong>public</strong> folder.
                    <br/>If your PDF has fillable form fields, they will be auto-filled. Otherwise, text will be overlaid at coordinates.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="JOE ARUL VINO A"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Course */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="AME TANK DESIGN"
                  />
                </div>

                {/* Tracking Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Certificate ID *
                  </label>
                  <input
                    type="text"
                    name="trackingNo"
                    value={formData.trackingNo}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="202505749"
                  />
                </div>

                {/* From Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date * (DD-MM-YYYY)
                  </label>
                  <input
                    type="text"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="22-09-2025"
                  />
                </div>

                {/* To Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date * (DD-MM-YYYY)
                  </label>
                  <input
                    type="text"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="30-11-2025"
                  />
                </div>
              </div>

              {/* Debug Info */}
              {debugInfo && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                  <p className="font-semibold text-gray-700 mb-2">📋 Certificate Info:</p>
                  <div className="space-y-1 text-gray-600">
                    {debugInfo.domain && (
                      <p>🌐 Domain: <span className="font-mono text-xs">{debugInfo.domain}</span></p>
                    )}
                    {debugInfo.templateUsed && (
                      <p>📄 Template: <span className="font-mono text-xs">{debugInfo.templateUsed}</span></p>
                    )}
                    <p>
                      {debugInfo.hasFormFields ? (
                        <>
                          ✅ Form fields: {debugInfo.fieldNames.length} field(s)
                          <br />
                          <span className="text-xs text-gray-500">
                            {debugInfo.fieldNames.join(', ') || 'None'}
                          </span>
                        </>
                      ) : (
                        '📝 Using coordinate-based overlay'
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {message}
                </div>
              )}

              {/* Generate Button */}
              {!pdfData && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating Certificate...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate Certificate
                    </span>
                  )}
                </button>
              )}

              {/* Action Buttons */}
              {pdfData && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={downloadAndEmail}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                    </svg>
                    📥📧 Download & Email Certificate
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadPDF()}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    📥 Download Only
                  </button>

                  <button
                    type="button"
                    onClick={composeEmail}
                    className="w-full bg-white text-gray-700 font-semibold py-3 rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    📧 Compose Email (Manual Attach)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPdfData(null);
                      setMessage('');
                      setDebugInfo(null);
                    }}
                    className="w-full text-purple-600 font-semibold py-2 rounded-lg hover:bg-purple-50 transition-all"
                  >
                    ← Generate Another Certificate
                  </button>
                </div>
              )}
            </form>

            {/* Setup Instructions */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 How to Setup Your PDF Template:</h3>
              
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Method 1: PDF with Form Fields (Recommended)</h4>
                  <ol className="text-sm text-purple-800 space-y-1 list-decimal list-inside">
                    <li>Open your certificate in Adobe Acrobat Pro</li>
                    <li>Go to Tools → Prepare Form</li>
                    <li>Add text fields with these names:
                      <ul className="ml-6 mt-1 space-y-1 text-xs">
                        <li>• <code className="bg-purple-100 px-1 rounded">name</code> or <code className="bg-purple-100 px-1 rounded">studentName</code></li>
                        <li>• <code className="bg-purple-100 px-1 rounded">course</code> or <code className="bg-purple-100 px-1 rounded">courseName</code></li>
                        <li>• <code className="bg-purple-100 px-1 rounded">certificateId</code> or <code className="bg-purple-100 px-1 rounded">trackingNo</code></li>
                        <li>• <code className="bg-purple-100 px-1 rounded">fromDate</code> and <code className="bg-purple-100 px-1 rounded">toDate</code></li>
                        <li>• <code className="bg-purple-100 px-1 rounded">issueDate</code></li>
                      </ul>
                    </li>
                    <li>Save as <strong>certificate-template.pdf</strong></li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Method 2: Blank PDF (Coordinate-based)</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Create your certificate design (leave name/course blank)</li>
                    <li>Export as PDF</li>
                    <li>Save as <strong>certificate-template.pdf</strong></li>
                    <li>Text will be overlaid at predefined coordinates</li>
                    <li>Adjust coordinates in <code className="bg-blue-100 px-1 rounded text-xs">route.js</code> if needed</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-purple-200">
        <p>© 2026 Multisoft Systems • Certificate Generator v1.0 • PDF Method</p>
      </footer>
    </div>
  );
}
