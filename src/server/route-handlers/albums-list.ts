
import { FastifyReply, FastifyRequest } from 'fastify'

import DatabaseQueries from '../database-queries'
import Globals from '../globals'
import JSONifyCookies from "../utility/jsonify-cookies"

/**
 * This route handler handles all the requests for getting the list of albums
 * specific to the user
 */
export default async function GetAlbumsListRouteHandler ( request: FastifyRequest, reply: FastifyReply ) {
    if (request.headers?.cookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        if (cookies?.sessionid) {
            let is_sessionid_valid = await DatabaseQueries.IsSessionIdValid(cookies.sessionid)
            if (!is_sessionid_valid) {
                reply.code(Globals.HttpStatusCode.Unauthorized)
                return
            }
            /* if the sessionid is valid */
            let username = await DatabaseQueries.GetUsernameBySessionID(cookies.sessionid)
            let albums = await DatabaseQueries.GetAlbums(username)
            reply.code(Globals.HttpStatusCode.Ok).send(albums).type("application/json")
            return
        }
        else /* if there is no sessionid */ {
            reply.code(Globals.HttpStatusCode.Unauthorized)
            return
        }
    }
    else /* if there is no cookie */ {
        reply.code(Globals.HttpStatusCode.Unauthorized)
    }
}