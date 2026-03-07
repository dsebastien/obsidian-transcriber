import { Plugin } from 'obsidian'
import { DEFAULT_SETTINGS } from './types/plugin-settings.intf'
import type { PluginSettings } from './types/plugin-settings.intf'
import { TranscriberSettingTab } from './settings/settings-tab'
import { OllamaService } from './services/ollama-service'
import { TranscriptionService } from './services/transcription-service'
import { registerCommands } from './commands/register-commands'
import { registerEvents } from './commands/register-events'
import { log } from '../utils/log'
import { produce } from 'immer'
import type { Draft } from 'immer'

export class TranscriberPlugin extends Plugin {
    settings: PluginSettings = { ...DEFAULT_SETTINGS }
    ollamaService!: OllamaService
    transcriptionService!: TranscriptionService

    override async onload(): Promise<void> {
        log('Initializing', 'debug')
        await this.loadSettings()

        this.ollamaService = new OllamaService(this.settings.ollamaUrl, this.settings.modelName)

        this.transcriptionService = new TranscriptionService(
            this.app,
            this.ollamaService,
            () => this.settings
        )

        registerCommands(this)
        registerEvents(this)

        this.addSettingTab(new TranscriberSettingTab(this.app, this))
    }

    override onunload(): void {
        // Cleanup handled by Obsidian's register* helpers
    }

    async loadSettings(): Promise<void> {
        log('Loading settings', 'debug')
        const loaded = (await this.loadData()) as Partial<PluginSettings> | null

        if (!loaded) {
            log('Using default settings', 'debug')
            this.settings = { ...DEFAULT_SETTINGS }
            return
        }

        this.settings = produce(DEFAULT_SETTINGS, (draft: Draft<PluginSettings>) => {
            if (loaded.ollamaUrl !== undefined) draft.ollamaUrl = loaded.ollamaUrl
            if (loaded.modelName !== undefined) draft.modelName = loaded.modelName
            if (loaded.transcriptionPrompt !== undefined)
                draft.transcriptionPrompt = loaded.transcriptionPrompt
            if (loaded.includeSubfolders !== undefined)
                draft.includeSubfolders = loaded.includeSubfolders
            if (loaded.overwriteExisting !== undefined)
                draft.overwriteExisting = loaded.overwriteExisting
        })

        log('Settings loaded', 'debug', this.settings)
    }

    async saveSettings(): Promise<void> {
        log('Saving settings', 'debug', this.settings)
        await this.saveData(this.settings)
        this.ollamaService.updateConfig(this.settings.ollamaUrl, this.settings.modelName)
        log('Settings saved', 'debug')
    }
}
