// content.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeGptData') {
        console.log('Received scrape request');
        scrapeGptData().then(data => {
            console.log('Scraped data:', data);
            sendResponse({success: true, data: data});
        }).catch(error => {
            console.error('Error scraping data:', error);
            sendResponse({success: false, error: error.message});
        });
        return true; // Indicates we will send a response asynchronously
    }
});

async function scrapeGptData() {
    try {
        await waitForElement('.text-2xl.font-semibold');
        
        const gptName = document.querySelector('.text-2xl.font-semibold')?.innerText.trim() || '';
        const description = document.querySelector('.text-sm.font-normal.text-token-text-primary')?.innerText.trim() || '';
        const url = window.location.href;

        if (!gptName) throw new Error('Could not find GPT name');
        if (!description) throw new Error('Could not find GPT description');

        console.log('Scraped GPT Name:', gptName);
        console.log('Scraped Description:', description);
        console.log('Scraped URL:', url);

        return { gptName, description, url };
    } catch (error) {
        console.error('Error in scrapeGptData:', error);
        throw error;
    }
}

function waitForElement(selector) {
    return new Promise((resolve) => {
        if (document.querySelector(selector)) {
            return resolve();
        }

        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                resolve();
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}