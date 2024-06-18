
import fs from 'node:fs'
import fsPromise from 'node:fs/promises'

async function IsFileExisting(filepath: string): Promise<boolean> {
    try {
        await fsPromise.access(filepath, fsPromise.constants.R_OK | fsPromise.constants.F_OK)
        return Promise.resolve(true)
    } catch {
        return Promise.resolve(false)
    }
}

function DeduceMimeTypeByFileExtension(filepath: string): string | undefined {
    let file_extension = filepath.split('.').reverse()[0]
    switch (file_extension.toLowerCase()) {
        case "js":
            return "text/javascript"
        case "css":
            return "text/css"
        case "otf":
            return "font/otf"
        case "ttf":
            return "font/ttf"
        case "svg":
            return "image/svg+xml"
        default:
            return undefined
    }
}

function DeduceFileExtensionByContentType(content_type: string): string {
    switch (content_type.toLowerCase()) {
        case "image/jpeg":
        case "image/png":
        case "image/webp":
            return content_type.toLowerCase().split("/")[1]
        default:
            return "unknown"
    }
}

export default {
    IsFileExisting,
    DeduceMimeTypeByFileExtension,
    DeduceFileExtensionByContentType
}