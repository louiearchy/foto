
import React from "react"
import ReactDOM from "react-dom/client"
import ReactRouterDOM from "react-router-dom"
import $ from "jquery"

const rootdiv = document.createElement("root")
const root = ReactDOM.createRoot(rootdiv)


interface AlbumEntry {
    album_name: string,
    albumid?: string
}

interface PhotoEntry {
    photoid: string,
    format: string
}

type AlbumEntries = AlbumEntry[]

namespace FotoBackendAPI {

    class FotoBackendEvent extends EventTarget {
        constructor() {
            super()
        }
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
        let request = $.ajax('/albums', {
            method: 'GET',
            dataType: 'json'
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
            let request = $.ajax('/new/album', {
                method: 'POST',
                contentType: 'text/plain',
                data: album_name,
                dataType: 'text'
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

        let url = `/album/name/${album_id}`
        $.get(url, function (data) {
            current_album_name = data 
            foto_backend_event.dispatchEvent(events.ALBUM_NAME_RECEIVED)
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
        let url = `/photos/${album_id}`

        // We do this since there is a tendency that the React.useEffect() to call this function many times
        // since because in dev mode, Effect hooks called twice, and the Effects that we're using changes the
        // state of the component
        let already_requested_photos_for_the_current_album = (album_id === last_request_album_id_for_album_photos)
        if (already_requested_photos_for_the_current_album)
            return // ignore function call

        last_request_album_id_for_album_photos = album_id

        $.get(url, function (data: PhotoEntry[]) {
            current_album_photo_entries = data
            current_album_thumbnail_photos = current_album_photo_entries.map(( photo_entry ) => {
                return `/thumbnail/${photo_entry.photoid}`
            })
            foto_backend_event.dispatchEvent(events.ALBUM_PHOTOS_LOADED)
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
        let url = `/to/album/${GetCurrentAlbumID()}`
        xhr.open('POST', url)
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
        let url = `/photo/${image_id}`
        $.ajax(url, {
            method: 'DELETE'
        })
    }

    export function GetPhotoUrlByThumbnailUrl(thumbnail_photo_url: string): string {
        let photoid_of_thumbnail = thumbnail_photo_url.split('/').reverse()[0]
        for (const {photoid, format} of current_album_photo_entries ) {
            if (photoid_of_thumbnail == photoid) {
                let photo_url = `/photo/${photoid}.${format}`
                return photo_url
            }
        }
        return ""
    }

    export function DeleteAlbum(album_id: string, onCompleteCallbackFn: () => void) {

        let url = `/album/${album_id}`

        $.ajax({
            method: 'DELETE',
            url: url
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

} // FotoBackendAPI


function Album(props) {
    return <div className="album">
        { 
            (props?.imgSrc) ? 
                /* if there's an image preview available */ <img src={ (props?.imgSrc) ? props.imgSrc : "" } /> :
                /* if there's no image */ <div className="album-blank-preview"></div>
        }
        <div className="info">
            <ReactRouterDOM.Link to={props?.link}>{props?.name}</ReactRouterDOM.Link>

            { 
                props?.name != "All Photos" && 
                <button onClick={() => {props?.DeleteAlbum(props?.albumid)}}>
                    <img src='/assets/svgs/trash-bin-minimalistic-svgrepo-com-black.svg'/>
                </button>
            }
        </div>
    </div>
}


// This is where the user sees their created albums
function AlbumsView() {
    
    let [list_of_albums, SetListOfAlbums] = React.useState<AlbumEntries>(FotoBackendAPI.GetAlbums())
    let [is_create_album_prompt_visible, SetCreateAlbumPromptVisibility] = React.useState(false)

    // State functions
    // --------------------------------------------------
    function UpdateListOfAlbums() {
        SetListOfAlbums(FotoBackendAPI.GetAlbums())
    }

    function DeleteAlbum(albumid: string) {
        FotoBackendAPI.DeleteAlbum(albumid, UpdateListOfAlbums)
    }

    function HideCreateAlbumPrompt() {
        SetCreateAlbumPromptVisibility(false)
    }

    function ShowCreateAlbumPrompt() {
        SetCreateAlbumPromptVisibility(true)
    }
    // --------------------------------------------------

    // Effects
    // --------------------------------------------------
    function SynchronizeAlbumViewWithFotoBackend() {
        FotoBackendAPI.EventHook.addEventListener('ALBUMS_LOADED', UpdateListOfAlbums)
        FotoBackendAPI.GetAlbumsFromServer()
        return () => FotoBackendAPI.EventHook.removeEventListener('ALBUMS_LOADED', UpdateListOfAlbums)
    }

    React.useEffect(SynchronizeAlbumViewWithFotoBackend)
    // --------------------------------------------------

    // Components
    // --------------------------------------------------
    function CreateAlbumPrompt() {

        let [warning_message, SetWarningMessage] = React.useState("")
        let album_name_field_ref = React.useRef<HTMLInputElement | null>(null)

        function ClearWarningMessage() {
            if (warning_message != "")
                SetWarningMessage("")
        }

        async function CreateAlbum() {
            if (album_name_field_ref && album_name_field_ref?.current) {
                let album_name = album_name_field_ref.current.value
                if (album_name.length == 0) {
                    SetWarningMessage("Please input an album name first")
                }
                else {
                    HideCreateAlbumPrompt()
                    await FotoBackendAPI.CreateNewAlbum(album_name)
                    UpdateListOfAlbums()
                }
            }
        }

        return (
            <div className="absolute" style={{ zIndex: 0 }} id="create-album-prompt">
                <h2>Create Album</h2>
                <input type="text" ref={album_name_field_ref} id="album-name-field" onInput={ClearWarningMessage}/>
                <div className="flex-row">
                    <button onClick={CreateAlbum}>Create Album</button>
                    <button onClick={HideCreateAlbumPrompt}>Cancel</button> 
                </div>
                { (warning_message != "") && <div id="warning-prompt">{warning_message}</div> }
            </div>
        )
    }
    // --------------------------------------------------



    return (
        <div className='flex-column' id='albums-view'>
            { is_create_album_prompt_visible && <CreateAlbumPrompt/> }
            <div id="albums-container" className="flex-row">
                { 
                    list_of_albums.map( (albumEntry) => {
                        let albumid = albumEntry?.albumid ?? 'all-photos'
                        let albumlink = `/album/${albumid}`
                        return <Album 
                            name={albumEntry.album_name} 
                            key={albumEntry.albumid}
                            albumid={albumEntry.albumid}
                            DeleteAlbum={DeleteAlbum}
                            link={albumlink}
                        /> 
                    })
                }
            </div>
            <div className='flex center'><button onClick={ShowCreateAlbumPrompt}>Create Album</button></div>
        </div>
    )
}

function AlbumView() {
    let [album_name, SetAlbumName] = React.useState('')
    let [thumbnail_photos, SetAlbumThumbnailPhotos] = React.useState<string[]>([])
    let [currently_viewed_photo, SetCurrentlyViewedPhoto] = React.useState('')

    let files_input_ref = React.useRef<HTMLInputElement | null>(null)

    // State functions
    // ---------------------------------------------------
    function SynchronizeAlbumName() {
        SetAlbumName(FotoBackendAPI.GetAlbumName())
    }
    function SynchronizeAlbumThumbnailPhotos() {
        SetAlbumThumbnailPhotos(FotoBackendAPI.GetAlbumThumbnailPhotos())
    }
    function HideCurrentlyViewedPhoto() {
        SetCurrentlyViewedPhoto('')
    }
    function AddPhotoToAlbum(thumbnail_photo_url: string) {
        let new_thumbnail_photos = thumbnail_photos
        new_thumbnail_photos.push(thumbnail_photo_url)
        SetAlbumThumbnailPhotos([...new_thumbnail_photos])
    }
    function RemovePhotoFromAlbumPhotos(given_photo_url: string) {
        let photo_id = given_photo_url.split("/").reverse()[0].split(".")[0]
        let thumbnail_photo_url = `/thumbnail/${photo_id}`
        let new_photos = thumbnail_photos.filter((photo_url) => photo_url != thumbnail_photo_url)
        // might dereference the array for garbage collection, since we create a new
        // array with the filter function
        thumbnail_photos = []
        SetAlbumThumbnailPhotos([...new_photos])
    }
    // ---------------------------------------------------

    // Effect hooks
    // ---------------------------------------------------
    function SynchronizeAlbumPhotosWithFotoBackend() {
        FotoBackendAPI.EventHook.addEventListener('ALBUM_PHOTOS_LOADED', SynchronizeAlbumThumbnailPhotos)
        FotoBackendAPI.GetAlbumPhotosFromServer()
        return () => FotoBackendAPI.EventHook.removeEventListener('ALBUM_PHOTOS_LOADED', SynchronizeAlbumThumbnailPhotos)
    }

    function SynchronizeAlbumNameWithFotoBackend() {
        FotoBackendAPI.EventHook.addEventListener('ALBUM_NAME_RECEIVED', SynchronizeAlbumName)
        FotoBackendAPI.GetAlbumNameFromServer()
        return () => FotoBackendAPI.EventHook.removeEventListener('ALBUM_NAME_RECEIVED', SynchronizeAlbumName)
    }

    React.useEffect(() => {
        SynchronizeAlbumNameWithFotoBackend()
        SynchronizeAlbumPhotosWithFotoBackend()
    })
    // ---------------------------------------------------

    function SubmitPhotos() {
        if (files_input_ref && files_input_ref?.current) {
            let photos_to_be_uploaded = files_input_ref.current.files
            if (photos_to_be_uploaded && photos_to_be_uploaded.length > 0) {
                FotoBackendAPI.UploadPhotos(
                    photos_to_be_uploaded,
                    // on post upload complete callback function
                    (photo_id: string) => {
                        let thumbnail_url = `/thumbnail/${photo_id}`
                        AddPhotoToAlbum(thumbnail_url)
                    }
                )
                files_input_ref.current.value = ''
            }
        }
    }

    function DeletePhoto() {
        let photo_id = currently_viewed_photo.split('/')[2].split('.')[0]
        FotoBackendAPI.DeletePhoto(photo_id)
        HideCurrentlyViewedPhoto()
        RemovePhotoFromAlbumPhotos(currently_viewed_photo)
    }

    return (
        <div className='flex-column' id='album-view'>
            { 
                (currently_viewed_photo != '') && 
                <div id='album-view-current-viewed-photo-container'>
                    <div className='flex-row'>
                        <button onClick={HideCurrentlyViewedPhoto}>
                            <img src='/assets/svgs/arrow-sm-left-svgrepo-com-white.svg'/>
                        </button>
                        <div></div>
                        <button onClick={DeletePhoto}>
                            <img src='/assets/svgs/trash-bin-minimalistic-svgrepo-com.svg'/>
                        </button>
                    </div>
                    <img src={currently_viewed_photo}/>
                </div>
            }
            <div className='flex-row' id='album-view-navigation-bar'>
                <div>
                    <ReactRouterDOM.Link to='/home' onClick={FotoBackendAPI.ResetState}>
                        <img src='/assets/svgs/arrow-sm-left-svgrepo-com.svg'/>
                    </ReactRouterDOM.Link>
                </div> 
                <div className='flex center'>{album_name}</div>
                <div></div>
            </div> 
            <div className='flex-row' id='album-view-photos-container'>{
                thumbnail_photos.map( (thumbnail_photo_url) => {
                    let photo_url = FotoBackendAPI.GetPhotoUrlByThumbnailUrl(thumbnail_photo_url)
                    return <img src={thumbnail_photo_url} 
                                key={thumbnail_photo_url} 
                                onClick={() => SetCurrentlyViewedPhoto(photo_url)}
                            />
                })
            }</div>
            <div className='flex center' id='album-view-submit-container'>
                <input type='file' ref={files_input_ref} multiple={true}/>
                <button onClick={SubmitPhotos}>Submit</button>
            </div>
        </div>
    )
}

const router = ReactRouterDOM.createBrowserRouter([
    {
        path: "/home",
        element: <AlbumsView/>
    },
    {
        path: "/album/:id",
        element: <AlbumView/>
    }
])

document.addEventListener('DOMContentLoaded', function() {

    document.body.appendChild(rootdiv)
    root.render(
        <React.StrictMode>
            <ReactRouterDOM.RouterProvider router={router}/>
        </React.StrictMode>
    )

}) 
