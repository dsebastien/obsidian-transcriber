# Configuration

All settings are available under **Settings > Transcriber**.

## Ollama Configuration

| Setting         | Type   | Default                  | Description                                                                           |
| --------------- | ------ | ------------------------ | ------------------------------------------------------------------------------------- |
| Server URL      | text   | `http://localhost:11434` | The URL of your Ollama server                                                         |
| Vision model    | select | `qwen3.5:9b`             | The Ollama vision model to use. Select from known models or enter a custom model name |
| Test connection | button | —                        | Verifies the Ollama server is reachable and reports available models                  |

### Known models

The dropdown includes all Qwen 3.5 vision-capable variants:

- `qwen3.5:latest` (6.6 GB, aliases 9b)
- `qwen3.5:0.8b` (1.0 GB)
- `qwen3.5:2b` (2.7 GB)
- `qwen3.5:4b` (3.4 GB)
- `qwen3.5:9b` (6.6 GB) — default
- `qwen3.5:27b` (17 GB)
- `qwen3.5:35b` (24 GB)
- `qwen3.5:122b` (81 GB)
- `qwen3.5:397b-cloud` (cloud-hosted)

Quantized variants (`q4_K_M`, `q8_0`, `bf16`) can be entered via the custom model text input.

## Transcription Settings

| Setting                  | Type   | Default     | Description                                                   |
| ------------------------ | ------ | ----------- | ------------------------------------------------------------- |
| Transcription prompt     | text   | (see below) | The prompt sent to the vision model along with each image     |
| Include subfolders       | toggle | off         | When transcribing a folder, also process images in subfolders |
| Overwrite existing files | toggle | off         | Overwrite existing `.md` files when re-transcribing images    |

### Default transcription prompt

The default prompt instructs the model to:

- Preserve all text content exactly as shown
- Use appropriate Markdown formatting (headings, lists, tables, code blocks)
- Maintain original document structure and hierarchy
- Describe diagrams or charts in detail
- Mark unclear text with `[unclear]`
- Output only the Markdown content with no commentary

You can customize this prompt to suit your specific use case (e.g. focus on handwriting, technical diagrams, or specific languages).
