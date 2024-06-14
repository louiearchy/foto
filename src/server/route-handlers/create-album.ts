
import { FastifyRequest, FastifyReply } from 'fastify'

import DatabaseQueries from '../database-queries'
import Globals from '../globals'
import JSONifyCookies from '../utility/jsonify-cookies'
import UtilsID from '../utility/id'

export default async function CreateAlbumRequestHandler( request: FastifyRequest, reply: FastifyReply ) {
    let clientHasCookie = request.headers?.cookie ?? false
    if (clientHasCookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        let withSessionId = cookies?.sessionid
        if (withSessionId) {
            if (await DatabaseQueries.IsSessionIdValid(cookies.sessionid)) {
                let isWithContentType = typeof request.headers?.["content-type"] === 'string'
                let isWithContentLength = request.headers?.["content-length"] !== undefined
                if (isWithContentLength && isWithContentType) {
                    let contentType = request.headers["content-type"].toLowerCase()
                    if (contentType == "text/plain") {
                        let album_name = (request.body as string)
                        let username = await DatabaseQueries.GetUsernameBySessionID(cookies.sessionid)
                        let albumid = UtilsID.GenerateAlbumId()
                        await DatabaseQueries.RecordNewAlbum(username, albumid, album_name)
                        reply.code(Globals.HttpStatusCode.Ok).send(albumid).type("text/plain")
                        return
                    }
                    else /* if the content type is not text/plain */ {
                        reply.code(Globals.HttpStatusCode.BadRequest)
                        return
                    }
                }
                else /* if the request did not give the content-length and content-type */ {
                    reply.code(Globals.HttpStatusCode.BadRequest)
                    return
                }
            }
            else /* if the session id is not valid */ {
                reply.code(Globals.HttpStatusCode.BadRequest)
                return
            }
        }
        else /* without session id */ {
            reply.code(Globals.HttpStatusCode.Unauthorized)
            return
        }
    }
}