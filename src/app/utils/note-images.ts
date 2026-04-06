import type { App, TFile } from 'obsidian'
import { IMAGE_EXTENSIONS } from '../domain/constants'

/**
 * Extract unique image TFile references from a note's embeds using the metadata cache.
 */
export function getImageFilesFromNote(app: App, note: TFile): TFile[] {
    const cache = app.metadataCache.getFileCache(note)
    if (!cache?.embeds) {
        return []
    }

    const seen = new Set<string>()
    const images: TFile[] = []

    for (const embed of cache.embeds) {
        const resolved = app.metadataCache.getFirstLinkpathDest(embed.link, note.path)
        if (!resolved) continue

        if (seen.has(resolved.path)) continue
        seen.add(resolved.path)

        const ext = resolved.extension.toLowerCase()
        if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
            images.push(resolved)
        }
    }

    return images
}
