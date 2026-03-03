const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

// Handle the Proxy logic (previously your Netlify function)
app.get('/api/proxy', async (req, res) => {
  const GOOGLE_URL = process.env.GOOGLE_SCRIPT_URL;
  try {
    const response = await axios.get(GOOGLE_URL, { params: req.query });
    res.json(response.data);
  } catch (error) {
    res.status(502).json({ error: "Failed to reach Google" });
  }
});

// Serve static React files
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(3000, () => console.log('Server running on port 3000'));