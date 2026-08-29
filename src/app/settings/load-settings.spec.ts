import { describe, expect, test, mock } from 'bun:test'
import { TranscriberPlugin } from '../plugin'
import { DEFAULT_SETTINGS } from '../types/plugin-settings.intf'

/**
 * The settings load path backfills each stored field individually, so a field
 * that is missing from the backfill is silently reset to its default on every
 * restart — which is exactly what `frontmatterTags` did before this branch.
 * These tests fail if any field drops out of the backfill again.
 */

function createPlugin(stored: unknown): TranscriberPlugin {
    const plugin = Object.create(TranscriberPlugin.prototype) as TranscriberPlugin
    const internals = plugin as unknown as Record<string, unknown>
    internals['settings'] = { ...DEFAULT_SETTINGS }
    internals['loadData'] = mock(async () => stored)
    return plugin
}

describe('loadSettings', () => {
    test('restores every persisted field', async () => {
        const stored = {
            ollamaUrl: 'http://box:11434',
            modelName: 'llava:13b',
            transcriptionPrompt: 'Describe the page.',
            includeSubfolders: !DEFAULT_SETTINGS.includeSubfolders,
            overwriteExisting: !DEFAULT_SETTINGS.overwriteExisting,
            frontmatterTags: 'notes, scans'
        }
        const plugin = createPlugin(stored)
        await plugin.loadSettings()
        expect(plugin.settings).toEqual(stored)
    })

    test('keeps a stored frontmatterTags value across a reload', async () => {
        const plugin = createPlugin({ frontmatterTags: 'reMarkable, transcription' })
        await plugin.loadSettings()
        // Regression guard: this field was missing from the backfill, so the
        // saved value was replaced by the default on every restart.
        expect(plugin.settings.frontmatterTags).toBe('reMarkable, transcription')
    })

    test('falls back to defaults for absent fields and for no stored data', async () => {
        const partial = createPlugin({ modelName: 'llava:13b' })
        await partial.loadSettings()
        expect(partial.settings.modelName).toBe('llava:13b')
        expect(partial.settings.frontmatterTags).toBe(DEFAULT_SETTINGS.frontmatterTags)
        expect(partial.settings.ollamaUrl).toBe(DEFAULT_SETTINGS.ollamaUrl)

        const fresh = createPlugin(null)
        await fresh.loadSettings()
        expect(fresh.settings).toEqual(DEFAULT_SETTINGS)
    })
})
