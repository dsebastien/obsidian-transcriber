# Usage

## Commands

| Command                  | Description                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| Transcribe current image | Transcribes the currently active image file. Only appears when an image is open. |

## Context Menu

Right-click in the file explorer to access transcription actions:

- **On an image file**: "Transcribe image" — transcribes that single image
- **On a folder**: "Transcribe all images in folder" — batch-transcribes all images in the folder

## Transcribing a Single Image

1. Right-click an image in the file explorer and select **Transcribe image**, or open an image and use the command palette (**Transcribe current image**)
2. A notice appears while transcription is in progress
3. When complete, a `.md` file is created alongside the image with the same name (e.g. `photo.png` produces `photo.md`)

## Batch Folder Transcription

1. Right-click a folder in the file explorer and select **Transcribe all images in folder**
2. A progress notice shows the current file being processed (e.g. "Transcribing (3/12): photo.png")
3. Up to 3 images are processed concurrently
4. When complete, a summary notice shows how many succeeded and how many failed
5. Individual failures do not stop the batch — all images are attempted

### Subfolder handling

By default, only images directly in the selected folder are processed. Enable **Include subfolders** in settings to also process images in nested folders.

### Overwrite behavior

By default, images that already have a corresponding `.md` file are skipped. Enable **Overwrite existing files** in settings to re-transcribe and update existing output files.

## Supported Image Formats

`png`, `jpg`, `jpeg`, `gif`, `bmp`, `webp`, `avif`, `svg`
