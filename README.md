# Flowser

<img src="assets/logo.svg" alt="flowser" width="100"/>

Flowser is a browser extension for automating web workflows with AI. It brings visual workflow automation to your browser, allowing you to create complex automations with ease.

## Features

- **Visual Workflow Editor**: Build workflows visually using a node-based editor powered by [Vue Flow](https://vueflow.dev/).
- **AI Integration**: Leverage powerful AI models from OpenAI, Anthropic, and Google Gemini to make your workflows smarter.
- **Browser Automation**: Interact with browser tabs, access active pages, and automate web tasks directly.
- **Local-First**: Your workflows run locally in your browser, ensuring privacy and speed.

## Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/)
- **Extension Framework**: [WXT](https://wxt.dev/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **UI Components**: [shadcn-vue](https://www.shadcn-vue.com/)

## Development

### Prerequisites

- Node.js (Latest LTS recommended)
- [pnpm](https://pnpm.io/)

### Installation

1. Clone the repository.
2. Install dependencies:

```bash
pnpm install
```

### Running in Development Mode

To start the extension in development mode with HMR (Hot Module Replacement):

```bash
# For Chrome (default)
pnpm dev

# For Firefox
pnpm dev:firefox
```

This will load the extension in a new browser instance.

### Building for Production

To build the extension for production:

```bash
pnpm build

# For Firefox
pnpm build:firefox
```

The output will be in the `.output` directory.

### Packaging

To create a zip file for distribution:

```bash
pnpm zip

# For Firefox
pnpm zip:firefox
```

## Structure

- `entrypoints/`: Contains the entry points for the extension (background script, content scripts, popup, options page, etc.).
- `components/`: Reusable Vue components.
- `assets/`: Static assets like images and styles.
- `wxt.config.ts`: WXT configuration file.
