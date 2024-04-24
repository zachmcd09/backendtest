// sendToLocalLLM.js
// Send a ready signal to the service worker
chrome.runtime.sendMessage({ action: "sendToOpenAi-Ready" });
class LlamaIndex {
  constructor(index) {
      this.index = new InvertedIndex(index);
  }

  async searchDocuments(query, k = 5) {
      return this.index.search(query, k);
  }
}

// Initialize the llama_index instance
const docStorage = new EmbeddingDocumentStorage(); // This will store documents as embeddings
const index = new LlamaIndex(new SimpleVectorScoreScorer());
docStorage.addToIndex(index);




let currentDomContent = "No DOM content available."; // domContent is a global variable that gets updated with the current DOM content.
let domUpdated = false; // Used to control token count and prevent over billing

// Function to update DOM content globally
function updateDomContent(newDomContent) {
  currentDomContent = newDomContent;
  domUpdated = true;
}

async function startConversationWithLocalLLM() { 
  const apiKey = 'not-needed'; 
  const apiUrl = 'http://localhost:1234/v1';

  let message_content = [
    { "role": "system", "content": "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful." },
    { "role": "user", "content": "Hello, introduce yourself to someone opening this program for the first time. Be concise." },
    { "role": "assistant", "content": "Hello! I am a codegemma-2b model trained on code. I am here to help you with your questions." },
  ];

  if (combinedContext !== "") {
    // Add combined context if available
    message_content.unshift({ "role": "system", "content": combinedContext });
  }

  // Data object containing the input text
  const data = {
    messages: message_content, 
    model: 'llama3:8b',
    max_tokens: 1024, // Adjust this as needed, it represents the maximum number of tokens (words) the model generates
    temperature: 0.4 // Adjust this as needed, it controls the randomness of the generated text
  };


  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(data),
      credentials: 'omit' // Ensure no cookies are sent
    });

    if (!response.ok) throw new Error('Network response was not ok');

    console.log('Conversation thread with Local LLM created');
    const responseData = await response.json();
    const content = responseData.choices[0].message.content; // Access the content from the response
    console.log('Greeting from Local LLM ', content);
    
    // Update conversation history with current interaction
    updateConversationHistory(inputText, content);


    // Display response in responseContainer
    const responseContainer = document.getElementById('responseContainer');
    responseContainer.innerHTML = `<p>${content}</p>`; // Displaying the content
  } catch (error) {
    console.error('Failed to create conversation thread with Local LLM:', error);
    const responseContainer = document.getElementById('responseContainer');
    responseContainer.innerHTML = `<p>Failed to create conversation thread with ChatGBT. Please try again later.</p>`; // Displaying error message to user
    console.error('Error type:', error.name); // Print the error type to console
  }
}

// Listens for message from service worker 
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sendDomToGBT") { // Message from service worker that contains the current DOM
    updateDomContent(message.domContent);
    console.log('sendToOpenAi.js - SUCCESS: Recieved DOM from service-worker.js. Now updating current DOM...');
    // console.log(message.domContent);
  }
  else if (message.action === "startGBTConvo") { // Message from service worker that says to start conversation with chatGBT
    startConversationWithLocalLLM(); 
  }
});


// Event listener for button click
document.getElementById('sendDataButton').addEventListener('click', function () {
  const textInput = document.getElementById('textInput');
  const inputData = textInput.value;

  // Asynchronously send the message
  sendtoLocalLLM(inputData).then(() => {
    textInput.value = ''; // Clear the input field after the message is sent
  }).catch(error => {
    console.error('Failed to send message:', error);
    textInput.value = ''; // Ensure input field is cleared even if sending fails
  });

  console.log('Sending message to OpenAi ChatGBT');
});

// Chat widget embed code
const chatWidgetScript = document.createElement('script');
chatWidgetScript.setAttribute('data-embed-id', '5fc05aaf-2f2c-4c84-87a3-367a4692c1ee');
chatWidgetScript.setAttribute('data-base-api-url', 'https://openai.com//*');
document.head.appendChild(chatWidgetScript);


// Function to update conversation history with each interaction
function updateConversationHistory(input, output) {
  conversationHistory.push({ input, output });
}

