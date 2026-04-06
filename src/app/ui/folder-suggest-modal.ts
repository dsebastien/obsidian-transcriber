import { FuzzySuggestModal, TFolder } from 'obsidian'
import type { App } from 'obsidian'

export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
    private readonly folders: TFolder[]
    private readonly onChooseFolder: (folder: TFolder) => void

    constructor(app: App, onChoose: (folder: TFolder) => void) {
        super(app)
        this.folders = this.getAllFolders()
        this.onChooseFolder = onChoose
        this.setPlaceholder('Select a folder')
    }

    getItems(): TFolder[] {
        return this.folders
    }

    getItemText(folder: TFolder): string {
        return folder.path || '/'
    }

    onChooseItem(folder: TFolder, _evt: MouseEvent | KeyboardEvent): void {
        this.onChooseFolder(folder)
    }

    private getAllFolders(): TFolder[] {
        const folders: TFolder[] = []
        const root = this.app.vault.getRoot()
        this.collectFolders(root, folders)
        return folders
    }

    private collectFolders(folder: TFolder, result: TFolder[]): void {
        result.push(folder)
        for (const child of folder.children) {
            if (child instanceof TFolder) {
                this.collectFolders(child, result)
            }
        }
    }
}
