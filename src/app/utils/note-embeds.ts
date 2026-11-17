/**
 * Finding an image's embed in a note's text and placing a transcription next
 * to it, as pure functions. The text is read at the moment of the write, not
 * from the metadata cache: a batch inserts several transcriptions into one
 * note, and the cache's line numbers are stale after the first one.
 */

const WIKILINK_EMBED = /!\[\[([^\]]+)\]\]/g
const MARKDOWN_EMBED = /!\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+"[^"]*")?\)/g
const FENCE = /^\s{0,3}(`{3,}|~{3,})/

/** The link path of a wikilink embed: no `|alias`, no `#subpath`. */
const wikilinkPath = (inner: string): string => (inner.split('|')[0] ?? '').split('#')[0] ?? ''

/** The link path of a Markdown embed: no angle brackets, percent-decoded. */
const markdownPath = (target: string): string => {
    const bare = target.startsWith('<') ? target.slice(1, -1) : target
    const withoutSubpath = bare.split('#')[0] ?? ''
    try {
        return decodeURIComponent(withoutSubpath)
    } catch {
        return withoutSubpath
    }
}

/** The link paths of every embed on a line, in the order they appear. */
export function embedLinkpathsOnLine(line: string): string[] {
    const found: { index: number; path: string }[] = []
    for (const match of line.matchAll(WIKILINK_EMBED)) {
        found.push({ index: match.index, path: wikilinkPath(match[1] ?? '').trim() })
    }
    for (const match of line.matchAll(MARKDOWN_EMBED)) {
        found.push({ index: match.index, path: markdownPath(match[1] ?? '').trim() })
    }
    return found
        .filter((embed) => embed.path !== '')
        .sort((a, b) => a.index - b.index)
        .map((embed) => embed.path)
}

/**
 * The first line that embeds what `matches` accepts, or -1. Fenced code is
 * skipped: an embed written there is text, not an embed.
 */
export function findEmbedLine(lines: string[], matches: (linkpath: string) => boolean): number {
    let fence: string | null = null
    for (const [index, line] of lines.entries()) {
        const marker = FENCE.exec(line)?.[1]
        if (marker !== undefined) {
            if (fence === null) {
                fence = marker
            } else if (marker[0] === fence[0] && marker.length >= fence.length) {
                fence = null
            }
            continue
        }
        if (fence === null && embedLinkpathsOnLine(line).some(matches)) {
            return index
        }
    }
    return -1
}

/**
 * The text to add at the END of line `index` so that the transcription sits
 * in its own paragraph right after that line.
 */
export function blockAfterLine(lines: string[], index: number, markdown: string): string {
    const next = lines[index + 1]
    const followedByBlankLine = next !== undefined && next.trim() === ''
    return `\n\n${markdown.trim()}${followedByBlankLine ? '' : '\n'}`
}

/**
 * The text to add at a cursor so that the transcription does not run into the
 * text around it. `lineText` is the cursor's line and `ch` its column.
 */
export function blockAtCursor(lineText: string, ch: number, markdown: string): string {
    const before = lineText.slice(0, ch).trim() === '' ? '' : '\n\n'
    const after = lineText.slice(ch).trim() === '' ? '\n' : '\n\n'
    return `${before}${markdown.trim()}${after}`
}

/** `content` with the transcription in its own paragraph after line `index`. */
export function insertAfterLine(content: string, index: number, markdown: string): string {
    const lines = content.split('\n')
    const line = lines[index]
    if (line === undefined) {
        return appendToNote(content, markdown)
    }
    lines[index] = line + blockAfterLine(lines, index, markdown)
    return lines.join('\n')
}

/** `content` with the transcription as its last paragraph. */
export function appendToNote(content: string, markdown: string): string {
    const body = content.replace(/\s+$/, '')
    return body === '' ? `${markdown.trim()}\n` : `${body}\n\n${markdown.trim()}\n`
}
