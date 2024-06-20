
import { FastifyRequest, FastifyReply } from 'fastify'
import Globals from '../globals'
import JSONifyCookies from '../utility/jsonify-cookies'
import DatabaseQueries from '../database-queries'

interface PhotoEntry {
    photoid: string,
    format: string
}

/**
 * Handler for requesting list of photos in a specific album
 */
export default async function PhotosRequestHandler( request: FastifyRequest, response: FastifyReply ) {
    
    if (!(request.headers?.cookie))
        return response.code(Globals.HttpStatusCode.Unauthorized)

    let cookies = JSONifyCookies(request.headers?.cookie)
    if (!(cookies?.sessionid))
        return response.code(Globals.HttpStatusCode.Unauthorized)

    let is_sessionid_invalid = !(await DatabaseQueries.IsSessionIdValid(cookies.sessionid))
    if (is_sessionid_invalid)
        return response.code(Globals.HttpStatusCode.Unauthorized)

    let username = await DatabaseQueries.GetUsernameBySessionID(cookies.sessionid)
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
