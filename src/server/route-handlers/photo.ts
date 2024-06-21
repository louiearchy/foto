
import { FastifyReply } from 'fastify'

import DatabaseQueries from '../database-queries'
import { ExtendedFastifyRequest } from '../interfaces'
import Globals from '../globals'
import JSONifyCookies from '../utility/jsonify-cookies'
import UtilsFile from '../utility/file'
import fsPromise from 'fs/promises'

export default async function PhotoRouteHandler( request: ExtendedFastifyRequest, reply: FastifyReply ) {
    
    if (await request.IsNotOnSession())
        return reply.code(Globals.HttpStatusCode.Unauthorized)

    let cookies = JSONifyCookies(request.headers?.cookie)
    let username = await DatabaseQueries.GetUsernameBySessionID(cookies.sessionid)
    let photo_resource = ((request.params as any)?.photo_resource as string)
    let photoid = photo_resource.split('.')[0]
    let client_doesnt_own_photo_resource = !(await DatabaseQueries.CheckPhotoResourceOwnership(username, photoid))

    if (client_doesnt_own_photo_resource)
        return reply.code(Globals.HttpStatusCode.Unauthorized)

    let true_path_to_photo_resource = `./built/${photo_resource}`
    let photo_resource_exists = await UtilsFile.IsFileExisting(true_path_to_photo_resource)
    let photo_mime_type = UtilsFile.DeduceMimeTypeByFileExtension(true_path_to_photo_resource)
    
    if (photo_resource_exists) {
        let photo = await fsPromise.readFile(true_path_to_photo_resource)
        return reply.code(Globals.HttpStatusCode.Ok).type(photo_mime_type).send(photo)
    }

    else {
        return reply.code(Globals.HttpStatusCode.NotFound)
    }

}