import { Notice } from 'obsidian'
import type { TranscriberPlugin } from '../plugin'
import { showResultNotice } from '../ui/transcription-notices'

export function createTranscribeImageCommand(plugin: TranscriberPlugin): {
    id: string
    name: string
    checkCallback: (checking: boolean) => boolean | void
} {
    return {
        id: 'transcribe-current-image',
        name: 'Transcribe current image',
        checkCallback(checking: boolean): boolean | void {
            const activeFile = plugin.app.workspace.getActiveFile()

            if (!activeFile || !plugin.transcriptionService.isImageFile(activeFile)) {
                return false
            }

            if (checking) {
                return true
            }

            void (async () => {
                new Notice(`Transcribing ${activeFile.name}...`)
                // The active file is the image: no note is open to insert
                // into, so the transcription goes to its own file.
                const result = await plugin.transcriptionService.transcribeFile(activeFile)
                showResultNotice(activeFile.name, result)
            })()
        }
    }
}
