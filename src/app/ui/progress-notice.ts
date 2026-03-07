import { Notice } from 'obsidian'

export class ProgressNotice {
    private notice: Notice

    constructor(initialMessage: string) {
        this.notice = new Notice(initialMessage, 0)
    }

    update(message: string): void {
        this.notice.setMessage(message)
    }

    hide(): void {
        this.notice.hide()
    }
}
