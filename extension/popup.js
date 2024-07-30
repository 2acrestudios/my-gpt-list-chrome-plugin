// popup.js - Version 2.2

// Establish connection with the background script
var port = chrome.runtime.connect({ name: "popup" });

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "refreshPopup") {
        loadGptLibraries();
    }
});

// Initial setup when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    loadGptLibraries();
    setupEventListeners();
});

// Setup all event listeners for UI interactions
function setupEventListeners() {
    document.getElementById('saveToCsvButton').addEventListener('click', handleSaveToCsvClick);
    document.getElementById('deleteAllButton').addEventListener('click', confirmDeleteAll);
    document.getElementById('importButton').addEventListener('click', importCsv);
    document.getElementById('exportButton').addEventListener('click', exportToCsv);
    setupSearch();
}

// Handle import of CSV file
function importCsv() {
    const fileInput = document.getElementById('csvFileInput');
    fileInput.click(); // Trigger file input click

    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();

            reader.onload = function(e) {
                Papa.parse(e.target.result, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        processCsvImport(results);
                    },
                    error: function(err, file, inputElem, reason) {
                        showStatusMessage('Error parsing CSV: ' + reason, 'error');
                    }
                });
            };

            reader.onerror = function() {
                showStatusMessage('Error reading file: ' + reader.error, 'error');
            };

            reader.readAsText(file);
        } else {
            showStatusMessage('No file selected', 'warning');
        }
    };
}

// Process CSV data after import
function processCsvImport(results) {
    console.log('Parsed CSV data:', results);
    if (results.data.length === 0) {
        showStatusMessage('No data found in the CSV file', 'error');
        return;
    }

    if (results.meta.fields.includes('gptName') && results.meta.fields.includes('description') && results.meta.fields.includes('url')) {
        importGptData(results.data);
    } else {
        showStatusMessage('CSV headers do not match expected structure', 'error');
    }
}

// Import GPT data to local storage
function importGptData(data) {
    chrome.storage.local.get({ gptDataList: [] }, function(result) {
        let gptDataList = result.gptDataList;
        let importedCount = 0;
        let updatedCount = 0;

        data.forEach(newItem => {
            const existingIndex = gptDataList.findIndex(item => item.url === newItem.url);
            if (existingIndex !== -1) {
                // Update existing entry
                gptDataList[existingIndex] = newItem;
                updatedCount++;
            } else {
                // Add new entry
                gptDataList.push(newItem);
                importedCount++;
            }
        });

        chrome.storage.local.set({ gptDataList: gptDataList }, function() {
            if (chrome.runtime.lastError) {
                showStatusMessage('Error saving imported data', 'error');
            } else {
                showStatusMessage(`Imported ${importedCount} new GPTs, updated ${updatedCount} existing GPTs`, 'success');
                loadGptLibraries(); // Refresh the displayed list
            }
        });
    });
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', function() {
        searchTable(searchInput.value);
    });
}

// Function to handle clicking the 'Save Current GPT' button
async function handleSaveToCsvClick() {
    showStatusMessage('Scraping GPT data...', 'info');

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            throw new Error('No active tab found');
        }

        const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapeGptData' });
        
        if (!response || !response.success) {
            throw new Error(response.error || 'Failed to scrape GPT data');
        }

        await saveGptDataToCsv(response.data);
        
        handleSuccessfulSave(response.data.gptName);
    } catch (error) {
        console.error('Error:', error);
        showStatusMessage('Error: ' + error.message, 'error');
    }
}

// Function to save GPT data to local storage
function saveGptDataToCsv(newData) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get({ gptDataList: [] }, function(result) {
            if (chrome.runtime.lastError) {
                return reject(new Error('Failed to access storage'));
            }

            let gptDataList = result.gptDataList;
            const existingIndex = gptDataList.findIndex(data => data.url === newData.url);

            if (existingIndex !== -1) {
                // Update existing entry
                gptDataList[existingIndex] = newData;
            } else {
                // Add new entry
                gptDataList.push(newData);
            }

            chrome.storage.local.set({ gptDataList: gptDataList }, function() {
                if (chrome.runtime.lastError) {
                    reject(new Error('Failed to save data'));
                } else {
                    resolve();
                }
            });
        });
    });
}

// Confirm deletion of all GPT data listings
function confirmDeleteAll() {
    if (confirm('Are you sure you want to delete all GPT listings?')) {
        deleteAllListings();
    }
}

// Delete all GPT data listings
function deleteAllListings() {
    chrome.storage.local.set({ gptDataList: [], csvData: [] }, function() {
        showStatusMessage('All GPT data deleted', 'success');
        loadGptLibraries();
    });
}

