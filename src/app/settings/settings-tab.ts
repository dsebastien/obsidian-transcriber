import { Notice, PluginSettingTab } from 'obsidian'
import type { App, SettingDefinitionItem, TextComponent } from 'obsidian'
import type { TranscriberPlugin } from '../plugin'
import type { PluginSettings } from '../types/plugin-settings.intf'
import { RECOMMENDED_MODELS } from '../domain/constants'
import { SETTINGS_LABELS } from './settings-constants'
import type { OllamaPullProgress } from '../domain/ollama-types'
import { BUY_ME_A_COFFEE_BADGE_DATA_URL } from '../assets/buy-me-a-coffee'
import { renderSupportSection } from '../ui/support-links'

/**
 * The settings keys owned by plain declarative controls, i.e. everything the
 * `getControlValue`/`setControlValue` pair addresses.
 */
type ControlKey =
    | 'ollamaUrl'
    | 'modelName'
    | 'transcriptionPrompt'
    | 'includeSubfolders'
    | 'overwriteExisting'
    | 'frontmatterTags'

/**
 * Settings tab, declared rather than rendered (Obsidian 1.13+).
 *
 * `getSettingDefinitions()` REPLACES `display()`: when it returns a non-empty
 * array, `display()` is never called. There is no partial adoption — the whole
 * settings UI is declarative, or none of it. The framework re-invokes
 * `getSettingDefinitions()` on every `update()`, which is what makes the
 * dynamic parts work: the model dropdown's options and the recommended-model
 * rows are recomputed from `installedModels` each render.
 *
 * Model discovery: the old tab reloaded the installed-model list on every
 * `display()`. Here `getSettingDefinitions()` kicks off an async refresh,
 * guarded against loops by only calling `update()` when the list actually
 * CHANGED — a completed refresh with identical data re-renders nothing, so
 * the refresh-render cycle always terminates.
 *
 * Rules that each cost a shipped bug the first time they were broken:
 *
 * - A `render:` hook renders the ROW. Write into `setting.settingEl` only.
 * - A row `action:` fires on the whole row and draws no button; button rows
 *   use `render:` with `addButton`.
 * - `setControlValue` MUST reject on failure — resolving tells the framework
 *   the write landed.
 */
export class TranscriberSettingTab extends PluginSettingTab {
    plugin: TranscriberPlugin

    private installedModels: string[] = []
    private isPullingModel = false
    private isLoadingModels = false

    constructor(app: App, plugin: TranscriberPlugin) {
        super(app, plugin)
        this.plugin = plugin
    }

