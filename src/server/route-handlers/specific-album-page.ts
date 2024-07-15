
import { ExtendedFastifyRequest } from "../interfaces"
import { FastifyReply } from "fastify"
import fsPromise from "node:fs/promises"

import Globals from '../globals'

export default async function SpecificAlbumPageRouteHandler (request: ExtendedFastifyRequest, reply: FastifyReply) {
    
    let { albumid } = request.params as any

    if (!albumid) 
        return reply.code(Globals.HttpStatusCode.BadRequest).send()
    

    if (await request.IsNotOnSession())
        return reply.code(Globals.HttpStatusCode.Unauthorized).send()

    let page = await fsPromise.readFile('src/web/html/mainpage.html')
    return reply.code(Globals.HttpStatusCode.Ok).type("text/html").send(page)


}