// Load GPT libraries into the popup
function loadGptLibraries() {
    chrome.storage.local.get({ gptDataList: [] }, function(result) {
        displayGptData(result.gptDataList);
    });
}

function displayGptData(dataList) {
    const tableBody = document.getElementById('gptTableBody');
    tableBody.innerHTML = '';
    if (dataList.length === 0) {
        showStatusMessage('No GPTs in your list. Add some!', 'info');
    } else {
        // Sort the dataList alphabetically by gptName
        dataList.sort((a, b) => a.gptName.localeCompare(b.gptName));
        
        dataList.forEach((data, index) => {
            const row = tableBody.insertRow();
            
            // GPT Name (linked)
            const nameCell = row.insertCell(0);
            const nameLink = document.createElement('a');
            nameLink.href = data.url;
            nameLink.textContent = data.gptName;
            nameLink.target = '_blank';
            nameCell.appendChild(nameLink);
            
            // Description
            const descCell = row.insertCell(1);
            descCell.textContent = data.description;
            
            // Actions (Open and Delete)
            const actionsCell = row.insertCell(2);
            
            const openLink = document.createElement('a');
            openLink.href = data.url;
            openLink.innerHTML = '&#8599;';
            openLink.target = '_blank';
            openLink.className = 'action-link';
            actionsCell.appendChild(openLink);
            
            const deleteLink = document.createElement('a');
            deleteLink.href = '#';
            deleteLink.innerHTML = '&#128465;';
            deleteLink.className = 'action-link';
            deleteLink.onclick = (e) => {
                e.preventDefault();
                confirmDeleteRow(data.url, index);
            };
            actionsCell.appendChild(deleteLink);
        });
    }
}

// Function to export GPT data to a CSV file
function exportToCsv() {
    chrome.storage.local.get({ gptDataList: [] }, function(result) {
        const gptDataList = result.gptDataList;
        const csv = Papa.unparse(gptDataList, {
            header: true,
            columns: ['gptName', 'description', 'url']
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'gpt_data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showStatusMessage('Data exported successfully', 'success');
    });
}

// Confirm deletion of a specific GPT listing
function confirmDeleteRow(url, index) {
    if (confirm(`Are you sure you want to delete this GPT?`)) {
        deleteRow(url);
    }
}

// Function to delete a specific GPT listing
function deleteRow(url) {
    chrome.storage.local.get({ gptDataList: [] }, function(result) {
        const gptDataList = result.gptDataList;
        const index = gptDataList.findIndex(item => item.url === url);
        if (index > -1) {
            const deletedGpt = gptDataList.splice(index, 1)[0];
            chrome.storage.local.set({ gptDataList: gptDataList }, function() {
                if (chrome.runtime.lastError) {
                    showStatusMessage('Error updating GPT data', 'error');
                } else {
                    showStatusMessage(`${deletedGpt.gptName} deleted successfully`, 'success');
                    loadGptLibraries();
                }
            });
        }
    });
}

// Search functionality for the table
function searchTable(keyword) {
    var table = document.getElementById('gptTable');
    var rows = table.getElementsByTagName('tr');
    var found = false;

    for (let i = 1; i < rows.length; i++) {
        var nameCell = rows[i].getElementsByTagName('td')[0];
        var descCell = rows[i].getElementsByTagName('td')[1];
        if (nameCell || descCell) {
            var nameText = nameCell.textContent || nameCell.innerText;
            var descText = descCell.textContent || descCell.innerText;
            if (nameText.toLowerCase().indexOf(keyword.toLowerCase()) > -1 || descText.toLowerCase().indexOf(keyword.toLowerCase()) > -1) {
                rows[i].style.display = "";
                found = true;
            } else {
                rows[i].style.display = "none";
            }
        }
    }

    if (!found && keyword !== '') {
        showStatusMessage('No matching GPTs found', 'info');
    } else if (keyword === '') {
        showStatusMessage('', 'clear'); // Clear any existing message
    }
}

// Function to show status messages
function showStatusMessage(message, type) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.style.display = message ? 'block' : 'none';
    
    // Add fade-out effect
    statusElement.classList.add('fade-out');
    
    // Remove the message after animation
    setTimeout(() => {
        statusElement.style.display = 'none';
        statusElement.classList.remove('fade-out');
    }, 3000);
}

// Function to handle successful GPT saving
function handleSuccessfulSave(gptName) {
    showStatusMessage(`${gptName} saved successfully!`, 'success');
    loadGptLibraries();
}

// Add this new function to handle the case when no GPTs are found
function handleNoGptsFound() {
    const tableBody = document.getElementById('gptTableBody');
    tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No GPTs found. Add some!</td></tr>';
}

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    loadGptLibraries();
    setupEventListeners();
});