    override getSettingDefinitions(): SettingDefinitionItem[] {
        this.refreshInstalledModels()
        const notInstalled = RECOMMENDED_MODELS.filter((m) => !this.installedModels.includes(m))

        return [
            {
                type: 'group',
                heading: SETTINGS_LABELS.ollamaHeading,
                items: [
                    {
                        name: SETTINGS_LABELS.ollamaUrl,
                        desc: SETTINGS_LABELS.ollamaUrlDesc,
                        control: {
                            type: 'text',
                            key: 'ollamaUrl',
                            placeholder: 'http://localhost:11434'
                        }
                    },
                    {
                        name: SETTINGS_LABELS.testConnection,
                        desc: SETTINGS_LABELS.testConnectionDesc,
                        render: (setting): void => {
                            setting.addButton((button) => {
                                button
                                    .setButtonText(SETTINGS_LABELS.testConnectionButton)
                                    .setCta()
                                    .onClick(async () => {
                                        button.setDisabled(true)
                                        button.setButtonText('Testing...')

                                        const result =
                                            await this.plugin.ollamaService.testConnection()

                                        if (result.ok) {
                                            const modelCount = result.models?.length ?? 0
                                            new Notice(
                                                `Connected to Ollama. ${modelCount} model${modelCount !== 1 ? 's' : ''} available.`
                                            )
                                            if (result.models) {
                                                this.installedModels = result.models
                                                this.update()
                                                return
                                            }
                                        } else {
                                            new Notice(`Connection failed: ${result.error}`)
                                        }

                                        button.setButtonText(SETTINGS_LABELS.testConnectionButton)
                                        button.setDisabled(false)
                                    })
                            })
                        }
                    },
                    {
                        name: SETTINGS_LABELS.model,
                        desc:
                            this.installedModels.length === 0
                                ? SETTINGS_LABELS.noModelsFound
                                : SETTINGS_LABELS.modelDesc,
                        control: {
                            type: 'dropdown',
                            key: 'modelName',
                            options: this.modelDropdownOptions()
                        }
                    }
                ]
            },
            {
                type: 'group',
                heading: SETTINGS_LABELS.recommendedModels,
                visible: (): boolean => notInstalled.length > 0,
                items: notInstalled.map((model) => ({
                    name: model,
                    desc: SETTINGS_LABELS.recommendedModelsDesc,
                    // Entries are computed data; the group heading is enough
                    // for the settings search.
                    searchable: false,
                    render: (setting): void => {
                        setting.addButton((button) => {
                            button
                                .setButtonText(SETTINGS_LABELS.installButton)
                                .setDisabled(this.isPullingModel)
                                .onClick(() => {
                                    void this.installModel(model)
                                })
                        })
                    }
                }))
            },
            {
                name: SETTINGS_LABELS.customModel,
                desc: SETTINGS_LABELS.customModelDesc,
                render: (setting): void => {
                    let customInput: TextComponent | undefined
                    setting.addText((text) => {
                        customInput = text
                        text.setPlaceholder(SETTINGS_LABELS.customModelPlaceholder)
                    })
                    setting.addButton((button) => {
                        button
                            .setButtonText(SETTINGS_LABELS.installButton)
                            .setDisabled(this.isPullingModel)
                            .onClick(() => {
                                const name = customInput?.getValue().trim() ?? ''
                                if (!name) return
                                void this.installModel(name)
                            })
                    })
                }
            },
            {
                type: 'group',
                heading: SETTINGS_LABELS.transcriptionHeading,
                items: [
                    {
                        name: SETTINGS_LABELS.prompt,
                        desc: SETTINGS_LABELS.promptDesc,
                        control: {
                            type: 'textarea',
                            key: 'transcriptionPrompt',
                            rows: 8
                        }
                    },
                    {
                        name: SETTINGS_LABELS.includeSubfolders,
                        desc: SETTINGS_LABELS.includeSubfoldersDesc,
                        control: { type: 'toggle', key: 'includeSubfolders' }
                    },
                    {
                        name: SETTINGS_LABELS.overwriteExisting,
                        desc: SETTINGS_LABELS.overwriteExistingDesc,
                        control: { type: 'toggle', key: 'overwriteExisting' }
                    },
                    {
                        name: SETTINGS_LABELS.frontmatterTags,
                        desc: SETTINGS_LABELS.frontmatterTagsDesc,
                        control: {
                            type: 'text',
                            key: 'frontmatterTags',
                            placeholder: SETTINGS_LABELS.frontmatterTagsPlaceholder
                        }
                    }
                ]
            },
            {
                type: 'group',
                // No heading: renderSupportSection draws its own.
                items: [
                    {
                        name: 'Support',
                        // Not a setting — keep it out of the settings search.
                        searchable: false,
                        render: (setting): void => {
                            // Render INSIDE the row (settingEl), never into
                            // group.listEl — see the class docs above.
                            setting.infoEl.remove() // the section draws its own headings
                            // `.setting-item` is a flex ROW; the support block
                            // is a stack of full-width rows.
                            setting.settingEl.addClass('settings-stack')
                            renderSupportSection(setting.settingEl, (el) => {
                                this.renderBuyMeACoffeeBadge(el)
                            })
                        }
                    }
                ]
            }
        ]
    }

    /**
     * The dropdown's options, recomputed on every render: the installed
     * models, plus the currently selected model flagged as missing when it is
     * not installed (so the stored choice stays visible instead of silently
     * snapping to another entry).
     */
    private modelDropdownOptions(): Record<string, string> {
        const options: Record<string, string> = {}
        for (const model of this.installedModels) {
            options[model] = model
        }
        const current = this.plugin.settings.modelName
        if (current && !this.installedModels.includes(current)) {
            options[current] = `${current} (not found)`
        }
        return options
    }

    /**
     * Refresh the installed-model list in the background. Loop-safe: a
     * completed refresh only re-renders when the list actually changed, so
     * the render -> refresh -> update cycle terminates as soon as the data
     * stabilizes (at most one extra render per real change).
     */
    private refreshInstalledModels(): void {
        if (this.isLoadingModels) {
            return
        }
        this.isLoadingModels = true
        void this.plugin.ollamaService
            .listModels()
            .then((models) => {
                const changed =
                    models.length !== this.installedModels.length ||
                    models.some((m, i) => m !== this.installedModels[i])
                this.installedModels = models
                if (changed) {
                    this.update()
                }
            })
            .catch(() => {
                // Unreachable server: keep whatever list we had.
            })
            .finally(() => {
                this.isLoadingModels = false
            })
    }

