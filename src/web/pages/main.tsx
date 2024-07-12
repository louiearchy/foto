
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
    key: string,
    url: string
}

type AlbumEntries = AlbumEntry[]

type ListOfPhotosAction = {
    type: 'ADD PHOTO' | 'RESET'
    photo?: {
        key: string,
        url: string
    }
}

var currently_viewed_album: string = ''
var dummy_key_track = 1

function ListOfPhotosReducer(list_of_photos: PhotoEntry[], action: ListOfPhotosAction): PhotoEntry[] {
    switch (action.type) {
        case 'ADD PHOTO': {
            if (action?.photo?.key && action?.photo?.url) {
                list_of_photos.push({key: action.photo.key, url: action.photo.url})
                return [...list_of_photos]
            }
        }
        case 'RESET':
            return []
        default:
            return list_of_photos
    }
}

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

    function ShallowCopyAlbums() {
        return [...albums]
    }

    var already_sent_list_of_albums_request = false

    var foto_backend_event = new FotoBackendEvent()
    var events = {
        ALBUM_NAME_RECEIVED: new Event('ALBUM_NAME_RECEIVED'),
        ALBUMS_LOADED: new Event('ALBUMS_LOADED')
    }

    export var EventHook = foto_backend_event
    export var Events = events

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

    export function GetAlbumID() {
        return window.location.pathname.split('/').reverse()[0]
    }

    export function GetAlbumNameFromServer() {
        let album_id = GetAlbumID()
        let is_viewing_specific_album = /\/album\//.test(window.location.pathname)
        let url = `/album/name/${album_id}`

        if (is_viewing_specific_album) {
            $.get(url, function( data ) {
                currently_viewed_album = data
                foto_backend_event.dispatchEvent(events.ALBUM_NAME_RECEIVED)
            })
        }
    }

    export function ClearCurrentViewedAlbum() {
        currently_viewed_album = ''
    }

    function DeduceMimeTypeByFileExtension(filepath: string): string {
        let file_extension = filepath.split(".").reverse()[0].toLowerCase()
        switch (file_extension) {
            case "jpg":
            case "jpeg":
                return 'image/jpeg'
            case 'png':
            case 'webp':
                return `image/${file_extension}`
            default:
                return 'unknown'
        }
    }

    export function UploadPhoto(file: File): Promise<string> {
        return new Promise( async (resolve, reject) => {
            let xhr = new XMLHttpRequest()
            let pathname = '/to' + window.location.pathname
            xhr.open('POST', pathname)
            xhr.setRequestHeader('Content-Type', DeduceMimeTypeByFileExtension(file.name))
            xhr.onreadystatechange = function() {
                if (xhr.readyState == xhr.DONE && xhr.status == 200) {
                    resolve(xhr.responseText)
                }
            }
            let data = await file.arrayBuffer()
            xhr.send(data)
        })
    }

    export async function UploadPhotos(
        submission_buttons_disabled_setter: React.Dispatch<React.SetStateAction<boolean>>,
        file_input_ref: React.MutableRefObject<HTMLInputElement | null>,
        ListOfPhotosDispatch: React.Dispatch<ListOfPhotosAction>
    ) {
        submission_buttons_disabled_setter(true)
        let files_to_be_uploaded = (document.getElementById('file-upload-input') as (HTMLInputElement | null))?.files
        
        if (files_to_be_uploaded) {
            if (files_to_be_uploaded.length == 0)  {
                alert('No files yet to be uploaded, please choose first!')
                submission_buttons_disabled_setter(false)
                return
            }
            else /* if there are files to be uploaded */ {
                for (
                    // initialization
                    let i = 0, current_file = files_to_be_uploaded.item(i);

                    // condition
                    i < files_to_be_uploaded.length; 

                    // update expression
                    current_file = files_to_be_uploaded.item(++i)
                ) {
                    if (current_file) {
                        await UploadPhoto(current_file)
                        let url = URL.createObjectURL(current_file)
                        ListOfPhotosDispatch({
                            type: 'ADD PHOTO',
                            photo: {
                                key: (dummy_key_track++).toString(),
                                url
                            }
                        })
                    }
                }
                // this resets the file input
                if (file_input_ref?.current) {
                    file_input_ref.current.value = ''
                }
                submission_buttons_disabled_setter(false)
            }
        }

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

} // FotoBackendAPI


