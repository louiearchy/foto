
import { ExtendedFastifyRequest } from "../interfaces"
import { FastifyReply } from 'fastify'

import DatabaseQueries from '../database-queries'
import Globals from '../globals'
import fsPromise from 'node:fs/promises'

async function DeletePhotosFromAlbum(username: string, albumid: string): Promise<void> {
    let list_of_photos = await DatabaseQueries.GetPhotosOfAlbum(username, albumid)
    let delete_operations: Promise<void>[] = []
    for (const photo of list_of_photos) { 
        let truepath_to_photo = `built/${photo.photoid}.${photo.format}`
        delete_operations.push(fsPromise.rm(truepath_to_photo))
    }
    await Promise.allSettled(delete_operations)
}

export default async function DeleteAlbumRouteHandler(request: ExtendedFastifyRequest, reply: FastifyReply) {

    let { id } = (request.params as any)

    if (!id)
        return reply.code(Globals.HttpStatusCode.BadRequest).send()

    if (await request.IsNotOnSession())
        return reply.code(Globals.HttpStatusCode.Unauthorized).send()

    let albumid = id
    let username = await DatabaseQueries.GetUsernameBySessionID(request.cookies.sessionid)
    let client_does_not_own_the_album = !(await DatabaseQueries.CheckAlbumOwnership(username, albumid))

    if (client_does_not_own_the_album)
        return reply.code(Globals.HttpStatusCode.BadRequest).send()

    await DeletePhotosFromAlbum(username, albumid)

    await Promise.allSettled([
        DatabaseQueries.DeleteAlbum(username, albumid),
        DatabaseQueries.DeletePhotosFromAlbum(username, albumid)
    ])

    return reply.code(Globals.HttpStatusCode.Ok).send()



}