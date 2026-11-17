export const SETTINGS_LABELS = {
    ollamaHeading: 'Ollama configuration',
    ollamaUrl: 'Server URL',
    ollamaUrlDesc: 'The URL of your Ollama server',
    model: 'Vision model',
    modelDesc: 'Select an installed Ollama vision model for transcription',
    noModelsFound: 'No models found. Start Ollama and test the connection.',
    testConnection: 'Test connection',
    testConnectionDesc: 'Verify that the Ollama server is reachable',
    testConnectionButton: 'Test',
    recommendedModels: 'Recommended models',
    recommendedModelsDesc:
        'Vision models known to work well for transcription. Click install to download.',
    installButton: 'Install',
    installingButton: 'Installing...',
    customModel: 'Install custom model',
    customModelDesc: 'Enter any Ollama model name to install it',
    customModelPlaceholder: 'e.g. llava:13b',
    transcriptionHeading: 'Transcription settings',
    prompt: 'Transcription prompt',
    promptDesc: 'The prompt sent to the vision model along with each image',
    includeSubfolders: 'Include subfolders',
    includeSubfoldersDesc: 'When transcribing a folder, also process images in subfolders',
    overwriteExisting: 'Overwrite existing files',
    overwriteExistingDesc: 'Overwrite existing markdown files when re-transcribing images',
    frontmatterTags: 'Frontmatter tags',
    frontmatterTagsDesc:
        'Comma-separated tags to add to the YAML frontmatter of transcribed files (e.g. reMarkable, transcription)',
    frontmatterTagsPlaceholder: 'reMarkable, transcription',
    outputFolder: 'Output folder',
    outputFolderDesc:
        'Folder for the transcription files. It is created when it does not exist. Leave empty to save each file next to its image.',
    outputFolderPlaceholder: 'Next to the image',
    outputFilePrefix: 'File name prefix',
    outputFilePrefixDesc:
        'Text added in front of the name of each transcription file, to make the files easy to find. Leave empty for no prefix.',
    outputFilePrefixPlaceholder: 'e.g. OCR_',
    outputFilePrefixInvalid: 'A file name prefix cannot contain \\ / : * ? " < > |',
    insertIntoNote: 'Insert into the current note',
    insertIntoNoteDesc:
        'Add the transcription to the note you work in and create no file: after the image when the note embeds it, at the cursor when it does not. Folder transcriptions always create files.'
} as const
