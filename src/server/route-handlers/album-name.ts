
import { ExtendedFastifyRequest } from "../interfaces"
import { FastifyReply } from "fastify"

import DatabaseQueries from "../database-queries"
import Globals from '../globals'

export default async function AlbumNameRouteHandler(request: ExtendedFastifyRequest, reply: FastifyReply) {

    let { albumid } = (request.params as any)

    if (!albumid) 
        return reply.code(Globals.HttpStatusCode.BadRequest).send()

    if (await request.IsNotOnSession())
        return reply.code(Globals.HttpStatusCode.Unauthorized).send()

    let album_name = await DatabaseQueries.GetAlbumNameByItsAlbumID(albumid)
    return reply.code(Globals.HttpStatusCode.Ok).type("text/plain").send(album_name)

}