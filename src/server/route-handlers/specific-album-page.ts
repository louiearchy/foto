
import { FastifyReply, FastifyRequest } from "fastify"

import DatabaseQueries from "../database-queries"
import Globals from '../globals'
import HtmlTemplatePages from '../html/template-pages'
import JSONifyCookies from "../utility/jsonify-cookies"

export default async function SpecificAlbumPageHandler (request: FastifyRequest, reply: FastifyReply) {
    
    let { albumid } = request.params as any

    if (!albumid) {
        reply.code(Globals.HttpStatusCode.BadRequest).redirect("/home")
        return
    }

    if (!request.headers?.cookie) {        
        reply.code(Globals.HttpStatusCode.Unauthorized).redirect("/")
        return
    }

    let cookies = JSONifyCookies(request.headers.cookie)

    if (!cookies?.sessionid) {
        reply.code(Globals.HttpStatusCode.Unauthorized).redirect("/")
        return
    }

    let is_sessionid_not_valid = !(await DatabaseQueries.IsSessionIdValid(cookies.sessionid))

    if (is_sessionid_not_valid) {
        reply.code(Globals.HttpStatusCode.Unauthorized).redirect("/")
        return
    }

    reply.code(Globals.HttpStatusCode.Ok).type("text/html").send(HtmlTemplatePages.mainpage.data)
    return


}