# Configuration

All settings are persisted via Obsidian's `loadData()`/`saveData()`.

## Ollama Configuration

| Setting              | Default                  | Description                                                     |
| -------------------- | ------------------------ | --------------------------------------------------------------- |
| Server URL           | `http://localhost:11434` | Ollama server address                                           |
| Test connection      | —                        | Verifies Ollama is reachable and refreshes installed model list |
| Vision model         | `qwen3.5:9b`             | Dropdown populated dynamically from installed Ollama models     |
| Recommended models   | —                        | Install buttons for recommended models not yet installed        |
| Install custom model | —                        | Enter any Ollama model name to download and install it          |

Recommended models: `maternion/LightOnOCR-2:1b`, `qwen3.5:2b`, `qwen3.5:4b`, `qwen3.5:9b`, `qwen3.5:27b`, `qwen3.5:35b`

Models can be installed directly from settings. Installed models are auto-detected via Ollama's `/api/tags` endpoint. Pull progress uses streaming `/api/pull` via native `fetch`.

## Transcription Settings

| Setting              | Default           | Description                                              |
| -------------------- | ----------------- | -------------------------------------------------------- |
| Transcription prompt | (detailed prompt) | Instructions sent to the vision model with each image    |
| Include subfolders   | `false`           | Process images in subfolders during folder transcription |
| Overwrite existing   | `false`           | Re-transcribe images that already have a `.md` file      |

## Constants

| Constant                      | Value                                     | Description                          |
| ----------------------------- | ----------------------------------------- | ------------------------------------ |
| MAX_CONCURRENT_TRANSCRIPTIONS | 3                                         | Max parallel transcription requests  |
| Supported image formats       | png, jpg, jpeg, gif, bmp, webp, avif, svg | File extensions recognized as images |
