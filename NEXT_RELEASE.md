You can now choose where the text of a transcription goes. The new settings are in Settings, Transcriber, under **Transcription settings**. They are all empty or off by default, so nothing changes until you set one. Thanks to bobhalford for the request.

### Put transcription files in one folder

With a large media folder, the `.md` files got lost among the images. Set **Output folder** and every transcription file goes to that folder, whatever folder the image is in. The folder is created if it does not exist. Leave it empty and each file stays next to its image, as before.

**File name prefix** adds text in front of the name of each transcription file: `OCR_` gives `OCR_photo.md`. It works with and without an output folder, and it cannot contain `\ / : * ? " < > |`.

One thing to know: with an output folder, two images that have the same name (in two different folders) share one transcription file. The second one is skipped, or replaces the first when **Overwrite existing files** is on.

### Insert the transcription into the current note

Turn on **Insert into the current note** and the text goes into your note. No separate file is created.

- **Transcribe all images in current note**: each transcription goes in a new paragraph right after its image, in the order of the note.
- **Transcribe this image** (right-click an image embed in the editor): the text goes after the image.
- **Transcribe image** (right-click an image in the file explorer): the text goes into the note you have open. It lands after the image if the note embeds it, at the cursor if it does not. Reading view has no cursor, so there the text goes at the end of the note.

If no note is open (for example, the image itself is the active tab), a file is created as usual. Folder transcriptions always create files. In this mode, the frontmatter tags are not added and an existing transcription file does not stop the transcription, so running the action twice inserts the text twice.

### The notice says where the text went

When a single image is done, the notice now shows the path of the transcription file, or the note the text was inserted into. It stays on screen for 10 seconds. It also tells you when an image was skipped because its transcription already exists (**Overwrite existing files** is off).

### Documentation

The documentation now recommends `glm-ocr:latest` as the default model.