function Album(props) {
    return <div className="album">
        { 
            (props?.imgSrc) ? 
                /* if there's an image preview available */ <img src={ (props?.imgSrc) ? props.imgSrc : "" } /> :
                /* if there's no image */ <div className="album-blank-preview"></div>
        }
        <ReactRouterDOM.Link 
            to={props?.link}
            onClick={ () => {
                currently_viewed_album = props?.name
            }
            }
        >{props?.name}</ReactRouterDOM.Link>
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
        <div className='flex-column' style={{ height: '100vh' }}>
            { is_create_album_prompt_visible && <CreateAlbumPrompt/> }
            <div id="album-view" className="flex-row">
                { 
                    list_of_albums.map( (albumEntry) => {
                        let albumid = albumEntry?.albumid ?? 'all-photos'
                        let albumlink = `/album/${albumid}`
                        return <Album 
                            name={albumEntry.album_name} 
                            key={albumEntry.albumid}
                            link={albumlink}
                        /> 
                    })
                }
            </div>
            <div className='flex center'><button onClick={ShowCreateAlbumPrompt}>Create Album</button></div>
        </div>
    )
}

let already_sent_album_name_request = false

function SpecificAlbumViewNavigationBar() {
    let [albumName, setAlbumName] = React.useState(currently_viewed_album)

    React.useEffect( () => {
        
        let albumid = window.location.pathname.split('/').reverse()[0]
        if (albumid === 'all-photos')
            return setAlbumName('All Photos')

        function updateAlbumName() {
            setAlbumName(currently_viewed_album)
        }
        FotoBackendAPI.EventHook.addEventListener('ALBUM_NAME_RECEIVED', updateAlbumName)
        if (!already_sent_album_name_request) {
            FotoBackendAPI.GetAlbumNameFromServer()
            already_sent_album_name_request = true
        }
        return () => FotoBackendAPI.EventHook.removeEventListener('ALBUM_NAME_RECEIVED', updateAlbumName)
    }, [albumName])


    return <div style={{
        padding: "0.2cm 0.5cm",
        height: "10%",
        maxHeight: "1cm"
    }} className="flex-row">
        <div style={
            {
                width: "10%"
            }
        }>
            <ReactRouterDOM.Link 
                to={"/home"} 
                id="to-homepage-arrow" 
                onClick={ () => FotoBackendAPI.ClearCurrentViewedAlbum() }>
                <img src="/assets/svgs/arrow-sm-left-svgrepo-com.svg"/>
            </ReactRouterDOM.Link>
        </div>
        <div style={{
            width: "80%"
        }} className="flex center">
        <span style={{
            fontFamily: 'Work Sans',
            fontSize: '1.3em'
        }}>{albumName}</span>
        </div>
        <div style={{
            width: "10%"
        }}></div>
    </div>
}

// Component used to view a specific photo in fullscreen
// this is handled by the SpecificAlbumView parent component
function SpecificPhotoView(
    { 
        currently_viewed_photo_source, 
        HideSpecificPhotoViewComponent 
    }: { 
        currently_viewed_photo_source: string,
        HideSpecificPhotoViewComponent: () => void 
    }
) {
    return <div id='specific-photo-view'>
        <div>
            <button onClick={HideSpecificPhotoViewComponent}>
                <img src='/assets/svgs/arrow-sm-left-svgrepo-com-white.svg'/>
            </button>
        </div>
        <div><img src={currently_viewed_photo_source}/></div>
    </div>
} 


function PhotosView(

// expected prop components
{
    list_of_photos,
    ListOfPhotosDispatch,
    SetCurrentlyViewedPhoto 
}: 

// type inference for prop components
{
    list_of_photos: PhotoEntry[],
    ListOfPhotosDispatch: React.Dispatch<ListOfPhotosAction>,
    SetCurrentlyViewedPhoto: React.Dispatch<React.SetStateAction<string>>
})

