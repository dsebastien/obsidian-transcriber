# Configuration

All settings are persisted via Obsidian's `loadData()`/`saveData()`.

## Ollama Configuration

| Setting              | Default                  | Description                                                     |
| -------------------- | ------------------------ | --------------------------------------------------------------- |
| Server URL           | `http://localhost:11434` | Ollama server address                                           |
| Test connection      | —                        | Verifies Ollama is reachable and refreshes installed model list |
| Vision model         | `glm-ocr:latest`         | Dropdown populated dynamically from installed Ollama models     |
| Recommended models   | —                        | Install buttons for recommended models not yet installed        |
| Install custom model | —                        | Enter any Ollama model name to download and install it          |

Recommended models: `glm-ocr:latest`, `maternion/LightOnOCR-2:1b`, `qwen3.5:2b`, `qwen3.5:4b`, `qwen3.5:9b`, `qwen3.5:27b`, `qwen3.5:35b`

Models can be installed directly from settings. Installed models are auto-detected via Ollama's `/api/tags` endpoint. Pull progress uses streaming `/api/pull` via native `fetch`.

## Transcription Settings

| Setting                      | Default           | Description                                                                                                            |
| ---------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Transcription prompt         | (detailed prompt) | Instructions sent to the vision model with each image                                                                  |
| Include subfolders           | `false`           | Process images in subfolders during folder transcription                                                               |
| Overwrite existing           | `false`           | Re-transcribe images that already have a `.md` file                                                                    |
| Frontmatter tags             | (empty)           | Comma-separated tags added to each transcription file                                                                  |
| Output folder                | (empty)           | Folder for the transcription files; empty = next to the image. Declarative `folder` control (1.13+), created on demand |
| File name prefix             | (empty)           | Text in front of each transcription file's name                                                                        |
| Insert into the current note | `false`           | Insert the text into the target note; no file is written. Never for folder transcriptions                              |

## Constants

| Constant                      | Value                                     | Description                          |
| ----------------------------- | ----------------------------------------- | ------------------------------------ |
| MAX_CONCURRENT_TRANSCRIPTIONS | 3                                         | Max parallel transcription requests  |
| Supported image formats       | png, jpg, jpeg, gif, bmp, webp, avif, svg | File extensions recognized as images |
