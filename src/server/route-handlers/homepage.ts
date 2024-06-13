
import { FastifyRequest, FastifyReply } from 'fastify'

import HtmlTemplatePages from '../html/template-pages'
import JSONifyCookies from '../utility/jsonify-cookies'

export default function HomepageRouteHandler(request: FastifyRequest, reply: FastifyReply ) {
    let client_has_cookie = request.headers?.cookie != undefined
    if (client_has_cookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        let client_has_sessionid = cookies?.sessionid != undefined
        if (client_has_sessionid) {
            return reply.redirect('/home')
        }
    }
    return reply.type('text/html').send(HtmlTemplatePages.homepage)
}