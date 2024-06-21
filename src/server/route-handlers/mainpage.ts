
import { ExtendedFastifyRequest } from "../interfaces"
import { FastifyReply } from "fastify"
import fsPromise from 'node:fs/promises'

import Globals from '../globals'

export default async function MainPageRouteHandler ( request: ExtendedFastifyRequest, reply: FastifyReply ) {

    if (await request.IsNotOnSession())
        return reply.redirect("/")
                
    let page = await fsPromise.readFile('src/web/html/mainpage.html')
    return reply.code(Globals.HttpStatusCode.Ok).type("text/html").send(page)

}