import { App, Notice, PluginSettingTab, Setting } from 'obsidian'
import type TranscriberPlugin from '../../main'
import { KNOWN_MODELS } from '../domain/constants'
import { SETTINGS_LABELS } from './settings-constants'
import { produce } from 'immer'
import type { Draft } from 'immer'
import type { PluginSettings } from '../types/plugin-settings.intf'

export class TranscriberSettingTab extends PluginSettingTab {
    plugin: TranscriberPlugin

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
    }

    private renderOllamaSection(containerEl: HTMLElement): void {
        new Setting(containerEl).setName(SETTINGS_LABELS.ollamaHeading).setHeading()

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

        new Setting(containerEl)
            .setName(SETTINGS_LABELS.model)
            .setDesc(SETTINGS_LABELS.modelDesc)
            .addDropdown((dropdown) => {
                for (const model of KNOWN_MODELS) {
                    dropdown.addOption(model, model)
                }
                dropdown.addOption('custom', 'Custom model...')
                const currentModel = this.plugin.settings.modelName
                const isKnown = (KNOWN_MODELS as readonly string[]).includes(currentModel)
                dropdown.setValue(isKnown ? currentModel : 'custom')
                dropdown.onChange(async (value) => {
                    if (value === 'custom') {
                        return
                    }
                    this.plugin.settings = produce(
                        this.plugin.settings,
                        (draft: Draft<PluginSettings>) => {
                            draft.modelName = value
                        }
                    )
                    await this.plugin.saveSettings()
                })
            })
            .addText((text) => {
                const isKnown = (KNOWN_MODELS as readonly string[]).includes(
                    this.plugin.settings.modelName
                )
                text.setPlaceholder('Enter custom model name')
                    .setValue(isKnown ? '' : this.plugin.settings.modelName)
                    .onChange(async (value) => {
                        if (value.trim()) {
                            this.plugin.settings = produce(
                                this.plugin.settings,
                                (draft: Draft<PluginSettings>) => {
                                    draft.modelName = value.trim()
                                }
                            )
                            await this.plugin.saveSettings()
                        }
                    })
            })

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
                        } else {
                            new Notice(`Connection failed: ${result.error}`)
                        }

                        button.setButtonText(SETTINGS_LABELS.testConnectionButton)
                        button.setDisabled(false)
                    })
            })
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
