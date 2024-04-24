//service-worker.js
// Listen for the extension's installation to set up any initial configuration
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
      id: 'openSidePanel',
      title: 'Open side panel',
      contexts: ['all']
  });
  console.log("Sidepanel opened");
});

// Add a listener for incoming messages in service-worker.js or another background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sendToBackend') {
    // Handle the OpenAI API request here using message.inputText as the input text data
    const apiKey = 'lm-studio';
    const apiUrl = 'https://localhost:1234/v1/chat/completions';
    
    sendToOpenAI(message.inputText, apiKey, apiUrl); // Call the API request function
  }
});

async function fetchData(query) {
  // Replace this with your actual data fetching logic
  // For example, you might make an AJAX request to a server-side API
  return new Promise(resolve => {
      setTimeout(() => {
          resolve([
              { content: `Result for query "${query}"` }
          ]);
      }, 1000);
  });
  
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    fetchPageContent(tab.url);
  } 
});

async function fetchPageContent(url) {
  const response = await chrome.tabs.sendMessage(tabId, { action: "captureDom" });
  const html = response.domContent;
  // Pass the HTML content to your Retrieval Augmented Generative model
  // ...
}


chrome.tabs.executeScript(null, {
  code: `document.documentElement.innerHTML`,
}, (results) => {
  // Send the DOM content back to the extension
});