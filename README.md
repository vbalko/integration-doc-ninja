# Integration Doc Ninja

Integration Doc Ninja is a tool that automatically documents integration processes based on the source codes of those processes. It is a powerful tool that can save you time and effort, and help you to keep your integration documentation up-to-date.

## Functionality

1. **Automated iFlow Download**: The tool can automatically download iFlow through API, which is a standard format for integration processes.

2. **Mermaid Chart Creation**: The tool translates the iFlow into a Mermaid.js chart, providing a visual representation of the integration process.

3. **Automated Documentation**: The tool uses advanced AI algorithms to automatically generate comprehensive and understandable documentation for your integration processes. This ensures that your documentation is always up-to-date with your code.

## Installation

To install and run Integration Doc Ninja, follow these steps:

1. Clone the GitHub repository:

```bash
git clone https://github.com/vbalko/integration-doc-ninja.git
```

2. Navigate into the project directory:

```bash
cd integration-doc-ninja
```

3. Install the necessary npm packages:

```bash
npm install
```

4. Create a `.env` file in the root directory of the project and add your credentials. These credentials should be taken from your SAP BTP Integration Suite service instance - service key:

```bash
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
BASE_URL=your_base_url
TOKEN_URL=your_token_url
```

5. Run the code with the command line parameter which is the id of the iFlow:

```bash
node index.js your_iflow_id
```

## Contribution

Contributions to the project are welcome. Please ensure that you follow the existing code style and provide tests for any new or changed functionality.

## License

This project is licensed under the MIT License.