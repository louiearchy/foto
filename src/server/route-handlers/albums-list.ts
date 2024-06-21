
import { ExtendedFastifyRequest } from '../interfaces'
import { FastifyReply } from 'fastify'

import DatabaseQueries from '../database-queries'
import Globals from '../globals'

/**
 * This route handler handles all the requests for getting the list of albums
 * specific to the user
 */
export default async function GetAlbumsListRouteHandler ( request: ExtendedFastifyRequest, reply: FastifyReply ) {
    
    if (await request.IsNotOnSession())
        return reply.code(Globals.HttpStatusCode.Unauthorized)

    let username = await DatabaseQueries.GetUsernameBySessionID(request.cookies.sessionid)
    let albums = await DatabaseQueries.GetAlbums(username)
    return reply.code(Globals.HttpStatusCode.Ok).send(albums).type("application/json")

}