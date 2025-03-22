
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
    let album_id_is_invalid = !album_name

    if (album_id_is_invalid)
        return reply.code(Globals.HttpStatusCode.NotFound).send()

    let clients_username = await DatabaseQueries.GetUsernameBySessionID(request.cookies?.sessionid)
    let the_album_is_not_owned_by_the_client = !(await DatabaseQueries.CheckAlbumOwnership(clients_username, albumid))

    if (the_album_is_not_owned_by_the_client)
        return reply.code(Globals.HttpStatusCode.NotFound).send()

    return reply.code(Globals.HttpStatusCode.Ok).type("text/plain").send(album_name)

}