
import { ExtendedFastifyRequest } from '../interfaces'
import { FastifyReply } from 'fastify'

import Globals from '../globals'
import DatabaseQueries from '../database-queries'

interface PhotoEntry {
    photoid: string,
    format: string
}

/**
 * Handler for requesting list of photos in a specific album
 */
export default async function PhotosRouteHandler( request: ExtendedFastifyRequest, response: FastifyReply ) {
    
    if (await request.IsNotOnSession())
        return response.code(Globals.HttpStatusCode.Unauthorized)

    let username = await DatabaseQueries.GetUsernameBySessionID(request.cookies.sessionid)
    let albumid = (request.params as any)?.albumid ?? ''
    let photo_entries: PhotoEntry[] = []

    if (albumid === 'all-photos')
        photo_entries = (await DatabaseQueries.GetAllPhotos(username) as PhotoEntry[])
    else // if the albumid for a specific album
        photo_entries = (await DatabaseQueries.GetPhotosOfAlbum(username, albumid) as PhotoEntry[])

    let photos: string[] = []

    photo_entries.map( (photo_entry) => {
        let respective_photo_url = `/photo/${photo_entry.photoid}.${photo_entry.format}`
        photos.push(respective_photo_url)
    })

    return response.code(Globals.HttpStatusCode.Ok).type('text/json').send(photos)

}
