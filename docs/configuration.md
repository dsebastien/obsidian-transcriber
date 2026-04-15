---
title: Configuration
nav_order: 3
---

# Configuration

All settings are available under **Settings > Transcriber**.

## Ollama Configuration

| Setting              | Type   | Default                  | Description                                                  |
| -------------------- | ------ | ------------------------ | ------------------------------------------------------------ |
| Server URL           | text   | `http://localhost:11434` | The URL of your Ollama server                                |
| Test connection      | button | —                        | Verifies the Ollama server is reachable and refreshes models |
| Vision model         | select | `qwen3.5:9b`             | Dropdown populated from installed Ollama models              |
| Recommended models   | list   | —                        | Install buttons for recommended models not yet installed     |
| Install custom model | text   | —                        | Enter any Ollama model name to install it                    |

### Model management

Models can be managed in two ways:

1. **Command palette** — Use the **Install AI model**, **Select AI model**, and **Remove AI model** commands for quick access without opening settings. See [Usage](usage.md) for details.
2. **Settings tab** — The sections below provide the same functionality within the settings UI.

The **Vision model** dropdown is populated dynamically from models installed in Ollama. When you open settings, the plugin queries Ollama for installed models. If the currently selected model is no longer installed, it appears in the dropdown with a "(not found)" warning.

The **Recommended models** section shows vision models known to work well for transcription that are not yet installed:

- `maternion/LightOnOCR-2:1b`
- `qwen3.5:2b`
- `qwen3.5:4b`
- `qwen3.5:9b` — default
- `qwen3.5:27b`
- `qwen3.5:35b`

Click **Install** next to any recommended model to download it directly. A progress notice shows download status.

You can also install any Ollama model by entering its name in the **Install custom model** field and clicking **Install**. This is useful for quantized variants (`q4_K_M`, `q8_0`, `bf16`) or other vision-capable models.

Once installed, the model is automatically selected and appears in the dropdown.

## Transcription Settings

| Setting                  | Type   | Default     | Description                                                   |
| ------------------------ | ------ | ----------- | ------------------------------------------------------------- |
| Transcription prompt     | text   | (see below) | The prompt sent to the vision model along with each image     |
| Include subfolders       | toggle | off         | When transcribing a folder, also process images in subfolders |
| Overwrite existing files | toggle | off         | Overwrite existing `.md` files when re-transcribing images    |

### Default transcription prompt

The default prompt tells the model it is an expert document transcriber and asks it to convert the image to Obsidian-flavored Markdown. Specifically, it instructs the model to:

- Preserve all text content exactly as shown
- Use appropriate Markdown formatting (headings, lists, tables, code blocks, links, etc.)
- Maintain the original document structure and hierarchy
- Transcribe handwritten text as accurately as possible
- Convert diagrams or charts to Mermaid syntax, describing them in detail if necessary
- Use `[unclear]` as a placeholder for illegible text
- Output **only** the transcribed Markdown — no comments, explanations, preamble, code fences, or framing text

You can customize this prompt to suit your specific use case (e.g. focus on handwriting, technical diagrams, or specific languages).
