
import { ExtendedFastifyRequest } from "../interfaces"
import { FastifyReply } from "fastify"
import fsPromise from "node:fs/promises"

import Globals from '../globals'

export default async function SpecificAlbumPageRouteHandler (request: ExtendedFastifyRequest, reply: FastifyReply) {
    
    let { albumid } = request.params as any

    if (!albumid) {
        reply.code(Globals.HttpStatusCode.BadRequest).redirect("/home")
        return
    }

    if (await request.IsNotOnSession())
        return reply.code(Globals.HttpStatusCode.Unauthorized)

    let page = await fsPromise.readFile('src/web/html/mainpage.html')
    reply.code(Globals.HttpStatusCode.Ok).type("text/html").send(page)
    return


}