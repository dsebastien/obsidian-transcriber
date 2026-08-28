import { Notice, SuggestModal } from 'obsidian'
import type { TranscriberPlugin } from '../plugin'

class InstalledModelSuggestModal extends SuggestModal<string> {
    private readonly models: string[]
    private readonly currentModel: string
    private readonly onChoose: (model: string) => void

    constructor(
        plugin: TranscriberPlugin,
        models: string[],
        currentModel: string,
        onChoose: (model: string) => void
    ) {
        super(plugin.app)
        this.models = models
        this.currentModel = currentModel
        this.onChoose = onChoose
        this.setPlaceholder('Select a model to use for transcription')
    }

    getSuggestions(query: string): string[] {
        const lower = query.toLowerCase().trim()
        return this.models.filter((m) => m.toLowerCase().includes(lower))
    }

    renderSuggestion(model: string, el: HTMLElement): void {
        el.createDiv({ text: model })
        if (model === this.currentModel) {
            el.createEl('small', { text: 'Currently selected', cls: 'opacity-60' })
        }
    }

    onChooseSuggestion(model: string, _evt: MouseEvent | KeyboardEvent): void {
        this.onChoose(model)
    }
}

export function createSelectModelCommand(plugin: TranscriberPlugin): {
    id: string
    name: string
    callback: () => void
} {
    return {
        id: 'select-model',
        name: 'Select AI model',
        callback(): void {
            void (async () => {
                try {
                    const models = await plugin.ollamaService.listModels()

                    if (models.length === 0) {
                        new Notice('No models installed. Use "Install AI model" to download one.')
                        return
                    }

                    new InstalledModelSuggestModal(
                        plugin,
                        models,
                        plugin.settings.modelName,
                        (model) => {
                            void (async () => {
                                await plugin.updateSettings((draft) => {
                                    draft.modelName = model
                                })
                                new Notice(`Now using ${model} for transcription`)
                            })()
                        }
                    ).open()
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error'
                    new Notice(`Failed to list models: ${message}`)
                }
            })()
        }
    }
}
