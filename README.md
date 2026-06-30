# Portals

Portals is a Chrome extension for switching between environments (Local, Staging, Production, or any custom set) while preserving the current page path, query string, and hash.

## What It Does

- Switches the active page to another environment with one click.
- Preserves URL path/search/hash when changing hosts.
- Supports multiple project profiles with custom environment lists.
- Auto-detects the active profile from the current tab's host.
- Opens targets in:
  - a new tab (default),
  - the current tab, or
  - side-by-side windows.

## Keyboard Shortcuts

Default extension commands:

- `Ctrl+Shift+1`, `Ctrl+Shift+2`, `Ctrl+Shift+3` (Mac: `Control+Shift+1/2/3`) to switch to environment 1-3.
- `split_env_1`, `split_env_2`, `split_env_3` commands are also available and can be bound from Chrome shortcuts.

Inside the popup:

- `S` opens Settings.
- `Esc` returns to the main view / closes dropdowns.
- `N` creates a new profile (in Settings view).
- `1-9` quickly switches to that environment index in the selected profile.

Configure extension command bindings at `chrome://extensions/shortcuts`.

## Installation (Load Unpacked)

1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `src/` folder from this repository.

## Usage

1. Open the extension popup.
2. Choose a profile (or create one in Settings).
3. Click an environment card to switch.
4. Choose your preferred behavior:
   - **Open side-by-side** (creates a second window arranged next to current),
   - **Open in new tab** (default), or
   - disable both to replace the current tab.

## Development

The extension is built with vanilla HTML/CSS/JavaScript (Manifest V3) and uses Vitest for unit tests.

### Prerequisites

- Node.js 18+

### Setup

```bash
npm install
```

### Test

```bash
npm run test
```

## Project Structure

```text
src/
  background/      # Service worker command handling
  popup/           # Popup UI (HTML/CSS/JS)
  utils/           # URL and window utility logic
  manifest.json    # Chrome extension manifest
tests/
  url.test.js      # URL utility tests
package.json
```
