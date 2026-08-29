import { registerWhatsNewView } from './whats-new'
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
    override settings: PluginSettings = { ...DEFAULT_SETTINGS }
    ollamaService!: OllamaService
    transcriptionService!: TranscriptionService

    override async onload(): Promise<void> {
        // Must run before anything can call saveData (fresh-install detection)
        registerWhatsNewView(this)
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
            // This backfill used to be missing: a saved value was silently
            // dropped on every load and the field reset to its default.
            if (loaded.frontmatterTags !== undefined) draft.frontmatterTags = loaded.frontmatterTags
        })

        log('Settings loaded', 'debug', this.settings)
    }

    /** Serializes settings writes; see updateSettings. */
    private settingsWriteChain: Promise<void> = Promise.resolve()

    /**
     * Apply a mutation to the settings (via immer) and persist the result.
     * The single write path — the declarative settings tab and the model
     * commands route every edit through here so persistence happens in
     * exactly one place.
     *
     * Persist-then-commit: memory is swapped only after saveData() succeeds,
     * so a rejected write rolls the control back to the on-disk truth.
     * Serialized: writes queue and each mutation derives from the previous
     * COMMITTED state — without this, overlapping calls produce from the same
     * base across the save await and the second commit silently drops the
     * first edit. The Ollama service re-reads its config strictly AFTER a
     * successful commit. The old saveSettings also waited for the save, but
     * it ran on a state that had ALREADY been assigned to `plugin.settings`
     * optimistically, so a failed save left memory and the service
     * disagreeing about what was stored.
     */
    updateSettings(mutator: (draft: Draft<PluginSettings>) => void): Promise<void> {
        const run = async (): Promise<void> => {
            const next = produce(this.settings, mutator)
            await this.saveData(next)
            this.settings = next
            this.ollamaService.updateConfig(next.ollamaUrl, next.modelName)
        }
        const p = this.settingsWriteChain.then(run, run)
        this.settingsWriteChain = p.catch(() => {})
        return p
    }
}
