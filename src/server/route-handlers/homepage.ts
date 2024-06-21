
import { ExtendedFastifyRequest } from '../interfaces'
import { FastifyReply } from 'fastify'
import fsPromise from 'node:fs/promises'

export default async function HomepageRouteHandler(request: ExtendedFastifyRequest, reply: FastifyReply ) {
    
    if (await request.IsOnSession())
        return reply.redirect('/home')

    let page = await fsPromise.readFile('src/web/html/homepage.html')
    return reply.type('text/html').send(page)

}