
import { FastifyReply, FastifyRequest } from "fastify"

import DatabaseQueries from "../database-queries"
import Globals from '../globals'
import JSONifyCookies from "../utility/jsonify-cookies"

export default async function AlbumNameRouteHandler(request: FastifyRequest, reply: FastifyReply) {

    let { albumid } = (request.params as any)

    if (!albumid) {
        reply.code(Globals.HttpStatusCode.BadRequest)
        return
    }

    if (!request.headers?.cookie) {
        reply.code(Globals.HttpStatusCode.Unauthorized)
        return
    }

    let cookies = JSONifyCookies(request.headers.cookie)

    if (!cookies.sessionid) {
        reply.code(Globals.HttpStatusCode.Unauthorized)
        return
    }

    let sessionid_is_not_valid = !(await DatabaseQueries.IsSessionIdValid(cookies.sessionid))

    if (sessionid_is_not_valid) {
        reply.code(Globals.HttpStatusCode.Unauthorized)
        return
    }

    let album_name = await DatabaseQueries.GetAlbumNameByItsAlbumID(albumid)
    reply.code(Globals.HttpStatusCode.Ok).type("text/plain").send(album_name)
    return

}