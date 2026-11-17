import { describe, expect, test } from 'bun:test'
import {
    appendToNote,
    blockAfterLine,
    blockAtCursor,
    embedLinkpathsOnLine,
    findEmbedLine,
    insertAfterLine
} from './note-embeds'

describe('embedLinkpathsOnLine', () => {
    test('reads wikilink embeds without their alias or subpath', () => {
        expect(embedLinkpathsOnLine('![[scan.png]]')).toEqual(['scan.png'])
        expect(embedLinkpathsOnLine('![[media/scan.png|300]]')).toEqual(['media/scan.png'])
        expect(embedLinkpathsOnLine('![[scan.png#center|300x200]]')).toEqual(['scan.png'])
    })

    test('reads Markdown embeds, decoded and without angle brackets or title', () => {
        expect(embedLinkpathsOnLine('![alt](media/scan.png)')).toEqual(['media/scan.png'])
        expect(embedLinkpathsOnLine('![](my%20scan.png)')).toEqual(['my scan.png'])
        expect(embedLinkpathsOnLine('![alt](<my scan.png>)')).toEqual(['my scan.png'])
        expect(embedLinkpathsOnLine('![alt](scan.png "A title")')).toEqual(['scan.png'])
    })

    test('reads every embed on the line, in order', () => {
        expect(embedLinkpathsOnLine('a ![[one.png]] b ![x](two.png) c ![[three.png]]')).toEqual([
            'one.png',
            'two.png',
            'three.png'
        ])
    })

    test('ignores plain links and text', () => {
        expect(embedLinkpathsOnLine('[[scan.png]] and [alt](scan.png)')).toEqual([])
        expect(embedLinkpathsOnLine('nothing here')).toEqual([])
    })

    test('keeps a path that is not valid percent-encoding as written', () => {
        expect(embedLinkpathsOnLine('![](100%.png)')).toEqual(['100%.png'])
    })
})

describe('findEmbedLine', () => {
    const isScan = (linkpath: string): boolean => linkpath === 'scan.png'

    test('finds the first line that embeds the image', () => {
        const lines = ['# Title', '', '![[other.png]]', 'text ![[scan.png|200]]', '![[scan.png]]']
        expect(findEmbedLine(lines, isScan)).toBe(3)
    })

    test('gives -1 when the note does not embed the image', () => {
        expect(findEmbedLine(['# Title', '![[other.png]]'], isScan)).toBe(-1)
    })

    test('skips an embed written inside fenced code', () => {
        const lines = ['```md', '![[scan.png]]', '```', '', '![[scan.png]]']
        expect(findEmbedLine(lines, isScan)).toBe(4)
        expect(findEmbedLine(['~~~', '![[scan.png]]', '~~~'], isScan)).toBe(-1)
    })
})

describe('insertAfterLine', () => {
    test('adds the transcription as its own paragraph after the embed', () => {
        expect(insertAfterLine('![[scan.png]]\nnext line', 0, 'TEXT')).toBe(
            '![[scan.png]]\n\nTEXT\n\nnext line'
        )
    })

    test('does not stack blank lines when one already follows the embed', () => {
        expect(insertAfterLine('![[scan.png]]\n\nnext paragraph', 0, 'TEXT')).toBe(
            '![[scan.png]]\n\nTEXT\n\nnext paragraph'
        )
    })

    test('ends the note with a newline when the embed is its last line', () => {
        expect(insertAfterLine('intro\n![[scan.png]]', 1, 'TEXT')).toBe(
            'intro\n![[scan.png]]\n\nTEXT\n'
        )
    })

    test('trims the transcription', () => {
        expect(insertAfterLine('![[scan.png]]\nnext', 0, '\n\nTEXT\n\n')).toBe(
            '![[scan.png]]\n\nTEXT\n\nnext'
        )
    })

    test('keeps two embeds in the order of the note when both are transcribed', () => {
        const isOne = (linkpath: string): boolean => linkpath === 'one.png'
        const isTwo = (linkpath: string): boolean => linkpath === 'two.png'
        // The second image finishes first, as it can with three in parallel.
        let content = '![[one.png]]\n![[two.png]]'
        content = insertAfterLine(content, findEmbedLine(content.split('\n'), isTwo), 'TWO')
        content = insertAfterLine(content, findEmbedLine(content.split('\n'), isOne), 'ONE')
        expect(content).toBe('![[one.png]]\n\nONE\n\n![[two.png]]\n\nTWO\n')
    })

    test('appends when the line does not exist', () => {
        expect(insertAfterLine('one line', 5, 'TEXT')).toBe('one line\n\nTEXT\n')
    })
})

describe('blockAfterLine', () => {
    test('is what an editor adds at the end of the embed line', () => {
        expect(blockAfterLine(['![[scan.png]]', 'next'], 0, 'TEXT')).toBe('\n\nTEXT\n')
        expect(blockAfterLine(['![[scan.png]]', '', 'next'], 0, 'TEXT')).toBe('\n\nTEXT')
        expect(blockAfterLine(['![[scan.png]]'], 0, 'TEXT')).toBe('\n\nTEXT\n')
    })
})

describe('blockAtCursor', () => {
    test('adds only a line end on an empty line', () => {
        expect(blockAtCursor('', 0, 'TEXT')).toBe('TEXT\n')
    })

    test('starts a new paragraph after text that precedes the cursor', () => {
        expect(blockAtCursor('some text', 9, 'TEXT')).toBe('\n\nTEXT\n')
    })

    test('keeps text that follows the cursor in its own paragraph', () => {
        expect(blockAtCursor('before after', 7, 'TEXT')).toBe('\n\nTEXT\n\n')
        expect(blockAtCursor('after', 0, 'TEXT')).toBe('TEXT\n\n')
    })
})

describe('appendToNote', () => {
    test('adds the transcription as the last paragraph', () => {
        expect(appendToNote('# Title\n\ntext\n\n\n', 'TEXT')).toBe('# Title\n\ntext\n\nTEXT\n')
    })

    test('fills an empty note', () => {
        expect(appendToNote('', 'TEXT')).toBe('TEXT\n')
        expect(appendToNote('\n', 'TEXT')).toBe('TEXT\n')
    })
})
