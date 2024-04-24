const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // Import 'node-fetch' for making HTTP requests
const path = require('path'); // Import the 'path' module
const cors = require('cors'); // Import the 'cors' middleware
const helmet = require('helmet'); // Helmet middleware

const app = express();
const PORT = 3001; // Choose any port you want

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Enable CORS for all origins
app.use(cors());

// Use helmet middleware to set Content Security Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'http://localhost:3000'] // Allow scripts from 'self' and 'http://localhost:3000'
    }
  })
);

// Function to send data to the OpenAI API
const sendToOpenAI = async (inputText) => {
  const apiKey = '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'; // Replace with your OpenAI API key
  const apiUrl = 'https://api.openai.com/v1/completions';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: inputText,
        model: "text-davinci-003",
        max_tokens: 150 // Adjust as needed
      })
    });

    const responseData = await response.json();
    console.log('Response from OpenAI:', responseData);
    return responseData; // Return the response data
  } catch (error) {
    console.error('Error sending data to OpenAI:', error);
    throw error; // Throw the error to handle it later
  }
};



// Route handler for the /sendToOpenAI endpoint
app.post('/sendToOpenAI', async (req, res) => {
  const inputData = req.body.inputData; // Assuming the input data is sent as { inputData: '...' }
  try {
    const response = await sendToOpenAI(inputData);
    res.json(response); // Respond with the response data from OpenAI
  } catch (error) {
    res.status(500).json({ error: 'Failed to send data to OpenAI' }); // Handle error
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
