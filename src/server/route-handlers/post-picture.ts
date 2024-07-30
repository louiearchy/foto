
import { ExtendedFastifyRequest } from '../interfaces'
import { FastifyReply } from 'fastify'

import DatabaseQueries from '../database-queries'
import Globals from '../globals'
import { ImageUploadingHandlingReport } from '../interfaces'
import { ImageUploadingHandlingReportStatus } from '../enums'



export default async function PostPictureRouteHandler ( request: ExtendedFastifyRequest, reply: FastifyReply ){
    let body = (request.body as ImageUploadingHandlingReport)
    if (body?.status == ImageUploadingHandlingReportStatus.MissingAuthorization) {
        return reply.code(Globals.HttpStatusCode.Unauthorized).send()
    }
    if (
        body.status == ImageUploadingHandlingReportStatus.Successful &&
        body?.photo_format                                           &&
        body?.photo_id
    ) {
        let username = await DatabaseQueries.GetUsernameBySessionID(request.cookies.sessionid)
        let albumid = (request.params as any)?.id ?? ''
        await DatabaseQueries.RecordNewPicture(username, albumid, body.photo_id, body.photo_format)
        return reply.type("text/plain").code(Globals.HttpStatusCode.Ok).send(body.photo_id)
    }
}