// Function to build conversation context from history
function buildConversationContext() {
  let context = "";
  for (const interaction of conversationHistory) {
    context += `${interaction.input}\n${interaction.output}\n`;
  }
  return context;
}


  async function sendtoLocalLLM(inputData, model = "codegemma/codegemma-2b", useGBT = false) {
    const apiKey = 'not-needed'; // Only used when useGBT is true
    const localUrl = 'http://localhost:5000/v1/chat/completions';
    let messages = inputData; // Assume inputData can be either a string or an array of message objects
    let apiEndpoint = localUrl;
    const headers = {
      'Content-Type': 'application/json',
      ...(useGBT && {'Authorization': `Bearer ${apiKey}`}) // Add auth header only when using GBT
  };

    // Build conversation context from history
    const conversationContext = buildConversationContext();

  if (useGBT) {
    messages = [
      {"role": "system", "content": "You are a virtual assistant who uses the DOM of the webpages a user visits as context."},
      {"role": "user", "content": messages} // Wrap the inputData in a user message object if it's a string
    ];
  } else {
    messages = messages.replace(/\\n/g, " "); // Replace newlines with spaces for local API
  }

  const data = useGBT ? {messages: messages, model: 'llama3:8b', max_tokens: 1024, temperature: 0.4} : {model: model, prompt: messages, max_tokens: max_tokens, temperature: temperature};

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
      credentials: useGBT ? 'omit' : undefined // Ensure no cookies are sent when using GBT
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const responseData = await response.json();
    let content;
    if (useGBT) {
      content = responseData.choices[0].message.content; // Parse GBT's nested response format
    } else {
      content = responseData.response; // Parse local API's flat response format
    }

    updateConversationHistory(inputData, content);
    displayResponse(content); // Abstracted DOM manipulation into a separate function
  } catch (error) {
    console.error(`Error sending data to ${apiEndpoint}:`, error);
    displayError('Failed to create conversation thread. Please try again later.');
    console.error('Error type:', error.name);
  }
}

function displayResponse(content) {
  const responseContainer = document.getElementById('responseContainer');
  responseContainer.innerHTML = `<p>${content}</p>`;
}

function displayError(message) {
  const responseContainer = document.getElementById('responseContainer');
  responseContainer.innerHTML = `<p>${message}</p>`;
}

async function getEmbedding(text, model = "nomic-ai/nomic-embed-text-v1.5-GGUF") {
  text = text.replace(/\\n/g, " "); // Replace newlines with spaces
  const response = await fetch(`http://localhost:5000/embdings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input: [text], model: model })
  });

  if (!response.ok) throw new Error('Network response was not ok');
  const data = await response.json();
  return data.embeddings[0].embedding;
}

// Listeners for messages from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sendDomToGBT") { // Message from service-worker.js that contains the current DOM
    updateDomContent(message.domContent);
    console.log('sendtoLocalLLM.js - SUCCESS: Recieved DOM from service-worker.js. Now updating current DOM...');
  }

  else if (message.action === "startGBTConvo") { // Message from service-worker.js that says to start conversation with chatGBT
    sendtoLocalLLM("Hello, I'm ready to chat!").then(() => {
      // Additional logic after starting the conversation
    });
  }
});

// Event listener for button click
document.getElementById('sendDataButton').addEventListener('click', function () {
  const textInput = document.getElementById('textInput');
  const inputData = textInput.value;

  // Asynchronously send the message
  sendToOpenAI(inputData).then(() => {
    textInput.value = ''; // Clear the input field after the message is sent
  }).catch(error => {
    console.error('Failed to send message:', error);
    textInput.value = ''; // Ensure input field is cleared even if sending fails
  });

  console.log('Sending message to OpenAi ChatGBT');
});




// Function
function handleUserInput(userMessage) {
    const newUserMessage = { "role": "user", "content": userMessage };
    addContextToHistory(newUserMessage).then(() => {
        return getContextForMessage(newUserMessage);
    }).then(contextMessage => {
        if (contextMessage) {
            message_content.push(contextMessage);
        }
        return sendChatCompletionToLLM(message_content);
    }).then(assistantMessage => {
        message_content.push({ "role": "assistant", "content": assistantMessage });
    }).catch(error => {
        console.error('An error occurred:', error);
    });
}

// Event listener or other pattern to handle user input asynchronous events
function handleUserInput(userMessage) {
  const newUserMessage = { "role": "user", "content": userMessage };
  
  getContextForMessage(newUserMessage).then(contextMessage => {
      if (contextMessage) {
          history.push(contextMessage);
      }
      
      // Use fetch to create chat completions
      fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              // Add any necessary headers for authentication
          },
          body: JSON.stringify({
              model: "bartowski/aixcoder-7b-GGUF",
              messages: message_content,
              temperature: 0.7
          })
      }).then(response => response.body.pipe(new Response()))
      .then(response => response.text())
      .then(text => {
          // Process the streamed text and update the assistant's message in history
          const newAssistantMessage = { "role": "assistant", "content": text };
          message_content.push(newUserMessage);
          message_content.push(newAssistantMessage);
      });
  });
}

// New function to add context to the message_content
function addContextToHistory(message) {
    return getContextForMessage(message).then(contextMessage => {
        if (contextMessage) {
            message_content.push(contextMessage);
        }
    });
}

// New function to send chat completion to OpenAI
function sendChatCompletionToLLM(message_content) {
    return fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Add any necessary headers for authentication
        },
        body: JSON.stringify({
            model: "bartowski/aixcoder-7b-GGUF",
            messages: message_content,
            temperature: 0.7
        })
    }).then(response => response.text()).then(text => text);
}


// Example usage for a Node.js environment or similar
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.prompt();

readline.on('line', (input) => {
    handleUserInput(input);
    readline.prompt();
}).on('close', () => {
    console.log('Have a great day!');
    process.exit(0);
});