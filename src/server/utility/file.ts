
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
        case 'jpeg':
        case 'jpg':
            return 'image/jpeg'
        case 'png':
            return 'image/png'
        case 'webp':
            return 'image/webp'
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

function GetFilenameFromFilePath(filepath: string): string {
    let window_style_path_separator = filepath.indexOf("\\") != -1
    let path_separator = (window_style_path_separator) ? "\\" : "/"
    return filepath.split(path_separator).reverse()[0]
}

function ReplaceFileExtension(filepath: string, to_file_extension: string): string {
    let splitted_filepath_by_dot = filepath.split(".")
    let returning_replaced_file_extension_filepath = ""
    for (let i = 0; i < splitted_filepath_by_dot.length; i++) {
        let is_at_the_end = (i == (splitted_filepath_by_dot.length - 1))
        if (is_at_the_end) {
            returning_replaced_file_extension_filepath += to_file_extension
        } else {
            returning_replaced_file_extension_filepath += splitted_filepath_by_dot[i]
        }
    }
    return returning_replaced_file_extension_filepath
}

export default {
    IsFileExisting,
    DeduceMimeTypeByFileExtension,
    DeduceFileExtensionByContentType,
    GetFilenameFromFilePath,
    ReplaceFileExtension
}