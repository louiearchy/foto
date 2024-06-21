
import { ExtendedFastifyRequest } from "../interfaces"
import { FastifyReply } from "fastify"

import DatabaseQueries from "../database-queries"
import Globals from '../globals'

export default async function AlbumNameRouteHandler(request: ExtendedFastifyRequest, reply: FastifyReply) {

    let { albumid } = (request.params as any)

    if (!albumid) {
        reply.code(Globals.HttpStatusCode.BadRequest)
        return
    }

    if (await request.IsNotOnSession())
        return reply.code(Globals.HttpStatusCode.Unauthorized)

    let album_name = await DatabaseQueries.GetAlbumNameByItsAlbumID(albumid)
    reply.code(Globals.HttpStatusCode.Ok).type("text/plain").send(album_name)
    return

}