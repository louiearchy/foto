

import { ExtendedFastifyRequest } from "../interfaces"
import { FastifyReply } from 'fastify'

import Globals from '../globals'
import UtilsFile from '../utility/file'
import fsPromise from 'node:fs/promises'
import DatabaseQueries from '../database-queries'

async function GetThumbnailLocation(photo_id: string): Promise<string> {

    let possible_thumbnail_filepath = `built/images/thumbnails/${photo_id}.webp`
    if (await UtilsFile.IsFileExisting(possible_thumbnail_filepath))
        return possible_thumbnail_filepath

    // there are some times where we will not generate a thumbnail because
    // the photo itself is small
    let original_photo_filepath = await DatabaseQueries.GetTruePathOfPicture(photo_id)
    return original_photo_filepath

}

export default async function ThumbnailRouteHandler(request: ExtendedFastifyRequest, reply: FastifyReply ) {

    if (await request.IsNotOnSession())
        return reply.code(Globals.HttpStatusCode.Unauthorized).send()

    let { photo_id } = (request.params as any)

    if (!photo_id)
        return reply.code(Globals.HttpStatusCode.BadRequest).send()

    let username = await DatabaseQueries.GetUsernameBySessionID(request.cookies.sessionid)
    let client_doesnt_own_photo_resource = !(await DatabaseQueries.CheckPhotoResourceOwnership(username, photo_id))

    if (client_doesnt_own_photo_resource)
        return reply.code(Globals.HttpStatusCode.Unauthorized).send()

    let thumbnail_truepath = await GetThumbnailLocation(photo_id)

    if (!(await UtilsFile.IsFileExisting(thumbnail_truepath))) 
        return reply.code(Globals.HttpStatusCode.NotFound).send()

    let thumbnail = await fsPromise.readFile(thumbnail_truepath)
    let thumbnail_mime_type = UtilsFile.DeduceMimeTypeByFileExtension(thumbnail_truepath)

    return reply.code(Globals.HttpStatusCode.Ok).type(thumbnail_mime_type).send(thumbnail)

}