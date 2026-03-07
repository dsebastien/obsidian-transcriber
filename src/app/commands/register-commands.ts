import type { TranscriberPlugin } from '../plugin'
import { createTranscribeImageCommand } from './transcribe-image-command'

export function registerCommands(plugin: TranscriberPlugin): void {
    plugin.addCommand(createTranscribeImageCommand(plugin))
}