{
    let [submissionButtonsDisabledValue, setSubmissionButtonsDisabledValue] = React.useState(false)
    let file_input_ref: React.MutableRefObject<HTMLInputElement | null> = React.useRef(null)

    return <div style={{
        height: "90%",
        width: "100%"
    }} className="flex-column">
        <div id="photos-view-container">
            { list_of_photos.map( (photo) => {
                return <img 
                    src={photo.url} 
                    key={photo.key} 
                    className="photo" 
                    onClick={
                        function() {
                            SetCurrentlyViewedPhoto(photo.url)
                        }
                    }
                />
            } ) } 
        </div>
        <div className="flex center" style={{
            width: "100%",
            height: "10%",
            maxHeight: "1cm",
        }}>
            <input 
                type="file" 
                id="file-upload-input" 
                accept="image/webp, image/png, image/jpeg" 
                multiple
                disabled={submissionButtonsDisabledValue}
                ref={file_input_ref}
             />
            <button onClick={() => {
                FotoBackendAPI.UploadPhotos(
                    setSubmissionButtonsDisabledValue, 
                    file_input_ref,
                    ListOfPhotosDispatch,
                )
            }} disabled={submissionButtonsDisabledValue}>Submit</button>
        </div>
    </div>
}


function ListOfPhotosInit(list_of_photos: PhotoEntry[]): PhotoEntry[] {
    return list_of_photos
}

type SpecificAlbumViewReducer = React.Reducer<PhotoEntry[], ListOfPhotosAction>

function SpecificAlbumView() {

    let [list_of_photos, ListOfPhotosDispatch] = React.useReducer<SpecificAlbumViewReducer, PhotoEntry[]>(
        ListOfPhotosReducer, // reducer
        [],                  // initialArg 
        ListOfPhotosInit     // init
    )
    let [currently_viewed_photo, SetCurrentlyViewedPhoto] = React.useState<string>('')
    
    function HideSpecificPhotoViewComponent() {
        SetCurrentlyViewedPhoto('')
    }

    React.useEffect( () => {
        let albumid = FotoBackendAPI.GetAlbumID()
        let url = `/photos/${albumid}`
        $.ajax(url, {
            method: 'GET',
            dataType: 'json',
            success: function (photo_urls: string[]) {

                // we call RESET on dispatch since in the development mode, the component
                // gets called twice even if the dependency doesn't change, because of this
                // behavior, when we render our SpecificAlbumView, the picture gets doubled
                // this call prevents it from happening, we cannot also rely on the cleanup
                // function as recommended in React docs since we are dealing with asynchronicity
                // therefore, the cleanup function won't prevent the pictures getting doubled
                ListOfPhotosDispatch({ type: 'RESET' })

                photo_urls.map( (photo_url) => 
                    ListOfPhotosDispatch(
                        {
                            type: 'ADD PHOTO', 
                            photo: { 
                                key: (dummy_key_track++).toString(), 
                                url: photo_url 
                            }
                        }
                    ) // end of ListOfPhotosDispatch
                ) // end of map function
            } // end of success function
        })
    }, [currently_viewed_album])


    return <div className="flex-column" style={{
        height: "100vh"
    }}>
        <SpecificAlbumViewNavigationBar/>
        <PhotosView 
            list_of_photos={list_of_photos}
            ListOfPhotosDispatch={ListOfPhotosDispatch}
            SetCurrentlyViewedPhoto={SetCurrentlyViewedPhoto}
        />
        {
            (currently_viewed_photo != '') && <SpecificPhotoView 
                                                    currently_viewed_photo_source={currently_viewed_photo}
                                                    HideSpecificPhotoViewComponent={HideSpecificPhotoViewComponent}
                                              />
        }
    </div>
}

const router = ReactRouterDOM.createBrowserRouter([
    {
        path: "/home",
        element: <AlbumsView/>
    },
    {
        path: "/album/:id",
        element: <SpecificAlbumView/>
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
