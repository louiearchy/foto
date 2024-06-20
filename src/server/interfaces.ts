
import { ImageUploadingHandlingReportStatus } from "./enums"

export interface AccountSubmissionInfo {
    username?: string,
    password?: string
}

export interface ImageUploadingHandlingReport {
    status?: ImageUploadingHandlingReportStatus,
    photo_id?: string,
    photo_format?: string
}
