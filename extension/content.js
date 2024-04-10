// content.js

// Listener for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeGptData') {
        // Logic to scrape GPT data from the current page
        const gptName = document.querySelector('.text-center.text-2xl.font-medium')?.innerText || 'Default GPT Name';
        const description = document.querySelector('.max-w-md.text-center.text-sm.font-normal.text-token-text-primary')?.innerText || 'Default Description';
        const url = window.location.href;
        sendResponse({ gptName, description, url });
    } else if (request.action === 'processCSVDataInContent') {
        // Logic to process CSV data in the content script, if needed
        processCSVData(request.data);
        sendResponse({ status: 'CSV data processed in content script' });
    }
    return true; // Keep the messaging channel open for asynchronous response
});

// Function to process CSV data within the content script
function processCSVData(csvData) {
    // TODO: Implement the logic to process CSV data within the content script
    // This function can manipulate the DOM based on the CSV data or perform other tasks
    console.log('CSV data received in content script:', csvData);
}

// Helper function to send data to the background script (if needed)
function sendDataToBackground(data) {
    chrome.runtime.sendMessage({ action: 'processDataInBackground', data: data });
}

// Add other necessary functions or logic for your content script
