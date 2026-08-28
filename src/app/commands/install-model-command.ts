import { Notice, SuggestModal } from 'obsidian'
import type { TranscriberPlugin } from '../plugin'
import { RECOMMENDED_MODELS } from '../domain/constants'
import type { OllamaPullProgress } from '../domain/ollama-types'

class ModelSuggestModal extends SuggestModal<string> {
    private readonly models: string[]
    private readonly onChoose: (model: string) => void

    constructor(plugin: TranscriberPlugin, models: string[], onChoose: (model: string) => void) {
        super(plugin.app)
        this.models = models
        this.onChoose = onChoose
        this.setPlaceholder('Type a model name or select from the list')
    }

    getSuggestions(query: string): string[] {
        const lower = query.toLowerCase().trim()
        const filtered = this.models.filter((m) => m.toLowerCase().includes(lower))
        // If the user typed something not in the list, offer it as a custom option
        if (lower && !this.models.some((m) => m.toLowerCase() === lower)) {
            filtered.push(lower)
        }
        return filtered
    }

    renderSuggestion(model: string, el: HTMLElement): void {
        const isRecommended = (RECOMMENDED_MODELS as readonly string[]).includes(model)
        el.createDiv({ text: model })
        if (isRecommended) {
            el.createEl('small', { text: 'Recommended', cls: 'opacity-60' })
        }
    }

    onChooseSuggestion(model: string, _evt: MouseEvent | KeyboardEvent): void {
        this.onChoose(model)
    }
}

async function installAndSelectModel(plugin: TranscriberPlugin, modelName: string): Promise<void> {
    const notice = new Notice(`Downloading ${modelName}: starting...`, 0)

    try {
        await plugin.ollamaService.pullModel(modelName, (progress: OllamaPullProgress) => {
            if (progress.total && progress.completed) {
                const pct = Math.round((progress.completed / progress.total) * 100)
                notice.setMessage(`Downloading ${modelName}: ${pct}%`)
            } else {
                notice.setMessage(`Downloading ${modelName}: ${progress.status}`)
            }
        })

        notice.hide()
        new Notice(`Installed ${modelName}`)

        // Auto-select the newly installed model
        await plugin.updateSettings((draft) => {
            draft.modelName = modelName
        })
    } catch (error) {
        notice.hide()
        const message = error instanceof Error ? error.message : 'Unknown error'
        new Notice(`Failed to install ${modelName}: ${message}`)
    }
}

export function createInstallModelCommand(plugin: TranscriberPlugin): {
    id: string
    name: string
    callback: () => void
} {
    return {
        id: 'install-model',
        name: 'Install AI model',
        callback(): void {
            // Build suggestion list: recommended models first, then any installed ones
            const allModels = [...RECOMMENDED_MODELS]
            new ModelSuggestModal(plugin, allModels, (model) => {
                void installAndSelectModel(plugin, model)
            }).open()
        }
    }
}
