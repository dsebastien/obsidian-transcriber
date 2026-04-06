import type { TranscriberPlugin } from '../plugin'
import { createTranscribeImageCommand } from './transcribe-image-command'
import { createTranscribeNoteImagesCommand } from './transcribe-note-images-command'
import { createTranscribeFolderImagesCommand } from './transcribe-folder-images-command'
import { createInstallModelCommand } from './install-model-command'
import { createSelectModelCommand } from './select-model-command'
import { createRemoveModelCommand } from './remove-model-command'

export function registerCommands(plugin: TranscriberPlugin): void {
    plugin.addCommand(createTranscribeImageCommand(plugin))
    plugin.addCommand(createTranscribeNoteImagesCommand(plugin))
    plugin.addCommand(createTranscribeFolderImagesCommand(plugin))
    plugin.addCommand(createInstallModelCommand(plugin))
    plugin.addCommand(createSelectModelCommand(plugin))
    plugin.addCommand(createRemoveModelCommand(plugin))
}
