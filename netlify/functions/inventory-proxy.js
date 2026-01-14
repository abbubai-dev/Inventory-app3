const axios = require('axios'); // You may need to run: npm install axios

exports.handler = async (event, context) => {
  // 1. Get the Apps Script URL from your environment variables (Security best practice)
  const API_URL = process.env.GOOGLE_SCRIPT_URL || process.env.VITE_APP_API_URL;
  
  // 2. Extract query parameters from the React request
  const queryString = new URLSearchParams(event.queryStringParameters).toString();
  const targetUrl = `${API_URL}?${queryString}`;

  try {
    let response;
    
    // 3. Handle GET requests
    if (event.httpMethod === 'GET') {
      response = await axios.get(targetUrl);
    } 
    // 4. Handle POST requests
    else if (event.httpMethod === 'POST') {
      response = await axios.post(targetUrl, event.body);
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // This is the magic header!
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};