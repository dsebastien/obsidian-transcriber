# Configuration

All settings are persisted via Obsidian's `loadData()`/`saveData()`.

## Ollama Configuration

| Setting      | Default                  | Description                                                                             |
| ------------ | ------------------------ | --------------------------------------------------------------------------------------- |
| Server URL   | `http://localhost:11434` | Ollama server address                                                                   |
| Vision model | `qwen3.5:9b`             | Model used for transcription. Dropdown includes known Qwen 3.5 models plus custom input |

Known models: `qwen3.5:latest`, `qwen3.5:0.8b`, `qwen3.5:2b`, `qwen3.5:4b`, `qwen3.5:9b`, `qwen3.5:27b`, `qwen3.5:35b`, `qwen3.5:122b`, `qwen3.5:397b-cloud`

"Test connection" button verifies Ollama is reachable and reports available model count.

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
