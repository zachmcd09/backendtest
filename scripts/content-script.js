// content-script.js
function createDataHandler(requestType) {
  return function(url, data = {}) {
    const defaultOptions = {
      method: requestType,
      headers: { 'Content-Type': 'application/json' },
      ...(data && { body: JSON.stringify(data) })
    };
    return performRequest(url, defaultOptions);
  };
}

const fetch = createDataHandler('GET');
const post = createDataHandler('POST');

async function performRequest(url, options) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json(); // debugging return
  } catch (error) {
    console.error(`An error occurred while performing a request:`);
    throw error;
  }
}

function buildRequestOptions(method, url, body = {}) {
  return Object.assign({ method, headers: { 'Content-Type': 'application/json' } }, body);
}


// Function to update the DOM content of a specific element on the page
function updateDomContent(domElementId, newContent) {
  const domElement = document.getElementById(domElementId);
  if (domElement) {
    domElement.innerHTML = newContent;
    return true;
  } else {
    throw new Error(`Element with ID ${domElementId} not found in the DOM.`);
  }
}



async function withExponentialBackoff(task, maxAttempts = 3, initialDelay = 100) {
  let delay = initialDelay;
  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    try {
      return await task();
    } catch (error) {
      console.error(`Attempt ${attempts + 1} failed:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error('Maximum attempts reached. Task failed.');
}

async function captureAndSendDOM() {
  await withExponentialBackoff(async () => {
    const domContent = await captureDomContent();
    chrome.runtime.sendMessage({ action: 'update-dom', content: domContent });
  });
}


// Function to get the current URL of the active tab in the browser
async function getCurrentTabUrl(tabId) {
  let queryOptions = { active: true, currentWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  if (tab && tabId === tab.id) {
    return tab.url;
  } else {
    throw new Error('Could not find the current active tab.');
  }
}

// Function to capture DOM content from the page and send it to the background script
async function processDOMIfNewPage() {
  const url = await getCurrentTabUrl(tabId);
  if (url !== cachedUrl) {
    // Update the cached URL
    cachedUrl = url;
    try {
      await captureAndSendDOM();
    } catch (error) {
      console.error('Failed to process DOM for new page:', error);
    }
  } else {
    console.log('The current tab has not changed, no need to update the DOM content.');
  }
}

// Function to add context to the history without duplicates
async function addContextToHistory(message) {
  const contextMessage = await getContextForMessage(message);
  if (contextMessage && !history.has(contextMessage)) {
    history.push(contextMessage);
  }
}

// Function to send chat completion request to language generation model
async function sendChatCompletionToLLM(messages) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add any necessary headers for authentication
    },
    body: JSON.stringify({
      model: "bartowski/aixcoder-7b-GGUF",
      messages,
      temperature: 0.7
    })
  });
  return await response.text();
}

// Function to handle user input and start a conversation with the bot
async function handleUserInput(userMessage) {
  const newUserMessage = { "role": "user", "content": userMessage };

  try {
    await addContextToHistory(newUserMessage);
    const contextMessage = await getContextForMessage(newUserMessage);
    if (contextMessage) {
      history.push(contextMessage);
    }

    const assistantMessage = await sendChatCompletionToLLM([newUserMessage, ...history]);
    const newAssistantMessage = { "role": "assistant", "content": assistantMessage };

    console.log(`Assistant says: ${newAssistantMessage.content}`); // Log the assistant's response to the console
    history.push(newAssistantMessage);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Function to handle chat input via command line argument
const args = program.parse(process.argv);
async function run(args) {
  await handleUserInput(args._[0]); // Assuming user message is the first argument
  readlineInterface.close();
}

// Expose history and addContextToHistory for testing or further use if necessary
module.exports = {
  history: Array.from(history), // Use Array.from to create a shallow copy of the Set
  addContextToHistory,
  run
};


processDOMIfNewPage(); // Run at document end to ensure the DOM is fully loaded
