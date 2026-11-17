import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { extractReleaseNotes } from '../src/app/utils/release-notes'
import {
    applyCuratedNotes,
    checkCuratedNotes,
    consumeCuratedNotes,
    extractReleaseBody,
    generateEntry,
    readCuratedNotes
} from './generate-changelog'
import { gitIn } from './version-bump'

/**
 * Written outside the repo, under a name unique to this process.
 *
 * It used to be `CHANGELOG.test.md` in the repo root. Two problems with that:
 * a run that dies before `afterAll` leaves an untracked file behind, and every
 * commit path here uses `git add -A`, so the stray file gets swept into the
 * next commit — a release commit, if the timing is unlucky. And two runs
 * sharing one checkout (a watcher alongside a manual run, or two agents) race
 * on the same path, so one deletes the file the other is still reading.
 */
const TEST_CHANGELOG = join(tmpdir(), `changelog-spec-${process.pid}-${Date.now()}.md`)

describe('getLatestChangelogEntry', () => {
    beforeAll(() => {
        // Create a test changelog file
        const content = `# Changelog

## [1.2.0] - 2024-01-15

### Added
- New feature A
- New feature B

### Fixed
- Bug fix 1

## [1.1.0] - 2024-01-01

### Added
- Initial feature

## [1.0.0] - 2023-12-01

### Added
- First release
`
        writeFileSync(TEST_CHANGELOG, content)
    })

    afterAll(() => {
        try {
            unlinkSync(TEST_CHANGELOG)
        } catch {
            // Ignore if file doesn't exist
        }
    })

    test('extracts latest version section', async () => {
        const testFile = Bun.file(TEST_CHANGELOG)

        // Read test content and verify extraction logic
        const content = await testFile.text()
        const sections = content.split(/^## /m)

        expect(sections.length).toBeGreaterThan(2)
        expect(sections[1]).toContain('[1.2.0]')
        expect(sections[1]).toContain('New feature A')
    })

    test('returns empty string for non-existent file', async () => {
        // This tests the edge case handling
        const nonExistentFile = Bun.file('CHANGELOG.nonexistent.md')
        const exists = await nonExistentFile.exists()
        expect(exists).toBe(false)
    })
})

describe('changelog format', () => {
    test('conventional changelog format is valid', () => {
        // Verify the expected format structure
        const sampleEntry = `## [1.0.0] - 2024-01-01

### Added
- Feature 1

### Fixed
- Bug 1
`
        expect(sampleEntry).toMatch(/^## \[\d+\.\d+\.\d+\]/)
        expect(sampleEntry).toContain('### Added')
        expect(sampleEntry).toContain('### Fixed')
    })
})

describe('applyCuratedNotes', () => {
    const generated = `## [1.3.0](https://github.com/o/r/compare/1.2.0...1.3.0) (2026-09-28)

### Features

* **plugin:** align with the catalog reviewer's archive ([abc1234](https://github.com/o/r/commit/abc1234))
`

    test('keeps the generated entry when there are no curated notes', () => {
        expect(applyCuratedNotes(generated, null)).toBe(generated)
        expect(applyCuratedNotes(generated, '  \n\n')).toBe(generated)
    })

    test('replaces the commit list with the curated notes under the same header', () => {
        const entry = applyCuratedNotes(generated, '\n### New\n\n- Past view of any note.\n\n')
        expect(entry).toBe(
            '## [1.3.0](https://github.com/o/r/compare/1.2.0...1.3.0) (2026-09-28)\n\n### New\n\n- Past view of any note.\n'
        )
        expect(entry).not.toContain('catalog reviewer')
    })

    test('keeps a header-only generated entry whole (a release of chore commits)', () => {
        const entry = applyCuratedNotes('## [1.3.1](x) (2026-09-28)', '- Fixed.')
        expect(entry).toBe('## [1.3.1](x) (2026-09-28)\n\n- Fixed.\n')
    })

    test.each([
        ['### 1.2.0 users: migration', 'version heading'],
        ['```md\n## [1.2.0] in a fence\n```', 'version heading'],
        ['## Highlights', 'use ### or deeper'],
        ['# Title', 'use ### or deeper'],
        ['  ## Indented', 'use ### or deeper'],
        ['##', 'use ### or deeper'],
        ['```\n# c\n```\n## After a closed fence', 'use ### or deeper']
    ])('refuses %p', (notes, reason) => {
        expect(() => applyCuratedNotes(generated, `${notes}\n\n- x`)).toThrow(
            new RegExp(`^NEXT_RELEASE\\.md: .*${reason}`)
        )
    })

    test('accepts deeper headings, shell comments in fences and hashes in prose', () => {
        const notes =
            '### Fixed\n\n#### Detail\n\n```bash\n# install\n## also a comment\n```\n\n- Tag #inbox kept.'
        expect(applyCuratedNotes(generated, notes)).toContain(notes)
    })

    test('a fence closes only on its own marker', () => {
        const notes = '~~~\n```\n## inside\n~~~'
        expect(applyCuratedNotes(generated, notes)).toContain(notes)
        expect(() => applyCuratedNotes(generated, '````\n```\n````\n## out')).toThrow(
            /use ### or deeper/
        )
        expect(() => applyCuratedNotes(generated, '```\n~~~\n```\n## out')).toThrow(
            /use ### or deeper/
        )
    })

    test('refuses a generated entry without a version header', () => {
        expect(() => applyCuratedNotes('### Features\n\n* x\n', '- y')).toThrow(/no version header/)
    })
})

describe('both surfaces show the curated section', () => {
    const changelog = (notes: string): string =>
        `# Changelog\n\n${applyCuratedNotes('## [1.3.0](x) (2026-09-28)\n\n* raw\n', notes)}\n## [1.2.0](x) (2026-09-01)\n\n- older\n`

    test("the release body and the What's new tab carry the same text", () => {
        const text = changelog('### New\n\n- Past view of any note.\n\n```bash\n# install\n```')
        const body = extractReleaseBody(text, '1.3.0')
        const tab = extractReleaseNotes(text, '1.3.0', '1.2.0')
        expect(body).toContain('Past view of any note.')
        expect(body).toContain('# install')
        expect(body).not.toContain('older')
        expect(tab).toContain(body.split('\n').slice(1).join('\n').trim())
    })

    test('the release body refuses a changelog whose newest section is another version', () => {
        expect(() => extractReleaseBody(changelog('- x'), '1.3.1')).toThrow(
            /newest section is 1\.3\.0/
        )
    })
})

describe('curated notes file', () => {
    let dir = ''
    let path = ''
    beforeEach(() => {
        dir = mkdtempSync(join(tmpdir(), 'curated-notes-'))
        path = join(dir, 'NEXT_RELEASE.md')
    })
    afterEach(() => {
        rmSync(dir, { recursive: true, force: true })
    })

    test('is consumed once, so the next release does not repeat it', async () => {
        writeFileSync(path, '- x')
        expect(await readCuratedNotes(path)).toBe('- x')
        expect(consumeCuratedNotes(path)).toBe(true)
        expect(existsSync(path)).toBe(false)
        expect(await readCuratedNotes(path)).toBeNull()
        expect(consumeCuratedNotes(path)).toBe(false)
    })

    test('is reported as curated, empty or absent before dispatch', async () => {
        expect(await checkCuratedNotes(path)).toBe('generated')
        writeFileSync(path, ' \n')
        expect(await checkCuratedNotes(path)).toBe('empty')
        writeFileSync(path, '- x')
        expect(await checkCuratedNotes(path)).toBe('curated')
        writeFileSync(path, '## Bad')
        await expect(checkCuratedNotes(path)).rejects.toThrow(/use ### or deeper/)
    })
})

describe('generateEntry', () => {
    // Runs the real generator in a throwaway repository, as bumpVersion's
    // specs do: a preset or generator upgrade that changes the entry's shape,
    // or stops rendering it, fails here and not in the middle of a release.
    let root = ''

    const GIT_TEST_TIMEOUT_MS = 60_000

    const git = async (...args: string[]): Promise<void> => {
        const result = await gitIn(root)([
            '-c',
            'user.name=spec',
            '-c',
            'user.email=spec@example.com',
            '-c',
            'commit.gpgsign=false',
            '-c',
            'tag.gpgsign=false',
            ...args
        ])
        if (result.exitCode !== 0) {
            throw new Error(`git ${args.join(' ')}: ${result.stderr.toString()}`)
        }
    }

    const commit = async (version: string, message: string): Promise<void> => {
        writeFileSync(
            join(root, 'package.json'),
            JSON.stringify({
                name: 'x',
                version,
                repository: { type: 'git', url: 'git+https://github.com/o/r.git' }
            })
        )
        writeFileSync(join(root, 'change.txt'), message)
        await git('add', '-A')
        await git('commit', '-q', '--no-verify', '-m', message)
    }

    // The generator spawns git with this process's environment. Inside a git
    // hook, GIT_DIR and its siblings point at the real repository whatever
    // the working directory is, so they are cleared for the test and put back.
    const HOOK_VARIABLES = [
        'GIT_DIR',
        'GIT_INDEX_FILE',
        'GIT_WORK_TREE',
        'GIT_PREFIX',
        'GIT_COMMON_DIR'
    ]
    let saved: Record<string, string | undefined> = {}

    beforeEach(async () => {
        saved = Object.fromEntries(HOOK_VARIABLES.map((key) => [key, process.env[key]]))
        for (const key of HOOK_VARIABLES) {
            delete process.env[key]
        }
        root = mkdtempSync(join(tmpdir(), 'generate-entry-spec-'))
        await git('init', '-q')
    }, GIT_TEST_TIMEOUT_MS)

    afterEach(() => {
        rmSync(root, { recursive: true, force: true })
        for (const [key, value] of Object.entries(saved)) {
            if (value !== undefined) {
                process.env[key] = value
            }
        }
    })

    test(
        'renders the commits since the previous tag under the new version',
        async () => {
            await commit('1.0.0', 'feat(plugin): first release')
            await git('tag', '1.0.0')
            await commit('1.0.0', 'fix(plugin): keep the notice on screen')
            await commit('1.0.0', 'docs(all): not for users')
            await commit('1.0.1', 'chore(release): 1.0.1')

            const entry = (await generateEntry(root)).trim()

            expect(entry).toStartWith('## [1.0.1](https://github.com/o/r/compare/1.0.0...1.0.1) (')
            expect(entry).toContain('### Bug Fixes')
            expect(entry).toMatch(
                /^\* \*\*plugin:\*\* keep the notice on screen \(\[[0-9a-f]{7}\]\(https:\/\/github\.com\/o\/r\/commit\/[0-9a-f]{40}\)\)$/m
            )
            expect(entry).not.toContain('first release')
            expect(entry).not.toContain('not for users')
            // The entry alone: the old changelog is merged in by generateChangelog.
            expect(entry.match(/^## /gm)).toHaveLength(1)
        },
        GIT_TEST_TIMEOUT_MS
    )
})
