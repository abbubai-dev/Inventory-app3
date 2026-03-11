const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const multer = require('multer');
const pdf = require('pdf-parse');
const upload = multer({ storage: multer.memoryStorage() });

// 1. Middleware
app.use(express.json());

// 2. Handle the Proxy logic (Login/Inventory/Checkout)
app.all('/api/proxy', async (req, res) => {
  const GOOGLE_URL = process.env.GOOGLE_SCRIPT_URL;
  if (!GOOGLE_URL) return res.status(500).json({ error: "Config missing" });

  try {
    const config = {
      method: req.method,
      url: GOOGLE_URL,
      params: req.query, // This handles ?action=getInventory
      maxRedirects: 5,
      // Logic for POST data
      data: req.method === 'POST' ? req.body : null,
      headers: { 'Content-Type': 'application/json' } 
    };

    const response = await axios(config);
    res.json(response.data);
  } catch (error) {
    // If Google sends back that HTML error, let's see why
    console.error("Proxy Error Details:", error.response?.data || error.message);
    res.status(502).json({ error: "Google Script rejected the request" });
  }
});

// 3. NEW ENDPOINT: PROCESS KEW.PS-8 PDF
// (Moved above the wildcard so it actually works)
app.post('/api/process-receipt', upload.single('invoice'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const data = await pdf(req.file.buffer);
    const text = data.text;
    const results = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      const cleanLine = line.trim();
      
      // KEW.PS-8 Pattern: Code/Name followed by Dimohon, Baki, Diluluskan, Diterima
      // We look for 4 numbers in a row and ignore anything after them (Catatan)
      const match = cleanLine.match(/(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)(.*)/);
      
      if (match) {
        results.push({
          item: match[1].trim(),      // The Item Name/Code
          quantity: parseInt(match[5]) // The 'Kuantiti Diterima'
        });
      }
    });

    res.json({ success: true, transferred: results });

  } catch (error) {
    console.error("PDF Processing Error:", error);
    res.status(500).json({ error: "Failed to parse PDF" });
  }
});

// 4. Serve static React files
app.use(express.static(path.join(__dirname, 'dist')));

// 5. Wildcard Route (MUST BE LAST)
// This serves the React SPA for any non-API request
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});