import { App, Notice, PluginSettingTab, Setting } from 'obsidian'
import type TranscriberPlugin from '../../main'
import { RECOMMENDED_MODELS } from '../domain/constants'
import { SETTINGS_LABELS } from './settings-constants'
import { produce } from 'immer'
import type { Draft } from 'immer'
import type { PluginSettings } from '../types/plugin-settings.intf'
import type { OllamaPullProgress } from '../domain/ollama-types'

export class TranscriberSettingTab extends PluginSettingTab {
    plugin: TranscriberPlugin

    private installedModels: string[] = []
    private isPullingModel = false

    constructor(app: App, plugin: TranscriberPlugin) {
        super(app, plugin)
        this.plugin = plugin
    }

    display(): void {
        const { containerEl } = this
        containerEl.empty()

        this.renderOllamaSection(containerEl)
        this.renderTranscriptionSection(containerEl)
        this.renderSupportSection(containerEl)

        // Load installed models asynchronously, then re-render the Ollama section
        void this.loadInstalledModels(containerEl)
    }

    private async loadInstalledModels(containerEl: HTMLElement): Promise<void> {
        try {
            this.installedModels = await this.plugin.ollamaService.listModels()
        } catch {
            this.installedModels = []
        }
        // Re-render only the Ollama section with fresh model data
        containerEl.empty()
        this.renderOllamaSection(containerEl)
        this.renderTranscriptionSection(containerEl)
        this.renderSupportSection(containerEl)
    }

    private renderOllamaSection(containerEl: HTMLElement): void {
        new Setting(containerEl).setName(SETTINGS_LABELS.ollamaHeading).setHeading()

        // Server URL
        new Setting(containerEl)
            .setName(SETTINGS_LABELS.ollamaUrl)
            .setDesc(SETTINGS_LABELS.ollamaUrlDesc)
            .addText((text) => {
                text.setPlaceholder('http://localhost:11434')
                    .setValue(this.plugin.settings.ollamaUrl)
                    .onChange(async (value) => {
                        this.plugin.settings = produce(
                            this.plugin.settings,
                            (draft: Draft<PluginSettings>) => {
                                draft.ollamaUrl = value
                            }
                        )
                        await this.plugin.saveSettings()
                    })
            })

        // Test connection
        new Setting(containerEl)
            .setName(SETTINGS_LABELS.testConnection)
            .setDesc(SETTINGS_LABELS.testConnectionDesc)
            .addButton((button) => {
                button
                    .setButtonText(SETTINGS_LABELS.testConnectionButton)
                    .setCta()
                    .onClick(async () => {
                        button.setDisabled(true)
                        button.setButtonText('Testing...')

                        const result = await this.plugin.ollamaService.testConnection()

                        if (result.ok) {
                            const modelCount = result.models?.length ?? 0
                            new Notice(
                                `Connected to Ollama. ${modelCount} model${modelCount !== 1 ? 's' : ''} available.`
                            )
                            // Refresh model list on successful connection
                            if (result.models) {
                                this.installedModels = result.models
                                this.display()
                                return
                            }
                        } else {
                            new Notice(`Connection failed: ${result.error}`)
                        }

                        button.setButtonText(SETTINGS_LABELS.testConnectionButton)
                        button.setDisabled(false)
                    })
            })

        // Vision model dropdown (populated from installed models)
        this.renderModelDropdown(containerEl)

        // Recommended models section
        this.renderRecommendedModels(containerEl)

        // Custom model install
        this.renderCustomModelInstall(containerEl)
    }

    private renderModelDropdown(containerEl: HTMLElement): void {
        const setting = new Setting(containerEl)
            .setName(SETTINGS_LABELS.model)
            .setDesc(SETTINGS_LABELS.modelDesc)

        if (this.installedModels.length === 0) {
            setting.setDesc(SETTINGS_LABELS.noModelsFound)
        }

        setting.addDropdown((dropdown) => {
            const currentModel = this.plugin.settings.modelName

            for (const model of this.installedModels) {
                dropdown.addOption(model, model)
            }

            // If current model isn't in the installed list, show it with a warning
            if (currentModel && !this.installedModels.includes(currentModel)) {
                dropdown.addOption(currentModel, `${currentModel} (not found)`)
            }

            dropdown.setValue(currentModel)
            dropdown.onChange(async (value) => {
                this.plugin.settings = produce(
                    this.plugin.settings,
                    (draft: Draft<PluginSettings>) => {
                        draft.modelName = value
                    }
                )
                await this.plugin.saveSettings()
            })
        })
    }

