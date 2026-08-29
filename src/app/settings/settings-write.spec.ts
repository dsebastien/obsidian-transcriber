import { describe, expect, test, mock } from 'bun:test'
import { TranscriberPlugin } from '../plugin'
import { TranscriberSettingTab } from './settings-tab'
import { DEFAULT_SETTINGS } from '../types/plugin-settings.intf'

/**
 * Behavioral coverage for the settings write path.
 *
 * Nothing in CI renders a settings pane, so these tests exercise the
 * properties no UI test can reach: writes are serialized, memory is committed
 * only after persistence succeeds, a rejected value never reaches the store,
 * and the Ollama service re-reads its config strictly after the commit.
 */

async function expectRejection(promise: Promise<unknown>, contains: string): Promise<void> {
    let caught: unknown
    await promise.catch((error: unknown) => {
        caught = error
    })
    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).message).toContain(contains)
}

interface Harness {
    plugin: TranscriberPlugin
    tab: TranscriberSettingTab
    saveData: ReturnType<typeof mock>
    updateConfig: ReturnType<typeof mock>
    /** `plugin.settings.modelName` as seen from inside each updateConfig call. */
    configSeenSettings: string[]
}

function createHarness(options?: { saveData?: () => Promise<void> }): Harness {
    const saveData = mock(async () => {
        if (options?.saveData) {
            await options.saveData()
        }
    })
    // Records what `plugin.settings` held at the moment the service was
    // reconfigured, so the test can assert ORDERING and not just arguments:
    // reconfiguring before the commit would capture the previous model.
    const configSeenSettings: string[] = []
    const updateConfig = mock((_url: string, model: string) => {
        configSeenSettings.push((plugin as { settings: { modelName: string } }).settings.modelName)
        void model
    })

    const plugin = Object.create(TranscriberPlugin.prototype) as TranscriberPlugin
    const internals = plugin as unknown as Record<string, unknown>
    internals['settings'] = { ...DEFAULT_SETTINGS }
    internals['settingsWriteChain'] = Promise.resolve()
    internals['saveData'] = saveData
    internals['ollamaService'] = { updateConfig, listModels: async () => [] }

    const tab = Object.create(TranscriberSettingTab.prototype) as TranscriberSettingTab
    const tabInternals = tab as unknown as Record<string, unknown>
    tabInternals['plugin'] = plugin
    tabInternals['installedModels'] = []
    tabInternals['isPullingModel'] = false
    tabInternals['isLoadingModels'] = false
    tabInternals['update'] = () => {}

    return { plugin, tab, saveData, updateConfig, configSeenSettings }
}

describe('updateSettings', () => {
    test('commits to memory only after the write is persisted', async () => {
        let release = (): void => {}
        const gate = new Promise<void>((resolve) => {
            release = resolve
        })
        const { plugin, saveData, updateConfig, configSeenSettings } = createHarness({
            saveData: () => gate
        })

        const pending = plugin.updateSettings((draft) => {
            draft.modelName = 'committed'
        })

        // Let the queued write start and reach its save await; a bare
        // synchronous assertion would pass even with the ordering reversed,
        // because the chain defers the work to a microtask.
        await Promise.resolve()
        await Promise.resolve()
        expect(saveData).toHaveBeenCalledTimes(1)
        expect(plugin.settings.modelName).toBe(DEFAULT_SETTINGS.modelName)
        expect(updateConfig).not.toHaveBeenCalled()

        release()
        await pending
        expect(plugin.settings.modelName).toBe('committed')
        expect(updateConfig).toHaveBeenCalledWith(DEFAULT_SETTINGS.ollamaUrl, 'committed')
        // Ordering, not just arguments: the service must observe the COMMITTED
        // settings. Reconfiguring before the commit would capture the old
        // model name here even though the arguments would still look right.
        expect(configSeenSettings).toEqual(['committed'])
    })

    test('leaves memory untouched, rejects, and skips the Ollama side effect when persistence fails', async () => {
        const { plugin, updateConfig } = createHarness({
            saveData: () => Promise.reject(new Error('disk full'))
        })

        await expectRejection(
            plugin.updateSettings((draft) => {
                draft.ollamaUrl = 'http://elsewhere:11434'
            }),
            'disk full'
        )
        expect(plugin.settings.ollamaUrl).toBe(DEFAULT_SETTINGS.ollamaUrl)
        expect(updateConfig).not.toHaveBeenCalled()
    })

    test('serializes overlapping writes so both land', async () => {
        let release = (): void => {}
        const gate = new Promise<void>((resolve) => {
            release = resolve
        })
        let first = true
        const { plugin } = createHarness({
            saveData: () => {
                if (first) {
                    first = false
                    return gate
                }
                return Promise.resolve()
            }
        })

        const a = plugin.updateSettings((draft) => {
            draft.modelName = 'first'
        })
        const b = plugin.updateSettings((draft) => {
            draft.includeSubfolders = !DEFAULT_SETTINGS.includeSubfolders
        })
        release()
        await Promise.all([a, b])
        expect(plugin.settings.modelName).toBe('first')
        expect(plugin.settings.includeSubfolders).toBe(!DEFAULT_SETTINGS.includeSubfolders)
    })
})

