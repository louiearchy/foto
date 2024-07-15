
import { ExtendedFastifyRequest } from '../interfaces'
import { FastifyReply } from 'fastify'

import DatabaseQueries from '../database-queries'
import Globals from '../globals'
import UtilsID from '../utility/id'

export default async function CreateAlbumRouteHandler( request: ExtendedFastifyRequest, reply: FastifyReply ) {

    if (await request.IsNotOnSession())
        return reply.code(Globals.HttpStatusCode.Unauthorized).send()

    let without_content_type = !(request.headers?.['content-type'])
    if (without_content_type)
        return reply.code(Globals.HttpStatusCode.BadRequest).send()

    let without_content_length = !(request.headers?.['content-length'])
    if (without_content_length)
        return reply.code(Globals.HttpStatusCode.BadRequest).send()

    let not_the_expected_content_type = request.headers?.['content-type'] != 'text/plain'
    if (not_the_expected_content_type)
        return reply.code(Globals.HttpStatusCode.BadRequest).send()

    let album_name = (request.body as string)
    let username = await DatabaseQueries.GetUsernameBySessionID(request.cookies.sessionid)
    let albumid = UtilsID.GenerateAlbumId()
    await DatabaseQueries.RecordNewAlbum(username, albumid, album_name)
    return reply.code(Globals.HttpStatusCode.Ok).type("text/plain").send(albumid)
            
}