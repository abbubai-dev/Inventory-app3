const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

// 1. IMPORTANT: Allow Express to read POST data (JSON)
app.use(express.json());

// 2. Handle the Proxy logic (Supports both GET and POST)
app.all('/api/proxy', async (req, res) => {
  const GOOGLE_URL = process.env.GOOGLE_SCRIPT_URL;
  
  if (!GOOGLE_URL) {
    return res.status(500).json({ error: "GOOGLE_SCRIPT_URL is not defined in .env" });
  }

  try {
    const response = await axios({
      method: req.method,
      url: GOOGLE_URL,
      data: req.body,    // For POST requests (Login/Checkout)
      params: req.query  // For GET requests (OTP/Inventory)
    });
    res.json(response.data);
  } catch (error) {
    console.error("Proxy Error:", error.message);
    res.status(502).json({ error: "Failed to reach Google Sheets" });
  }
});

// 3. Serve static React files
app.use(express.static(path.join(__dirname, 'dist')));

// 4. FIX: Use regex for the wildcard to avoid Express 5 PathErrors
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});