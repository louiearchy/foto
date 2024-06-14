
import { FastifyRequest, FastifyReply } from 'fastify'

import DatabaseQueries from '../database-queries'
import Globals from '../globals'
import JSONifyCookies from '../utility/jsonify-cookies'
import { ImageUploadingHandlingReport } from '../interfaces'
import { ImageUploadingHandlingReportStatus } from '../enums'



export default async function PostPictureRequestHandler ( request: FastifyRequest, reply: FastifyReply ){
    let body = (request.body as ImageUploadingHandlingReport)
    if (body?.status == ImageUploadingHandlingReportStatus.MissingAuthorization) {
        reply.code(Globals.HttpStatusCode.Unauthorized)
        return
    }
    if (body.status == ImageUploadingHandlingReportStatus.Successful) {
        let cookies = JSONifyCookies(request.headers.cookie)
        let username = await DatabaseQueries.GetUsernameBySessionID(cookies?.sessionid)
        await DatabaseQueries.RecordNewPicture(username, (request.params as any)?.id, body.filepath)
        reply.code(Globals.HttpStatusCode.Ok)
        return
    }
}