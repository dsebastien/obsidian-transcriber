# Transcriber

Transcribe images in your vault to Markdown using local [Ollama](https://ollama.com/) vision models. Point it at any image and get structured Markdown back — headings, lists, tables, code blocks — all extracted by a vision AI running on your own machine. No data leaves your computer.

## What it does

- **Transcribe a single image** via the command palette or right-click context menu
- **Batch-transcribe an entire folder** of images (with optional subfolder inclusion)
- **Creates a `.md` file** alongside each image with the transcribed content
- **Install, select, and remove AI models** directly from the command palette — no terminal needed
- **Progress tracking** for batch operations with per-file status
- **Configurable prompt** so you can tailor the transcription instructions

## Recommended models

The plugin recommends these vision models for transcription:

`maternion/LightOnOCR-2:1b`, `qwen3.5:2b`, `qwen3.5:4b`, `qwen3.5:9b`, `qwen3.5:27b`, `qwen3.5:35b`

Any other Ollama vision model can be installed directly from the settings or via the Ollama CLI.

## Prerequisites

- [Ollama](https://ollama.com/) installed and running locally
- Desktop Obsidian (this plugin is desktop-only)

## Installation

### Community plugins (recommended)

1. In Obsidian, go to **Settings → Community plugins**.
2. Disable **Restricted mode** if it's enabled.
3. Select **Browse**, search for **Transcriber**, install it, then enable it.

You can also browse the catalog on the [Obsidian Community](https://community.obsidian.md/) website.

### Manual installation

If the plugin isn't listed in the community catalog yet (or you want a specific version):

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/dsebastien/obsidian-transcriber/releases).
2. Copy them into `<Vault>/.obsidian/plugins/image-transcriber/`.
3. Reload Obsidian and enable **Transcriber** in **Settings → Community plugins**.

### BRAT (bleeding edge)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Reviewers Auto-update Tool) installs plugins straight from a GitHub repo and keeps them updated automatically. Use this if you want the latest commits — **things might break**.

1. Install **Obsidian42 - BRAT** from **Settings → Community plugins → Browse** and enable it.
2. Run **BRAT: Add a beta plugin for testing** from the command palette.
3. Paste `https://github.com/dsebastien/obsidian-transcriber`.
4. Select the latest version and confirm.
5. Enable **Transcriber** in **Settings → Community plugins**.

## Getting started

1. Install the plugin (see [Installation](#installation) above).
2. Enable it
3. Open **Settings > Transcriber** and verify the Ollama server URL (default: `http://localhost:11434`)
4. Click **Test** to confirm the connection
5. Install a model: open the command palette (Ctrl/Cmd+P) and run **Install AI model**, or install from settings
6. Right-click any image in your vault and select **Transcribe image**

## Documentation

See the [user guide](docs/README.md) for detailed usage, configuration, and troubleshooting.

## Support

Created by [Sébastien Dubois](https://dsebastien.net).

<a href="https://www.buymeacoffee.com/dsebastien"><img src="src/assets/buy-me-a-coffee.png" alt="Buy me a coffee" width="175"></a>

## License

MIT
