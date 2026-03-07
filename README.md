# Transcriber for Obsidian

An Obsidian plugin that transcribes images to Markdown using local [Ollama](https://ollama.com/) vision models.

Point it at any image in your vault and get structured Markdown back — headings, lists, tables, code blocks — all extracted by a vision AI running on your own machine. No data leaves your computer.

## What it does

- **Transcribe a single image** via the command palette or right-click context menu
- **Batch-transcribe an entire folder** of images (with optional subfolder inclusion)
- **Creates a `.md` file** alongside each image with the transcribed content
- **Progress tracking** for batch operations with per-file status
- **Configurable prompt** so you can tailor the transcription instructions

## Supported models

Any [Qwen 3.5](https://ollama.com/library/qwen3.5) vision model running in Ollama, including:

`qwen3.5:latest`, `qwen3.5:0.8b`, `qwen3.5:2b`, `qwen3.5:4b`, `qwen3.5:9b`, `qwen3.5:27b`, `qwen3.5:35b`, `qwen3.5:122b`, `qwen3.5:397b-cloud`

Quantized variants (`q4_K_M`, `q8_0`, `bf16`) are also supported via the custom model input in settings.

## Prerequisites

- [Ollama](https://ollama.com/) installed and running locally
- A Qwen 3.5 vision model pulled (e.g. `ollama pull qwen3.5:9b`)
- Desktop Obsidian (this plugin is desktop-only)

## Getting started

1. Install the plugin from **Settings > Community plugins**
2. Enable it
3. Open **Settings > Transcriber** and verify the Ollama server URL (default: `http://localhost:11434`)
4. Click **Test** to confirm the connection
5. Choose your preferred model
6. Right-click any image in your vault and select **Transcribe image**

## Documentation

See the [user guide](docs/README.md) for detailed usage, configuration, and troubleshooting.

## Support

Created by [Sébastien Dubois](https://dsebastien.net).

<a href="https://www.buymeacoffee.com/dsebastien"><img src="https://github.com/dsebastien/obsidian-plugin-template/blob/main/src/assets/buy-me-a-coffee.png?raw=true" alt="Buy me a coffee" width="175"></a>

## License

MIT
