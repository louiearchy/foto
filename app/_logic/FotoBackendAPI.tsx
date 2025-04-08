
import $ from 'jquery'

export interface AlbumEntry {
    album_name: string,
    albumid?: string
}

export interface PhotoEntry {
    photoid: string,
    format: string
}

export type AlbumEntries = AlbumEntry[]

class FotoBackendEvent extends EventTarget {
    constructor() {
        super()
    }
}

let main_server_address = 'http://localhost:3000'

function ToMainServerAddress(url: string): string {
    let new_url = (url.startsWith('/')) ? `${main_server_address}${url}` : `${main_server_address}/${url}`
    return new_url
}

// This is the list of albums (which is really only one) at the start where we had yet
// to synchronize with the server for the user's albums, all of the users of foto
// have an 'All Albums' album
var initial_albums: AlbumEntries = [{album_name: 'All Photos', albumid: undefined}]

function DeepCopyInitialAlbums() {
    return JSON.parse(JSON.stringify(initial_albums))
}

// we need deep copy instead of shallow copy of the initial albums, otherwise
// instead of initial albums having only the initial 'All Albums' album when we reset, it
// would also include the added albums from the server, which makes calling the function
// ResetAlbums useless
var albums: AlbumEntries = DeepCopyInitialAlbums()

var current_album_name: string = ''
var current_album_photo_entries: PhotoEntry[] = []
var current_album_thumbnail_photos: string[] = []
var last_request_album_id_for_album_name = ''
var last_request_album_id_for_album_photos = ''

function ShallowCopyAlbums() {
    return [...albums]
}

var already_sent_list_of_albums_request = false

var foto_backend_event = new FotoBackendEvent()
var events = {
    ALBUM_NAME_RECEIVED: new Event('ALBUM_NAME_RECEIVED'),
    ALBUMS_LOADED: new Event('ALBUMS_LOADED'),
    ALBUM_PHOTOS_LOADED: new Event('ALBUM_PHOTOS_LOADED'),
}

export var EventHook = foto_backend_event
export var Events = events

function GetCurrentAlbumID() {
    return window.location.pathname.split('/').reverse()[0]
}

export function GetAlbums() {
    return ShallowCopyAlbums() 
}

export function ResetAlbums() {
    albums = DeepCopyInitialAlbums()
}

export function GetAlbumsFromServer() {
    
    if (already_sent_list_of_albums_request)
        return // ignore
    
    already_sent_list_of_albums_request = true
    let request = $.ajax(ToMainServerAddress('/albums'), {
        method: 'GET',
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        }
    })
    request.done((albums_sent_by_the_server: AlbumEntries) => {
        albums.push(...albums_sent_by_the_server)
        foto_backend_event.dispatchEvent(events.ALBUMS_LOADED)
    })
    request.fail( (textstatus, error_thrown) => {
        console.log(textstatus)
        console.log(error_thrown)
    })

}

async function RegisterNewAlbum(album_name: string): Promise<string | undefined>{
    return new Promise( (resolve, reject) => {
        let request = $.ajax(ToMainServerAddress('/new/album'), {
            method: 'POST',
            contentType: 'text/plain',
            data: album_name,
            dataType: 'text',
            xhrFields: {
                withCredentials: true
            }
        })
        request.done((data) => {
            this.alreadySuccessfullyRequestedAlbums = true
            resolve(data)
        })
        request.fail( (_, textstatus, error_thrown) => {
            console.log(textstatus)
            console.log(error_thrown)
            reject()
        })
    })
}

export async function CreateNewAlbum(album_name: string): Promise<void> {
    let album_id = await RegisterNewAlbum(album_name)
    if (album_id) {
        albums.push({
            album_name: album_name,
            albumid: album_id
        })
    }
    return Promise.resolve()
}

/**
 * This function gets the album name from the server of the current album being viewed, 
 * this doesn't return anything but it must be invoked first before calling GetAlbumName function
 */
export function GetAlbumNameFromServer() {
    let album_id = GetCurrentAlbumID() 

    

    // We do this since there is a tendency that the React.useEffect() to call this function many times
    // since because in dev mode, Effect hooks called twice, and the Effects that we're using changes the
    // state of the component
    let already_requested_album_name_for_the_current_album = (album_id === last_request_album_id_for_album_name)
    if (already_requested_album_name_for_the_current_album)
        return // ignore function call


    // There's no need to contact the server for the name of the 'All Photos' album
    if (album_id === 'all-photos') {
        current_album_name = 'All Photos'
        foto_backend_event.dispatchEvent(events.ALBUM_NAME_RECEIVED)
        return
    }

    last_request_album_id_for_album_name = album_id

    let url = ToMainServerAddress(`/album/name/${album_id}`)
    $.get({
        url, 
        xhrFields: {
            withCredentials: true
        },
        success: function (data) {
            current_album_name = data 
            foto_backend_event.dispatchEvent(events.ALBUM_NAME_RECEIVED)
        }
    })
}