describe('setControlValue', () => {
    test('persists writes for every declared key', async () => {
        const { tab, plugin } = createHarness()
        await tab.setControlValue('ollamaUrl', 'http://box:11434')
        await tab.setControlValue('transcriptionPrompt', 'Describe the page.')
        await tab.setControlValue('includeSubfolders', true)
        await tab.setControlValue('frontmatterTags', 'notes, scans')
        expect(plugin.settings.ollamaUrl).toBe('http://box:11434')
        expect(plugin.settings.transcriptionPrompt).toBe('Describe the page.')
        expect(plugin.settings.includeSubfolders).toBe(true)
        expect(plugin.settings.frontmatterTags).toBe('notes, scans')
    })

    test('rejects type-mismatched values without writing', async () => {
        const { tab, plugin, saveData } = createHarness()
        await expectRejection(tab.setControlValue('ollamaUrl', 42), 'expects a string')
        await expectRejection(tab.setControlValue('includeSubfolders', 'yes'), 'expects a boolean')
        expect(saveData).not.toHaveBeenCalled()
        expect(plugin.settings.ollamaUrl).toBe(DEFAULT_SETTINGS.ollamaUrl)
    })

    test('routes modelName and overwriteExisting to their own fields', async () => {
        const { tab, plugin } = createHarness()
        await tab.setControlValue('modelName', 'llava:13b')
        await tab.setControlValue('overwriteExisting', true)
        expect(plugin.settings.modelName).toBe('llava:13b')
        expect(plugin.settings.overwriteExisting).toBe(true)
        // Neighbouring fields must be untouched by either write.
        expect(plugin.settings.includeSubfolders).toBe(DEFAULT_SETTINGS.includeSubfolders)
        expect(plugin.settings.transcriptionPrompt).toBe(DEFAULT_SETTINGS.transcriptionPrompt)
    })

    test('propagates a persistence failure to the caller', async () => {
        const { tab, plugin } = createHarness({
            saveData: () => Promise.reject(new Error('disk full'))
        })
        // The framework rolls the control back only if the promise REJECTS;
        // swallowing the error here would leave the pane showing a value that
        // was never stored.
        await expectRejection(tab.setControlValue('ollamaUrl', 'http://box:11434'), 'disk full')
        expect(plugin.settings.ollamaUrl).toBe(DEFAULT_SETTINGS.ollamaUrl)
    })

    test('rejects an unknown key', async () => {
        const { tab, saveData } = createHarness()
        await expectRejection(
            tab.setControlValue('__proto__', 'x'),
            'does not address a known field'
        )
        expect(saveData).not.toHaveBeenCalled()
    })
})

describe('modelDropdownOptions', () => {
    test('flags a stored model that is not installed instead of dropping it', () => {
        const { tab, plugin } = createHarness()
        const internals = tab as unknown as Record<string, unknown>
        internals['installedModels'] = ['llava:13b']
        ;(plugin.settings as { modelName: string }).modelName = 'gone:7b'
        const options = (
            tab as unknown as { modelDropdownOptions(): Record<string, string> }
        ).modelDropdownOptions()
        expect(options['llava:13b']).toBe('llava:13b')
        expect(options['gone:7b']).toBe('gone:7b (not found)')
    })
})
