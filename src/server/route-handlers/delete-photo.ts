
import { ExtendedFastifyRequest } from "../interfaces";
import { FastifyReply } from 'fastify'
import fsPromise from 'fs/promises'
import nodepath from 'node:path'

import UtilsFile from '../utility/file'
import Globals from '../globals'
import DatabaseQueries from '../database-queries'


export default async function DeletePhotoRouteHandler(request: ExtendedFastifyRequest, reply: FastifyReply) {

    let { id } = (request.params as any)

    if (!id)
        return reply.code(Globals.HttpStatusCode.BadRequest).send()

    if (await request.IsNotOnSession())
        return reply.code(Globals.HttpStatusCode.Unauthorized).send()

    let username = await DatabaseQueries.GetUsernameBySessionID(request.cookies.sessionid)
    let photo_id = id
    let user_doesnt_own_the_photo = !(await DatabaseQueries.CheckPhotoResourceOwnership(username, photo_id))

    if (user_doesnt_own_the_photo)
        return reply.code(Globals.HttpStatusCode.Unauthorized).send()

    // else if the user owns the photo
    let photo_filename = await DatabaseQueries.GetPhotoFilename(username, photo_id)
    let photo_storage_location = nodepath.join(Globals.StorageLocation.ForPhotos, photo_filename)
    let thumbnail_filename = `${photo_id}.webp`
    let thumbnail_storage_location = nodepath.join(Globals.StorageLocation.ForThumbnails, thumbnail_filename)
    await fsPromise.rm(photo_storage_location)

    // we check if the thumbnail for the photo exists since 
    // thumbnails are optional
    if (await UtilsFile.IsFileExisting(thumbnail_storage_location))
        await fsPromise.rm(thumbnail_storage_location)
 
    await DatabaseQueries.DeletePhoto(username, photo_id)
    return reply.code(Globals.HttpStatusCode.Ok).send()

    
}