/**
 * This function returns the album name that was received from the server, before
 * calling this function you must call first the GetAlbumNameFromServer(), and because the
 * React.useEffect() doesn't permit asynchronous function, this must be called after the event
 * `ALBUM_NAME_RECEIVED` has been dispatched 
 */
export function GetAlbumName() {
    return current_album_name
}

/**
 * This function gets the album photos from the server of the current album being viewed, 
 * this doesn't return anything but it must be invoked first before calling GetAlbumPhotos function
 */
export function GetAlbumPhotosFromServer() {
    let album_id = GetCurrentAlbumID()
    let url = ToMainServerAddress(`/photos/${album_id}`)

    // We do this since there is a tendency that the React.useEffect() to call this function many times
    // since because in dev mode, Effect hooks called twice, and the Effects that we're using changes the
    // state of the component
    let already_requested_photos_for_the_current_album = (album_id === last_request_album_id_for_album_photos)
    if (already_requested_photos_for_the_current_album)
        return // ignore function call

    last_request_album_id_for_album_photos = album_id

    $.get({
        url, 
        xhrFields: {
            withCredentials: true
        },
        success: function (data: PhotoEntry[]) {
            current_album_photo_entries = data
            current_album_thumbnail_photos = current_album_photo_entries.map(( photo_entry ) => {
                return ToMainServerAddress(`/thumbnail/${photo_entry.photoid}`)
            })
            foto_backend_event.dispatchEvent(events.ALBUM_PHOTOS_LOADED)
        }
    })
}

/**
 * This function returns the album photos that was received from the server, before
 * calling this function you must call first the GetAlbumPhotosFromServer(), and because the
 * React.useEffect() doesn't permit asynchronous function, this must be called after the event
 * `ALBUM_PHOTOS_LOADED` has been dispatched 
 */
export function GetAlbumThumbnailPhotos() {
    return current_album_thumbnail_photos
}

/**
 * We call this function after we leave the album in order to prevent photos and the album name
 * not loading or showing after the second time we visit the same album
 */
export function ResetState() {
    current_album_name = ''
    current_album_thumbnail_photos = []
    last_request_album_id_for_album_name = ''
    last_request_album_id_for_album_photos = ''
}

function DeduceMimeTypeByFileExtension(filename: string) {
    let file_extension = filename.split('.').reverse()[0].toLowerCase()
    switch (file_extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg'
        case 'png':
        case 'webp':
            return `image/${file_extension}`
        default:
            return ''
    }
}

function GetFileExtension(filename: string): string {
    let file_extension = filename.split('.').reverse()[0].toLowerCase()
    switch (file_extension) {
        case 'jpg':
        case 'jpeg':
            return 'jpeg'
        default:
            return file_extension
    }
}

async function UploadPhoto(file: File, onCompleteCallbackFn: (photo_id: string) => void) {
    let xhr = new XMLHttpRequest()
    let url = ToMainServerAddress(`/to/album/${GetCurrentAlbumID()}`)
    xhr.open('POST', url)
    xhr.withCredentials = true
    xhr.setRequestHeader('Content-Type', DeduceMimeTypeByFileExtension(file.name))
    let image_data = await file.arrayBuffer()
    xhr.onreadystatechange = function() {
        if (xhr.readyState == xhr.DONE && xhr.status == 200 /* Ok */ ) {
            let photoid = xhr.responseText
            let format = GetFileExtension(file.name)
            current_album_photo_entries.push({
                photoid,
                format 
            })
            onCompleteCallbackFn(photoid)
        }
    }
    xhr.send(image_data)
}

export function UploadPhotos(files: FileList, onCompleteCallbackFn: (photo_id: string) => void) {
    if (files.length > 0) {
        for (const file of files) {
            UploadPhoto(file, onCompleteCallbackFn)
        }
    }
}

export function DeletePhoto(image_id: string) {
    let url = ToMainServerAddress(`/photo/${image_id}`)
    $.ajax(url, {
        method: 'DELETE',
        xhrFields: {
            withCredentials: true
        }
    })
}

export function GetPhotoUrlByThumbnailUrl(thumbnail_photo_url: string): string {
    let photoid_of_thumbnail = thumbnail_photo_url.split('/').reverse()[0]
    for (const {photoid, format} of current_album_photo_entries ) {
        if (photoid_of_thumbnail == photoid) {
            let photo_url = ToMainServerAddress(`/photo/${photoid}.${format}`)
            return photo_url
        }
    }
    return ""
}

export function DeleteAlbum(album_id: string, onCompleteCallbackFn: () => void) {

    let url = ToMainServerAddress(`/album/${album_id}`)

    $.ajax({
        method: 'DELETE',
        url: url,
        xhrFields: {
            withCredentials: true
        }
    }).then(
        () => {
            albums = albums.filter( (album_entry) => {
                if (album_entry?.albumid != album_id)
                    return album_entry
            })
            onCompleteCallbackFn()
        }
    )

}
