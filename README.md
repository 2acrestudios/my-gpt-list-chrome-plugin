# MY GPT LIST

<img src="https://2acrestudios.com/wp-content/uploads/2024/05/00024-377158633.png" align="right" style="width: 300px;" />
My GPT List is a Chrome extension designed to manage and interact with a library of GPTs at OpenAI. It allows users to import, export, and manipulate data regarding different custom GPTs stored as CSV files. This extension is ideal for researchers, developers, and enthusiasts interested in exploring different GPT configurations and their capabilities or just keeping your favorites close on hand.

## Features

- **Import CSV Files:** Import a CSV file containing details about GPT models.
- **Export Data to CSV:** Export your GPT model data to a CSV file for external use.
- **Search Functionality:** Quickly find GPT models on your list based on keywords.
- **Dynamic Data Handling:** Add new GPT model details or delete existing ones directly from the extension interface.
- **Background Script Interaction:** Runs scripts in the background to manage data storage and inter-script communication effectively.

## Installation

To install the GPT Library Navigator, follow these steps:
<img src="https://2acrestudios.com/wp-content/uploads/2024/05/00026-377158635.png" align="right" style="width: 300px;" />
1. **Download the Extension:** Clone this repository or download the ZIP file and extract it.
2. **Open Chrome Extensions Page:** Navigate to `chrome://extensions/` in your Google Chrome browser.
3. **Enable Developer Mode:** At the top right of the extensions page, toggle the "Developer mode" switch to the 'On' position.
4. **Load Unpacked Extension:** Click the "Load unpacked" button and select the extension directory where you've saved this project.

## How to Use

### Importing CSV Data

1. Click the 'Import' button in the extension popup.
2. Select a CSV file with the required structure (fields: gptName, description, url).

### Searching for GPT Models

1. Type the name or description of the GPT model in the 'Search' bar in the extension popup.

### Exporting Data

1. Click the 'Export' button to download a CSV file containing all the GPT model data stored in the extension.

### Adding New GPT Models

1. Navigate to the GPT model webpage.
2. Click the extension icon and use the '+' button to save the custom GPT model to your list.

## Structure of CSV Files

<img src="https://2acrestudios.com/wp-content/uploads/2024/05/00027-377158636.png" align="right" style="width: 300px;" />
The CSV files used for import and export should adhere to the following column structure:
- `gptName`: The name of the GPT model.
- `description`: A brief description of the model.
- `url`: URL to more details or the source of the GPT model.

## Contributing
Interested in contributing? Great! You can follow these steps to submit your contributions:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/fooBar`).
3. Commit your changes (`git commit -am 'Add some fooBar'`).
4. Push to the branch (`git push origin feature/fooBar`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
