
import { FastifyRequest, FastifyReply } from "fastify"

import DatabaseQueries from '../database-queries'
import Globals from '../globals'
import HtmlTemplatePages from '../html/template-pages'
import JSONifyCookies from "../utility/jsonify-cookies"

export default async function MainPageRequestHandler ( request: FastifyRequest, reply: FastifyReply ) {
    if (request.headers?.cookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        if (cookies?.sessionid) {
            let is_sessionid_valid = await DatabaseQueries.IsSessionIdValid(cookies.sessionid)
            if (!is_sessionid_valid) {
                reply.redirect("/")
                return
            }
            reply.code(Globals.HttpStatusCode.Ok).type("text/html").send(HtmlTemplatePages.mainpage.data)  
        }
        else /* if no sessionid is given */ {
            reply.redirect("/")
            return
        }
    }
}