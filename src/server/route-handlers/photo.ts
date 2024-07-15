
import { FastifyReply } from 'fastify'

import DatabaseQueries from '../database-queries'
import { ExtendedFastifyRequest } from '../interfaces'
import Globals from '../globals'
import UtilsFile from '../utility/file'
import fsPromise from 'fs/promises'

export default async function PhotoRouteHandler( request: ExtendedFastifyRequest, reply: FastifyReply ) {
    
    if (await request.IsNotOnSession())
        return reply.code(Globals.HttpStatusCode.Unauthorized).send()

    let username = await DatabaseQueries.GetUsernameBySessionID(request.cookies.sessionid)
    let photo_resource = ((request.params as any)?.photo_resource as string)
    let photoid = photo_resource.split('.')[0]
    let client_doesnt_own_photo_resource = !(await DatabaseQueries.CheckPhotoResourceOwnership(username, photoid))

    if (client_doesnt_own_photo_resource)
        return reply.code(Globals.HttpStatusCode.Unauthorized).send()

    let true_path_to_photo_resource = `./built/${photo_resource}`
    let photo_resource_doesnt_exist = !(await UtilsFile.IsFileExisting(true_path_to_photo_resource))
    let photo_mime_type = UtilsFile.DeduceMimeTypeByFileExtension(true_path_to_photo_resource)

    if (photo_resource_doesnt_exist)
        return reply.code(Globals.HttpStatusCode.NotFound).send()

    let photo = await fsPromise.readFile(true_path_to_photo_resource)
    return reply.code(Globals.HttpStatusCode.Ok).type(photo_mime_type).send(photo)

}