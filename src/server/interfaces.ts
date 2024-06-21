
import { FastifyRequest } from 'fastify'
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

export interface ExtendedFastifyRequest extends FastifyRequest {
    cookies?: any,
    IsNotOnSession?: () => Promise<boolean>,
    IsOnSession: () => Promise<boolean>
}