    private renderRecommendedModels(containerEl: HTMLElement): void {
        const notInstalled = RECOMMENDED_MODELS.filter((m) => !this.installedModels.includes(m))

        if (notInstalled.length === 0) return

        new Setting(containerEl)
            .setName(SETTINGS_LABELS.recommendedModels)
            .setDesc(SETTINGS_LABELS.recommendedModelsDesc)
            .setHeading()

        for (const model of notInstalled) {
            new Setting(containerEl).setName(model).addButton((button) => {
                button
                    .setButtonText(SETTINGS_LABELS.installButton)
                    .setDisabled(this.isPullingModel)
                    .onClick(() => {
                        void this.installModel(model)
                    })
            })
        }
    }

    private renderCustomModelInstall(containerEl: HTMLElement): void {
        let customModelName = ''

        new Setting(containerEl)
            .setName(SETTINGS_LABELS.customModel)
            .setDesc(SETTINGS_LABELS.customModelDesc)
            .addText((text) => {
                text.setPlaceholder(SETTINGS_LABELS.customModelPlaceholder).onChange((value) => {
                    customModelName = value.trim()
                })
            })
            .addButton((button) => {
                button
                    .setButtonText(SETTINGS_LABELS.installButton)
                    .setDisabled(this.isPullingModel)
                    .onClick(() => {
                        if (!customModelName) return
                        void this.installModel(customModelName)
                    })
            })
    }

    private async installModel(modelName: string): Promise<void> {
        this.isPullingModel = true
        this.display()

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

            // Select the newly installed model
            this.plugin.settings = produce(this.plugin.settings, (draft: Draft<PluginSettings>) => {
                draft.modelName = modelName
            })
            await this.plugin.saveSettings()
        } catch (error) {
            notice.hide()
            const message = error instanceof Error ? error.message : 'Unknown error'
            new Notice(`Failed to install ${modelName}: ${message}`)
        } finally {
            this.isPullingModel = false
            this.display()
        }
    }

    private renderTranscriptionSection(containerEl: HTMLElement): void {
        new Setting(containerEl).setName(SETTINGS_LABELS.transcriptionHeading).setHeading()

        new Setting(containerEl)
            .setName(SETTINGS_LABELS.prompt)
            .setDesc(SETTINGS_LABELS.promptDesc)
            .addTextArea((textArea) => {
                textArea
                    .setValue(this.plugin.settings.transcriptionPrompt)
                    .onChange(async (value) => {
                        this.plugin.settings = produce(
                            this.plugin.settings,
                            (draft: Draft<PluginSettings>) => {
                                draft.transcriptionPrompt = value
                            }
                        )
                        await this.plugin.saveSettings()
                    })
                textArea.inputEl.rows = 8
                textArea.inputEl.classList.add('w-full')
            })

        new Setting(containerEl)
            .setName(SETTINGS_LABELS.includeSubfolders)
            .setDesc(SETTINGS_LABELS.includeSubfoldersDesc)
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.includeSubfolders).onChange(async (value) => {
                    this.plugin.settings = produce(
                        this.plugin.settings,
                        (draft: Draft<PluginSettings>) => {
                            draft.includeSubfolders = value
                        }
                    )
                    await this.plugin.saveSettings()
                })
            })

        new Setting(containerEl)
            .setName(SETTINGS_LABELS.overwriteExisting)
            .setDesc(SETTINGS_LABELS.overwriteExistingDesc)
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.overwriteExisting).onChange(async (value) => {
                    this.plugin.settings = produce(
                        this.plugin.settings,
                        (draft: Draft<PluginSettings>) => {
                            draft.overwriteExisting = value
                        }
                    )
                    await this.plugin.saveSettings()
                })
            })
    }

    private renderSupportSection(containerEl: HTMLElement): void {
        new Setting(containerEl).setName('Support').setHeading()

        new Setting(containerEl)
            .setName('Follow me on X')
            .setDesc('Sébastien Dubois (@dSebastien)')
            .addButton((button) => {
                button.setCta()
                button.setButtonText('Follow me on X').onClick(() => {
                    window.open('https://x.com/dSebastien')
                })
            })

        const supportDesc = new DocumentFragment()
        supportDesc.createDiv({
            text: 'Buy me a coffee to support the development of this plugin'
        })
        new Setting(containerEl).setDesc(supportDesc)

        this.renderBuyMeACoffeeBadge(containerEl)
        const spacing = containerEl.createDiv()
        spacing.classList.add('support-header-margin')
    }

    private renderBuyMeACoffeeBadge(contentEl: HTMLElement | DocumentFragment, width = 175): void {
        const linkEl = contentEl.createEl('a', {
            href: 'https://www.buymeacoffee.com/dsebastien'
        })
        const imgEl = linkEl.createEl('img')
        imgEl.src =
            'https://github.com/dsebastien/obsidian-plugin-template/blob/main/src/assets/buy-me-a-coffee.png?raw=true'
        imgEl.alt = 'Buy me a coffee'
        imgEl.width = width
    }
}
