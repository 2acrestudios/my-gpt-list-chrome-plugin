// popup.js - Version 1.0

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
    loadGptLibraries(); // Load initial data
    setupEventListeners(); // Setup all event listeners
});

// Setup all event listeners for UI interactions
function setupEventListeners() {
    document.getElementById('saveToCsvButton').addEventListener('click', handleSaveToCsvClick);
    document.getElementById('deleteAllButton').addEventListener('click', deleteAllListings);
    document.getElementById('importButton').addEventListener('click', importCsv);
    document.getElementById('sortButton').addEventListener('click', sortTable);
    document.getElementById('exportButton').addEventListener('click', exportToCsv); // Event listener for export button
    setupSearch(); // Setup the search functionality
}

// Handle import of CSV file
function importCsv() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
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
                    console.error('Error parsing CSV:', err, reason);
                }
            });
        };

        reader.onerror = function() {
            console.error('Error reading file:', reader.error);
        };

        reader.readAsText(file);
    } else {
        console.log('No file selected.');
    }
}

// Process CSV data after import
function processCsvImport(results) {
    console.log('Parsed CSV data:', results);
    if (results.meta.fields.includes('gptName') && results.meta.fields.includes('description') && results.meta.fields.includes('url')) {
        chrome.runtime.sendMessage({ action: "processCSVData", data: results.data }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
            } else {
                console.log('Data processed response:', response);
                loadGptLibraries(); // Reload the table with the new data
            }
        });
    } else {
        console.error('CSV headers do not match expected structure:', results.meta.fields);
    }
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', function() {
        searchTable(searchInput.value);
    });
}

// Function to handle clicking the 'Save to CSV' button
async function handleSaveToCsvClick() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'scrapeGptData' }, function(response) {
            if (response) {
                saveGptDataToCsv(response);
            }
        });
    }
}

// Function to save GPT data to local storage
function saveGptDataToCsv(newData) {
    chrome.storage.local.get({ gptDataList: [] }, function(result) {
        const gptDataList = result.gptDataList;
        const exists = gptDataList.some(data => data.url === newData.url);
        if (!exists) {
            gptDataList.push(newData);
            chrome.storage.local.set({ gptDataList: gptDataList }, function() {
                console.log('New GPT data saved.');
                loadGptLibraries();
            });
        } else {
            console.log('Duplicate data. Not saved.');
        }
    });
}

// Delete all GPT data listings
function deleteAllListings() {
    chrome.storage.local.set({ gptDataList: [], csvData: [] }, function() {
        console.log('All GPT data deleted.');
        loadGptLibraries();  // Reload the table to reflect the changes
    });
}

// Load GPT libraries into the popup
function loadGptLibraries() {
    Promise.all([
        new Promise((resolve) => chrome.storage.local.get({ gptDataList: [] }, (result) => resolve(result.gptDataList))),
        new Promise((resolve) => chrome.storage.local.get({ csvData: [] }, (result) => resolve(result.csvData)))
    ]).then(([gptDataList, csvData]) => {
        displayCombinedData(gptDataList.concat(csvData));
    }).catch((error) => {
        console.error('Error loading GPT libraries:', error);
    });
}

// Function to export GPT data to a CSV file
function exportToCsv() {
    chrome.storage.local.get({ gptDataList: [] }, function(result) {
        const gptDataList = result.gptDataList;
        // Convert the data to CSV format
        const csv = Papa.unparse(gptDataList, {
            header: true,
            columns: ['gptName', 'description', 'url'] // Specify the order of columns
        });

        // Create a Blob with the CSV data
        const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        // Create a link element to download the Blob
        const csvUrl = URL.createObjectURL(csvBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = csvUrl;
        downloadLink.setAttribute('download', 'gpt_data.csv'); // Set the file name for the download
        document.body.appendChild(downloadLink); // Append the link to the body
        downloadLink.click(); // Programmatically click the link to trigger the download
        document.body.removeChild(downloadLink); // Remove the link after triggering the download
    });
}

// Display combined data in the table
function displayCombinedData(combinedDataList) {
    const tableBody = document.getElementById('gptTableBody');
    tableBody.innerHTML = ''; // Clear the table body before loading
    combinedDataList.forEach((data) => {
        // Check if the data object has the properties you're trying to access
        if (data.hasOwnProperty('url') && data.hasOwnProperty('gptName') && data.hasOwnProperty('description')) {
            const row = tableBody.insertRow();
            const nameCell = row.insertCell(0);
            const descCell = row.insertCell(1);
            const deleteCell = row.insertCell(2); // Cell for delete button

            const nameLink = document.createElement('a');
            nameLink.href = data.url; // Use the camelCase property name
            nameLink.textContent = data.gptName; // Use the camelCase property name
            nameLink.target = '_blank';
            nameCell.appendChild(nameLink);

            descCell.textContent = data.description; // Use the camelCase property name

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'X';
            deleteBtn.onclick = function() { deleteRow(data.url, combinedDataList); };
            deleteCell.appendChild(deleteBtn);
        } else {
            // Log the data object for debugging purposes
            console.error('Data object is missing required properties:', JSON.stringify(data));
        }
    });
}

// Function to delete a specific GPT listing
function deleteRow(url, combinedDataList) {
    // Find the index of the item with the matching URL
    const index = combinedDataList.findIndex(item => item['url'] === url);
    if (index > -1) {
      // Remove the item at the specified index
      combinedDataList.splice(index, 1);
      // Update the storage with the new list and reload the table
      chrome.storage.local.set({ gptDataList: combinedDataList, csvData: [] }, function() {
        if (chrome.runtime.lastError) {
          console.error('Error updating GPT data:', chrome.runtime.lastError);
        } else {
          console.log('GPT data updated after deletion.');
          loadGptLibraries(); // Reload the table to show the updated list
        }
      });
    }
  }

// Sort the table alphabetically by the GPT name
function sortTable() {
    var table = document.getElementById("gptTable");
    var rows, switching, i, x, y, shouldSwitch;
    switching = true;
    while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("TD")[0];
            y = rows[i + 1].getElementsByTagName("TD")[0];
            if (x.textContent.toLowerCase() > y.textContent.toLowerCase()) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}

// Search functionality for the table
function searchTable(keyword) {
    var table = document.getElementById('gptTable');
    var rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        var nameCell = rows[i].getElementsByTagName('td')[0];
        var descCell = rows[i].getElementsByTagName('td')[1];
        if (nameCell || descCell) {
            var nameText = nameCell.textContent || nameCell.innerText;
            var descText = descCell.textContent || descCell.innerText;
            if (nameText.toLowerCase().indexOf(keyword.toLowerCase()) > -1 || descText.toLowerCase().indexOf(keyword.toLowerCase()) > -1) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }
}
