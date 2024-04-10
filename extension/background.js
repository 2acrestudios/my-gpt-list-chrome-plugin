// background.js

let isPopupOpen = false;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    isPopupOpen = true;
    port.onDisconnect.addListener(() => {
      isPopupOpen = false;
    });
  }
});
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "processCSVData") {
    let csvData = request.data;
    console.log('Received CSV data:', csvData);
    
    // Store the CSV data
    chrome.storage.local.set({ "csvData": csvData }, function() {
      if (chrome.runtime.lastError) {
        console.error(`Error storing CSV data: ${chrome.runtime.lastError.message}`);
        sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
      } else {
        console.log("CSV data stored successfully.");
        sendResponse({ status: 'success' });
      }
    });
    return true; // Indicates that sendResponse will be called asynchronously
  }
});

chrome.action.onClicked.addListener((tab) => {
  // Ensure the tab ID is valid before trying to inject a content script
  if (tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }, () => {
      // This will execute the content.js file in the context of the current page
      if (chrome.runtime.lastError) {
        console.error(`Error injecting script: ${chrome.runtime.lastError.message}`);
      }
    });
  }
});