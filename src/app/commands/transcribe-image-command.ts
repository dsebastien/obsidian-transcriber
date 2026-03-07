import { Notice } from 'obsidian'
import type { TranscriberPlugin } from '../plugin'

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
                const result = await plugin.transcriptionService.transcribeFile(activeFile)
                if (result.success) {
                    new Notice(`Transcribed ${activeFile.name} successfully`)
                } else {
                    new Notice(`Failed to transcribe ${activeFile.name}: ${result.error}`)
                }
            })()
        }
    }
}
