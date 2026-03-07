/**
 * Test setup file that mocks the 'obsidian' module.
 * The obsidian package is types-only and has no runtime code,
 * so we need to provide mock implementations for tests.
 */
import { mock } from 'bun:test'

// Mock the obsidian module (fire-and-forget, no need to await)
void mock.module('obsidian', () => ({
    Notice: class Notice {
        constructor(_message: string, _timeout?: number) {
            // No-op for tests
        }
        setMessage(_message: string): void {
            // No-op for tests
        }
        hide(): void {
            // No-op for tests
        }
    },
    Menu: class Menu {
        addItem(cb: (item: unknown) => void): Menu {
            cb({
                setTitle: () => ({ setIcon: () => ({ onClick: () => ({}) }) }),
                setIcon: () => ({ onClick: () => ({}) })
            })
            return this
        }
    },
    // These are only used as types, but we provide empty implementations
    // in case they're ever accessed at runtime
    App: class App {},
    TFile: class TFile {},
    TFolder: class TFolder {},
    Plugin: class Plugin {},
    PluginSettingTab: class PluginSettingTab {},
    Setting: class Setting {},
    MarkdownView: class MarkdownView {},
    TAbstractFile: class TAbstractFile {},
    AbstractInputSuggest: class AbstractInputSuggest {},
    SearchComponent: class SearchComponent {},
    requestUrl: () =>
        Promise.resolve({
            status: 200,
            json: {},
            text: '',
            arrayBuffer: new ArrayBuffer(0),
            headers: {}
        }),
    debounce: (fn: (...args: unknown[]) => unknown) => fn,
    setIcon: () => {}
}))
