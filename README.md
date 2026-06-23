# Portals

Portals is a sleek, modern Chrome extension for developers that allows you to seamlessly switch between Local, Staging, and Production environments with a single keyboard shortcut, completely preserving your current URL path and query parameters.

## Features

- 🎨 **Beautiful UI**: A premium, glassmorphism-inspired dark mode interface.
- ⌨️ **Keyboard Shortcuts**: Switch environments instantly using `Ctrl+Shift+1/2/3` (or `Cmd+Shift+1/2/3` on Mac).
- 🔄 **Smart Switching**: Automatically detects which project you're currently in based on your active tab.
- ⚙️ **No JSON Required**: Manage all your projects, environments, and domains directly within the extension's UI.
- 🧪 **Side-by-Side Compare**: Optionally open environments in a new tab for easy side-by-side comparison.

## Installation

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `src/` directory from this repository.

## Development

The project uses Vanilla HTML/CSS/JS for the extension itself to remain lightweight and fast, alongside modern Node.js tooling for asset generation and testing.

### Prerequisites

- Node.js (v18+)

### Setup

Install the required dependencies (Vitest):

```bash
npm install
```

### Scripts

- `npm run test`: Runs the Vitest suite to rigorously test the URL construction and edge-case logic.

## Project Structure

```text
/src                # The core extension directory (load this in Chrome)
  /assets/icons     # icons
  /background       # Background service worker logic
  /popup            # UI components (HTML, CSS, JS)
  /utils            # Shared utility logic
  manifest.json     # Chrome extension manifest
/tests              # Vitest test files
package.json        # Tooling dependencies
```
