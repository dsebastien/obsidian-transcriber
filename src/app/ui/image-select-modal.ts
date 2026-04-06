import { Modal, TFile } from 'obsidian'
import type { App } from 'obsidian'

export class ImageSelectModal extends Modal {
    private readonly imageFiles: TFile[]
    private readonly onConfirm: (selected: TFile[]) => void
    private readonly checkedState: Map<string, boolean>

    constructor(app: App, imageFiles: TFile[], onConfirm: (selected: TFile[]) => void) {
        super(app)
        this.imageFiles = imageFiles
        this.onConfirm = onConfirm
        this.checkedState = new Map(imageFiles.map((f) => [f.path, true]))
    }

    override onOpen(): void {
        const { contentEl } = this

        this.titleEl.setText('Select images to transcribe')

        const toggleAllContainer = contentEl.createDiv({
            cls: 'transcriber-image-select-toggle-all'
        })
        const toggleAllCheckbox = toggleAllContainer.createEl('input', { type: 'checkbox' })
        toggleAllCheckbox.checked = true
        toggleAllContainer.createEl('span', { text: 'Select all' })

        const listContainer = contentEl.createDiv({
            cls: 'transcriber-image-select-list'
        })

        const checkboxEls: HTMLInputElement[] = []

        for (const file of this.imageFiles) {
            const row = listContainer.createDiv({ cls: 'transcriber-image-select-row' })
            const checkbox = row.createEl('input', { type: 'checkbox' })
            checkbox.checked = true
            checkboxEls.push(checkbox)

            row.createEl('span', { text: file.path })

            checkbox.addEventListener('change', () => {
                this.checkedState.set(file.path, checkbox.checked)
                updateToggleAll()
                updateButtonState()
            })
        }

        const updateToggleAll = (): void => {
            const allChecked = checkboxEls.every((cb) => cb.checked)
            const someChecked = checkboxEls.some((cb) => cb.checked)
            toggleAllCheckbox.checked = allChecked
            toggleAllCheckbox.indeterminate = someChecked && !allChecked
        }

        toggleAllCheckbox.addEventListener('change', () => {
            const checked = toggleAllCheckbox.checked
            for (const cb of checkboxEls) {
                cb.checked = checked
            }
            for (const file of this.imageFiles) {
                this.checkedState.set(file.path, checked)
            }
            updateButtonState()
        })

        const buttonContainer = contentEl.createDiv({
            cls: 'transcriber-image-select-actions'
        })
        const transcribeBtn = buttonContainer.createEl('button', {
            text: `Transcribe ${this.imageFiles.length} images`,
            cls: 'mod-cta'
        })

        const updateButtonState = (): void => {
            const selectedCount = this.getSelectedFiles().length
            transcribeBtn.textContent = `Transcribe ${selectedCount} image${selectedCount !== 1 ? 's' : ''}`
            transcribeBtn.disabled = selectedCount === 0
        }

        transcribeBtn.addEventListener('click', () => {
            const selected = this.getSelectedFiles()
            if (selected.length > 0) {
                this.close()
                this.onConfirm(selected)
            }
        })
    }

    override onClose(): void {
        this.contentEl.empty()
    }

    private getSelectedFiles(): TFile[] {
        return this.imageFiles.filter((f) => this.checkedState.get(f.path) === true)
    }
}
