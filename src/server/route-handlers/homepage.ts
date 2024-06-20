
import { FastifyRequest, FastifyReply } from 'fastify'
import fsPromise from 'node:fs/promises'

import JSONifyCookies from '../utility/jsonify-cookies'

export default async function HomepageRouteHandler(request: FastifyRequest, reply: FastifyReply ) {
    let client_has_cookie = request.headers?.cookie != undefined
    if (client_has_cookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        let client_has_sessionid = cookies?.sessionid != undefined
        if (client_has_sessionid) {
            return reply.redirect('/home')
        }
    }
    let page = await fsPromise.readFile('src/web/html/homepage.html')
    return reply.type('text/html').send(page)
}