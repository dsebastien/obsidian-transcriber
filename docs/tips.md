---
title: Tips & best practices
nav_order: 90
---

# Tips and best practices

## Installing Ollama

1. Download Ollama from [ollama.com](https://ollama.com/)
2. Follow the installation instructions for your operating system
3. Start Ollama — it runs a local server on `http://localhost:11434` by default
4. Verify it's running: open a terminal and run `ollama list`

You do not need to install models via the terminal. The plugin handles model installation through the command palette and settings UI.

## Choosing a model

| Model                       | Size   | Best for                                  |
| --------------------------- | ------ | ----------------------------------------- |
| `maternion/LightOnOCR-2:1b` | ~1 GB  | Clean printed text, OCR-focused           |
| `qwen3.5:2b`                | ~2 GB  | Simple text extraction, fast results      |
| `qwen3.5:4b`                | ~3 GB  | Good balance of speed and quality         |
| `qwen3.5:9b` (default)      | ~6 GB  | Recommended starting point                |
| `qwen3.5:27b`               | ~17 GB | Complex documents, handwriting, diagrams  |
| `qwen3.5:35b`               | ~22 GB | Highest quality, requires significant RAM |

**General guidance:**

- Smaller models are faster but may struggle with handwriting, complex layouts, or low-quality images.
- Larger models need more RAM/VRAM. Ensure your machine has enough memory before installing large models.
- You can also install quantized variants (e.g. `qwen3.5:9b-q4_K_M`) for reduced memory usage at a slight quality trade-off.

You can install any of these from the command palette (**Install AI model**) or from **Settings > Transcriber** — no terminal needed.

## Getting better results

- **Use clear images**: Higher resolution and good contrast produce better transcriptions.
- **Customize the prompt**: If you're transcribing a specific type of content (e.g. handwritten notes, code screenshots, receipts), tailor the prompt to mention that context. See [Configuration](configuration.md) for details on the default prompt.
- **Try a larger model**: If results are poor with the default model, try a larger variant before adjusting the prompt.

## Performance

- Batch transcription processes up to 3 images concurrently. Large batches may take time depending on your hardware and model size.
- The first transcription after pulling a model may be slower as Ollama loads it into memory.
- Subsequent transcriptions are faster because Ollama keeps the model loaded.

## Troubleshooting

### "Connection failed" when testing

- Verify Ollama is running: `ollama list` in your terminal should return without error
- Check the server URL in settings matches your Ollama configuration (default: `http://localhost:11434`)
- If Ollama runs on a non-default port, update the URL accordingly

### Transcription produces poor results

- Try a larger model (e.g. upgrade from `qwen3.5:4b` to `qwen3.5:9b`)
- Customize the transcription prompt to be more specific about the content type
- Ensure the source image is clear and readable

### "Model not found" error

- Run **Install AI model** from the command palette, or install from **Settings > Transcriber**
- Alternatively, pull via CLI: `ollama pull qwen3.5:9b` (replace with your chosen model)
- Check for typos in the model name if using a custom model

### No "Transcribe image" option in context menu

- The option only appears when right-clicking image files (png, jpg, jpeg, gif, bmp, webp, avif, svg)
- The **Transcribe current image** command only appears in the command palette when an image file is currently open

### "No models installed" when selecting a model

- Run **Install AI model** from the command palette to download one
- Verify Ollama is running and reachable (use the **Test** button in settings)

### Model download seems stuck

- Large models can take a while to download depending on your internet connection
- The progress notice updates with download percentage — check that it's still progressing
- If the download fails, try again — Ollama resumes partial downloads
