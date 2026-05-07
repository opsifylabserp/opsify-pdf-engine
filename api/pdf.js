const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

module.exports = async function handler(req, res) {
  // 1. SECURITY: Open CORS so your Google Script can talk to this server
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Reject anything that isn't our POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    // 2. THE ENGINE: Boot up the invisible serverless Chrome Browser
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // 3. Paste the Apps Script HTML into the browser
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // 4. GENERATE: Print the perfect PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Forces your blue headers to print!
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' } // Zero margin since our HTML has its own padding
    });

    await browser.close();

    // 5. Send the PDF back to Google Apps Script
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error("PDF Engine Error:", error);
    res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
  }
};
