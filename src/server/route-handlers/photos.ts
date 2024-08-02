
import { ExtendedFastifyRequest } from '../interfaces'
import { FastifyReply } from 'fastify'

import Globals from '../globals'
import DatabaseQueries from '../database-queries'
import { PhotoEntry } from '../interfaces'

/**
 * Handler for requesting list of photos in a specific album
 */
export default async function PhotosRouteHandler( request: ExtendedFastifyRequest, response: FastifyReply ) {
    
    if (await request.IsNotOnSession())
        return response.code(Globals.HttpStatusCode.Unauthorized).send()

    let username = await DatabaseQueries.GetUsernameBySessionID(request.cookies.sessionid)
    let albumid = (request.params as any)?.albumid ?? ''
    let photo_entries: PhotoEntry[] = []

    if (albumid === 'all-photos')
        photo_entries = (await DatabaseQueries.GetAllPhotos(username) as PhotoEntry[])
    else // if the albumid for a specific album
        photo_entries = (await DatabaseQueries.GetPhotosOfAlbum(username, albumid) as PhotoEntry[])

    return response.code(Globals.HttpStatusCode.Ok).type('text/json').send(photo_entries)

}
