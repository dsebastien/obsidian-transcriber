import { Notice, SuggestModal } from 'obsidian'
import type { TranscriberPlugin } from '../plugin'

class RemoveModelSuggestModal extends SuggestModal<string> {
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
        this.setPlaceholder('Select a model to remove')
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

export function createRemoveModelCommand(plugin: TranscriberPlugin): {
    id: string
    name: string
    callback: () => void
} {
    return {
        id: 'remove-model',
        name: 'Remove AI model',
        callback(): void {
            void (async () => {
                try {
                    const models = await plugin.ollamaService.listModels()

                    if (models.length === 0) {
                        new Notice('No models installed.')
                        return
                    }

                    new RemoveModelSuggestModal(
                        plugin,
                        models,
                        plugin.settings.modelName,
                        (model) => {
                            void (async () => {
                                try {
                                    new Notice(`Removing ${model}...`)
                                    await plugin.ollamaService.deleteModel(model)
                                    new Notice(`Removed ${model}`)
                                } catch (error) {
                                    const message =
                                        error instanceof Error ? error.message : 'Unknown error'
                                    new Notice(`Failed to remove ${model}: ${message}`)
                                }
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
