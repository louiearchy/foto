
import { FastifyRequest, FastifyReply } from "fastify"
import fsPromise from 'node:fs/promises'

import DatabaseQueries from '../database-queries'
import Globals from '../globals'
import JSONifyCookies from "../utility/jsonify-cookies"

export default async function MainPageRouteHandler ( request: FastifyRequest, reply: FastifyReply ) {
    if (request.headers?.cookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        if (cookies?.sessionid) {
            let is_sessionid_valid = await DatabaseQueries.IsSessionIdValid(cookies.sessionid)
            if (!is_sessionid_valid) {
                reply.redirect("/")
                return
            }
            let page = await fsPromise.readFile('src/web/html/mainpage.html')
            reply.code(Globals.HttpStatusCode.Ok).type("text/html").send(page)  
        }
        else /* if no sessionid is given */ {
            reply.redirect("/")
            return
        }
    }
}