# Tips and Best Practices

## Choosing a Model

- **`qwen3.5:0.8b` / `qwen3.5:2b`** — Fast, low memory usage. Good for simple text extraction from clean images.
- **`qwen3.5:4b` / `qwen3.5:9b`** — Balanced speed and quality. Recommended starting point.
- **`qwen3.5:27b` / `qwen3.5:35b`** — Higher quality for complex documents, handwriting, or diagrams. Requires more RAM.
- **`qwen3.5:122b`** — Best quality but requires significant hardware (81 GB).

Smaller models are faster but may struggle with handwriting, complex layouts, or low-quality images.

## Getting Better Results

- **Use clear images**: Higher resolution and good contrast produce better transcriptions.
- **Customize the prompt**: If you're transcribing a specific type of content (e.g. handwritten notes, code screenshots, receipts), tailor the prompt to mention that context.
- **Try a larger model**: If results are poor with the default model, try a larger variant before adjusting the prompt.

## Performance

- Batch transcription processes up to 3 images concurrently. Large batches may take time depending on your hardware and model size.
- The first transcription after pulling a model may be slower as Ollama loads it into memory.

## Troubleshooting

### "Connection failed" when testing

- Verify Ollama is running: `ollama list` in your terminal
- Check the server URL in settings matches your Ollama configuration
- If Ollama runs on a non-default port, update the URL accordingly

### Transcription produces poor results

- Try a larger model (e.g. upgrade from `qwen3.5:4b` to `qwen3.5:9b`)
- Customize the transcription prompt to be more specific about the content type
- Ensure the source image is clear and readable

### "Model not found" error

- Pull the model first: `ollama pull qwen3.5:9b` (replace with your chosen model)
- Check for typos in the model name if using a custom model

### No "Transcribe image" option in context menu

- The option only appears when right-clicking image files (png, jpg, jpeg, gif, bmp, webp, avif, svg)
- The command palette command only appears when an image file is currently active/open
