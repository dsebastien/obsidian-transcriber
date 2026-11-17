/**
 * Where a transcription file goes, as pure functions of the image path and the
 * two settings that move it (output folder, file name prefix).
 */

/** Characters no file name may hold on at least one supported system. */
const FORBIDDEN_FILE_NAME_CHARACTERS = /[\\/:*?"<>|]/

/** Whether a file name prefix can be part of a file name on every system. */
export function isValidFileNamePrefix(prefix: string): boolean {
    return !FORBIDDEN_FILE_NAME_CHARACTERS.test(prefix)
}

/**
 * A vault folder path as the vault spells it: forward slashes, no leading or
 * trailing slash, no empty or `.` segment. Blank, `/` and `.` are the vault
 * root, which is the empty string.
 */
export function normalizeFolderPath(folder: string): string {
    return folder
        .replace(/\\/g, '/')
        .split('/')
        .map((segment) => segment.trim())
        .filter((segment) => segment !== '' && segment !== '.')
        .join('/')
}

/** Every folder on the way to `folder`, outermost first: `a/b` gives `a`, `a/b`. */
export function folderAncestry(folder: string): string[] {
    const segments = normalizeFolderPath(folder).split('/')
    if (segments[0] === '') {
        return []
    }
    return segments.map((_, index) => segments.slice(0, index + 1).join('/'))
}

/**
 * The transcription file for an image.
 *
 * `outputFolder` blank keeps the file next to the image; otherwise every
 * transcription goes to that one folder, whatever folder its image is in.
 * `prefix` goes in front of the image's name in both cases.
 */
export function buildOutputPath(
    imagePath: string,
    imageExtension: string,
    outputFolder: string,
    prefix: string
): string {
    const separator = imagePath.lastIndexOf('/')
    const imageFolder = separator === -1 ? '' : imagePath.slice(0, separator)
    const imageName = imagePath.slice(separator + 1)
    const baseName =
        imageExtension === '' ? imageName : imageName.slice(0, -(imageExtension.length + 1))

    const configured = normalizeFolderPath(outputFolder)
    const folder = configured === '' ? imageFolder : configured
    const fileName = `${prefix}${baseName}.md`
    return folder === '' ? fileName : `${folder}/${fileName}`
}
