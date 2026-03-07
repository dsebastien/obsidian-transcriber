export const SETTINGS_LABELS = {
    ollamaHeading: 'Ollama configuration',
    ollamaUrl: 'Server URL',
    ollamaUrlDesc: 'The URL of your Ollama server',
    model: 'Vision model',
    modelDesc: 'The Ollama vision model to use for transcription',
    testConnection: 'Test connection',
    testConnectionDesc: 'Verify that the Ollama server is reachable',
    testConnectionButton: 'Test',
    transcriptionHeading: 'Transcription settings',
    prompt: 'Transcription prompt',
    promptDesc: 'The prompt sent to the vision model along with each image',
    includeSubfolders: 'Include subfolders',
    includeSubfoldersDesc: 'When transcribing a folder, also process images in subfolders',
    overwriteExisting: 'Overwrite existing files',
    overwriteExistingDesc: 'Overwrite existing markdown files when re-transcribing images'
} as const