    private async installModel(modelName: string): Promise<void> {
        this.isPullingModel = true
        this.update()

        const notice = new Notice(`Downloading ${modelName}: starting...`, 0)

        try {
            await this.plugin.ollamaService.pullModel(modelName, (progress: OllamaPullProgress) => {
                if (progress.total && progress.completed) {
                    const pct = Math.round((progress.completed / progress.total) * 100)
                    notice.setMessage(`Downloading ${modelName}: ${pct}%`)
                } else {
                    notice.setMessage(`Downloading ${modelName}: ${progress.status}`)
                }
            })

            notice.hide()
            new Notice(`Installed ${modelName}`)

            if (!this.installedModels.includes(modelName)) {
                this.installedModels = [...this.installedModels, modelName]
            }
            // Select the newly installed model
            await this.plugin.updateSettings((draft) => {
                draft.modelName = modelName
            })
        } catch (error) {
            notice.hide()
            const message = error instanceof Error ? error.message : 'Unknown error'
            new Notice(`Failed to install ${modelName}: ${message}`)
        } finally {
            this.isPullingModel = false
            this.update()
        }
    }

    /**
     * Reads the value behind a control `key`. Returning undefined/null makes
     * the framework fall back to the control's declared `defaultValue`.
     */
    override getControlValue(key: string): unknown {
        switch (key as ControlKey) {
            case 'ollamaUrl':
                return this.plugin.settings.ollamaUrl
            case 'modelName':
                return this.plugin.settings.modelName
            case 'transcriptionPrompt':
                return this.plugin.settings.transcriptionPrompt
            case 'includeSubfolders':
                return this.plugin.settings.includeSubfolders
            case 'overwriteExisting':
                return this.plugin.settings.overwriteExisting
            case 'frontmatterTags':
                return this.plugin.settings.frontmatterTags
            default:
                return undefined
        }
    }

    /**
     * Persists a control edit. Rejecting (not resolving) on failure is what
     * lets the framework roll the control back to the stored truth. The
     * Ollama service re-reads its config inside the plugin's write path,
     * strictly after a successful commit.
     *
     * `modelName` is deliberately NOT validated against `installedModels`:
     * the list is asynchronous and can be stale or empty while the server is
     * down, and the dropdown itself only offers known entries.
     */
    override async setControlValue(key: string, value: unknown): Promise<void> {
        switch (key as ControlKey) {
            case 'ollamaUrl':
                await this.writeString(key, value, (draft, next) => {
                    draft.ollamaUrl = next
                })
                break
            case 'modelName':
                await this.writeString(key, value, (draft, next) => {
                    draft.modelName = next
                })
                break
            case 'transcriptionPrompt':
                await this.writeString(key, value, (draft, next) => {
                    draft.transcriptionPrompt = next
                })
                break
            case 'includeSubfolders': {
                const next = this.expectBoolean(key, value)
                await this.plugin.updateSettings((draft) => {
                    draft.includeSubfolders = next
                })
                break
            }
            case 'overwriteExisting': {
                const next = this.expectBoolean(key, value)
                await this.plugin.updateSettings((draft) => {
                    draft.overwriteExisting = next
                })
                break
            }
            case 'frontmatterTags':
                await this.writeString(key, value, (draft, next) => {
                    draft.frontmatterTags = next
                })
                break
            default:
                new Notice('Failed to save settings.')
                throw new Error(`Setting "${key}" does not address a known field.`)
        }
    }

    private async writeString(
        key: string,
        value: unknown,
        write: (draft: PluginSettings, next: string) => void
    ): Promise<void> {
        if (typeof value !== 'string') {
            throw new Error(`Setting "${key}" expects a string.`)
        }
        await this.plugin.updateSettings((draft) => {
            write(draft, value)
        })
    }

    private expectBoolean(key: string, value: unknown): boolean {
        if (typeof value !== 'boolean') {
            throw new Error(`Setting "${key}" expects a boolean.`)
        }
        return value
    }

    private renderBuyMeACoffeeBadge(contentEl: HTMLElement | DocumentFragment, width = 175): void {
        const linkEl = contentEl.createEl('a', {
            href: 'https://www.buymeacoffee.com/dsebastien'
        })
        const imgEl = linkEl.createEl('img')
        imgEl.src = BUY_ME_A_COFFEE_BADGE_DATA_URL
        imgEl.alt = 'Buy me a coffee'
        imgEl.width = width
    }
}
