// sendToBackendScript.js
console.log('This is a popup!');
const { runtime } = chrome;

async function sendtoLocalLLMWrapper(inputText) {
  try {
    // Call sendtoLocalLLM function, passing inputText as message content
    await sendtoLocalLLM(inputText);
  } catch (error) {
    console.error('Error sending data to Local LLM:', error);
    // Handle error here, e.g., display it to the user
  }
}

// New function name: sendToBackground
const sendToBackground = async (inputText) => {
  const apiUrl = 'http://localhost:3001/api/completions';
  const apiKey = 'not-needed'; // Replace with your actual API key
  try {
    // Define the message we want to send to the background script
    const message = { action: "sendToBackend", inputText };
    
    // Send a fetch request instead of using chrome.runtime.sendMessage
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: inputText,
        max_tokens: 150 // Adjust as needed
      })
    });

    const data = await response.json();
    console.log('Response from backend API:', data);
    // Handle response here, e.g., display it to the user
  } catch (error) {
    console.error('Error sending message to background script:', error);
    // Handle error
  }
};

// New event listener for sendDataButton click
document.getElementById('sendDataButton').addEventListener('click', async () => {
  const inputData = document.getElementById('textInput').value;
  await sendToBackground(inputData); // Call the new function with the input text value
});

// Chat widget embed code
const chatWidgetScript = document.createElement('script');
chatWidgetScript.setAttribute('data-embed-id', '5fc05aaf-2f2c-4c84-87a3-367a4692c1ee');
chatWidgetScript.setAttribute('data-base-api-url', 'http://localhost:3001/*');
chatWidgetScript.setAttribute('src', 'http://localhost:3000/embed/anythingllm-chat-widget.min.js');
document.head.appendChild(chatWidgetScript);
