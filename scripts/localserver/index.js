const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json());

const API_KEY = 'lm-studio';  // Use your actual API key here
const MODEL_ID = 'mixtral-8x7b-instruct-v0.1.Q4_0.gguf'; // Example model

// Endpoint to handle chat completions
app.post('/chat', async (req, res) => {
  const { message_content } = req.body;
  try {
    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: MODEL_ID,
            messages: message_content
        })
    });

    if (response.ok) {
      const data = await response.json();
      res.json(data);
    } else {
      throw new Error('Failed to fetch from OpenAI');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing your request');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

